create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  m_payment_id text not null unique,
  pf_payment_id text,
  amount numeric(10,2) not null,
  item_name text not null,
  credits_granted integer not null,
  grants_pro boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'complete', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payments enable row level security;

create policy "Payments are viewable by owner"
  on public.payments for select
  using (auth.uid() = user_id);

create policy "Payments are insertable by owner"
  on public.payments for insert
  with check (auth.uid() = user_id);

create index payments_user_id_idx on public.payments(user_id);
create index payments_m_payment_id_idx on public.payments(m_payment_id);

-- Called only by the validated Payfast ITN webhook handler. Runs as the
-- function owner (bypassing RLS) so it can credit the paying user's profile.
-- Cross-checks the posted amount against the pending payment's own stored
-- amount and is idempotent, so a replayed or forged call can't credit
-- more than what was actually invoiced for that payment id.
create or replace function public.complete_payfast_payment(
  p_m_payment_id text,
  p_pf_payment_id text,
  p_amount numeric
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_payment record;
begin
  select * into v_payment from public.payments where m_payment_id = p_m_payment_id for update;

  if not found then
    raise exception 'payment not found: %', p_m_payment_id;
  end if;

  if v_payment.status = 'complete' then
    return;
  end if;

  if abs(v_payment.amount - p_amount) > 0.01 then
    raise exception 'amount mismatch for payment %: expected %, got %', p_m_payment_id, v_payment.amount, p_amount;
  end if;

  update public.payments
  set status = 'complete', pf_payment_id = p_pf_payment_id, updated_at = now()
  where id = v_payment.id;

  update public.profiles
  set credits_remaining = credits_remaining + v_payment.credits_granted,
      plan = case when v_payment.grants_pro then 'pro' else plan end
  where id = v_payment.user_id;
end;
$$;

revoke all on function public.complete_payfast_payment(text, text, numeric) from public;
grant execute on function public.complete_payfast_payment(text, text, numeric) to anon, authenticated;
