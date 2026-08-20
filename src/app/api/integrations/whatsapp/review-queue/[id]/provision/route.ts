import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findOrCreateWhatsAppCandidate } from "@/lib/whatsapp-candidate";
import { randomSuffix } from "@/lib/slug";
import { emptyResumeContent } from "@/types/database";
import type { ResumeContent } from "@/types/database";

const ACCESS_WINDOW_DAYS = 30;

/** Phase 3 of the WhatsApp-first done-for-you CV/LinkedIn service: auto
 * account provisioning. n8n calls this once its own Payfast ITN listener
 * confirms payment for a review-queue order (payment itself is generated and
 * confirmed entirely in n8n, same as the interview pack — see the
 * client-decision route's dual-approval gate for the precondition that must
 * hold before n8n is even allowed to charge). This endpoint:
 *   1. finds or creates the Resume Hub account for the customer's phone
 *      number (shared with the standalone lead-capture webhook, so the same
 *      person never ends up with two accounts),
 *   2. grants a 30-day free Pro window (Phase 4 aftercare) using the exact
 *      same plan/subscription_plan/subscription_expires_at combination the
 *      one-off Pro purchase grants — so it reads as "Active until X" on the
 *      subscription page, no cancel button, no recurring charge,
 *   3. for a CV + cover letter order, creates a real `resumes` row (and a
 *      `cover_letters` row if content is provided) from the structured data
 *      n8n hands over — deliberately reusing the platform's own resume model
 *      rather than a separate documents table, so the delivered CV is
 *      immediately editable in the normal dashboard CV builder (the
 *      "platform path" half of Phase 4's two symmetric edit paths).
 * Idempotent: safe to call again on a retried webhook — it reuses the
 * existing account/resume rather than creating duplicates. */
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
  const resumeContent =
    body?.resumeContent && typeof body.resumeContent === "object"
      ? (body.resumeContent as Partial<ResumeContent>)
      : undefined;
  const coverLetterContent = typeof body?.coverLetterContent === "string" ? body.coverLetterContent : undefined;

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
  });
  if (!candidateResult.ok) {
    return NextResponse.json({ error: candidateResult.error }, { status: 500 });
  }

  const now = new Date();
  const currentExpiry = review.access_expires_at ? new Date(review.access_expires_at) : null;
  const base = currentExpiry && currentExpiry > now ? currentExpiry : now;
  const accessExpiresAt = new Date(base.getTime() + ACCESS_WINDOW_DAYS * 86400000).toISOString();

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

  await admin
    .from("whatsapp_review_queue")
    .update({
      payment_confirmed_at: review.payment_confirmed_at ?? now.toISOString(),
      access_expires_at: accessExpiresAt,
      provisioned_profile_id: candidateResult.candidateId,
      provisioned_resume_id: resumeId,
      updated_at: now.toISOString(),
    })
    .eq("id", id);

  return NextResponse.json({
    candidateId: candidateResult.candidateId,
    email: candidateResult.email,
    magicLink: candidateResult.magicLink,
    resumeId,
    accessExpiresAt,
  });
}
