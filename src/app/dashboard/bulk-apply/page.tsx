import { redirect } from "next/navigation";
import { BackLink } from "@/components/ui/back-link";
import { createClient } from "@/lib/supabase/server";
import { BulkApplyForm } from "@/components/dashboard/bulk-apply-form";
import { computeJobMatch } from "@/lib/matching/job-match";
import type { CareerProfile, Job } from "@/types/database";

export default async function BulkApplyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: resumes }, { data: jobs }, { data: existingApplications }, { data: careerProfileData }] =
    await Promise.all([
      supabase
        .from("resumes")
        .select("id, title")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false }),
      supabase
        .from("jobs")
        .select("*")
        .eq("status", "open")
        // Bulk apply submits a real application through Resume Hub — jobs
        // sourced from an external board (application_url set) can only be
        // applied to on that board, so they're excluded here.
        .is("application_url", null)
        .order("posted_at", { ascending: false })
        .limit(60),
      supabase.from("applications").select("job_id").eq("candidate_id", user.id),
      supabase.from("career_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    ]);

  const appliedJobIds = new Set((existingApplications ?? []).map((a) => a.job_id));
  const careerProfile = (careerProfileData as CareerProfile | null) ?? null;

  const availableJobs = ((jobs ?? []) as Job[])
    .filter((job) => !appliedJobIds.has(job.id))
    .map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      salaryMin: job.salary_min,
      salaryMax: job.salary_max,
      currency: job.currency,
      postedAt: job.posted_at,
      matchScore: careerProfile ? computeJobMatch(careerProfile, job).overallScore : null,
    }));

  return (
    <div className="mx-auto max-w-6xl">
      <BackLink href="/dashboard" label="Dashboard" />
      <h1 className="mb-1 text-3xl font-bold text-slate-900">Bulk apply</h1>
      <p className="mb-6 text-sm text-slate-500">
        Select up to 5 open roles and apply to all of them at once with the same resume.
      </p>
      <BulkApplyForm resumes={resumes ?? []} jobs={availableJobs} />
    </div>
  );
}
