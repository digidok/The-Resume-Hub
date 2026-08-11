import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { ApplyForm } from "@/components/jobs/apply-form";

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
};

export default async function JobDetailPage({ params }: PageProps<"/jobs/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single();

  if (!job) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let resumes: { id: string; title: string }[] = [];
  let alreadyApplied = false;
  let isEmployer = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isEmployer = profile?.role === "employer";

    if (!isEmployer) {
      const { data: myResumes } = await supabase
        .from("resumes")
        .select("id, title")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      resumes = myResumes ?? [];

      const { data: existing } = await supabase
        .from("applications")
        .select("id")
        .eq("job_id", id)
        .eq("candidate_id", user.id)
        .maybeSingle();
      alreadyApplied = Boolean(existing);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/jobs" className="text-sm text-indigo-600 hover:underline">
        ← All jobs
      </Link>
      <div className="mt-2 mb-6">
        <h1 className="text-3xl font-bold text-slate-900">{job.title}</h1>
        <p className="mt-1 text-slate-600">
          {job.company} {job.location ? `· ${job.location}` : ""} ·{" "}
          {EMPLOYMENT_LABELS[job.employment_type] ?? job.employment_type}
        </p>
        {(job.salary_min || job.salary_max) && (
          <p className="mt-1 text-sm text-slate-500">
            {job.salary_min ? `$${job.salary_min.toLocaleString()}` : ""}
            {job.salary_min && job.salary_max ? " – " : ""}
            {job.salary_max ? `$${job.salary_max.toLocaleString()}` : ""}
          </p>
        )}
        {job.status !== "open" && (
          <p className="mt-2 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
            This role is no longer accepting applications.
          </p>
        )}
      </div>

      <Card className="mb-6 p-6">
        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
          {job.description}
        </p>
      </Card>

      {job.status === "open" && !isEmployer && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Apply for this role</h2>
          {user ? (
            <ApplyForm jobId={job.id} resumes={resumes} alreadyApplied={alreadyApplied} />
          ) : (
            <p className="text-sm text-slate-600">
              <Link href={`/login?redirect=/jobs/${job.id}`} className="text-indigo-600 hover:underline">
                Sign in
              </Link>{" "}
              to apply for this job.
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
