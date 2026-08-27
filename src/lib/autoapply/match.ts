import type { SupabaseClient } from "@supabase/supabase-js";
import { computeJobMatch } from "@/lib/matching/job-match";
import type { CareerProfile, Job } from "@/types/database";

// Auto-apply submits a real application with no human review, so the bar
// for "this is actually your field" has to be much higher than a loose
// keyword hit — a candidate's keywords can coincidentally appear in an
// unrelated job's description. Only jobs computeJobMatch scores at 80%+
// against the candidate's actual Career Passport are auto-applied to.
export const AUTO_APPLY_MIN_SCORE = 80;

export async function findAutoApplyMatches(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  userId: string,
  keywords: string,
  location: string
): Promise<{ jobs: Job[]; error?: string }> {
  const { data: careerProfileData } = await supabase
    .from("career_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!careerProfileData) {
    return {
      jobs: [],
      error: "Complete your Career Passport first so we know what to match your applications against.",
    };
  }
  const careerProfile = careerProfileData as CareerProfile;

  const keywordList = keywords
    .split(",")
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);
  const locationFilter = location.trim().toLowerCase();

  const [{ data: jobs }, { data: existingApplications }] = await Promise.all([
    // application_url IS NULL — auto-apply can only submit a real Resume Hub
    // application. Jobs that route to an employer's own site need a human to
    // actually go there; including them here would create an "applied" row
    // and email the candidate without anything ever being submitted.
    supabase.from("jobs").select("*").eq("status", "open").is("application_url", null),
    supabase.from("applications").select("job_id").eq("candidate_id", userId),
  ]);

  const appliedJobIds = new Set(
    (existingApplications ?? []).map((a: { job_id: string }) => a.job_id)
  );

  const candidates = ((jobs ?? []) as Job[]).filter((job) => {
    if (appliedJobIds.has(job.id)) return false;
    if (locationFilter && !(job.location ?? "").toLowerCase().includes(locationFilter)) {
      return false;
    }
    if (keywordList.length === 0) return true;
    const haystack = `${job.title} ${job.description}`.toLowerCase();
    return keywordList.some((keyword) => haystack.includes(keyword));
  });

  const matches = candidates.filter(
    (job) => computeJobMatch(careerProfile, job).overallScore >= AUTO_APPLY_MIN_SCORE
  );

  return { jobs: matches };
}
