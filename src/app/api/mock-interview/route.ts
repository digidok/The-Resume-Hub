import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { spendCredits } from "@/lib/credits";

type ChatMessage = { role: "user" | "assistant"; content: string };

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
  const messages = (body?.messages as ChatMessage[] | undefined) ?? [];

  if (!role) {
    return NextResponse.json({ error: "role is required." }, { status: 400 });
  }

  const isStart = messages.length === 0;
  if (isStart) {
    const spend = await spendCredits(supabase, user.id, "mock_interview");
    if (!spend.ok) {
      return NextResponse.json({ error: spend.error }, { status: 402 });
    }
  }

  const anthropic = new Anthropic({ apiKey });
  const systemPrompt = `You are an experienced interviewer conducting a mock job interview for the role of "${role}"${
    company ? ` at ${company}` : ""
  }. Ask one question at a time, wait for the candidate's answer, then give brief constructive feedback (1-2 sentences) before asking the next question. Cover a mix of behavioral and role-relevant questions. Keep your responses focused and conversational, not overly long. If this is the first message, open with a short greeting and your first question.`;

  const claudeMessages =
    messages.length > 0
      ? messages
      : [{ role: "user" as const, content: "Let's begin the interview." }];

  try {
    const message = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
      max_tokens: 600,
      system: systemPrompt,
      messages: claudeMessages,
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response from AI." }, { status: 502 });
    }

    return NextResponse.json({ reply: textBlock.text });
  } catch (err) {
    console.error("Mock interview failed", err);
    return NextResponse.json({ error: "Mock interview failed. Please try again." }, { status: 500 });
  }
}
