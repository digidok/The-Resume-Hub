import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findOrCreateWhatsAppCandidate } from "@/lib/whatsapp-candidate";
import { sendWhatsAppMessage } from "@/lib/notifications/whatsapp";
import { randomSuffix } from "@/lib/slug";
import { emptyResumeContent } from "@/types/database";
import type { LinkedInExperienceEntry, ResumeContent } from "@/types/database";

const ACCESS_WINDOW_DAYS = 30;
const REFERRAL_DISCOUNT_PERCENT = 20;

/** Phase 3 (account provisioning) + the payment-confirmed half of Phase 6
 * (referral reward) for the WhatsApp-first done-for-you CV/LinkedIn service.
 * n8n calls this once its own Payfast ITN listener confirms payment for a
 * review-queue order (payment itself is generated and confirmed entirely in
 * n8n — see the client-decision route's dual-approval gate for the
 * precondition that must hold before n8n is even allowed to charge). This
 * endpoint:
 *   1. finds or creates the Resume Hub account for the customer's phone
 *      number, optionally attributing it to a referrer via referredByCode
 *      (shared find-or-create logic with the standalone lead-capture
 *      webhook, so the same person never ends up with two accounts),
 *   2. grants a 30-day free Pro window (Phase 4 aftercare) using the exact
 *      plan/subscription_plan/subscription_expires_at combination the
 *      one-off Pro purchase already grants — reads as "Active until X", no
 *      cancel button, no recurring charge,
 *   3. for a CV + cover letter order, creates a real `resumes` row (and a
 *      `cover_letters` row if content is provided); for a LinkedIn revamp
 *      order, creates a `linkedin_copy_packs` row — deliberately reusing (or,
 *      for the copy pack, extending) the platform's own models rather than a
 *      separate documents table, so the delivered work is immediately usable
 *      in the normal dashboard the moment payment clears,
 *   4. if this order was discounted with a referral code (set on the review
 *      by the client-decision route), marks that code redeemed,
 *   5. if the customer was themselves referred and this is their first
 *      confirmed order, mints their referrer a one-time discount code for
 *      the referrer's own next order and best-effort WhatsApps them about it
 *      — the "referral trigger once a CV is delivered" growth loop.
 * Idempotent: safe to call again on a retried webhook — it reuses the
 * existing account/resume/copy-pack rather than creating duplicates, and
 * never mints a second discount for the same referral. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const secret = process.env.WHATSAPP_WEBHOOK_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : undefined;
  const email = typeof body?.email === "string" ? body.email.trim() : undefined;
  const referredByCode = typeof body?.referredByCode === "string" ? body.referredByCode.trim() : undefined;
  const resumeContent =
    body?.resumeContent && typeof body.resumeContent === "object"
      ? (body.resumeContent as Partial<ResumeContent>)
      : undefined;
  const coverLetterContent = typeof body?.coverLetterContent === "string" ? body.coverLetterContent : undefined;
  const linkedinCopyPack =
    body?.linkedinCopyPack && typeof body.linkedinCopyPack === "object"
      ? (body.linkedinCopyPack as {
          headline?: string;
          about?: string;
          experience?: LinkedInExperienceEntry[];
          skills?: string[];
        })
      : undefined;

  const admin = createAdminClient();

  const { data: review } = await admin
    .from("whatsapp_review_queue")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!review) {
    return NextResponse.json({ error: "Review item not found." }, { status: 404 });
  }

  if (review.status !== "approved" || review.client_status !== "approved") {
    return NextResponse.json(
      { error: "Both admin and client approval are required before provisioning an account." },
      { status: 409 }
    );
  }

  const candidateResult = await findOrCreateWhatsAppCandidate(admin, {
    phone: review.customer_phone,
    name: name || review.customer_name || undefined,
    email,
    referredByCode,
  });
  if (!candidateResult.ok) {
    return NextResponse.json({ error: candidateResult.error }, { status: 500 });
  }

  const now = new Date();
  const currentExpiry = review.access_expires_at ? new Date(review.access_expires_at) : null;
  const base = currentExpiry && currentExpiry > now ? currentExpiry : now;
  const accessExpiresAt = new Date(base.getTime() + ACCESS_WINDOW_DAYS * 86400000).toISOString();

  const { data: candidateProfile } = await admin
    .from("profiles")
    .select("referral_code, referred_by")
    .eq("id", candidateResult.candidateId)
    .single();

  await admin
    .from("profiles")
    .update({
      plan: "pro",
      subscription_plan: "candidate_pro",
      subscription_expires_at: accessExpiresAt,
      whatsapp_opt_in: true,
    })
    .eq("id", candidateResult.candidateId);

  let resumeId: string | null = review.provisioned_resume_id;
  if (!resumeId && review.service_type === "cv_cover_letter" && resumeContent) {
    const { data: resume, error: resumeError } = await admin
      .from("resumes")
      .insert({
        user_id: candidateResult.candidateId,
        title: "My CV",
        slug: `resume-${randomSuffix(8)}`,
        template: review.template || "professional",
        content: { ...emptyResumeContent(), ...resumeContent },
      })
      .select("id")
      .single();
    if (resumeError) {
      console.error("WhatsApp order provisioning: resume creation failed", resumeError);
    } else {
      resumeId = resume.id;
    }

    if (coverLetterContent) {
      const { error: coverLetterError } = await admin.from("cover_letters").insert({
        user_id: candidateResult.candidateId,
        title: "My Cover Letter",
        content: coverLetterContent,
      });
      if (coverLetterError) {
        console.error("WhatsApp order provisioning: cover letter creation failed", coverLetterError);
      }
    }
  }

  let linkedinPackId: string | null = review.provisioned_linkedin_pack_id;
  if (!linkedinPackId && review.service_type === "linkedin_revamp" && linkedinCopyPack) {
    const { data: pack, error: packError } = await admin
      .from("linkedin_copy_packs")
      .insert({
        user_id: candidateResult.candidateId,
        review_id: review.id,
        headline: linkedinCopyPack.headline ?? null,
        about: linkedinCopyPack.about ?? null,
        experience: linkedinCopyPack.experience ?? [],
        skills: linkedinCopyPack.skills ?? [],
      })
      .select("id")
      .single();
    if (packError) {
      console.error("WhatsApp order provisioning: LinkedIn copy pack creation failed", packError);
    } else {
      linkedinPackId = pack.id;
    }
  }

  // Redeem the discount code this order used (set by the client-decision
  // route when the client approved), now that payment has actually cleared.
  if (review.discount_code_id) {
    await admin
      .from("discount_codes")
      .update({
        redeemed: true,
        redeemed_by: candidateResult.candidateId,
        redeemed_review_id: review.id,
        redeemed_at: now.toISOString(),
      })
      .eq("id", review.discount_code_id)
      .eq("redeemed", false);
  }

  // This customer's own referral conversion: mint their referrer a discount
  // for the referrer's next order, once — never twice for the same referral.
  let referralGrantedCode: string | null = null;
  if (candidateProfile?.referred_by) {
    const { data: existingGrant } = await admin
      .from("discount_codes")
      .select("id")
      .eq("owner_id", candidateProfile.referred_by)
      .eq("referred_profile_id", candidateResult.candidateId)
      .maybeSingle();

    if (!existingGrant) {
      const code = `SAVE${REFERRAL_DISCOUNT_PERCENT}-${randomSuffix(6).toUpperCase()}`;
      const { error: grantError } = await admin.from("discount_codes").insert({
        code,
        owner_id: candidateProfile.referred_by,
        percent_off: REFERRAL_DISCOUNT_PERCENT,
        referred_profile_id: candidateResult.candidateId,
      });
      if (!grantError) {
        referralGrantedCode = code;
        const { data: referrerProfile } = await admin
          .from("profiles")
          .select("phone_number, whatsapp_opt_in")
          .eq("id", candidateProfile.referred_by)
          .single();
        if (referrerProfile?.phone_number && referrerProfile.whatsapp_opt_in) {
          await sendWhatsAppMessage(
            referrerProfile.phone_number,
            `🎉 Someone you referred to Resume Hub just got their order delivered! Here's ${REFERRAL_DISCOUNT_PERCENT}% off your next WhatsApp order: ${code}`
          );
        }
      } else {
        console.error("WhatsApp order provisioning: referral discount grant failed", grantError);
      }
    }
  }

  await admin
    .from("whatsapp_review_queue")
    .update({
      payment_confirmed_at: review.payment_confirmed_at ?? now.toISOString(),
      access_expires_at: accessExpiresAt,
      provisioned_profile_id: candidateResult.candidateId,
      provisioned_resume_id: resumeId,
      provisioned_linkedin_pack_id: linkedinPackId,
      updated_at: now.toISOString(),
    })
    .eq("id", id);

  return NextResponse.json({
    candidateId: candidateResult.candidateId,
    email: candidateResult.email,
    magicLink: candidateResult.magicLink,
    resumeId,
    linkedinPackId,
    accessExpiresAt,
    referralCode: candidateProfile?.referral_code ?? null,
    referrerDiscountGranted: referralGrantedCode,
  });
}
