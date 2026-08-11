import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";
import { DonutChart } from "@/components/dashboard/donut-chart";
import { WeeklyBarChart } from "@/components/dashboard/weekly-bar-chart";
import { Button } from "@/components/ui/button";
import type { ApplicationStatus } from "@/types/database";

const STATUS_META: Record<ApplicationStatus, { label: string; colorClass: string; colorHex: string }> = {
  submitted: { label: "Submitted", colorClass: "bg-slate-400", colorHex: "#94a3b8" },
  interviewing: { label: "Interviewing", colorClass: "bg-blue-500", colorHex: "#3b82f6" },
  offer: { label: "Offer", colorClass: "bg-emerald-500", colorHex: "#10b981" },
  rejected: { label: "Rejected", colorClass: "bg-red-500", colorHex: "#ef4444" },
};

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}

function buildWeeklyBuckets(
  applications: { created_at: string; interview_scheduled_at: string | null }[],
  weekCount = 8
) {
  const now = new Date();
  const thisWeekStart = startOfWeek(now);
  const buckets = Array.from({ length: weekCount }, (_, i) => {
    const start = new Date(thisWeekStart);
    start.setDate(start.getDate() - (weekCount - 1 - i) * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { start, end, submitted: 0, interviews: 0 };
  });

  for (const app of applications) {
    const createdAt = new Date(app.created_at);
    const bucket = buckets.find((b) => createdAt >= b.start && createdAt < b.end);
    if (bucket) bucket.submitted += 1;

    if (app.interview_scheduled_at) {
      const interviewAt = new Date(app.interview_scheduled_at);
      const interviewBucket = buckets.find((b) => interviewAt >= b.start && interviewAt < b.end);
      if (interviewBucket) interviewBucket.interviews += 1;
    }
  }

  return buckets.map((b) => ({
    label: `${b.start.getMonth() + 1}/${b.start.getDate()}`,
    submitted: b.submitted,
    interviews: b.interviews,
  }));
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, credits_remaining")
    .eq("id", user.id)
    .single();

  if (profile?.role === "employer") {
    redirect("/dashboard/jobs");
  }

  const [{ data: applications }, { count: savedJobsCount }] = await Promise.all([
    supabase
      .from("applications")
      .select("id, status, created_at, interview_scheduled_at")
      .eq("candidate_id", user.id),
    supabase
      .from("saved_jobs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  const apps = applications ?? [];
  const weekStart = startOfWeek(new Date());
  const submittedThisWeek = apps.filter((a) => new Date(a.created_at) >= weekStart).length;
  const interviewsScheduled = apps.filter((a) => a.interview_scheduled_at).length;

  const statusCounts: Record<ApplicationStatus, number> = {
    submitted: 0,
    interviewing: 0,
    offer: 0,
    rejected: 0,
  };
  for (const app of apps) {
    const status = app.status as ApplicationStatus;
    statusCounts[status] = (statusCounts[status] ?? 0) + 1;
  }

  const donutSegments = (Object.keys(STATUS_META) as ApplicationStatus[]).map((status) => ({
    label: STATUS_META[status].label,
    value: statusCounts[status],
    colorClass: STATUS_META[status].colorClass,
    colorHex: STATUS_META[status].colorHex,
  }));

  const weeklyBuckets = buildWeeklyBuckets(apps);

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? "Good morning" : greetingHour < 18 ? "Good afternoon" : "Good evening";
  const firstName = profile?.full_name?.split(" ")[0] || "there";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {greeting}, {firstName}
          </h1>
          <p className="text-sm text-slate-500">
            You have {apps.length} total application{apps.length === 1 ? "" : "s"}.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/jobs">
            <Button variant="outline">Find jobs</Button>
          </Link>
          <Link href="/dashboard/ai-generator">
            <Button>AI generator</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total applications" value={apps.length} />
        <StatCard label="Submitted this week" value={submittedThisWeek} />
        <StatCard label="Interviews scheduled" value={interviewsScheduled} />
        <StatCard label="Saved jobs" value={savedJobsCount ?? 0} />
        <StatCard label="AI credits" value={profile?.credits_remaining ?? 0} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DonutChart title="Application status" segments={donutSegments} />
        <WeeklyBarChart title="Weekly application volume" weeks={weeklyBuckets} />
      </div>
    </div>
  );
}
