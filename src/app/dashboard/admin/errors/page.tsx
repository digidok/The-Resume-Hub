import { redirect } from "next/navigation";
import { BackLink } from "@/components/ui/back-link";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card } from "@/components/ui/card";

function sinceIso(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

export default async function AdminErrorsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const last24h = sinceIso(24);

  const [{ data: errors }, { count: last24hCount }] = await Promise.all([
    supabase
      .from("error_logs")
      .select("id, message, route_path, route_type, request_path, request_method, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("error_logs").select("id", { count: "exact", head: true }).gte("created_at", last24h),
  ]);

  const rows = errors ?? [];

  return (
    <div className="mx-auto max-w-5xl">
      <BackLink href="/dashboard/admin" label="Admin overview" />
      <h1 className="mb-1 text-3xl font-bold text-slate-900">Server errors</h1>
      <p className="mb-6 text-sm text-slate-500">
        Automatically captured from every Server Component, Route Handler, and Server Action —
        most recent 100.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Last 24 hours" value={last24hCount ?? 0} />
        <StatCard label="Showing" value={rows.length} />
      </div>

      {rows.length === 0 && <Card className="p-8 text-center text-slate-500">No errors logged. 🎉</Card>}

      <div className="space-y-2">
        {rows.map((e) => (
          <Card key={e.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
              <p className="font-medium text-slate-900">{e.message}</p>
              <span className="shrink-0 text-xs text-slate-500">
                {new Date(e.created_at).toLocaleString()}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {[
                e.request_method && e.request_path ? `${e.request_method} ${e.request_path}` : null,
                e.route_type,
                e.route_path,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
