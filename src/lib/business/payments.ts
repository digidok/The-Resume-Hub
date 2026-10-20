import { createAdminClient } from "@/lib/supabase/admin";
import { TEAM_EMAIL, emailBody, esc, sendEmail } from "@/lib/business/notify";

export const BUSINESS_PAYMENT_PREFIX = "BIL-";

/**
 * Called by the Payfast ITN handler only after signature, merchant, source IP and
 * Payfast's own server-side confirmation have all passed. Marks the invoice paid
 * only when the status is COMPLETE and the amount matches the invoice exactly.
 * A browser return to the site is never treated as proof of payment.
 */
export async function settleBusinessInvoice(pf: Record<string, string>, grossAmount: number): Promise<void> {
  const mPaymentId = pf.m_payment_id;
  if (pf.payment_status !== "COMPLETE") {
    console.error("Business invoice ITN: payment not COMPLETE", { mPaymentId, status: pf.payment_status });
    return;
  }

  const admin = createAdminClient();
  const { data: bill } = await admin
    .from("business_billing")
    .select("id, kind, number, status, amount_zar, client_email, client_name")
    .eq("payment_ref", mPaymentId)
    .maybeSingle();

  if (!bill || bill.kind !== "invoice") {
    console.error("Business invoice ITN: no matching invoice", { mPaymentId });
    return;
  }
  if (Math.abs(Number(bill.amount_zar) - grossAmount) > 0.01) {
    console.error("Business invoice ITN: amount mismatch", { mPaymentId, expected: bill.amount_zar, got: grossAmount });
    return;
  }
  if (bill.status === "paid") return;
  if (bill.status !== "sent") {
    console.error("Business invoice ITN: invoice not payable in current status", { mPaymentId, status: bill.status });
    return;
  }

  const { error } = await admin
    .from("business_billing")
    .update({ status: "paid", paid_at: new Date().toISOString(), pf_payment_id: pf.pf_payment_id ?? null })
    .eq("id", bill.id)
    .eq("status", "sent");
  if (error) {
    console.error("Business invoice ITN: update failed", error.message);
    return;
  }

  await admin.from("audit_log").insert({
    actor_email: "payfast-itn",
    action: "billing.paid",
    entity: "business_billing",
    entity_id: bill.id,
    meta: { number: bill.number, amount: grossAmount, pf_payment_id: pf.pf_payment_id ?? null },
  });

  await sendEmail({
    to: bill.client_email,
    replyTo: TEAM_EMAIL,
    subject: `Payment received for ${bill.number}`,
    html: emailBody(bill.client_name, [
      `We have received your payment of <strong>R${grossAmount.toLocaleString("en-ZA")}</strong> for invoice <strong>${esc(bill.number)}</strong>. Thank you.`,
    ], { path: "/dashboard/business", label: "View your dashboard" }),
  });
  await sendEmail({
    to: TEAM_EMAIL,
    subject: `Invoice ${bill.number} paid by ${bill.client_name}`,
    html: `<p>${esc(bill.client_name)} paid invoice <strong>${esc(bill.number)}</strong> (R${grossAmount.toLocaleString("en-ZA")}) via Payfast.</p>`,
  });
}
