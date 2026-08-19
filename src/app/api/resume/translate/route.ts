import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { spendCredits } from "@/lib/credits";
import { randomSuffix } from "@/lib/slug";
import type { ResumeContent } from "@/types/database";

const TRANSLATION_SCHEMA = {
  type: "object" as const,
  properties: {
    summary: { type: "string" as const },
    skills: { type: "array" as const, items: { type: "string" as const } },
    languages: { type: "array" as const, items: { type: "string" as const } },
    experience: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          id: { type: "string" as const },
          description: { type: "string" as const },
        },
        required: ["id", "description"],
        additionalProperties: false,
      },
    },
    projects: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          id: { type: "string" as const },
          description: { type: "string" as const },
        },
        required: ["id", "description"],
        additionalProperties: false,
      },
    },
  },
  required: ["summary", "skills", "languages", "experience", "projects"],
  additionalProperties: false,
};

const SUPPORTED_LANGUAGES = [
  "Arabic",
  "French",
  "Portuguese",
  "Swahili",
  "Mandarin Chinese",
  "Hindi",
  "Amharic",
  "Zulu",
] as const;

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI generation is not configured. Set ANTHROPIC_API_KEY on the server." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const resumeId = body?.resumeId as string | undefined;
  const targetLanguage = body?.targetLanguage as string | undefined;
  if (!resumeId || !targetLanguage) {
    return NextResponse.json({ error: "resumeId and targetLanguage are required." }, { status: 400 });
  }
  if (!SUPPORTED_LANGUAGES.includes(targetLanguage as (typeof SUPPORTED_LANGUAGES)[number])) {
    return NextResponse.json({ error: "Unsupported target language." }, { status: 400 });
  }

  const { data: resume, error: resumeError } = await supabase
    .from("resumes")
    .select("title, template, content")
    .eq("id", resumeId)
    .eq("user_id", user.id)
    .single();
  if (resumeError || !resume) {
    return NextResponse.json({ error: "Resume not found." }, { status: 404 });
  }

  const spend = await spendCredits(supabase, user.id, "resume_translate");
  if (!spend.ok) {
    return NextResponse.json({ error: spend.error }, { status: 402 });
  }

  const content = resume.content as ResumeContent;
  const anthropic = new Anthropic({ apiKey });

  const prompt = `Translate the following resume content into ${targetLanguage}. Keep the meaning accurate and the tone professional — this is a real job application. Do not translate proper nouns you're given as opaque ids. Return each field translated into ${targetLanguage}.

Summary: ${content.summary || "(empty)"}
Skills: ${content.skills?.join(", ") || "(none)"}
Languages: ${content.languages?.join(", ") || "(none)"}
Experience entries (translate only "description", keep "id" exactly as given):
${(content.experience ?? []).map((exp) => `- id: ${exp.id}, description: ${exp.description || "(empty)"}`).join("\n") || "(none)"}
Project entries (translate only "description", keep "id" exactly as given):
${(content.projects ?? []).map((p) => `- id: ${p.id}, description: ${p.description || "(empty)"}`).join("\n") || "(none)"}`;

  try {
    const message = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
      // Same risk shape as the ai-review route: translating every
      // experience/project description in one structured call can need
      // more than 2048 tokens combined with the model's own reasoning,
      // which silently draws from the same budget and truncates the JSON.
      max_tokens: 4096,
      output_config: { format: { type: "json_schema", schema: TRANSLATION_SCHEMA } },
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response from AI." }, { status: 502 });
    }

    const translated = JSON.parse(textBlock.text) as {
      summary: string;
      skills: string[];
      languages: string[];
      experience: { id: string; description: string }[];
      projects: { id: string; description: string }[];
    };

    const descById = new Map(translated.experience.map((e) => [e.id, e.description]));
    const projectDescById = new Map(translated.projects.map((p) => [p.id, p.description]));

    const translatedContent: ResumeContent = {
      ...content,
      summary: translated.summary,
      skills: translated.skills,
      languages: translated.languages,
      experience: content.experience.map((exp) => ({
        ...exp,
        description: descById.get(exp.id) ?? exp.description,
      })),
      projects: content.projects.map((project) => ({
        ...project,
        description: projectDescById.get(project.id) ?? project.description,
      })),
    };

    const slug = `resume-${randomSuffix(8)}`;
    const { data: newResume, error: insertError } = await supabase
      .from("resumes")
      .insert({
        user_id: user.id,
        title: `${resume.title} (${targetLanguage})`,
        slug,
        template: resume.template,
        content: translatedContent,
      })
      .select("id")
      .single();

    if (insertError || !newResume) {
      return NextResponse.json({ error: "Could not save translated resume." }, { status: 500 });
    }

    return NextResponse.json({ resumeId: newResume.id, credits_remaining: spend.remaining });
  } catch (err) {
    console.error("Resume translation failed", err);
    return NextResponse.json({ error: "Could not translate resume. Please try again." }, { status: 500 });
  }
}
