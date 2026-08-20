import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/phone";
import { WHATSAPP_ORDER_PRICING } from "@/lib/payfast/config";
import type { WhatsAppServiceType } from "@/types/database";

const DECISIONS = ["approved", "changes_requested"] as const;

/** Inbound webhook n8n calls when the CLIENT (not the admin) responds to the
 * watermarked preview on WhatsApp — the other half of the "payment timing
 * fix" dual-approval gate. n8n must NOT generate a Payfast link on its own
 * say-so; it calls here first and only proceeds if readyForPayment is true,
 * which requires the admin to have already approved (Phase 1) AND this
 * client decision to be "approved". That makes the trigger a real,
 * server-verified precondition instead of something n8n's workflow ordering
 * has to get right on its own — which is exactly what caused the original
 * "payment link fires right after the preview" bug. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const secret = process.env.WHATSAPP_WEBHOOK_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const decision = typeof body?.decision === "string" ? body.decision : "";
  const notes = typeof body?.notes === "string" ? body.notes.trim() : "";
  const discountCode = typeof body?.discountCode === "string" ? body.discountCode.trim() : "";

  if (!DECISIONS.includes(decision as (typeof DECISIONS)[number])) {
    return NextResponse.json({ error: `decision must be one of: ${DECISIONS.join(", ")}` }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: review } = await supabase
    .from("whatsapp_review_queue")
    .select("status, service_type, customer_phone")
    .eq("id", id)
    .maybeSingle();

  if (!review) {
    return NextResponse.json({ error: "Review item not found." }, { status: 404 });
  }

  if (decision === "changes_requested") {
    await supabase
      .from("whatsapp_review_queue")
      .update({
        client_status: "changes_requested",
        client_notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    return NextResponse.json({ readyForPayment: false });
  }

  // decision === "approved" — the actual dual-approval gate.
  if (review.status !== "approved") {
    return NextResponse.json({
      readyForPayment: false,
      error: "Admin hasn't approved this preview yet — don't generate a payment link.",
    });
  }

  let amountZar = WHATSAPP_ORDER_PRICING[review.service_type as WhatsAppServiceType];
  let discountCodeId: string | null = null;
  let discountApplied = false;

  // A referral discount is only redeemable by its own owner, on their own next
  // order — verified by matching this order's customer phone to the code
  // owner's account phone, not just possession of the code string.
  if (discountCode) {
    const { data: code } = await supabase
      .from("discount_codes")
      .select("id, percent_off, owner_id, redeemed")
      .eq("code", discountCode)
      .maybeSingle();
    if (code && !code.redeemed) {
      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("phone_number")
        .eq("id", code.owner_id)
        .single();
      if (ownerProfile?.phone_number === normalizePhone(review.customer_phone)) {
        amountZar = Math.round(amountZar * (1 - code.percent_off / 100));
        discountCodeId = code.id;
        discountApplied = true;
      }
    }
  }

  await supabase
    .from("whatsapp_review_queue")
    .update({
      client_status: "approved",
      client_notes: notes || null,
      client_approved_at: new Date().toISOString(),
      discount_code_id: discountCodeId,
      amount_charged_zar: amountZar,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  return NextResponse.json({ readyForPayment: true, amountZar, discountApplied });
}
