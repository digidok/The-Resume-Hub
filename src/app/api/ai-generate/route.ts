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
  if (content.skills.length) {
    lines.push(`Skills: ${content.skills.join(", ")}`);
  }
  return lines.join("\n");
}

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
  const jobId = body?.jobId as string | undefined;
  if (!resumeId || !jobId) {
    return NextResponse.json({ error: "resumeId and jobId are required." }, { status: 400 });
  }

  const [{ data: resume, error: resumeError }, { data: job, error: jobError }] = await Promise.all([
    supabase.from("resumes").select("content").eq("id", resumeId).eq("user_id", user.id).single(),
    supabase.from("jobs").select("title, company, description").eq("id", jobId).single(),
  ]);

  if (resumeError || !resume) {
    return NextResponse.json({ error: "Resume not found." }, { status: 404 });
  }
  if (jobError || !job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  const spend = await spendCredits(supabase, user.id, "ai_generate");
  if (!spend.ok) {
    return NextResponse.json({ error: spend.error }, { status: 402 });
  }

  const resumeText = contentToPlainText(resume.content as ResumeContent);
  const anthropic = new Anthropic({ apiKey });

  const prompt = `Write a tailored, specific cover letter for this candidate applying to this job. Use the candidate's real experience from their resume — do not invent skills or achievements. Keep it to 3-4 short paragraphs, professional but not generic, no placeholder brackets.

RESUME:
${resumeText}

JOB TITLE: ${job.title}
COMPANY: ${job.company}
JOB DESCRIPTION:
${job.description}

Return only the cover letter text, no preamble or sign-off instructions.`;

  try {
    const message = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response from AI." }, { status: 502 });
    }

    const { data: coverLetter, error: insertError } = await supabase
      .from("cover_letters")
      .insert({
        user_id: user.id,
        job_id: jobId,
        title: `Cover letter — ${job.title} at ${job.company}`,
        content: textBlock.text.trim(),
      })
      .select("id")
      .single();

    if (insertError || !coverLetter) {
      return NextResponse.json({ error: "Could not save cover letter." }, { status: 500 });
    }

    return NextResponse.json({ coverLetterId: coverLetter.id, credits_remaining: spend.remaining });
  } catch (err) {
    console.error("AI generate failed", err);
    return NextResponse.json({ error: "AI generation failed. Please try again." }, { status: 500 });
  }
}
