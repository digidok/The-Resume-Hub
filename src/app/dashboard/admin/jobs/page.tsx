import { redirect } from "next/navigation";
import { BackLink } from "@/components/ui/back-link";
import { createClient } from "@/lib/supabase/server";
import { setJobStatus } from "@/lib/admin/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";

export default async function AdminJobsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const [{ data: jobs }, { data: applications }] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, title, company, status, created_at, profiles:employer_id(full_name)")
      .order("created_at", { ascending: false }),
    supabase.from("applications").select("job_id"),
  ]);

  const applicantCounts = new Map<string, number>();
  for (const app of applications ?? []) {
    applicantCounts.set(app.job_id, (applicantCounts.get(app.job_id) ?? 0) + 1);
  }

  const openCount = (jobs ?? []).filter((j) => j.status === "open").length;

  return (
    <div className="mx-auto max-w-6xl">
      <BackLink href="/dashboard" label="Dashboard" />
      <h1 className="mb-1 text-3xl font-bold text-slate-900">Jobs</h1>
      <p className="mb-6 text-sm text-slate-500">{jobs?.length ?? 0} job posts across the platform.</p>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatCard label="Total jobs" value={jobs?.length ?? 0} />
        <StatCard label="Open" value={openCount} />
        <StatCard label="Closed" value={(jobs?.length ?? 0) - openCount} />
      </div>

      <div className="space-y-3">
        {jobs?.map((job) => {
          const employer = Array.isArray(job.profiles) ? job.profiles[0] : job.profiles;
          return (
            <Card key={job.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium text-slate-900">{job.title}</p>
                <p className="text-sm text-slate-500">
                  {job.company} · posted by {employer?.full_name || "Unknown"}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {applicantCounts.get(job.id) ?? 0} applicant
                  {(applicantCounts.get(job.id) ?? 0) === 1 ? "" : "s"} ·{" "}
                  {new Date(job.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                    job.status === "open"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {job.status}
                </span>
                <form
                  action={async () => {
                    "use server";
                    await setJobStatus(job.id, job.status === "open" ? "closed" : "open");
                  }}
                >
                  <Button type="submit" size="sm" variant="outline">
                    {job.status === "open" ? "Force close" : "Reopen"}
                  </Button>
                </form>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
