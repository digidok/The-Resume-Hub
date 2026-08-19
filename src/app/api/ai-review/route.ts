import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { spendCredits } from "@/lib/credits";
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
  if (content.languages.length) {
    lines.push(`Languages: ${content.languages.join(", ")}`);
  }
  return lines.join("\n");
}

const REVIEW_SCHEMA = {
  type: "object" as const,
  properties: {
    score: { type: "integer" as const, description: "Overall CV score from 0-100" },
    summary: { type: "string" as const },
    strengths: { type: "array" as const, items: { type: "string" as const } },
    weaknesses: { type: "array" as const, items: { type: "string" as const } },
    suggestions: { type: "array" as const, items: { type: "string" as const } },
    keyword_gaps: { type: "array" as const, items: { type: "string" as const } },
    categories: {
      type: "object" as const,
      description:
        "Sub-scores (0-100), each grounded in specific evidence from the resume text — not guessed.",
      properties: {
        ats_compatibility: { type: "integer" as const },
        keyword_coverage: { type: "integer" as const },
        summary_quality: { type: "integer" as const },
        experience_quality: { type: "integer" as const },
        achievement_quality: { type: "integer" as const },
        skills_score: { type: "integer" as const },
        formatting_score: { type: "integer" as const },
        completeness_score: { type: "integer" as const },
      },
      required: [
        "ats_compatibility",
        "keyword_coverage",
        "summary_quality",
        "experience_quality",
        "achievement_quality",
        "skills_score",
        "formatting_score",
        "completeness_score",
      ],
      additionalProperties: false,
    },
  },
  required: ["score", "summary", "strengths", "weaknesses", "suggestions", "keyword_gaps", "categories"],
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

  const categoryInstructions = `Also score these 8 categories from 0-100, each based on specific, concrete evidence you can point to in the resume text above — never a guess or a round default number:
- ats_compatibility: would an ATS parse the structure/dates/headings correctly?
- keyword_coverage: ${jobDescription ? "overlap with the job description's key terms" : "presence of role-relevant keywords for the candidate's apparent field"}
- summary_quality: is the summary specific and outcome-focused, or generic filler?
- experience_quality: are roles described with real scope and responsibility, not just duty lists?
- achievement_quality: how many bullet points show a measurable, quantified result?
- skills_score: are the listed skills relevant, specific, and not vague buzzwords?
- formatting_score: is structure consistent (dates present, no obvious gaps in the data)?
- completeness_score: how many expected sections (summary, experience, education, skills) are actually filled in?`;

  const prompt = jobDescription
    ? `Review this resume against the target job description. Score how well it matches (0-100, ATS-style), and give concrete, specific feedback.\n\nRESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jobDescription}\n\n${categoryInstructions}`
    : `Review this resume for general quality, clarity, and impact. Score it 0-100 as if evaluated by an applicant tracking system, and give concrete, specific feedback.\n\nRESUME:\n${resumeText}\n\n${categoryInstructions}`;

  try {
    const message = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
      // The full review (summary + 4 feedback arrays + 8 grounded category
      // scores) plus the model's own reasoning both draw from this same
      // budget — 2048 was cutting responses off mid-JSON on a real resume
      // more often than not (confirmed empirically: 2 of 3 real-resume
      // test runs hit stop_reason "max_tokens" and failed JSON.parse).
      max_tokens: 4096,
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

    // Only charge once the scan has actually produced a result — a failed
    // AI call shouldn't cost the candidate a credit for nothing.
    const spend = await spendCredits(supabase, user.id, "ai_review");
    if (!spend.ok) {
      return NextResponse.json({ error: spend.error }, { status: 402 });
    }

    await supabase.from("ai_reviews").insert({
      resume_id: resumeId,
      job_description: jobDescription || null,
      score: review.score ?? null,
      feedback: review,
    });

    return NextResponse.json({ ...review, credits_remaining: spend.remaining });
  } catch (err) {
    console.error("AI review failed", err);
    return NextResponse.json({ error: "AI review failed. Please try again." }, { status: 500 });
  }
}
