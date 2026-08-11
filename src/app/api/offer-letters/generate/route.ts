import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Offer letter drafting is not configured. Set ANTHROPIC_API_KEY on the server." },
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
  const applicationId = body?.applicationId as string | undefined;
  if (!applicationId) {
    return NextResponse.json({ error: "applicationId is required." }, { status: 400 });
  }

  const { data: application, error: appError } = await supabase
    .from("applications")
    .select("id, job_id, jobs:job_id(title, company, employer_id), profiles:candidate_id(full_name)")
    .eq("id", applicationId)
    .single();

  if (appError || !application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  const job = Array.isArray(application.jobs) ? application.jobs[0] : application.jobs;
  const candidate = Array.isArray(application.profiles)
    ? application.profiles[0]
    : application.profiles;

  if (!job || job.employer_id !== user.id) {
    return NextResponse.json({ error: "Not authorized for this application." }, { status: 403 });
  }

  const anthropic = new Anthropic({ apiKey });

  const prompt = `Draft a professional, warm job offer letter. Use placeholder brackets like [Start Date] and [Annual Salary] for details that aren't given here, since the employer will fill those in before sending.

Candidate: ${candidate?.full_name || "the candidate"}
Job title: ${job.title}
Company: ${job.company}

Return only the offer letter text, no preamble.`;

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

    const content = textBlock.text.trim();

    const { data: existing } = await supabase
      .from("offer_letters")
      .select("id")
      .eq("application_id", applicationId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("offer_letters")
        .update({ content, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await supabase.from("offer_letters").insert({
        application_id: applicationId,
        employer_id: user.id,
        content,
      });
    }

    return NextResponse.json({ content });
  } catch (err) {
    console.error("Offer letter generation failed", err);
    return NextResponse.json({ error: "Could not draft offer letter. Please try again." }, { status: 500 });
  }
}
