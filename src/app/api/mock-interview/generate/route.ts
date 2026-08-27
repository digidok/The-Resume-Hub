import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { spendCredits } from "@/lib/credits";
import { logAiUsage } from "@/lib/ai/usage";

const QUESTIONS_SCHEMA = {
  type: "object" as const,
  properties: {
    questions: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          category: {
            type: "string" as const,
            enum: ["behavioural", "technical", "situational", "culture_fit", "motivation"],
          },
          difficulty: { type: "string" as const, enum: ["easy", "medium", "hard"] },
          question: { type: "string" as const },
        },
        required: ["category", "difficulty", "question"],
        additionalProperties: false,
      },
    },
  },
  required: ["questions"],
  additionalProperties: false,
};

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Mock interview is not configured. Set ANTHROPIC_API_KEY on the server." },
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
  const role = (body?.role as string | undefined)?.trim();
  const company = (body?.company as string | undefined)?.trim();
  if (!role) {
    return NextResponse.json({ error: "role is required." }, { status: 400 });
  }

  const spend = await spendCredits(supabase, user.id, "mock_interview");
  if (!spend.ok) {
    return NextResponse.json({ error: spend.error }, { status: 402 });
  }

  const anthropic = new Anthropic({ apiKey });

  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
  try {
    const message = await anthropic.messages.create({
      model,
      max_tokens: 1024,
      output_config: { format: { type: "json_schema", schema: QUESTIONS_SCHEMA } },
      messages: [
        {
          role: "user",
          content: `Generate exactly 5 mock interview questions for a "${role}" role${
            company ? ` at ${company}` : ""
          }, one for each of these categories: behavioural, technical, situational, culture_fit, motivation. Vary the difficulty across easy/medium/hard. Make the technical and situational questions specific to the role, not generic.`,
        },
      ],
    });
    await logAiUsage(supabase, {
      userId: user.id,
      feature: "mock_interview_generate",
      model,
      inputTokens: message.usage?.input_tokens,
      outputTokens: message.usage?.output_tokens,
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response from AI." }, { status: 502 });
    }

    const parsed = JSON.parse(textBlock.text);
    return NextResponse.json({
      questions: parsed.questions,
      credits_remaining: spend.remaining,
    });
  } catch (err) {
    console.error("Mock interview question generation failed", err);
    await logAiUsage(supabase, {
      userId: user.id,
      feature: "mock_interview_generate",
      model,
      success: false,
      errorMessage: err instanceof Error ? err.message : "Unknown error",
    });
    return NextResponse.json({ error: "Could not generate questions. Please try again." }, { status: 500 });
  }
}
