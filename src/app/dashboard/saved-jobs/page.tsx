import Link from "next/link";
import { BackLink } from "@/components/ui/back-link";
import { redirect } from "next/navigation";
import { Bookmark, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { toggleSavedJob, removeSavedJobById } from "@/lib/savedjobs/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";

export default async function SavedJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ captured?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { captured } = await searchParams;

  const { data: savedJobs } = await supabase
    .from("saved_jobs")
    .select(
      "id, job_id, external_title, external_company, external_location, external_url, jobs:job_id(id, title, company, location, status)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const list = savedJobs ?? [];
  const onPlatformCount = list.filter((s) => s.job_id).length;
  const bookmarkletCount = list.filter((s) => !s.job_id).length;
  const openCount = list.filter((s) => {
    const job = Array.isArray(s.jobs) ? s.jobs[0] : s.jobs;
    return job?.status === "open";
  }).length;

  return (
    <div className="mx-auto max-w-5xl">
      <BackLink href="/dashboard" label="Dashboard" />
      <h1 className="mb-6 text-3xl font-bold text-slate-900">Saved jobs</h1>

      {captured === "1" && (
        <Card className="mb-4 border-0 border-l-[3px] border-emerald-400 bg-emerald-50/60 p-4 text-sm text-emerald-800">
          Saved via the bookmarklet — you can find it below.
        </Card>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total saved" value={list.length} />
        <StatCard label="Still open" value={openCount} />
        <StatCard label="From Resume Hub" value={onPlatformCount} />
        <StatCard label="From bookmarklet" value={bookmarkletCount} />
      </div>

      {list.length === 0 && (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <Bookmark className="h-6 w-6" />
          </span>
          <div>
            <p className="font-semibold text-slate-900">No saved jobs yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Browse the job board, or use the Save to Resume Hub bookmarklet on any job listing
              across the web.
            </p>
          </div>
          <Link href="/jobs">
            <Button size="sm">Browse open roles</Button>
          </Link>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {list.map((saved) => {
          const job = Array.isArray(saved.jobs) ? saved.jobs[0] : saved.jobs;

          if (job) {
            return (
              <Card key={saved.id} className="flex flex-col justify-between p-5">
                <div>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="font-semibold text-slate-900 hover:text-brand-600"
                  >
                    {job.title}
                  </Link>
                  <p className="text-sm text-slate-500">
                    {job.company} {job.location ? `· ${job.location}` : ""}
                  </p>
                  {job.status !== "open" && (
                    <p className="mt-1 text-xs text-slate-400">No longer accepting applications</p>
                  )}
                </div>
                <form action={toggleSavedJob.bind(null, job.id, false)} className="mt-3">
                  <Button type="submit" size="sm" variant="ghost">
                    Remove
                  </Button>
                </form>
              </Card>
            );
          }

          if (!saved.external_title) return null;

          return (
            <Card key={saved.id} className="flex flex-col justify-between p-5">
              <div>
                <a
                  href={saved.external_url ?? "#"}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 font-semibold text-slate-900 hover:text-brand-600"
                >
                  {saved.external_title}
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                </a>
                <p className="text-sm text-slate-500">
                  {saved.external_company}
                  {saved.external_location ? ` · ${saved.external_location}` : ""}
                </p>
                <p className="mt-1 text-xs text-slate-400">Saved from another site via bookmarklet</p>
              </div>
              <form action={removeSavedJobById.bind(null, saved.id)} className="mt-3">
                <Button type="submit" size="sm" variant="ghost">
                  Remove
                </Button>
              </form>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
