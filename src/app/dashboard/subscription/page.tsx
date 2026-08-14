import { redirect } from "next/navigation";
import { BackLink } from "@/components/ui/back-link";
import { createClient } from "@/lib/supabase/server";
import {
  CREDIT_PACKAGES,
  SUBSCRIPTION_PACKAGES,
  PRO_ONCE_OFF_PACKAGE,
  getPayfastConfig,
} from "@/lib/payfast/config";
import { hasUnlimitedCredits } from "@/lib/credits";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { InvoiceRequestForm } from "@/components/subscription/invoice-request-form";
import Link from "next/link";

const INVOICE_STATUS_STYLES: Record<string, string> = {
  requested: "bg-amber-100 text-amber-700",
  invoiced: "bg-blue-100 text-blue-700",
  paid: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-slate-200 text-slate-600",
};

export default async function SubscriptionPage({
  searchParams,
}: PageProps<"/dashboard/subscription">) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "role, plan, credits_remaining, subscription_plan, subscription_expires_at, job_posting_credits, payfast_token"
    )
    .eq("id", user.id)
    .single();

  const { data: payments } = await supabase
    .from("payments")
    .select("id, item_name, amount, status, payment_type, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: invoiceRequests } =
    profile?.role === "employer"
      ? await supabase
          .from("invoice_requests")
          .select("id, package_id, amount_zar, status, invoice_number, created_at")
          .eq("employer_id", user.id)
          .order("created_at", { ascending: false })
      : { data: null };

  const config = getPayfastConfig();
  const role = profile?.role ?? "candidate";
  const subscriptionPkg = SUBSCRIPTION_PACKAGES.find((p) => p.role === role);
  const isSubscribed =
    profile?.subscription_plan &&
    profile.subscription_expires_at &&
    new Date(profile.subscription_expires_at) > new Date();
  const unlimitedCredits = profile
    ? hasUnlimitedCredits({
        plan: profile.plan,
        subscription_plan: profile.subscription_plan,
        subscription_expires_at: profile.subscription_expires_at,
      })
    : false;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <BackLink href="/dashboard" label="Dashboard" />
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Subscription & billing</h1>
        <p className="text-sm text-slate-500">
          You&apos;re on the <span className="font-medium capitalize">{profile?.plan ?? "free"}</span>{" "}
          plan with{" "}
          {unlimitedCredits ? (
            <span className="font-medium text-brand-700">unlimited AI credits</span>
          ) : (
            <>
              <span className="font-medium">{profile?.credits_remaining ?? 0}</span> AI credits
              remaining
            </>
          )}
          .
          {role === "employer" && (
            <>
              {" "}
              You have <span className="font-medium">{profile?.job_posting_credits ?? 0}</span> job
              post{(profile?.job_posting_credits ?? 0) === 1 ? "" : "s"} remaining.
            </>
          )}
        </p>
      </div>

      {!config.configured && (
        <Card className="border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Payments aren&apos;t configured yet — set PAYFAST_MERCHANT_ID and PAYFAST_MERCHANT_KEY to
          enable purchases.
        </Card>
      )}
      {config.configured && config.mode === "sandbox" && (
        <Card className="border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          Payments are in <strong>sandbox mode</strong> — no real charges will be made. Set
          PAYFAST_MODE=live with your live credentials when you&apos;re ready to accept real payments.
        </Card>
      )}
      {params.cancelled === "1" && (
        <Card className="border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Your subscription won&apos;t renew. You&apos;ll keep your current benefits until the billing
          period ends.
        </Card>
      )}
      {params.cancel_error === "no_active_subscription" && (
        <Card className="border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          There&apos;s no active subscription to cancel.
        </Card>
      )}
      {params.cancel_error === "payfast_error" && (
        <Card className="border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Couldn&apos;t cancel with Payfast — please try again, or contact us at info@resumehub.co.za
          and we&apos;ll cancel it manually.
        </Card>
      )}

      {subscriptionPkg && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            {role === "candidate" ? "Get Pro" : "Monthly subscription"}
          </h2>
          <div className={role === "candidate" ? "grid grid-cols-1 gap-4 sm:grid-cols-2" : ""}>
            {role === "candidate" && !isSubscribed && (
              <Card className="flex flex-col justify-between gap-4 p-5">
                <div>
                  <p className="font-semibold text-slate-900">{PRO_ONCE_OFF_PACKAGE.label}</p>
                  <p className="text-sm text-slate-500">
                    Pay once, no recurring billing — Pro access for 30 days.
                  </p>
                </div>
                <form action="/api/payfast/checkout" method="POST" className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-slate-900">
                    R{PRO_ONCE_OFF_PACKAGE.amountZar}
                  </span>
                  <input type="hidden" name="package_id" value={PRO_ONCE_OFF_PACKAGE.id} />
                  <SubmitButton disabled={!config.configured} variant="outline">
                    Buy once-off
                  </SubmitButton>
                </form>
              </Card>
            )}
            <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="font-semibold text-slate-900">{subscriptionPkg.label}</p>
                <p className="text-sm text-slate-500">{subscriptionPkg.description}</p>
                {isSubscribed && profile?.subscription_expires_at && (
                  <p className="mt-1 text-xs font-medium text-emerald-600">
                    {profile.payfast_token
                      ? `Active — renews ${new Date(profile.subscription_expires_at).toLocaleDateString()}`
                      : `Active until ${new Date(profile.subscription_expires_at).toLocaleDateString()} — won't renew`}
                  </p>
                )}
              </div>
              {isSubscribed ? (
                profile?.payfast_token && (
                  <form action="/api/payfast/cancel" method="POST">
                    <SubmitButton variant="outline" size="sm" pendingLabel="Cancelling…">
                      Cancel subscription
                    </SubmitButton>
                  </form>
                )
              ) : (
                <form
                  action="/api/payfast/subscribe"
                  method="POST"
                  className="flex flex-wrap items-center gap-3"
                >
                  <span className="text-2xl font-bold text-slate-900">R{subscriptionPkg.amountZar}</span>
                  <input type="hidden" name="package_id" value={subscriptionPkg.id} />
                  <input
                    type="text"
                    name="promo_code"
                    placeholder="Promo code (optional)"
                    className="w-40 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm placeholder:text-slate-400"
                  />
                  <SubmitButton disabled={!config.configured}>Subscribe</SubmitButton>
                </form>
              )}
            </Card>
          </div>
          {!isSubscribed && role === "employer" && (
            <InvoiceRequestForm packageId={subscriptionPkg.id} />
          )}
          {!isSubscribed && role === "candidate" && (
            <p className="mt-2 text-xs text-slate-400">
              Studying? Get a{" "}
              <a href="/student-discount" className="font-medium text-brand-600 hover:underline">
                student discount code
              </a>{" "}
              and enter it above before subscribing.
            </p>
          )}
          {!isSubscribed && role === "employer" && (
            <p className="mt-2 text-xs text-slate-500">
              Want a walkthrough first?{" "}
              <a
                href="https://wa.me/27693391915?text=Hi%2C%20I%27d%20like%20to%20book%20a%20demo%20of%20Resume%20Hub%20for%20Employers"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-brand-600 hover:underline"
              >
                Book a demo on WhatsApp
              </a>{" "}
              before subscribing.
            </p>
          )}
        </div>
      )}

      {invoiceRequests && invoiceRequests.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Invoice requests</h2>
          <div className="space-y-2">
            {invoiceRequests.map((inv) => (
              <Card key={inv.id} className="flex items-center justify-between p-3 text-sm">
                <span className="text-slate-700">
                  {inv.invoice_number ? `Invoice ${inv.invoice_number}` : "Awaiting invoice number"} ·{" "}
                  {new Date(inv.created_at).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-slate-500">R{Number(inv.amount_zar).toFixed(2)}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${INVOICE_STATUS_STYLES[inv.status]}`}
                  >
                    {inv.status}
                  </span>
                  {(inv.status === "invoiced" || inv.status === "paid") && (
                    <Link
                      href={`/dashboard/invoices/${inv.id}/print`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      View invoice
                    </Link>
                  )}
                </span>
              </Card>
            ))}
          </div>
        </div>
      )}

      {role === "candidate" && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">One-time credit top-ups</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {CREDIT_PACKAGES.map((pkg) => (
              <Card key={pkg.id} className="flex flex-col p-5">
                <h3 className="text-lg font-semibold text-slate-900">{pkg.label}</h3>
                <p className="mt-1 text-3xl font-bold text-slate-900">R{pkg.amountZar}</p>
                <p className="mt-1 text-sm text-slate-500">{pkg.credits} AI credits</p>
                {pkg.grantsPro && (
                  <p className="mt-1 text-xs font-medium text-brand-600">Includes Pro plan</p>
                )}
                <form action="/api/payfast/checkout" method="POST" className="mt-4">
                  <input type="hidden" name="package_id" value={pkg.id} />
                  <SubmitButton disabled={!config.configured} className="w-full">
                    Buy
                  </SubmitButton>
                </form>
              </Card>
            ))}
          </div>
        </div>
      )}

      {payments && payments.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Payment history</h2>
          <div className="space-y-2">
            {payments.map((p) => (
              <Card key={p.id} className="flex items-center justify-between p-3 text-sm">
                <span className="text-slate-700">{p.item_name}</span>
                <span className="flex items-center gap-3">
                  <span className="text-slate-500">R{p.amount}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                      p.status === "complete"
                        ? "bg-emerald-100 text-emerald-700"
                        : p.status === "failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {p.status}
                  </span>
                </span>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
