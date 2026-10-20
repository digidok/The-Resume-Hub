import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPayfastConfig } from "@/lib/payfast/config";
import { buildCheckoutSignature } from "@/lib/payfast/signature";
import { BUSINESS_PAYMENT_PREFIX } from "@/lib/business/payments";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login?redirect=/dashboard/business", request.url), 303);

  const form = await request.formData();
  const billingId = String(form.get("billing_id") ?? "");

  // Read through the user's session so row-level security proves they may see this invoice.
  const { data: bill } = await supabase
    .from("business_billing")
    .select("id, kind, number, status, amount_zar, client_name, payment_ref")
    .eq("id", billingId)
    .maybeSingle();
  if (!bill || bill.kind !== "invoice" || bill.status !== "sent") {
    return NextResponse.json({ error: "This invoice cannot be paid online." }, { status: 400 });
  }

  const config = getPayfastConfig();
  if (!config.configured) {
    return NextResponse.json({ error: "Online payment is not available right now. Please pay by EFT." }, { status: 503 });
  }

  let paymentRef = bill.payment_ref as string | null;
  if (!paymentRef) {
    paymentRef = `${BUSINESS_PAYMENT_PREFIX}${crypto.randomUUID()}`;
    try {
      const { error } = await createAdminClient().from("business_billing").update({ payment_ref: paymentRef }).eq("id", bill.id);
      if (error) throw error;
    } catch (err) {
      console.error("business invoice checkout: could not store payment ref", err);
      return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
    }
  }

  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const siteUrl = `${protocol}://${host}`;

  const [firstName, ...rest] = String(bill.client_name).split(" ");
  const fields: Record<string, string> = {
    merchant_id: config.merchantId,
    merchant_key: config.merchantKey,
    return_url: `${siteUrl}/dashboard/business?paid=1`,
    cancel_url: `${siteUrl}/dashboard/business`,
    notify_url: `${siteUrl}/api/payfast/notify`,
    name_first: firstName || "Client",
    name_last: rest.join(" ") || "Account",
    email_address: user.email ?? "",
    m_payment_id: paymentRef,
    amount: Number(bill.amount_zar).toFixed(2),
    item_name: `Invoice ${bill.number}`,
  };
  const signature = await buildCheckoutSignature({ ...fields, passphrase: config.passphrase });

  const inputs = Object.entries(fields)
    .map(([key, value]) => `<input type="hidden" name="${key}" value="${escapeHtml(value)}" />`)
    .join("\n");

  const html = `<!doctype html>
<html><head><meta charset="utf-8" /><title>Redirecting to Payfast…</title></head>
<body>
  <p>Redirecting to Payfast…</p>
  <form id="payfast-form" action="${config.processUrl}" method="POST">
    ${inputs}
    <input type="hidden" name="signature" value="${signature}" />
  </form>
  <script>document.getElementById('payfast-form').submit();</script>
</body></html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
