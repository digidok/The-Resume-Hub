import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getPayfastConfig, CREDIT_PACKAGES } from "@/lib/payfast/config";
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
    return NextResponse.redirect(new URL("/login?redirect=/dashboard/subscription", request.url));
  }

  const formData = await request.formData();
  const packageId = String(formData.get("package_id") ?? "");
  const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
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

  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const siteUrl = `${protocol}://${host}`;

  const mPaymentId = crypto.randomUUID();

  const { error: insertError } = await supabase.from("payments").insert({
    user_id: user.id,
    m_payment_id: mPaymentId,
    amount: pkg.amountZar,
    item_name: `Resume Hub — ${pkg.label} (${pkg.credits} credits)`,
    credits_granted: pkg.credits,
    grants_pro: pkg.grantsPro,
    status: "pending",
  });

  if (insertError) {
    return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
  }

  const [firstName, ...rest] = (profile?.full_name || "Resume Hub User").split(" ");

  const fields: Record<string, string> = {
    merchant_id: config.merchantId,
    merchant_key: config.merchantKey,
    return_url: `${siteUrl}/dashboard/subscription/success`,
    cancel_url: `${siteUrl}/dashboard/subscription`,
    notify_url: `${siteUrl}/api/payfast/notify`,
    name_first: firstName || "Resume",
    name_last: rest.join(" ") || "Hub",
    email_address: user.email ?? "",
    m_payment_id: mPaymentId,
    amount: pkg.amountZar.toFixed(2),
    item_name: `Resume Hub - ${pkg.label} (${pkg.credits} credits)`,
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

  return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
}
