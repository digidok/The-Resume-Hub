import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { spendCredits } from "@/lib/credits";
import { logAiUsage } from "@/lib/ai/usage";

const DUTIES_SCHEMA = {
  type: "object" as const,
  properties: {
    duties: { type: "array" as const, items: { type: "string" as const } },
  },
  required: ["duties"],
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
  const title = (body?.title as string | undefined)?.trim();
  const company = (body?.company as string | undefined)?.trim();
  const skills = Array.isArray(body?.skills)
    ? (body.skills as unknown[]).filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    : [];
  if (!title) {
    return NextResponse.json({ error: "title is required." }, { status: 400 });
  }

  const spend = await spendCredits(supabase, user.id, "suggest_duties");
  if (!spend.ok) {
    return NextResponse.json({ error: spend.error }, { status: 402 });
  }

  const anthropic = new Anthropic({ apiKey });

  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
  try {
    const message = await anthropic.messages.create({
      model,
      max_tokens: 1400,
      output_config: { format: { type: "json_schema", schema: DUTIES_SCHEMA } },
      messages: [
        {
          role: "user",
          content: `Suggest 8 detailed, achievement-focused resume bullet points for someone working as a "${title}"${
            company ? ` at ${company}` : ""
          }.${
            skills.length > 0
              ? ` They've listed these skills elsewhere on their resume, so lean on them where relevant: ${skills.join(", ")}.`
              : ""
          } Each bullet should describe a specific, concrete duty or accomplishment typical for this role — go beyond generic filler ("responsible for X") and include realistic detail: the tools/systems used, the scale or scope of the work, and a plausible quantified outcome (a percentage, count, timeframe, or amount) wherever it's reasonable for the role, without inventing anything wildly implausible. Start each with a strong action verb. Each bullet is one to two sentences, with no bullet character or leading dash. Vary sentence structure across the 8 bullets so they don't all read the same.`,
        },
      ],
    });
    await logAiUsage(supabase, {
      userId: user.id,
      feature: "resume_suggest_duties",
      model,
      inputTokens: message.usage?.input_tokens,
      outputTokens: message.usage?.output_tokens,
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response from AI." }, { status: 502 });
    }

    const parsed = JSON.parse(textBlock.text) as { duties: string[] };
    return NextResponse.json({ duties: parsed.duties, credits_remaining: spend.remaining });
  } catch (err) {
    console.error("Suggest duties failed", err);
    await logAiUsage(supabase, {
      userId: user.id,
      feature: "resume_suggest_duties",
      model,
      success: false,
      errorMessage: err instanceof Error ? err.message : "Unknown error",
    });
    return NextResponse.json({ error: "Could not suggest duties. Please try again." }, { status: 500 });
  }
}
