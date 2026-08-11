import type { SupabaseClient } from "@supabase/supabase-js";

export const CREDIT_COSTS = {
  ai_review: 1,
  ai_generate: 2,
  mock_interview: 2,
  salary_insight: 1,
  auto_apply: 1,
  follow_up_draft: 1,
  resume_fill_gaps: 1,
  suggest_duties: 1,
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

/**
 * Deducts credits with a compare-and-swap write (WHERE matches the balance
 * just read) so a concurrent spend can't double-deduct the same credits.
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
    .select("credits_remaining")
    .eq("id", userId)
    .single();

  if (readError || !profile) {
    return { ok: false, error: "Could not read credit balance." };
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
