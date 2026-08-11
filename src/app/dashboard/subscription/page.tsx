import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CREDIT_PACKAGES, getPayfastConfig } from "@/lib/payfast/config";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function SubscriptionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, credits_remaining")
    .eq("id", user.id)
    .single();

  const { data: payments } = await supabase
    .from("payments")
    .select("id, item_name, amount, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const config = getPayfastConfig();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Subscription & credits</h1>
        <p className="text-sm text-slate-500">
          You&apos;re on the <span className="font-medium capitalize">{profile?.plan ?? "free"}</span>{" "}
          plan with <span className="font-medium">{profile?.credits_remaining ?? 0}</span> AI credits
          remaining.
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {CREDIT_PACKAGES.map((pkg) => (
          <Card key={pkg.id} className="flex flex-col p-5">
            <h2 className="text-lg font-semibold text-slate-900">{pkg.label}</h2>
            <p className="mt-1 text-3xl font-bold text-slate-900">R{pkg.amountZar}</p>
            <p className="mt-1 text-sm text-slate-500">{pkg.credits} AI credits</p>
            {pkg.grantsPro && (
              <p className="mt-1 text-xs font-medium text-indigo-600">Includes Pro plan</p>
            )}
            <form action="/api/payfast/checkout" method="POST" className="mt-4">
              <input type="hidden" name="package_id" value={pkg.id} />
              <Button type="submit" disabled={!config.configured} className="w-full">
                Buy
              </Button>
            </form>
          </Card>
        ))}
      </div>

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
