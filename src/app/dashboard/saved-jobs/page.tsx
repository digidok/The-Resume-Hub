import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toggleSavedJob } from "@/lib/savedjobs/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function SavedJobsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: savedJobs } = await supabase
    .from("saved_jobs")
    .select("id, job_id, jobs:job_id(id, title, company, location, status)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Saved jobs</h1>

      {(!savedJobs || savedJobs.length === 0) && (
        <Card className="p-8 text-center text-slate-500">
          No saved jobs yet.{" "}
          <Link href="/jobs" className="text-indigo-600 hover:underline">
            Browse open roles →
          </Link>
        </Card>
      )}

      <div className="space-y-3">
        {savedJobs?.map((saved) => {
          const job = Array.isArray(saved.jobs) ? saved.jobs[0] : saved.jobs;
          if (!job) return null;
          return (
            <Card key={saved.id} className="flex items-center justify-between p-5">
              <div>
                <Link
                  href={`/jobs/${job.id}`}
                  className="font-semibold text-slate-900 hover:text-indigo-600"
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
        })}
      </div>
    </div>
  );
}
