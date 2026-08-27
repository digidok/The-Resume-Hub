import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { logAiUsage } from "@/lib/ai/usage";

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI assist is not configured. Set ANTHROPIC_API_KEY on the server." },
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "employer") {
    return NextResponse.json({ error: "Only employer accounts can use this." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const title = (body?.title as string | undefined)?.trim();
  const company = (body?.company as string | undefined)?.trim();
  const employmentType = (body?.employmentType as string | undefined)?.trim();
  const existingDescription = (body?.description as string | undefined)?.trim();

  if (!title || !company) {
    return NextResponse.json({ error: "Title and company are required first." }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey });

  const prompt = existingDescription
    ? `Improve this job description for clarity, structure, and appeal to candidates. Keep the same facts — don't invent responsibilities, requirements, or benefits that aren't implied. Use short paragraphs and bullet points where useful.

Job title: ${title}
Company: ${company}
Employment type: ${employmentType ?? "full_time"}

CURRENT DESCRIPTION:
${existingDescription}

Return only the improved job description text.`
    : `Write a clear, well-structured job description for this role. Include a short intro, a "What you'll do" section, and a "What we're looking for" section. Use bullet points. Do not invent a specific salary or company-specific benefits — keep those generic or omit them.

Job title: ${title}
Company: ${company}
Employment type: ${employmentType ?? "full_time"}

Return only the job description text.`;

  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
  try {
    const message = await anthropic.messages.create({
      model,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });
    await logAiUsage(supabase, {
      userId: user.id,
      feature: "job_ai_assist",
      model,
      inputTokens: message.usage?.input_tokens,
      outputTokens: message.usage?.output_tokens,
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response from AI." }, { status: 502 });
    }

    return NextResponse.json({ description: textBlock.text.trim() });
  } catch (err) {
    console.error("Job AI assist failed", err);
    await logAiUsage(supabase, {
      userId: user.id,
      feature: "job_ai_assist",
      model,
      success: false,
      errorMessage: err instanceof Error ? err.message : "Unknown error",
    });
    return NextResponse.json({ error: "AI assist failed. Please try again." }, { status: 500 });
  }
}
