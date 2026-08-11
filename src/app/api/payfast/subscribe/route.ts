import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getPayfastConfig, SUBSCRIPTION_PACKAGES } from "@/lib/payfast/config";
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
  const promoCode = String(formData.get("promo_code") ?? "").trim();
  const pkg = SUBSCRIPTION_PACKAGES.find((p) => p.id === packageId);
  if (!pkg) {
    return NextResponse.json({ error: "Unknown package." }, { status: 400 });
  }

  let amountZar = pkg.amountZar;
  if (promoCode) {
    const { data: discountPercent } = await supabase.rpc("get_promo_discount", {
      p_code: promoCode,
      p_plan: pkg.id,
    });
    if (!discountPercent) {
      return NextResponse.json({ error: "That promo code isn't valid." }, { status: 400 });
    }
    amountZar = Math.round(pkg.amountZar * (1 - discountPercent / 100) * 100) / 100;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();
  if (profile?.role !== pkg.role) {
    return NextResponse.json({ error: "This package isn't available for your account type." }, { status: 403 });
  }

  const config = getPayfastConfig();
  if (!config.configured) {
    return NextResponse.json(
      { error: "Payments are not configured. Set PAYFAST_MERCHANT_ID and PAYFAST_MERCHANT_KEY." },
      { status: 503 }
    );
  }

  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const siteUrl = `${protocol}://${host}`;

  const mPaymentId = crypto.randomUUID();
  const itemName = promoCode
    ? `Resume Hub — ${pkg.label} (recurring, promo ${promoCode.toUpperCase()})`
    : `Resume Hub — ${pkg.label} (recurring)`;

  const { error: insertError } = await supabase.from("payments").insert({
    user_id: user.id,
    m_payment_id: mPaymentId,
    amount: amountZar,
    item_name: itemName,
    credits_granted: 0,
    grants_pro: false,
    status: "pending",
    payment_type: "subscription_initial",
    subscription_plan_target: pkg.id,
    job_credits_granted: pkg.jobCredits,
  });

  if (insertError) {
    return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
  }

  const [firstName, ...rest] = (profile?.full_name || "Resume Hub User").split(" ");
  const today = new Date().toISOString().slice(0, 10);

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
    amount: amountZar.toFixed(2),
    item_name: itemName,
    subscription_type: "1",
    billing_date: today,
    recurring_amount: amountZar.toFixed(2),
    frequency: "3",
    cycles: "0",
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
