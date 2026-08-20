import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/phone";
import { hasUnlimitedCredits } from "@/lib/credits";
import type { ResumeContent } from "@/types/database";

/** Phase 4 of the WhatsApp-first done-for-you CV/LinkedIn service: the
 * WhatsApp half of the "two symmetric edit paths, one source of truth"
 * aftercare design. n8n owns turning a free-text message ("change my job
 * title to Senior Analyst") into a structured patch — this endpoint just
 * applies it to the candidate's resume, which is the exact same `resumes`
 * row and content shape the dashboard CV builder edits (the platform path
 * needs no new code at all, since it already writes to this table).
 *
 * `changes` replaces whole top-level ResumeContent fields, not a deep merge —
 * to edit one experience entry, n8n must send the complete updated
 * `experience` array back, not a nested patch. That keeps the semantics
 * unambiguous instead of guessing how to merge nested arrays.
 *
 * Gated on the same Pro access every other unlimited-AI-feature check in
 * this app uses (hasUnlimitedCredits) — which is exactly what the Phase 3
 * provisioning endpoint grants for 30 days, so this naturally expires with
 * the aftercare window and doubles as a Pro-subscriber perk for anyone else
 * who's opted into WhatsApp. */
export async function POST(request: Request) {
  const secret = process.env.WHATSAPP_WEBHOOK_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const phoneRaw = typeof body?.phone === "string" ? body.phone : "";
  const changes =
    body?.changes && typeof body.changes === "object" ? (body.changes as Partial<ResumeContent>) : null;

  if (!phoneRaw.trim()) {
    return NextResponse.json({ error: "phone is required" }, { status: 400 });
  }
  if (!changes || Object.keys(changes).length === 0) {
    return NextResponse.json({ error: "changes must be a non-empty object." }, { status: 400 });
  }

  const phone = normalizePhone(phoneRaw);
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, plan, subscription_plan, subscription_expires_at")
    .eq("phone_number", phone)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({
      reply: "We don't have a Resume Hub account linked to this WhatsApp number. Sign up free at resumehub.co.za first.",
    });
  }

  if (!hasUnlimitedCredits(profile)) {
    return NextResponse.json({
      reply:
        "Your free WhatsApp editing window has ended. You can still edit your CV any time in the dashboard, or upgrade to Pro at resumehub.co.za/pricing to keep editing here.",
    });
  }

  const { data: resume } = await admin
    .from("resumes")
    .select("id, content")
    .eq("user_id", profile.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!resume) {
    return NextResponse.json({ reply: "You don't have a CV on Resume Hub yet — build one first at resumehub.co.za." });
  }

  const { error } = await admin
    .from("resumes")
    .update({
      content: { ...(resume.content as ResumeContent), ...changes },
      updated_at: new Date().toISOString(),
    })
    .eq("id", resume.id);

  if (error) {
    console.error("WhatsApp resume edit failed", error);
    return NextResponse.json({ reply: "Something went wrong saving that change — please try again shortly." });
  }

  return NextResponse.json({
    reply: `Updated your CV. Changed: ${Object.keys(changes).join(", ")}.`,
    resumeId: resume.id,
    updatedFields: Object.keys(changes),
  });
}
