import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

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
  const question = (body?.question as string | undefined)?.trim();
  const answer = (body?.answer as string | undefined)?.trim();

  if (!role || !question || !answer) {
    return NextResponse.json({ error: "role, question, and answer are required." }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    const message = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content: `You're an interview coach reviewing a candidate's answer for a "${role}" role.\n\nQuestion: ${question}\n\nCandidate's answer: ${answer}\n\nGive brief, direct feedback (2-4 sentences): what worked, and one concrete way to improve the answer. No preamble.`,
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response from AI." }, { status: 502 });
    }

    return NextResponse.json({ feedback: textBlock.text.trim() });
  } catch (err) {
    console.error("Mock interview feedback failed", err);
    return NextResponse.json({ error: "Could not get feedback. Please try again." }, { status: 500 });
  }
}
