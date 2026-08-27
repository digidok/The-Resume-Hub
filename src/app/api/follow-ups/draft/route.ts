import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { spendCredits } from "@/lib/credits";
import { logAiUsage } from "@/lib/ai/usage";

const DRAFT_SCHEMA = {
  type: "object" as const,
  properties: {
    subject: { type: "string" as const },
    body: { type: "string" as const },
  },
  required: ["subject", "body"],
  additionalProperties: false,
};

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Follow-up drafting is not configured. Set ANTHROPIC_API_KEY on the server." },
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
  const followUpId = body?.followUpId as string | undefined;
  if (!followUpId) {
    return NextResponse.json({ error: "followUpId is required." }, { status: 400 });
  }

  const { data: followUp, error: followUpError } = await supabase
    .from("follow_ups")
    .select("id, due_date, applications:application_id(created_at, jobs:job_id(title, company))")
    .eq("id", followUpId)
    .eq("user_id", user.id)
    .single();

  if (followUpError || !followUp) {
    return NextResponse.json({ error: "Follow-up not found." }, { status: 404 });
  }

  const application = Array.isArray(followUp.applications)
    ? followUp.applications[0]
    : followUp.applications;
  const job = application ? (Array.isArray(application.jobs) ? application.jobs[0] : application.jobs) : null;

  if (!job) {
    return NextResponse.json({ error: "Could not find the related job." }, { status: 404 });
  }

  const spend = await spendCredits(supabase, user.id, "follow_up_draft");
  if (!spend.ok) {
    return NextResponse.json({ error: spend.error }, { status: 402 });
  }

  const daysSinceApplying = application
    ? Math.max(0, Math.round((Date.now() - new Date(application.created_at).getTime()) / 86400000))
    : null;

  const anthropic = new Anthropic({ apiKey });

  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
  try {
    const message = await anthropic.messages.create({
      model,
      max_tokens: 500,
      output_config: { format: { type: "json_schema", schema: DRAFT_SCHEMA } },
      messages: [
        {
          role: "user",
          content: `Draft a short, professional follow-up email for a job application. Use "[Hiring Manager's Name]" as a placeholder for the recipient's name since it isn't known. Keep it brief (3 short paragraphs max), polite, and not pushy.

Job title: ${job.title}
Company: ${job.company}
${daysSinceApplying !== null ? `Applied ${daysSinceApplying} day${daysSinceApplying === 1 ? "" : "s"} ago, no response yet.` : ""}`,
        },
      ],
    });
    await logAiUsage(supabase, {
      userId: user.id,
      feature: "follow_up_draft",
      model,
      inputTokens: message.usage?.input_tokens,
      outputTokens: message.usage?.output_tokens,
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response from AI." }, { status: 502 });
    }

    const parsed = JSON.parse(textBlock.text);

    const { error: updateError } = await supabase
      .from("follow_ups")
      .update({ draft_subject: parsed.subject, draft_body: parsed.body })
      .eq("id", followUpId);

    if (updateError) {
      return NextResponse.json({ error: "Could not save the draft." }, { status: 500 });
    }

    return NextResponse.json({
      subject: parsed.subject,
      body: parsed.body,
      credits_remaining: spend.remaining,
    });
  } catch (err) {
    console.error("Follow-up draft failed", err);
    await logAiUsage(supabase, {
      userId: user.id,
      feature: "follow_up_draft",
      model,
      success: false,
      errorMessage: err instanceof Error ? err.message : "Unknown error",
    });
    return NextResponse.json({ error: "Could not draft the email. Please try again." }, { status: 500 });
  }
}
