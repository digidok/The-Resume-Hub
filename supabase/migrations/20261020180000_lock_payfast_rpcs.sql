-- SECURITY FIX (not yet applied; apply only AFTER the ITN route that uses the
-- service role has been deployed and a test payment has been confirmed).
--
-- process_payfast_itn() and mark_payfast_payment_failed() were granted to anon and
-- authenticated so the webhook could call them with a cookie-less client. That also
-- lets any visitor call them straight through /rest/v1/rpc with a pending payment's
-- m_payment_id and amount, completing it (credits, Pro, employer plan) with no payment.
-- The webhook now calls them with the service role, so browsers no longer need access.
revoke execute on function public.process_payfast_itn(text, text, numeric, text, text) from anon, authenticated, public;
revoke execute on function public.mark_payfast_payment_failed(text) from anon, authenticated, public;
grant execute on function public.process_payfast_itn(text, text, numeric, text, text) to service_role;
grant execute on function public.mark_payfast_payment_failed(text) to service_role;
