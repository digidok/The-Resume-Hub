import type { SupabaseClient } from "@supabase/supabase-js";

export const CREDIT_COSTS = {
  ai_review: 1,
  ai_generate_application: 1,
  mock_interview: 2,
  salary_insight: 1,
  auto_apply: 1,
  follow_up_draft: 1,
  resume_fill_gaps: 1,
  suggest_duties: 1,
  align_to_job: 1,
  resume_translate: 1,
  recruiter_message: 1,
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

/**
 * Pro status grants unlimited AI credits — either permanently (a one-time
 * Growth/Power credit top-up sets plan='pro' with no expiry) or for as long
 * as an active Candidate Pro subscription is paid up (subscription_expires_at
 * in the future). A lapsed subscription falls back to metered credits.
 */
export function hasUnlimitedCredits(profile: {
  plan: string;
  subscription_plan: string | null;
  subscription_expires_at: string | null;
}): boolean {
  if (profile.plan !== "pro") return false;
  if (profile.subscription_plan !== "candidate_pro") return true;
  return Boolean(
    profile.subscription_expires_at && new Date(profile.subscription_expires_at) > new Date()
  );
}

/**
 * Deducts credits with a compare-and-swap write (WHERE matches the balance
 * just read) so a concurrent spend can't double-deduct the same credits.
 * Pro users (see hasUnlimitedCredits) skip deduction entirely.
 */
export async function spendCredits(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  userId: string,
  action: CreditAction
): Promise<{ ok: true; remaining: number } | { ok: false; error: string }> {
  const cost = CREDIT_COSTS[action];

  const { data: profile, error: readError } = await supabase
    .from("profiles")
    .select("credits_remaining, plan, subscription_plan, subscription_expires_at")
    .eq("id", userId)
    .single();

  if (readError || !profile) {
    return { ok: false, error: "Could not read credit balance." };
  }

  if (hasUnlimitedCredits(profile)) {
    return { ok: true, remaining: profile.credits_remaining };
  }

  if (profile.credits_remaining < cost) {
    return { ok: false, error: "You're out of AI credits. Upgrade to keep going." };
  }

  const newBalance = profile.credits_remaining - cost;

  const { data: updated, error: updateError } = await supabase
    .from("profiles")
    .update({ credits_remaining: newBalance })
    .eq("id", userId)
    .eq("credits_remaining", profile.credits_remaining)
    .select("credits_remaining")
    .single();

  if (updateError || !updated) {
    return { ok: false, error: "Could not spend credits — please try again." };
  }

  return { ok: true, remaining: updated.credits_remaining };
}
