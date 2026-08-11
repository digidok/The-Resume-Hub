import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { spendCredits } from "@/lib/credits";
import type { ResumeContent } from "@/types/database";

const MESSAGE_SCHEMA = {
  type: "object" as const,
  properties: {
    linkedin: { type: "string" as const, description: "Short LinkedIn connection/InMail message" },
    email: { type: "string" as const, description: "Professional email to a recruiter or hiring manager" },
    whatsapp: { type: "string" as const, description: "Brief, professional WhatsApp-style message" },
  },
  required: ["linkedin", "email", "whatsapp"],
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
  const resumeId = body?.resumeId as string | undefined;
  const jobId = body?.jobId as string | undefined;
  if (!resumeId || !jobId) {
    return NextResponse.json({ error: "resumeId and jobId are required." }, { status: 400 });
  }

  const [{ data: resume, error: resumeError }, { data: job, error: jobError }] = await Promise.all([
    supabase.from("resumes").select("content").eq("id", resumeId).eq("user_id", user.id).single(),
    supabase.from("jobs").select("title, company").eq("id", jobId).single(),
  ]);

  if (resumeError || !resume) {
    return NextResponse.json({ error: "Resume not found." }, { status: 404 });
  }
  if (jobError || !job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  const spend = await spendCredits(supabase, user.id, "recruiter_message");
  if (!spend.ok) {
    return NextResponse.json({ error: spend.error }, { status: 402 });
  }

  const content = resume.content as ResumeContent;
  const anthropic = new Anthropic({ apiKey });

  const prompt = `Write three short outreach messages from a job candidate to a recruiter or hiring manager about the "${job.title}" role at ${job.company}. Base every claim strictly on the candidate's real background below — never invent experience.

CANDIDATE:
Name: ${content.full_name || "N/A"}
Summary: ${content.summary || "N/A"}
Most recent role: ${content.experience[0] ? `${content.experience[0].title} at ${content.experience[0].company}` : "N/A"}
Key skills: ${content.skills?.join(", ") || "N/A"}

Write:
1. "linkedin" — a short (2-3 sentence) LinkedIn connection note or InMail, professional and warm, mentioning the specific role.
2. "email" — a brief professional email (with a natural opening and sign-off, no subject line) introducing the candidate for this role.
3. "whatsapp" — a short, professional WhatsApp-style message (more casual than email, still professional), suitable for a recruiter who's shared their number.

None of the messages should read as generic form letters — reference the actual role and the candidate's real background.`;

  try {
    const message = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
      max_tokens: 1024,
      output_config: { format: { type: "json_schema", schema: MESSAGE_SCHEMA } },
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response from AI." }, { status: 502 });
    }

    const parsed = JSON.parse(textBlock.text) as {
      linkedin: string;
      email: string;
      whatsapp: string;
    };

    const { error: insertError } = await supabase.from("recruiter_messages").insert([
      { user_id: user.id, job_id: jobId, channel: "linkedin", content: parsed.linkedin },
      { user_id: user.id, job_id: jobId, channel: "email", content: parsed.email },
      { user_id: user.id, job_id: jobId, channel: "whatsapp", content: parsed.whatsapp },
    ]);

    if (insertError) {
      console.error("Could not save recruiter messages", insertError);
    }

    return NextResponse.json({ ...parsed, credits_remaining: spend.remaining });
  } catch (err) {
    console.error("Recruiter message generation failed", err);
    return NextResponse.json({ error: "Could not generate messages. Please try again." }, { status: 500 });
  }
}
