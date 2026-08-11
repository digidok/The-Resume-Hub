import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
};

export default async function JobBoardPage() {
  const supabase = await createClient();
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, company, location, employment_type, salary_min, salary_max, created_at")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-1 text-3xl font-bold text-slate-900">Job board</h1>
      <p className="mb-8 text-slate-600">Open roles from employers on Resume Hub.</p>

      {(!jobs || jobs.length === 0) && (
        <Card className="p-8 text-center text-slate-500">No open jobs right now.</Card>
      )}

      <div className="space-y-4">
        {jobs?.map((job) => (
          <Link key={job.id} href={`/jobs/${job.id}`}>
            <Card className="p-5 transition hover:border-indigo-300 hover:shadow-md">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold text-slate-900">{job.title}</h2>
                  <p className="text-sm text-slate-500">
                    {job.company} {job.location ? `· ${job.location}` : ""}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {EMPLOYMENT_LABELS[job.employment_type] ?? job.employment_type}
                </span>
              </div>
              {(job.salary_min || job.salary_max) && (
                <p className="mt-2 text-sm text-slate-500">
                  {job.salary_min ? `$${job.salary_min.toLocaleString()}` : ""}
                  {job.salary_min && job.salary_max ? " – " : ""}
                  {job.salary_max ? `$${job.salary_max.toLocaleString()}` : ""}
                </p>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
