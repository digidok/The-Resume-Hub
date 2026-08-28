import Link from "next/link";
import { redirect } from "next/navigation";
import {
  UploadCloud,
  FilePlus2,
  ArrowRight,
  Briefcase,
  TrendingUp,
  CalendarClock,
  Bookmark,
  Target,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";
import { DonutChart } from "@/components/dashboard/donut-chart";
import { WeeklyBarChart } from "@/components/dashboard/weekly-bar-chart";
import { RecommendedJobs, type RecommendedJob } from "@/components/dashboard/recommended-jobs";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { getRecentActivity } from "@/lib/dashboard/activity";
import { computeJobMatch } from "@/lib/matching/job-match";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ApplicationStatus, CareerProfile, Job } from "@/types/database";

const LOW_CREDITS_THRESHOLD = 10;

function GetStartedChooser({ firstName }: { firstName: string }) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Welcome, {firstName}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Let&apos;s get your resume set up — you can always add more later.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/dashboard/resumes/new?start=upload">
          <Card className="flex h-full flex-col p-6 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <UploadCloud className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">Upload your CV</h2>
            <p className="mt-2 flex-1 text-sm text-slate-600">
              Already have a CV? Upload a PDF, Word doc, or photo/scan (or paste your LinkedIn
              profile) and we&apos;ll fill in your resume automatically.
            </p>
            <span className="mt-4 flex items-center gap-1.5 text-sm font-medium text-brand-700">
              Upload a CV <ArrowRight className="h-4 w-4" />
            </span>
          </Card>
        </Link>

        <Link href="/dashboard/resumes/new?start=scratch">
          <Card className="flex h-full flex-col p-6 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-500/10 text-accent-600">
              <FilePlus2 className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">Build from scratch</h2>
            <p className="mt-2 flex-1 text-sm text-slate-600">
              Start with a blank resume and fill it in step by step, with AI help along the way.
            </p>
            <span className="mt-4 flex items-center gap-1.5 text-sm font-medium text-accent-600">
              Start building <ArrowRight className="h-4 w-4" />
            </span>
          </Card>
        </Link>
      </div>
    </div>
  );
}

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
            <h1 className="text-3xl font-bold text-slate-900">
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

  const [
    { data: applications },
    { data: savedJobRows },
    { data: resumes },
    { data: careerProfileData },
    { data: openJobs },
  ] = await Promise.all([
    supabase
      .from("applications")
      .select("id, job_id, status, created_at, updated_at, interview_scheduled_at")
      .eq("candidate_id", user.id),
    supabase.from("saved_jobs").select("id, job_id").eq("user_id", user.id),
    supabase.from("resumes").select("id, title, updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }),
    supabase.from("career_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("jobs").select("*").eq("status", "open").order("posted_at", { ascending: false }).limit(30),
  ]);

  if (!resumes || resumes.length === 0) {
    return <GetStartedChooser firstName={firstName} />;
  }

  const apps = applications ?? [];
  const weekStart = startOfWeek(new Date());
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const submittedThisWeek = apps.filter((a) => new Date(a.created_at) >= weekStart).length;
  const submittedLastWeek = apps.filter(
    (a) => new Date(a.created_at) >= lastWeekStart && new Date(a.created_at) < weekStart
  ).length;
  const submittedThisMonth = apps.filter((a) => new Date(a.created_at) >= monthStart).length;
  const interviewsScheduled = apps.filter((a) => a.interview_scheduled_at).length;
  const interviewsThisWeek = apps.filter(
    (a) => a.interview_scheduled_at && new Date(a.interview_scheduled_at) >= weekStart
  ).length;

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

  const resumeIds = resumes.map((r) => r.id);
  const primaryResumeId = resumes[0]?.id ?? null;

  const { data: reviewRows } = resumeIds.length
    ? await supabase
        .from("ai_reviews")
        .select("resume_id, score, created_at")
        .in("resume_id", resumeIds)
        .not("score", "is", null)
        .order("created_at", { ascending: false })
    : { data: [] };

  // Each CV is scored independently — the trend must compare a resume's
  // score to its OWN previous scan, never to a different resume's score.
  const latestReview = reviewRows?.[0] ?? null;
  const profileMatchScore = latestReview?.score ?? null;
  const latestScoredResumeTitle = latestReview
    ? (resumes.find((r) => r.id === latestReview.resume_id)?.title ?? null)
    : null;
  const previousMatchScore =
    (latestReview
      ? reviewRows?.find((r, i) => i > 0 && r.resume_id === latestReview.resume_id)?.score
      : null) ?? null;

  const credits = profile?.credits_remaining ?? 0;
  const lowCredits = credits < LOW_CREDITS_THRESHOLD;

  const activityItems = await getRecentActivity(supabase, user.id, 7);

  const careerProfile = (careerProfileData as CareerProfile | null) ?? null;
  const appliedJobIds = new Set(apps.map((a) => a.job_id));
  const savedJobIds = new Set((savedJobRows ?? []).map((s) => s.job_id).filter(Boolean));
  const jobs = (openJobs ?? []) as Job[];

  const recommended: RecommendedJob[] = jobs
    .filter((job) => !appliedJobIds.has(job.id))
    .map((job) => ({
      job,
      matchScore: careerProfile ? computeJobMatch(careerProfile, job).overallScore : null,
      saved: savedJobIds.has(job.id),
    }))
    .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
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
            <Button>Generate application</Button>
          </Link>
        </div>
      </div>

      <Link
        href="/dashboard/mock-interview"
        className={`group flex flex-wrap items-center justify-between gap-4 rounded-2xl px-6 py-5 transition hover:-translate-y-0.5 ${
          statusCounts.interviewing > 0
            ? "bg-brand-950 hover:shadow-lg"
            : "border border-brand-200 bg-brand-50 hover:shadow-md"
        }`}
      >
        <div className="flex items-center gap-4">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              statusCounts.interviewing > 0 ? "bg-white/10 text-white" : "bg-white text-brand-700"
            }`}
          >
            <MessageSquare className="h-5 w-5" />
          </span>
          <div>
            <p className={`font-semibold ${statusCounts.interviewing > 0 ? "text-white" : "text-slate-900"}`}>
              {statusCounts.interviewing > 0
                ? `You have ${statusCounts.interviewing} interview${statusCounts.interviewing === 1 ? "" : "s"} lined up — practice now`
                : "Get interview-ready before you need to be"}
            </p>
            <p className={`text-sm ${statusCounts.interviewing > 0 ? "text-slate-300" : "text-slate-600"}`}>
              AI Interview Coach asks role-specific questions and gives instant feedback — free to
              start.
            </p>
          </div>
        </div>
        <span
          className={`flex shrink-0 items-center gap-1.5 text-sm font-semibold ${
            statusCounts.interviewing > 0 ? "text-white" : "text-brand-700"
          }`}
        >
          Try Interview Coach
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </span>
      </Link>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          icon={Briefcase}
          label="Total applications"
          value={apps.length}
          href="/dashboard/applications"
          trend={submittedThisMonth > 0 ? { text: `+${submittedThisMonth} this month` } : undefined}
        />
        <StatCard
          icon={TrendingUp}
          label="Submitted this week"
          value={submittedThisWeek}
          href="/dashboard/applications"
          trend={
            submittedThisWeek !== submittedLastWeek
              ? { text: `${submittedThisWeek >= submittedLastWeek ? "+" : ""}${submittedThisWeek - submittedLastWeek} vs last week` }
              : undefined
          }
        />
        <StatCard
          icon={CalendarClock}
          label="Interviews scheduled"
          value={interviewsScheduled}
          href="/dashboard/applications"
          trend={interviewsThisWeek > 0 ? { text: `${interviewsThisWeek} this week` } : undefined}
        />
        <StatCard
          icon={Bookmark}
          label="Saved jobs"
          value={savedJobRows?.length ?? 0}
          href="/dashboard/saved-jobs"
        />
        <StatCard
          icon={Target}
          label="Latest CV score"
          value={profileMatchScore != null ? `${profileMatchScore}%` : "—"}
          href="/dashboard/resumes"
          trend={
            profileMatchScore != null && previousMatchScore != null
              ? {
                  text: `${profileMatchScore >= previousMatchScore ? "+" : ""}${profileMatchScore - previousMatchScore}% since last scan of "${latestScoredResumeTitle}"`,
                }
              : profileMatchScore != null && latestScoredResumeTitle
                ? { text: `For "${latestScoredResumeTitle}" — each CV is scored separately` }
                : { text: "Run an ATS scan to get scored" }
          }
        />
        <StatCard
          icon={Sparkles}
          label="AI credits remaining"
          value={credits}
          href="/dashboard/subscription"
          trend={lowCredits ? { text: "Low — upgrade plan", tone: "warning" } : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DonutChart title="Application status" segments={donutSegments} />
        <WeeklyBarChart title="Weekly application volume" weeks={weeklyBuckets} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecommendedJobs jobs={recommended} resumeId={primaryResumeId} />
        </div>
        <RecentActivity items={activityItems} />
      </div>
    </div>
  );
}
