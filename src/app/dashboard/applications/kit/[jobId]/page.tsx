import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ApplicationKit } from "@/components/applications/application-kit";
import { computeJobMatch } from "@/lib/matching/job-match";
import type { CareerProfile, Job, ResumeContent } from "@/types/database";

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

  const [
    { data: resumes },
    { data: existingApplication },
    { data: careerProfileData },
    { data: profile },
    { data: existingGeneration },
  ] =
    await Promise.all([
      supabase
        .from("resumes")
        .select("id, title, content")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false }),
      supabase
        .from("applications")
        .select("id")
        .eq("job_id", jobId)
        .eq("candidate_id", user.id)
        .maybeSingle(),
      supabase.from("career_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("profiles").select("credits_remaining").eq("id", user.id).single(),
      supabase
        .from("ai_generations")
        .select("id, tailored_resume_id, cover_letter_id, matched_skills, skills_to_address, profile_match_pct")
        .eq("user_id", user.id)
        .eq("job_id", jobId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  // A kit prepared earlier (by the scheduled run or a previous visit) reopens as-is.
  let initialGeneration = null;
  if (existingGeneration) {
    const [{ data: tailored }, { data: letter }, { data: checklist }] = await Promise.all([
      supabase.from("resumes").select("content").eq("id", existingGeneration.tailored_resume_id).eq("user_id", user.id).maybeSingle(),
      supabase.from("cover_letters").select("content").eq("id", existingGeneration.cover_letter_id).eq("user_id", user.id).maybeSingle(),
      supabase.from("review_checklist").select("*").eq("ai_generation_id", existingGeneration.id).maybeSingle(),
    ]);
    if (tailored && letter) {
      initialGeneration = {
        generationId: existingGeneration.id as string,
        tailoredResumeId: existingGeneration.tailored_resume_id as string,
        coverLetterId: existingGeneration.cover_letter_id as string,
        matchedSkills: (existingGeneration.matched_skills ?? []) as string[],
        skillsToAddress: (existingGeneration.skills_to_address ?? []) as string[],
        profileMatchPct: (existingGeneration.profile_match_pct ?? null) as number | null,
        tailoredContent: tailored.content as ResumeContent,
        coverLetterContent: letter.content as string,
        checklist: {
          resume_reviewed: Boolean(checklist?.resume_reviewed),
          cover_letter_reviewed: Boolean(checklist?.cover_letter_reviewed),
          contact_confirmed: Boolean(checklist?.contact_confirmed),
          work_auth_confirmed: Boolean(checklist?.work_auth_confirmed),
          salary_confirmed: Boolean(checklist?.salary_confirmed),
          questions_done: Boolean(checklist?.questions_done),
        },
      };
    }
  }

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
          creditsRemaining={profile?.credits_remaining ?? 0}
          initialGeneration={initialGeneration}
        />
      </div>
    </div>
  );
}
