-- Security hardening found in the 20 Oct 2026 audit.
-- Apply AFTER the Payfast RPC lock (20261020180000). Safe to run more than once.

-- 1. Functions that only make sense for a signed-in user. Each already checks
--    auth.uid() inside, so anonymous callers can only ever get an error; removing
--    the privilege shrinks the public API surface.
revoke execute on function public.accept_offer(uuid) from public, anon;
revoke execute on function public.decline_offer(uuid) from public, anon;
revoke execute on function public.get_induction_module(uuid) from public, anon;
revoke execute on function public.submit_induction_attempt(uuid, jsonb) from public, anon;
revoke execute on function public.get_suggested_connections(integer) from public, anon;
revoke execute on function public.get_promo_discount(text, text) from public, anon;

grant execute on function public.accept_offer(uuid) to authenticated;
grant execute on function public.decline_offer(uuid) to authenticated;
grant execute on function public.get_induction_module(uuid) to authenticated;
grant execute on function public.submit_induction_attempt(uuid, jsonb) to authenticated;
grant execute on function public.get_suggested_connections(integer) to authenticated;
grant execute on function public.get_promo_discount(text, text) to authenticated;

-- 2. Trigger function: it must never be callable through the public API.
--    Triggers still fire; EXECUTE is not checked when a trigger runs.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- 3. Pin the search path on the two trigger functions that had none.
alter function public.set_applications_updated_at() set search_path = public;
alter function public.set_connections_updated_at() set search_path = public;

-- NOT changed on purpose: is_admin() and is_employer() are called inside
-- row-level-security policies. Policies run as the querying role, so anonymous
-- visitors need EXECUTE on them or every public read of those tables would fail.
-- They only report the caller's own role and expose nothing else.
