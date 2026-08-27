import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { logAiUsage } from "@/lib/ai/usage";

const MAX_HISTORY = 12;
const MAX_MESSAGE_LENGTH = 2000;

const SYSTEM_PROMPT = `You are Els, the in-app AI assistant for Resume Hub — a job-seeker and hiring platform for South Africa (resumehub.co.za).

You help with: building and improving a CV, understanding job match scores, preparing for interviews, salary expectations in ZAR, and finding your way around the platform's tools — Career Passport, CV Builder, ATS Scanner, Mock Interview Coach, Bulk Apply, Auto-Apply, Salary Insights, Application Kits, and — for employers — posting jobs, reviewing candidates, and induction/offer tools.

Keep answers short (2-5 sentences unless the question needs a list), practical, and specific to South Africa where relevant (POPIA, NQF qualifications, matric, ZAR salaries). When a dedicated in-app tool would help more than a chat answer, point to it by name and path, e.g. "Try the ATS Scanner at /dashboard/ats-scanner." If asked something unrelated to jobs, CVs, or the platform, politely redirect back to what you can help with. Never invent platform features, prices, or policies you're not sure of.

Reply in plain text only — this is rendered as-is in a chat bubble with no markdown support. No **bold**, no _italics_, no markdown headings. For lists, use a line break and a plain "-" per item, nothing fancier.`;

type IncomingMessage = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Ask Els isn't configured yet." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const rawMessages = Array.isArray(body?.messages) ? body.messages : null;
  if (!rawMessages || rawMessages.length === 0) {
    return NextResponse.json({ error: "messages is required." }, { status: 400 });
  }

  const messages: IncomingMessage[] = rawMessages
    .filter(
      (m: unknown): m is IncomingMessage =>
        typeof m === "object" &&
        m !== null &&
        ((m as IncomingMessage).role === "user" || (m as IncomingMessage).role === "assistant") &&
        typeof (m as IncomingMessage).content === "string" &&
        (m as IncomingMessage).content.trim().length > 0
    )
    .slice(-MAX_HISTORY)
    .map((m: IncomingMessage) => ({ role: m.role, content: m.content.trim().slice(0, MAX_MESSAGE_LENGTH) }));

  if (messages.length === 0) {
    return NextResponse.json({ error: "messages is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profileContext = "The visitor is not signed in yet.";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .single();
    if (profile) {
      const roleLabel =
        profile.role === "employer" ? "an employer" : profile.role === "admin" ? "an admin" : "a candidate";
      profileContext = `The signed-in user is ${profile.full_name || "a user"}, using Resume Hub as ${roleLabel}.`;
    }
  }

  const anthropic = new Anthropic({ apiKey });

  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
  try {
    const message = await anthropic.messages.create({
      model,
      max_tokens: 500,
      system: `${SYSTEM_PROMPT}\n\n${profileContext}`,
      messages,
    });
    await logAiUsage(supabase, {
      userId: user?.id ?? null,
      feature: "ask_els",
      model,
      inputTokens: message.usage?.input_tokens,
      outputTokens: message.usage?.output_tokens,
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response from Els." }, { status: 502 });
    }

    return NextResponse.json({ reply: textBlock.text.trim() });
  } catch (err) {
    console.error("Ask Els failed", err);
    await logAiUsage(supabase, {
      userId: user?.id ?? null,
      feature: "ask_els",
      model,
      success: false,
      errorMessage: err instanceof Error ? err.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Els is having trouble responding right now. Please try again." },
      { status: 500 }
    );
  }
}
