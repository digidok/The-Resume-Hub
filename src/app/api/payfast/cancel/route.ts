import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cancelPayfastSubscription } from "@/lib/payfast/api";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login?redirect=/dashboard/subscription", request.url));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("payfast_token, subscription_plan")
    .eq("id", user.id)
    .single();

  const redirectUrl = new URL("/dashboard/subscription", request.url);

  if (!profile?.payfast_token || !profile.subscription_plan) {
    redirectUrl.searchParams.set("cancel_error", "no_active_subscription");
    return NextResponse.redirect(redirectUrl);
  }

  const result = await cancelPayfastSubscription(profile.payfast_token);

  if (!result.ok) {
    redirectUrl.searchParams.set("cancel_error", "payfast_error");
    return NextResponse.redirect(redirectUrl);
  }

  // Billing stops immediately at Payfast; access (unlimited credits / job
  // posting credits) intentionally continues until subscription_expires_at,
  // same as most SaaS cancellations. Clearing the token is what signals
  // "won't renew" — hasUnlimitedCredits() already falls back to metered
  // credits once subscription_expires_at passes.
  await supabase.from("profiles").update({ payfast_token: null }).eq("id", user.id);

  redirectUrl.searchParams.set("cancelled", "1");
  return NextResponse.redirect(redirectUrl);
}
