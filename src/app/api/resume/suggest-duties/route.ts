import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { spendCredits } from "@/lib/credits";

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
  if (!title) {
    return NextResponse.json({ error: "title is required." }, { status: 400 });
  }

  const spend = await spendCredits(supabase, user.id, "suggest_duties");
  if (!spend.ok) {
    return NextResponse.json({ error: spend.error }, { status: 402 });
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    const message = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
      max_tokens: 768,
      output_config: { format: { type: "json_schema", schema: DUTIES_SCHEMA } },
      messages: [
        {
          role: "user",
          content: `Suggest 6 realistic, achievement-focused resume bullet points for someone working as a "${title}"${
            company ? ` at ${company}` : ""
          }. Each bullet should describe a typical duty or accomplishment for this role, start with a strong action verb, and be a single sentence with no bullet character or leading dash. Keep them generic enough to be plausible for most people in this role, but specific in wording, not vague.`,
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response from AI." }, { status: 502 });
    }

    const parsed = JSON.parse(textBlock.text) as { duties: string[] };
    return NextResponse.json({ duties: parsed.duties, credits_remaining: spend.remaining });
  } catch (err) {
    console.error("Suggest duties failed", err);
    return NextResponse.json({ error: "Could not suggest duties. Please try again." }, { status: 500 });
  }
}
