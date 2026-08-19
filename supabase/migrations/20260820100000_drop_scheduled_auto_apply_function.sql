-- Superseded by src/lib/autoapply/match.ts (findAutoApplyMatches), which is
-- now the single source of truth for auto-apply matching (used by both the
-- manual "Run now" action and the scheduled cron job). This SQL function
-- only did a loose keyword ILIKE match with no scoring, which is exactly
-- what let auto-apply submit applications to jobs outside a candidate's
-- field — dropped to avoid two competing implementations drifting apart.
drop function if exists public.run_scheduled_auto_apply(text);
