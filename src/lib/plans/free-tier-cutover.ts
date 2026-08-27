/**
 * The moment the candidate free tier was retired. Accounts created before
 * this keep their existing free access (grandfathered) exactly as it
 * worked before; any candidate account created at or after this must have
 * an active paid plan to use the dashboard. See the paywall gate in
 * src/app/dashboard/layout.tsx.
 */
export const FREE_TIER_CUTOFF = new Date("2026-08-27T14:51:37Z");
