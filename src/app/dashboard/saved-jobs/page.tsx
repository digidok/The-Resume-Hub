import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { toggleSavedJob, removeSavedJobById } from "@/lib/savedjobs/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Saved jobs</h1>

      {captured === "1" && (
        <Card className="mb-4 border-0 border-l-[3px] border-emerald-400 bg-emerald-50/60 p-4 text-sm text-emerald-800">
          Saved via the bookmarklet — you can find it below.
        </Card>
      )}

      {(!savedJobs || savedJobs.length === 0) && (
        <Card className="p-8 text-center text-slate-500">
          No saved jobs yet.{" "}
          <Link href="/jobs" className="text-brand-600 hover:underline">
            Browse open roles →
          </Link>
        </Card>
      )}

      <div className="space-y-3">
        {savedJobs?.map((saved) => {
          const job = Array.isArray(saved.jobs) ? saved.jobs[0] : saved.jobs;

          if (job) {
            return (
              <Card key={saved.id} className="flex items-center justify-between p-5">
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
                <form action={toggleSavedJob.bind(null, job.id, false)}>
                  <Button type="submit" size="sm" variant="ghost">
                    Remove
                  </Button>
                </form>
              </Card>
            );
          }

          if (!saved.external_title) return null;

          return (
            <Card key={saved.id} className="flex items-center justify-between p-5">
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
              <form action={removeSavedJobById.bind(null, saved.id)}>
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
