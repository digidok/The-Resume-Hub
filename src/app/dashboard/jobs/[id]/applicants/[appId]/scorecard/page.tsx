import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ScorecardForm } from "@/components/scorecards/scorecard-form";
import type { InterviewScorecard } from "@/types/database";

export default async function ScorecardPage({
  params,
}: PageProps<"/dashboard/jobs/[id]/applicants/[appId]/scorecard">) {
  const { id, appId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: job } = await supabase
    .from("jobs")
    .select("id, title")
    .eq("id", id)
    .eq("employer_id", user.id)
    .single();
  if (!job) notFound();

  const { data: application } = await supabase
    .from("applications")
    .select("id, profiles:candidate_id(full_name)")
    .eq("id", appId)
    .eq("job_id", id)
    .single();
  if (!application) notFound();

  const candidate = Array.isArray(application.profiles)
    ? application.profiles[0]
    : application.profiles;

  const { data: existing } = await supabase
    .from("interview_scorecards")
    .select("*")
    .eq("application_id", appId)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href={`/dashboard/jobs/${id}/applicants`}
        className="text-sm text-indigo-600 hover:underline"
      >
        ← Applicants
      </Link>
      <h1 className="mb-1 mt-1 text-2xl font-semibold text-slate-900">
        Interview scorecard: {candidate?.full_name || "Candidate"}
      </h1>
      <p className="mb-6 text-sm text-slate-500">{job.title}</p>
      <ScorecardForm
        jobId={id}
        applicationId={appId}
        existing={existing as InterviewScorecard | null}
      />
    </div>
  );
}
