import Link from "next/link";
import { BackLink } from "@/components/ui/back-link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

export default async function InterviewsPage() {
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

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id")
    .eq("employer_id", user.id);

  const jobIds = (jobs ?? []).map((j) => j.id);

  const { data: applications } = jobIds.length
    ? await supabase
        .from("applications")
        .select(
          "id, job_id, interview_scheduled_at, profiles:candidate_id(full_name), jobs:job_id(title, company)"
        )
        .in("job_id", jobIds)
        .not("interview_scheduled_at", "is", null)
        .order("interview_scheduled_at", { ascending: true })
    : { data: [] };

  const now = new Date();
  const rows = applications ?? [];
  const upcoming = rows.filter((a) => new Date(a.interview_scheduled_at!) >= now);
  const past = rows.filter((a) => new Date(a.interview_scheduled_at!) < now);

  function InterviewRow({ app }: { app: (typeof rows)[number] }) {
    const candidate = Array.isArray(app.profiles) ? app.profiles[0] : app.profiles;
    const job = Array.isArray(app.jobs) ? app.jobs[0] : app.jobs;
    return (
      <Link
        href={`/dashboard/jobs/${app.job_id}/applicants`}
        className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-slate-50"
      >
        <div>
          <p className="font-medium text-slate-900">{candidate?.full_name || "Candidate"}</p>
          <p className="text-xs text-slate-500">
            {job?.title} at {job?.company}
          </p>
        </div>
        <span className="text-sm font-medium text-blue-700">
          {new Date(app.interview_scheduled_at!).toLocaleDateString()}
        </span>
      </Link>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <BackLink href="/dashboard" label="Dashboard" />
      <h1 className="mb-1 text-3xl font-bold text-slate-900">Interviews</h1>
      <p className="mb-6 text-sm text-slate-500">
        Scheduled interviews across all your job posts.
      </p>

      <Card className="mb-4 p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Upcoming</h2>
        {upcoming.length === 0 && <p className="text-sm text-slate-500">No upcoming interviews.</p>}
        <div className="space-y-1">
          {upcoming.map((app) => (
            <InterviewRow key={app.id} app={app} />
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Past</h2>
        {past.length === 0 && <p className="text-sm text-slate-500">No past interviews.</p>}
        <div className="space-y-1">
          {past.map((app) => (
            <InterviewRow key={app.id} app={app} />
          ))}
        </div>
      </Card>
    </div>
  );
}
