"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AuthActionState } from "@/lib/auth/actions";
import type { ScorecardRecommendation } from "@/types/database";

export const SCORECARD_CATEGORIES = [
  "communication",
  "technical_skills",
  "culture_fit",
  "problem_solving",
] as const;

export async function saveScorecard(
  jobId: string,
  applicationId: string,
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const ratings: Record<string, number> = {};
  for (const category of SCORECARD_CATEGORIES) {
    const raw = formData.get(category);
    if (raw) ratings[category] = Number(raw);
  }
  const notes = String(formData.get("notes") ?? "").trim();
  const recommendation = String(formData.get("recommendation") ?? "") as ScorecardRecommendation;

  const { data: existing } = await supabase
    .from("interview_scorecards")
    .select("id")
    .eq("application_id", applicationId)
    .maybeSingle();

  const payload = {
    application_id: applicationId,
    employer_id: user.id,
    ratings,
    notes: notes || null,
    recommendation: recommendation || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = existing
    ? await supabase.from("interview_scorecards").update(payload).eq("id", existing.id)
    : await supabase.from("interview_scorecards").insert(payload);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/jobs/${jobId}/applicants/${applicationId}/scorecard`);
  return { message: "Scorecard saved." };
}
