-- The ITN handler previously never checked Payfast's payment_status field,
-- so it's possible for it to receive a non-COMPLETE notification (FAILED,
-- PENDING) after all four security checks pass. This function lets the
-- webhook mark a pending payment as failed instead of silently leaving it
-- "pending" forever (or, before this fix, potentially fulfilling it).
create or replace function public.mark_payfast_payment_failed(p_m_payment_id text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.payments
  set status = 'failed', updated_at = now()
  where m_payment_id = p_m_payment_id
    and status = 'pending';
end;
$$;

revoke all on function public.mark_payfast_payment_failed(text) from public;
grant execute on function public.mark_payfast_payment_failed(text) to anon, authenticated;
