import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Rough USD-per-million-token pricing for the models this app calls, and a
 * fixed USD→ZAR rate — precise enough to catch runaway spend and compare
 * features against each other, not for finance-grade accounting.
 */
const USD_PER_ZAR = 18.5;
const DEFAULT_PRICING = { inputPerMTok: 3, outputPerMTok: 15 };
const MODEL_PRICING_USD_PER_MTOK: Record<string, { inputPerMTok: number; outputPerMTok: number }> = {
  "claude-sonnet-5": DEFAULT_PRICING,
};

function estimateCostZar(model: string, inputTokens: number, outputTokens: number) {
  const pricing = MODEL_PRICING_USD_PER_MTOK[model] ?? DEFAULT_PRICING;
  const usd =
    (inputTokens / 1_000_000) * pricing.inputPerMTok + (outputTokens / 1_000_000) * pricing.outputPerMTok;
  return Math.round(usd * USD_PER_ZAR * 10000) / 10000;
}

/**
 * Records one AI call's token usage and estimated ZAR cost to
 * ai_usage_events, for admin cost visibility (see /dashboard/admin).
 * Best-effort and never throws — a logging failure must never break the
 * AI feature that just successfully ran for the user.
 */
export async function logAiUsage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  params: {
    userId: string | null;
    feature: string;
    model: string;
    inputTokens?: number | null;
    outputTokens?: number | null;
    success?: boolean;
    errorMessage?: string;
  }
): Promise<void> {
  try {
    const hasTokens = params.inputTokens != null && params.outputTokens != null;
    await supabase.from("ai_usage_events").insert({
      user_id: params.userId,
      feature: params.feature,
      model: params.model,
      input_tokens: params.inputTokens ?? null,
      output_tokens: params.outputTokens ?? null,
      estimated_cost_zar: hasTokens
        ? estimateCostZar(params.model, params.inputTokens!, params.outputTokens!)
        : null,
      success: params.success ?? true,
      error_message: params.errorMessage?.slice(0, 500) ?? null,
    });
  } catch (err) {
    console.error("logAiUsage: failed to record usage event", err);
  }
}
