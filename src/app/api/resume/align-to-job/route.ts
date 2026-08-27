import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { spendCredits } from "@/lib/credits";
import { logAiUsage } from "@/lib/ai/usage";
import type { ResumeContent } from "@/types/database";

const ALIGN_SCHEMA = {
  type: "object" as const,
  properties: {
    tailored_summary: { type: "string" as const },
    suggested_skills: { type: "array" as const, items: { type: "string" as const } },
    keyword_gaps: { type: "array" as const, items: { type: "string" as const } },
  },
  required: ["tailored_summary", "suggested_skills", "keyword_gaps"],
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
  const jobDescription = (body?.jobDescription as string | undefined)?.trim();
  if (!content || !jobDescription) {
    return NextResponse.json({ error: "content and jobDescription are required." }, { status: 400 });
  }

  const spend = await spendCredits(supabase, user.id, "align_to_job");
  if (!spend.ok) {
    return NextResponse.json({ error: spend.error }, { status: 402 });
  }

  const anthropic = new Anthropic({ apiKey });

  const prompt = `You are helping a candidate tailor their resume to a specific job posting. Only use facts already present in their resume — never invent experience, skills, or achievements they don't have.

CANDIDATE'S CURRENT RESUME:
Name: ${content.full_name || "N/A"}
Current summary: ${content.summary || "(empty)"}
Skills: ${content.skills?.join(", ") || "(none)"}
Experience:
${(content.experience ?? [])
  .map((exp) => `- ${exp.title || "Role"} at ${exp.company || "Company"}: ${exp.description || "(no description)"}`)
  .join("\n") || "(none)"}

TARGET JOB POSTING:
${jobDescription.slice(0, 6000)}

TASK:
1. "tailored_summary": rewrite the candidate's professional summary (2-4 sentences) to emphasize the parts of their real background most relevant to this job. Write it in first person (e.g. "I am...", "I have...") — never third person or referring to the candidate by name. Do not fabricate anything.
2. "suggested_skills": list skills from the candidate's own experience/skills that match this job but aren't already in their skills list, worth adding (max 8). Only suggest skills reasonably implied by their existing resume content.
3. "keyword_gaps": list important keywords/requirements from the job posting that the candidate's resume doesn't currently address at all, so they know what's missing (max 6).`;

  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
  try {
    const message = await anthropic.messages.create({
      model,
      max_tokens: 1024,
      output_config: { format: { type: "json_schema", schema: ALIGN_SCHEMA } },
      messages: [{ role: "user", content: prompt }],
    });
    await logAiUsage(supabase, {
      userId: user.id,
      feature: "align_to_job",
      model,
      inputTokens: message.usage?.input_tokens,
      outputTokens: message.usage?.output_tokens,
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response from AI." }, { status: 502 });
    }

    const parsed = JSON.parse(textBlock.text) as {
      tailored_summary: string;
      suggested_skills: string[];
      keyword_gaps: string[];
    };

    return NextResponse.json({ ...parsed, credits_remaining: spend.remaining });
  } catch (err) {
    console.error("Align to job failed", err);
    await logAiUsage(supabase, {
      userId: user.id,
      feature: "align_to_job",
      model,
      success: false,
      errorMessage: err instanceof Error ? err.message : "Unknown error",
    });
    return NextResponse.json({ error: "Could not align resume. Please try again." }, { status: 500 });
  }
}
