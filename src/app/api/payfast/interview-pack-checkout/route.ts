import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getPayfastConfig, INTERVIEW_PACK_PACKAGES } from "@/lib/payfast/config";
import { buildCheckoutSignature } from "@/lib/payfast/signature";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c] as string);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login?redirect=/interview-ready/plan", request.url));
  }

  const formData = await request.formData();
  const packageId = String(formData.get("package_id") ?? "");
  const sessionId = String(formData.get("session_id") ?? "");
  const pkg = INTERVIEW_PACK_PACKAGES.find((p) => p.id === packageId);
  if (!pkg) {
    return NextResponse.json({ error: "Unknown package." }, { status: 400 });
  }

  const config = getPayfastConfig();
  if (!config.configured) {
    return NextResponse.json(
      { error: "Payments are not configured. Set PAYFAST_MERCHANT_ID and PAYFAST_MERCHANT_KEY." },
      { status: 503 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: quizResponse } = sessionId
    ? await supabase.from("quiz_responses").select("id").eq("session_id", sessionId).maybeSingle()
    : { data: null };

  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const siteUrl = `${protocol}://${host}`;

  const mPaymentId = crypto.randomUUID();

  const { data: payment, error: insertError } = await supabase
    .from("payments")
    .insert({
      user_id: user.id,
      m_payment_id: mPaymentId,
      amount: pkg.amountZar,
      item_name: `Resume Hub — ${pkg.label}`,
      credits_granted: 0,
      grants_pro: false,
      quiz_response_id: quizResponse?.id ?? null,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError || !payment) {
    return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
  }

  if (quizResponse) {
    await supabase.from("quiz_responses").update({ payment_id: payment.id }).eq("id", quizResponse.id);
  }

  const [firstName, ...rest] = (profile?.full_name || "Resume Hub User").split(" ");

  const fields: Record<string, string> = {
    merchant_id: config.merchantId,
    merchant_key: config.merchantKey,
    return_url: `${siteUrl}/interview-ready/success`,
    cancel_url: `${siteUrl}/interview-ready/plan`,
    notify_url: `${siteUrl}/api/payfast/notify`,
    name_first: firstName || "Resume",
    name_last: rest.join(" ") || "Hub",
    email_address: user.email ?? "",
    m_payment_id: mPaymentId,
    amount: pkg.amountZar.toFixed(2),
    item_name: `Resume Hub - ${pkg.label}`,
  };

  const signature = await buildCheckoutSignature({ ...fields, passphrase: config.passphrase });

  const inputs = Object.entries(fields)
    .map(([key, value]) => `<input type="hidden" name="${key}" value="${escapeHtml(value)}" />`)
    .join("\n");

  const html = `<!doctype html>
<html>
<head><meta charset="utf-8" /><title>Redirecting to Payfast…</title></head>
<body>
  <p>Redirecting to Payfast…</p>
  <form id="payfast-form" action="${config.processUrl}" method="POST">
    ${inputs}
    <input type="hidden" name="signature" value="${signature}" />
  </form>
  <script>document.getElementById('payfast-form').submit();</script>
</body>
</html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
