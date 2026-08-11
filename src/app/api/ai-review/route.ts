import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import type { ResumeContent } from "@/types/database";

function contentToPlainText(content: ResumeContent): string {
  const lines: string[] = [];
  if (content.full_name) lines.push(`Name: ${content.full_name}`);
  if (content.summary) lines.push(`Summary: ${content.summary}`);
  if (content.experience.length) {
    lines.push("Experience:");
    for (const exp of content.experience) {
      lines.push(
        `- ${exp.title || "Role"} at ${exp.company || "Company"} (${exp.start_date ?? ""} - ${
          exp.current ? "Present" : exp.end_date ?? ""
        }): ${exp.description ?? ""}`
      );
    }
  }
  if (content.education.length) {
    lines.push("Education:");
    for (const edu of content.education) {
      lines.push(`- ${edu.degree ?? ""} ${edu.field ?? ""} at ${edu.school}`);
    }
  }
  if (content.projects.length) {
    lines.push("Projects:");
    for (const project of content.projects) {
      lines.push(`- ${project.name}: ${project.description ?? ""}`);
    }
  }
  if (content.skills.length) {
    lines.push(`Skills: ${content.skills.join(", ")}`);
  }
  return lines.join("\n");
}

const REVIEW_SCHEMA = {
  type: "object" as const,
  properties: {
    score: { type: "integer" as const, description: "ATS match score from 0-100" },
    summary: { type: "string" as const },
    strengths: { type: "array" as const, items: { type: "string" as const } },
    weaknesses: { type: "array" as const, items: { type: "string" as const } },
    suggestions: { type: "array" as const, items: { type: "string" as const } },
    keyword_gaps: { type: "array" as const, items: { type: "string" as const } },
  },
  required: ["score", "summary", "strengths", "weaknesses", "suggestions", "keyword_gaps"],
  additionalProperties: false,
};

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI review is not configured. Set ANTHROPIC_API_KEY on the server." },
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
  const jobDescription = (body?.jobDescription as string | undefined)?.trim() || "";
  if (!resumeId) {
    return NextResponse.json({ error: "resumeId is required." }, { status: 400 });
  }

  const { data: resume, error } = await supabase
    .from("resumes")
    .select("id, user_id, content")
    .eq("id", resumeId)
    .eq("user_id", user.id)
    .single();

  if (error || !resume) {
    return NextResponse.json({ error: "Resume not found." }, { status: 404 });
  }

  const resumeText = contentToPlainText(resume.content as ResumeContent);
  const anthropic = new Anthropic({ apiKey });

  const prompt = jobDescription
    ? `Review this resume against the target job description. Score how well it matches (0-100, ATS-style), and give concrete, specific feedback.\n\nRESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jobDescription}`
    : `Review this resume for general quality, clarity, and impact. Score it 0-100 as if evaluated by an applicant tracking system, and give concrete, specific feedback.\n\nRESUME:\n${resumeText}`;

  try {
    const message = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
      max_tokens: 2048,
      output_config: {
        format: { type: "json_schema", schema: REVIEW_SCHEMA },
      },
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response from AI." }, { status: 502 });
    }

    const review = JSON.parse(textBlock.text);

    await supabase.from("ai_reviews").insert({
      resume_id: resumeId,
      job_description: jobDescription || null,
      score: review.score ?? null,
      feedback: review,
    });

    return NextResponse.json(review);
  } catch (err) {
    console.error("AI review failed", err);
    return NextResponse.json({ error: "AI review failed. Please try again." }, { status: 500 });
  }
}
