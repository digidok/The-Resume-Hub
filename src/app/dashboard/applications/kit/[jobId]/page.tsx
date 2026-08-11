import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ApplicationKit } from "@/components/applications/application-kit";
import { computeJobMatch } from "@/lib/matching/job-match";
import type { CareerProfile, Job } from "@/types/database";

export default async function ApplicationKitPage({
  params,
}: PageProps<"/dashboard/applications/kit/[jobId]">) {
  const { jobId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: job } = await supabase.from("jobs").select("*").eq("id", jobId).single();
  if (!job) notFound();

  const [{ data: resumes }, { data: existingApplication }, { data: careerProfileData }] =
    await Promise.all([
      supabase
        .from("resumes")
        .select("id, title")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false }),
      supabase
        .from("applications")
        .select("id")
        .eq("job_id", jobId)
        .eq("candidate_id", user.id)
        .maybeSingle(),
      supabase.from("career_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    ]);

  const careerProfile = (careerProfileData as CareerProfile) ?? null;
  const match = careerProfile ? computeJobMatch(careerProfile, job as Job) : null;

  return (
    <div className="mx-auto max-w-5xl">
      <Link href={`/jobs/${job.id}`} className="text-sm text-brand-600 hover:underline">
        ← Back to job
      </Link>
      <div className="mt-4">
        <ApplicationKit
          job={job as Job}
          resumes={resumes ?? []}
          match={match}
          alreadyApplied={Boolean(existingApplication)}
        />
      </div>
    </div>
  );
}
