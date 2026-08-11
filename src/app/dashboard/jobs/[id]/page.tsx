import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateJobStatus } from "@/lib/jobs/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function EmployerJobDetailPage({
  params,
}: PageProps<"/dashboard/jobs/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .eq("employer_id", user.id)
    .single();

  if (!job) notFound();

  const { count: applicantCount } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("job_id", id);

  const toggleStatus = job.status === "open" ? "closed" : "open";

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/dashboard/jobs" className="text-sm text-brand-600 hover:underline">
        ← My job posts
      </Link>

      <div className="mt-1 mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{job.title}</h1>
          <p className="text-slate-500">
            {job.company} {job.location ? `· ${job.location}` : ""}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
            job.status === "open"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {job.status}
        </span>
      </div>

      <Card className="mb-6 p-6">
        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
          {job.description}
        </p>
      </Card>

      <div className="flex gap-3">
        <Link href={`/dashboard/jobs/${job.id}/applicants`}>
          <Button variant="secondary">
            View applicants{typeof applicantCount === "number" ? ` (${applicantCount})` : ""}
          </Button>
        </Link>
        <form action={updateJobStatus.bind(null, job.id, toggleStatus)}>
          <Button type="submit" variant="outline">
            Mark as {toggleStatus}
          </Button>
        </form>
        <Link href={`/jobs/${job.id}`} target="_blank">
          <Button variant="ghost">View public listing →</Button>
        </Link>
      </div>
    </div>
  );
}
