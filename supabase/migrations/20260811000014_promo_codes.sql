-- Promo codes for discounted subscriptions (e.g. student discount).
-- plan matches a SUBSCRIPTION_PACKAGES id (e.g. "candidate_pro"), not a profile.
create table if not exists promo_codes (
  code text primary key,
  plan text not null,
  discount_percent int not null check (discount_percent > 0 and discount_percent <= 100),
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table promo_codes enable row level security;

-- No select/insert/update/delete policies: the table is never queried
-- directly by clients. Codes are managed manually via SQL and validated
-- only through the SECURITY DEFINER function below, which returns nothing
-- but the discount percentage — never the full row.
create or replace function get_promo_discount(p_code text, p_plan text)
returns int
language sql
security definer
set search_path = public
stable
as $$
  select discount_percent
  from promo_codes
  where code = upper(trim(p_code))
    and plan = p_plan
    and active
    and (expires_at is null or expires_at > now())
  limit 1;
$$;

grant execute on function get_promo_discount(text, text) to authenticated;

insert into promo_codes (code, plan, discount_percent)
values ('STUDENT50', 'candidate_pro', 50)
on conflict (code) do nothing;
