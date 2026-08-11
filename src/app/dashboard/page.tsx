import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";
import { DonutChart } from "@/components/dashboard/donut-chart";
import { WeeklyBarChart } from "@/components/dashboard/weekly-bar-chart";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ApplicationStatus } from "@/types/database";

const STATUS_META: Record<ApplicationStatus, { label: string; colorClass: string; colorHex: string }> = {
  submitted: { label: "Submitted", colorClass: "bg-slate-400", colorHex: "#94a3b8" },
  interviewing: { label: "Interviewing", colorClass: "bg-blue-500", colorHex: "#3b82f6" },
  offer: { label: "Offer", colorClass: "bg-emerald-500", colorHex: "#10b981" },
  hired: { label: "Hired", colorClass: "bg-brand-600", colorHex: "#0d9488" },
  rejected: { label: "Rejected", colorClass: "bg-red-500", colorHex: "#ef4444" },
};

const statusStyles: Record<ApplicationStatus, string> = {
  submitted: "bg-slate-100 text-slate-600",
  interviewing: "bg-blue-100 text-blue-700",
  offer: "bg-emerald-100 text-emerald-700",
  hired: "bg-brand-100 text-brand-700",
  rejected: "bg-red-100 text-red-700",
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

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? "Good morning" : greetingHour < 18 ? "Good afternoon" : "Good evening";
  const firstName = profile?.full_name?.split(" ")[0] || "there";

  if (profile?.role === "admin") {
    const [
      { count: candidateCount },
      { count: employerCount },
      { count: openJobCount },
      { count: closedJobCount },
      { count: applicationCount },
      { count: resumeCount },
      { data: completedPayments },
    ] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "candidate"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "employer"),
      supabase.from("jobs").select("id", { count: "exact", head: true }).eq("status", "open"),
      supabase.from("jobs").select("id", { count: "exact", head: true }).eq("status", "closed"),
      supabase.from("applications").select("id", { count: "exact", head: true }),
      supabase.from("resumes").select("id", { count: "exact", head: true }),
      supabase.from("payments").select("amount").eq("status", "complete"),
    ]);

    const totalRevenue = (completedPayments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);

    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
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
        </div>
      </div>
    );
  }

  if (profile?.role === "employer") {
    const { data: jobs } = await supabase
      .from("jobs")
      .select("id, title, company, status, created_at")
      .eq("employer_id", user.id)
      .order("created_at", { ascending: false });

    const jobList = jobs ?? [];
    const jobIds = jobList.map((j) => j.id);
    const activeJobPosts = jobList.filter((j) => j.status === "open");

    const { data: applications } = jobIds.length
      ? await supabase
          .from("applications")
          .select(
            "id, status, created_at, interview_scheduled_at, shortlisted, job_id, profiles:candidate_id(full_name, headline)"
          )
          .in("job_id", jobIds)
          .order("created_at", { ascending: false })
      : { data: [] };

    const apps = applications ?? [];
    const shortlistedCount = apps.filter((a) => a.shortlisted).length;
    const interviewsScheduled = apps.filter((a) => a.interview_scheduled_at).length;
    const recentApplicants = apps.slice(0, 5);
    const jobTitleById = new Map(jobList.map((j) => [j.id, j.title]));

    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {greeting}, {firstName}
            </h1>
            <p className="text-sm text-slate-500">
              You have {activeJobPosts.length} active job post{activeJobPosts.length === 1 ? "" : "s"}.
            </p>
          </div>
          <Link href="/dashboard/jobs/new">
            <Button>+ Post a job</Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Active job posts" value={activeJobPosts.length} />
          <StatCard label="Total applicants" value={apps.length} />
          <StatCard label="Shortlisted" value={shortlistedCount} />
          <StatCard label="Interviews scheduled" value={interviewsScheduled} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Active job posts</h2>
            {activeJobPosts.length === 0 && (
              <p className="text-sm text-slate-500">No active job posts yet.</p>
            )}
            <div className="space-y-2">
              {activeJobPosts.slice(0, 6).map((job) => (
                <Link
                  key={job.id}
                  href={`/dashboard/jobs/${job.id}`}
                  className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-slate-50"
                >
                  <span className="font-medium text-slate-900">{job.title}</span>
                  <span className="text-slate-500">{job.company}</span>
                </Link>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Recent applicants</h2>
            {recentApplicants.length === 0 && (
              <p className="text-sm text-slate-500">No applicants yet.</p>
            )}
            <div className="space-y-2">
              {recentApplicants.map((app) => {
                const candidate = Array.isArray(app.profiles) ? app.profiles[0] : app.profiles;
                const status = app.status as ApplicationStatus;
                return (
                  <Link
                    key={app.id}
                    href={`/dashboard/jobs/${app.job_id}/applicants`}
                    className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-slate-50"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{candidate?.full_name || "Candidate"}</p>
                      <p className="text-xs text-slate-500">{jobTitleById.get(app.job_id)}</p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[status]}`}
                    >
                      {status}
                    </span>
                  </Link>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    );
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
