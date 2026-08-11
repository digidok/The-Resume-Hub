import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function EmployerJobsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, company, status, created_at")
    .eq("employer_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">My job posts</h1>
        <Link href="/dashboard/jobs/new">
          <Button>+ Post a job</Button>
        </Link>
      </div>

      {(!jobs || jobs.length === 0) && (
        <Card className="p-8 text-center text-slate-500">
          You haven&apos;t posted any jobs yet.
        </Card>
      )}

      <div className="space-y-3">
        {jobs?.map((job) => (
          <Link key={job.id} href={`/dashboard/jobs/${job.id}`}>
            <Card className="flex items-center justify-between p-5 transition hover:border-indigo-300 hover:shadow-md">
              <div>
                <h2 className="font-semibold text-slate-900">{job.title}</h2>
                <p className="text-sm text-slate-500">{job.company}</p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                  job.status === "open"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {job.status}
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
