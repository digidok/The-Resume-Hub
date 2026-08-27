import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? "Good morning" : greetingHour < 18 ? "Good afternoon" : "Good evening";
  const firstName = profile?.full_name?.split(" ")[0] || "there";

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const [
    { count: candidateCount },
    { count: employerCount },
    { count: openJobCount },
    { count: closedJobCount },
    { count: applicationCount },
    { count: resumeCount },
    { data: completedPayments },
    { data: aiUsageThisMonth },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "candidate"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "employer"),
    supabase.from("jobs").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("jobs").select("id", { count: "exact", head: true }).eq("status", "closed"),
    supabase.from("applications").select("id", { count: "exact", head: true }),
    supabase.from("resumes").select("id", { count: "exact", head: true }),
    supabase.from("payments").select("amount").eq("status", "complete"),
    supabase.from("ai_usage_events").select("estimated_cost_zar").gte("created_at", startOfMonth),
  ]);

  const totalRevenue = (completedPayments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const aiCostThisMonth = (aiUsageThisMonth ?? []).reduce(
    (sum, e) => sum + Number(e.estimated_cost_zar ?? 0),
    0
  );
  const aiCallsThisMonth = aiUsageThisMonth?.length ?? 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          {greeting}, {firstName}
        </h1>
        <p className="text-sm text-slate-500">Platform-wide overview.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Candidates" value={candidateCount ?? 0} />
        <StatCard label="Employers" value={employerCount ?? 0} />
        <StatCard label="Open jobs" value={openJobCount ?? 0} />
        <StatCard label="Closed jobs" value={closedJobCount ?? 0} />
        <StatCard label="Applications" value={applicationCount ?? 0} />
        <StatCard label="Resumes created" value={resumeCount ?? 0} />
        <StatCard label="Revenue" value={`R${totalRevenue.toFixed(2)}`} />
        <StatCard label="AI cost this month" value={`R${aiCostThisMonth.toFixed(2)}`} />
        <StatCard label="AI calls this month" value={aiCallsThisMonth} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/admin/users">
          <Button variant="outline">Manage users</Button>
        </Link>
        <Link href="/dashboard/admin/jobs">
          <Button variant="outline">Moderate jobs</Button>
        </Link>
        <Link href="/dashboard/admin/payments">
          <Button variant="outline">View payments</Button>
        </Link>
        <Link href="/dashboard/admin/ai-usage">
          <Button variant="outline">AI usage breakdown</Button>
        </Link>
        <Link href="/dashboard/admin/errors">
          <Button variant="outline">Server errors</Button>
        </Link>
      </div>
    </div>
  );
}
