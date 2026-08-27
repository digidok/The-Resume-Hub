import { redirect } from "next/navigation";
import { BackLink } from "@/components/ui/back-link";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card } from "@/components/ui/card";

export default async function AdminAiUsagePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const { data: events } = await supabase
    .from("ai_usage_events")
    .select("feature, model, input_tokens, output_tokens, estimated_cost_zar, success, created_at")
    .gte("created_at", startOfMonth)
    .order("created_at", { ascending: false });

  const rows = events ?? [];
  const totalCost = rows.reduce((sum, e) => sum + Number(e.estimated_cost_zar ?? 0), 0);
  const failedCount = rows.filter((e) => !e.success).length;

  const byFeature = new Map<
    string,
    { calls: number; failed: number; cost: number; inputTokens: number; outputTokens: number }
  >();
  for (const e of rows) {
    const entry = byFeature.get(e.feature) ?? {
      calls: 0,
      failed: 0,
      cost: 0,
      inputTokens: 0,
      outputTokens: 0,
    };
    entry.calls += 1;
    if (!e.success) entry.failed += 1;
    entry.cost += Number(e.estimated_cost_zar ?? 0);
    entry.inputTokens += e.input_tokens ?? 0;
    entry.outputTokens += e.output_tokens ?? 0;
    byFeature.set(e.feature, entry);
  }
  const featureRows = [...byFeature.entries()].sort((a, b) => b[1].cost - a[1].cost);

  return (
    <div className="mx-auto max-w-5xl">
      <BackLink href="/dashboard/admin" label="Admin overview" />
      <h1 className="mb-1 text-3xl font-bold text-slate-900">AI usage &amp; cost</h1>
      <p className="mb-6 text-sm text-slate-500">
        Estimated spend this month, by feature. Costs are approximate (based on published per-token
        pricing) — not finance-grade accounting.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total AI cost" value={`R${totalCost.toFixed(2)}`} />
        <StatCard label="Total calls" value={rows.length} />
        <StatCard label="Failed calls" value={failedCount} />
        <StatCard label="Features used" value={byFeature.size} />
      </div>

      {featureRows.length === 0 && (
        <Card className="p-8 text-center text-slate-500">No AI usage recorded this month yet.</Card>
      )}

      <div className="space-y-2">
        {featureRows.map(([feature, stats]) => (
          <Card key={feature} className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium text-slate-900">{feature.replace(/_/g, " ")}</p>
              <p className="text-sm text-slate-500">
                {stats.calls} call{stats.calls === 1 ? "" : "s"}
                {stats.failed > 0 ? ` · ${stats.failed} failed` : ""} ·{" "}
                {(stats.inputTokens + stats.outputTokens).toLocaleString()} tokens
              </p>
            </div>
            <span className="font-medium text-slate-900">R{stats.cost.toFixed(2)}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}
