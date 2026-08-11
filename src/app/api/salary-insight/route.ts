import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { spendCredits } from "@/lib/credits";

const SALARY_SCHEMA = {
  type: "object" as const,
  properties: {
    currency: { type: "string" as const, description: "ISO currency code, e.g. ZAR, USD" },
    low: { type: "integer" as const },
    median: { type: "integer" as const },
    high: { type: "integer" as const },
    period: { type: "string" as const, description: "'year' or 'month'" },
    summary: { type: "string" as const },
    factors: { type: "array" as const, items: { type: "string" as const } },
  },
  required: ["currency", "low", "median", "high", "period", "summary", "factors"],
  additionalProperties: false,
};

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Salary insights are not configured. Set ANTHROPIC_API_KEY on the server." },
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
  const location = (body?.location as string | undefined)?.trim();
  if (!role || !location) {
    return NextResponse.json({ error: "role and location are required." }, { status: 400 });
  }

  const spend = await spendCredits(supabase, user.id, "salary_insight");
  if (!spend.ok) {
    return NextResponse.json({ error: spend.error }, { status: 402 });
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    const message = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
      max_tokens: 512,
      output_config: { format: { type: "json_schema", schema: SALARY_SCHEMA } },
      messages: [
        {
          role: "user",
          content: `Estimate a realistic salary range for this role and location based on general market knowledge. Be a reasonable, conservative estimator — this is a rough guide, not verified market data.\n\nRole: ${role}\nLocation: ${location}`,
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response from AI." }, { status: 502 });
    }

    return NextResponse.json({
      ...JSON.parse(textBlock.text),
      credits_remaining: spend.remaining,
    });
  } catch (err) {
    console.error("Salary insight failed", err);
    return NextResponse.json({ error: "Could not estimate salary. Please try again." }, { status: 500 });
  }
}
