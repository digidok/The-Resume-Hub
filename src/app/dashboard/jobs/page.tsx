import Link from "next/link";
import { BackLink } from "@/components/ui/back-link";
import { redirect } from "next/navigation";
import { Briefcase } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";

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

  const list = jobs ?? [];
  const activeCount = list.filter((j) => j.status === "open").length;
  const closedCount = list.filter((j) => j.status !== "open").length;

  return (
    <div className="mx-auto max-w-6xl">
      <BackLink href="/dashboard" label="Dashboard" />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">My job posts</h1>
        <Link href="/dashboard/jobs/new">
          <Button>+ Post a job</Button>
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatCard label="Total posts" value={list.length} />
        <StatCard label="Active" value={activeCount} />
        <StatCard label="Closed" value={closedCount} />
      </div>

      {list.length === 0 && (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <Briefcase className="h-6 w-6" />
          </span>
          <div>
            <p className="font-semibold text-slate-900">You haven&apos;t posted any jobs yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Post your first role to start reaching candidates on Resume Hub.
            </p>
          </div>
          <Link href="/dashboard/jobs/new">
            <Button size="sm">Post a job</Button>
          </Link>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((job) => (
          <Link key={job.id} href={`/dashboard/jobs/${job.id}`}>
            <Card className="flex h-full flex-col justify-between p-5 transition hover:border-brand-300 hover:shadow-md">
              <div>
                <h2 className="font-semibold text-slate-900">{job.title}</h2>
                <p className="text-sm text-slate-500">{job.company}</p>
              </div>
              <span
                className={`mt-3 inline-block w-fit rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
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
