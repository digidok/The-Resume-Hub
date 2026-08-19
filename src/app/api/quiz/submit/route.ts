import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/phone";
import { buildPlanVariant } from "@/lib/interview-quiz/plan-engine";
import type { QuizIndustry, QuizPainPoint, QuizTimeline } from "@/types/database";

/**
 * Finds or creates a Resume Hub account for a quiz-taker, exactly like the
 * WhatsApp lead-capture route does — a quiz completion is a lead, and every
 * lead becomes a real (if dormant) candidate account from first contact.
 * Returns a magic link whose redirect_to points back into the funnel, so
 * the browser can navigate straight through it (no email/WhatsApp click
 * needed) and land back signed in via the existing /auth/callback route —
 * the same PKCE code-exchange path Google/LinkedIn login already uses.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const sessionId = typeof body?.session_id === "string" ? body.session_id : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const phoneRaw = typeof body?.phone === "string" ? body.phone : "";
  const answers = (body?.answers ?? {}) as Record<string, string | undefined>;
  const utmSource = typeof body?.utm_source === "string" ? body.utm_source : "direct";

  if (!sessionId || !name || !phoneRaw.trim()) {
    return NextResponse.json({ error: "session_id, name, and phone are required." }, { status: 400 });
  }

  const phone = normalizePhone(phoneRaw);
  const supabase = createAdminClient();

  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const siteUrl = `${protocol}://${host}`;
  const redirectTo = `${siteUrl}/auth/callback?redirect=${encodeURIComponent("/interview-ready/plan")}`;

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("phone_number", phone)
    .maybeSingle();

  let userId: string;
  let email: string;

  if (existingProfile) {
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(existingProfile.id);
    if (userError || !userData.user?.email) {
      return NextResponse.json({ error: "Could not resolve existing account." }, { status: 500 });
    }
    userId = existingProfile.id;
    email = userData.user.email;
  } else {
    email = `wa-${phone.replace(/[^\d]/g, "")}@leads.resumehub.co.za`;
    const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: randomUUID(),
      email_confirm: true,
      user_metadata: { full_name: name, role: "candidate" },
    });

    if (createError || !createdUser.user) {
      return NextResponse.json(
        { error: createError?.message ?? "Could not create account." },
        { status: 500 }
      );
    }
    userId = createdUser.user.id;
    await supabase
      .from("profiles")
      .update({ phone_number: phone, source: "interview_quiz", full_name: name })
      .eq("id", userId);
  }

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });

  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  const planVariant = buildPlanVariant({
    name,
    industry: answers.industry as QuizIndustry | undefined,
    pain_point: answers.pain_point as QuizPainPoint | undefined,
    timeline: answers.timeline as QuizTimeline | undefined,
  });

  const { error: upsertError } = await supabase.from("quiz_responses").upsert(
    {
      session_id: sessionId,
      user_id: userId,
      name,
      phone,
      urgency: answers.urgency ?? null,
      industry: answers.industry ?? null,
      pain_point: answers.pain_point ?? null,
      experience_level: answers.experience_level ?? null,
      format_pref: answers.format_pref ?? null,
      timeline: answers.timeline ?? null,
      plan_variant: planVariant,
      completed: true,
      utm_source: utmSource,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "session_id" }
  );

  if (upsertError) {
    return NextResponse.json({ error: "Could not save your answers." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, magicLink: linkData.properties.action_link });
}
