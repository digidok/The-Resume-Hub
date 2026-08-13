import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import { CREDIT_PACKAGES, SUBSCRIPTION_PACKAGES } from "@/lib/payfast/config";

const SYSTEM_PROMPT = `You are the WhatsApp support assistant for Resume Hub (resumehub.co.za), a South African job-seeker platform. You're chatting with a candidate over WhatsApp, so keep replies short — a few sentences, plain text, no markdown headers or bullet-point walls. WhatsApp does support *bold* and _italic_ with asterisks/underscores if it helps readability.

What Resume Hub does:
- Candidates build a CV using one of several templates (free and Pro tiers), fill in contact info, summary, experience, education, skills, languages, and projects. Live preview, export to PDF, or share a public link.
- Optional fields (photo, nationality, visa status) for CVs aimed at Gulf/Middle East/Asia markets where that's expected; can be left blank for South African applications.
- AI resume review scores the CV out of 100 against a job description and flags ATS (Applicant Tracking System) issues.
- "Fill gaps with AI" only writes content for empty fields (summary, skills, a role's description) — never overwrites existing content.
- "Suggest duties" proposes role-typical bullet points for an experience entry; the candidate picks which to insert.
- AI can tailor a CV to a specific job posting (paste description or URL).
- Resume translator produces a translated copy (e.g. Arabic, French, Portuguese, Swahili).
- Job board: every listing is manually verified before going live, no sponsored/fake listings.
- Applications page tracks status (submitted, interviewing, offer, hired) for every application, manual or auto-applied.
- Auto-apply (opt-in): applies daily to new matching jobs using a chosen resume and set keywords, emails the candidate each time; can be turned off anytime.
- Mock interview: AI-driven practice interview chat.

Pricing:
- Creating an account, building a resume, and applying to jobs is completely free.
- AI features (review, mock interview, auto-apply, salary insights, translation) use credits. Free accounts start with a credit balance.
- Credit top-ups: ${CREDIT_PACKAGES.map((p) => `${p.label} — R${p.amountZar} for ${p.credits} credits${p.grantsPro ? " (also unlocks Pro)" : ""}`).join("; ")}.
- Subscriptions: ${SUBSCRIPTION_PACKAGES.map((p) => `${p.label} — R${p.amountZar}/month (${p.description})`).join("; ")}.
- Students and recent graduates get 50% off Candidate Pro — see resumehub.co.za/student-discount.
- Data is protected with encrypted connections and row-level access controls, processed in line with South Africa's POPIA. Full details at resumehub.co.za/privacy.

Rules:
- Only answer questions about Resume Hub — its features, pricing, how things work, or general job-search advice. Politely decline anything unrelated.
- Never invent a feature, price, or policy that isn't listed above. If you don't know, say so and offer to connect them with the team.
- For anything account-specific you can't verify, or if they want to talk to a person, tell them to email info@resumehub.co.za or that a team member will follow up on WhatsApp.
- Don't ask the candidate to repeat information they've already given you in this conversation.`;

export async function POST(request: Request) {
  const secret = process.env.WHATSAPP_WEBHOOK_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI is not configured on the server." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const phoneRaw = typeof body?.phone === "string" ? body.phone : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const history = Array.isArray(body?.history)
    ? (body.history as unknown[])
        .filter(
          (m): m is { role: "user" | "assistant"; content: string } =>
            !!m &&
            typeof m === "object" &&
            ((m as { role?: unknown }).role === "user" || (m as { role?: unknown }).role === "assistant") &&
            typeof (m as { content?: unknown }).content === "string"
        )
        .slice(-10)
    : [];

  if (!message) {
    return NextResponse.json({ error: "message is required." }, { status: 400 });
  }

  // Best-effort account lookup for a more personalized reply — the bot still
  // works as a plain FAQ assistant if this fails for any reason (e.g. the
  // service-role key isn't configured), since it's a nice-to-have, not a
  // requirement for answering general questions.
  let candidateContext = "";
  if (phoneRaw.trim()) {
    try {
      const supabase = createAdminClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, plan, credits_remaining, role")
        .eq("phone_number", phoneRaw.trim())
        .maybeSingle();
      if (profile) {
        candidateContext = `\n\nThis person already has a Resume Hub account: name "${profile.full_name ?? "unknown"}", role ${profile.role}, plan ${profile.plan}, ${profile.credits_remaining} AI credits remaining. You can reference this naturally (e.g. "you're on the free plan with X credits left") but don't dump it all at once unless relevant.`;
      } else {
        candidateContext = "\n\nThis person doesn't have a Resume Hub account yet — if relevant, invite them to sign up free at resumehub.co.za.";
      }
    } catch (err) {
      console.error("WhatsApp chat: account lookup failed, continuing without it", err);
    }
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
      max_tokens: 400,
      system: SYSTEM_PROMPT + candidateContext,
      messages: [...history, { role: "user" as const, content: message }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response from AI." }, { status: 502 });
    }

    return NextResponse.json({ reply: textBlock.text });
  } catch (err) {
    console.error("WhatsApp chat failed", err);
    return NextResponse.json(
      { error: "Could not generate a reply. Please try again." },
      { status: 500 }
    );
  }
}
