import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { spendCredits } from "@/lib/credits";
import type { ResumeContent } from "@/types/database";

const FILL_SCHEMA = {
  type: "object" as const,
  properties: {
    summary: { type: "string" as const },
    skills: { type: "array" as const, items: { type: "string" as const } },
    experience_descriptions: {
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
  required: ["summary", "skills", "experience_descriptions"],
  additionalProperties: false,
};

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
  const content = body?.content as ResumeContent | undefined;
  if (!content) {
    return NextResponse.json({ error: "content is required." }, { status: 400 });
  }

  const needsSummary = !content.summary?.trim();
  const needsSkills = !content.skills || content.skills.length === 0;
  const experienceGaps = (content.experience ?? []).filter(
    (exp) => (exp.title || exp.company) && !exp.description?.trim()
  );

  if (!needsSummary && !needsSkills && experienceGaps.length === 0) {
    return NextResponse.json({ error: "No gaps found — everything is already filled in." }, { status: 400 });
  }

  const spend = await spendCredits(supabase, user.id, "resume_fill_gaps");
  if (!spend.ok) {
    return NextResponse.json({ error: spend.error }, { status: 402 });
  }

  const anthropic = new Anthropic({ apiKey });

  const asks: string[] = [];
  if (needsSummary)
    asks.push(
      '- Write a 2-3 sentence professional summary in "summary", in first person (e.g. "I am...", "I have...") — never third person or referring to the candidate by name.'
    );
  if (needsSkills) asks.push('- List 8-12 relevant skills (as an array of short strings) in "skills".');
  if (experienceGaps.length > 0) {
    asks.push(
      `- For each of these experience entries missing a description, write 3-4 achievement-focused bullet points (as a single string with newlines) in "experience_descriptions", matched by "id":\n` +
        experienceGaps
          .map((exp) => `  - id: ${exp.id}, role: ${exp.title || "Role"} at ${exp.company || "Company"}`)
          .join("\n")
    );
  }

  const prompt = `You are helping a candidate finish an incomplete resume. Only fill in the gaps described below — do not invent unrelated facts. Base your writing on the context already present in the resume (name, existing experience, education, skills). Keep the tone professional and specific, avoid generic filler phrases.

EXISTING RESUME CONTEXT:
Name: ${content.full_name || "N/A"}
Existing summary: ${content.summary || "(empty)"}
Existing skills: ${content.skills?.join(", ") || "(empty)"}
Experience entries:
${(content.experience ?? [])
  .map((exp) => `- ${exp.title || "Role"} at ${exp.company || "Company"}: ${exp.description || "(no description)"}`)
  .join("\n") || "(none)"}
Education: ${(content.education ?? []).map((e) => `${e.degree ?? ""} ${e.field ?? ""} at ${e.school}`).join("; ") || "(none)"}

WHAT TO FILL IN:
${asks.join("\n")}

For any field not requested above, return an empty string or empty array.`;

  try {
    const message = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
      max_tokens: 1536,
      output_config: { format: { type: "json_schema", schema: FILL_SCHEMA } },
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response from AI." }, { status: 502 });
    }

    const parsed = JSON.parse(textBlock.text) as {
      summary: string;
      skills: string[];
      experience_descriptions: { id: string; description: string }[];
    };

    return NextResponse.json({
      summary: needsSummary ? parsed.summary : null,
      skills: needsSkills ? parsed.skills : null,
      experience_descriptions: parsed.experience_descriptions ?? [],
      credits_remaining: spend.remaining,
    });
  } catch (err) {
    console.error("Fill gaps failed", err);
    return NextResponse.json({ error: "Could not fill gaps. Please try again." }, { status: 500 });
  }
}
