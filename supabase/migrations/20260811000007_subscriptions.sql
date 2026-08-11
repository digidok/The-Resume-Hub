-- Recurring subscription state
alter table public.profiles
  add column subscription_plan text check (subscription_plan in ('candidate_pro', 'employer_jobs')),
  add column subscription_expires_at timestamptz,
  add column payfast_token text,
  add column job_posting_credits integer not null default 1;

create unique index profiles_payfast_token_idx on public.profiles(payfast_token) where payfast_token is not null;

-- Payment metadata needed to activate/renew a subscription from the ITN webhook
alter table public.payments
  add column payment_type text not null default 'once_off'
    check (payment_type in ('once_off', 'subscription_initial', 'subscription_renewal')),
  add column payfast_token text,
  add column subscription_plan_target text check (subscription_plan_target in ('candidate_pro', 'employer_jobs')),
  add column job_credits_granted integer not null default 0;

create unique index payments_pf_payment_id_idx on public.payments(pf_payment_id) where pf_payment_id is not null;

drop function if exists public.complete_payfast_payment(text, text, numeric);

-- Handles both once-off/initial-subscription charges (looked up by our own
-- m_payment_id, which we set at checkout) and recurring subscription renewals
-- (which Payfast auto-charges without us creating a new pending row first —
-- those are identified by the Payfast subscription token instead, and made
-- idempotent by the unique pf_payment_id index).
create or replace function public.process_payfast_itn(
  p_m_payment_id text,
  p_pf_payment_id text,
  p_amount numeric,
  p_token text default null,
  p_item_name text default null
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_payment record;
  v_profile record;
  v_job_credits integer;
begin
  select * into v_payment from public.payments where m_payment_id = p_m_payment_id for update;

  if found then
    if v_payment.status = 'complete' then
      return;
    end if;

    if abs(v_payment.amount - p_amount) > 0.01 then
      raise exception 'amount mismatch for payment %: expected %, got %', p_m_payment_id, v_payment.amount, p_amount;
    end if;

    update public.payments
    set status = 'complete',
        pf_payment_id = p_pf_payment_id,
        payfast_token = coalesce(p_token, payfast_token),
        updated_at = now()
    where id = v_payment.id;

    update public.profiles
    set credits_remaining = credits_remaining + v_payment.credits_granted,
        plan = case when v_payment.grants_pro then 'pro' else plan end,
        subscription_plan = coalesce(v_payment.subscription_plan_target, subscription_plan),
        subscription_expires_at = case
          when v_payment.subscription_plan_target is not null then now() + interval '30 days'
          else subscription_expires_at
        end,
        payfast_token = coalesce(p_token, payfast_token),
        job_posting_credits = case
          when v_payment.job_credits_granted > 0 then v_payment.job_credits_granted
          else job_posting_credits
        end
    where id = v_payment.user_id;

    return;
  end if;

  if p_token is null then
    raise exception 'payment not found and no subscription token: %', p_m_payment_id;
  end if;

  if p_pf_payment_id is not null and exists (
    select 1 from public.payments where pf_payment_id = p_pf_payment_id
  ) then
    return;
  end if;

  select * into v_profile from public.profiles where payfast_token = p_token for update;
  if not found then
    raise exception 'no profile for subscription token: %', p_token;
  end if;

  v_job_credits := case when v_profile.subscription_plan = 'employer_jobs' then 5 else 0 end;

  insert into public.payments (
    user_id, m_payment_id, pf_payment_id, amount, item_name,
    credits_granted, grants_pro, status, payment_type, payfast_token,
    subscription_plan_target, job_credits_granted
  ) values (
    v_profile.id,
    'renewal-' || coalesce(p_pf_payment_id, gen_random_uuid()::text),
    p_pf_payment_id, p_amount, coalesce(p_item_name, 'Resume Hub subscription renewal'),
    0, false, 'complete', 'subscription_renewal', p_token,
    v_profile.subscription_plan, v_job_credits
  );

  update public.profiles
  set subscription_expires_at = greatest(coalesce(subscription_expires_at, now()), now()) + interval '30 days',
      job_posting_credits = case when v_job_credits > 0 then v_job_credits else job_posting_credits end
  where id = v_profile.id;
end;
$$;

revoke all on function public.process_payfast_itn(text, text, numeric, text, text) from public;
grant execute on function public.process_payfast_itn(text, text, numeric, text, text) to anon, authenticated;
