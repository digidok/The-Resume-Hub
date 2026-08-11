import { redirect } from "next/navigation";
import { BackLink } from "@/components/ui/back-link";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";
import { DonutChart } from "@/components/dashboard/donut-chart";
import { WeeklyBarChart } from "@/components/dashboard/weekly-bar-chart";
import type { ApplicationStatus } from "@/types/database";

const STATUS_META: Record<ApplicationStatus, { label: string; colorClass: string; colorHex: string }> = {
  submitted: { label: "Submitted", colorClass: "bg-slate-400", colorHex: "#94a3b8" },
  interviewing: { label: "Interviewing", colorClass: "bg-blue-500", colorHex: "#3b82f6" },
  offer: { label: "Offer", colorClass: "bg-emerald-500", colorHex: "#10b981" },
  hired: { label: "Hired", colorClass: "bg-brand-600", colorHex: "#0d9488" },
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

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "employer") {
    redirect("/dashboard");
  }

  const { data: jobs } = await supabase.from("jobs").select("id").eq("employer_id", user.id);
  const jobIds = (jobs ?? []).map((j) => j.id);

  const { data: applications } = jobIds.length
    ? await supabase
        .from("applications")
        .select("id, status, created_at, interview_scheduled_at")
        .in("job_id", jobIds)
    : { data: [] };

  const apps = applications ?? [];

  const statusCounts: Record<ApplicationStatus, number> = {
    submitted: 0,
    interviewing: 0,
    offer: 0,
    hired: 0,
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

  const offerCount = statusCounts.offer + statusCounts.hired;
  const conversionRate = apps.length > 0 ? Math.round((offerCount / apps.length) * 100) : 0;

  const timesToInterview = apps
    .filter((a) => a.interview_scheduled_at)
    .map(
      (a) =>
        (new Date(a.interview_scheduled_at!).getTime() - new Date(a.created_at).getTime()) /
        (1000 * 60 * 60 * 24)
    );
  const avgDaysToInterview =
    timesToInterview.length > 0
      ? Math.round(timesToInterview.reduce((sum, d) => sum + d, 0) / timesToInterview.length)
      : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <BackLink href="/dashboard" label="Dashboard" />
      <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total applicants" value={apps.length} />
        <StatCard label="Offers made" value={offerCount} />
        <StatCard label="Applicant → offer rate" value={`${conversionRate}%`} />
        <StatCard
          label="Avg. days to interview"
          value={avgDaysToInterview === null ? "—" : avgDaysToInterview}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DonutChart title="Hiring funnel" segments={donutSegments} />
        <WeeklyBarChart title="Weekly applicant volume" weeks={weeklyBuckets} />
      </div>
    </div>
  );
}
