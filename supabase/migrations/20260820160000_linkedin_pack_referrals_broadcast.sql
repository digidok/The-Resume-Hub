-- Phase 5 of the WhatsApp-first done-for-you service: the LinkedIn Copy Pack
-- deliverable (headline / about / experience bullets / skills — text the
-- client copies into LinkedIn themselves, never their login credentials).
-- Delivered the same way a CV is: created by the provisioning webhook once
-- payment confirms, then owned and editable by the candidate on-platform.
create table public.linkedin_copy_packs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  review_id uuid references public.whatsapp_review_queue(id) on delete set null,
  headline text,
  about text,
  -- [{ role: string, company: string, bullets: string[] }, ...]
  experience jsonb not null default '[]'::jsonb,
  skills text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.linkedin_copy_packs enable row level security;

create policy "Candidates manage their own LinkedIn copy pack"
  on public.linkedin_copy_packs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.whatsapp_review_queue
  add column provisioned_linkedin_pack_id uuid references public.linkedin_copy_packs(id) on delete set null;

-- Phase 6a: WhatsApp job-match broadcast — dedupe so the same match is never
-- pushed to the same candidate twice across cron runs.
create table public.job_matches_sent (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  sent_at timestamptz not null default now(),
  unique (user_id, job_id)
);

alter table public.job_matches_sent enable row level security;

create policy "Users can view their own sent job matches"
  on public.job_matches_sent for select
  using (auth.uid() = user_id);
-- No insert/update policy for regular users — only the cron (service role)
-- ever writes here.

create index job_matches_sent_user_id_idx on public.job_matches_sent(user_id);

-- Phase 6b: referrals. Every profile gets a short, shareable code; signing up
-- (web or WhatsApp) with someone else's code sets referred_by. Converting
-- (completing a paid WhatsApp order) mints the referrer a one-time discount
-- code for their own next order — see the provisioning route.
alter table public.profiles
  add column referral_code text unique,
  add column referred_by uuid references public.profiles(id);

update public.profiles
set referral_code = upper(substr(replace(id::text, '-', ''), 1, 8))
where referral_code is null;

alter table public.profiles alter column referral_code set not null;

create table public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  percent_off integer not null,
  source text not null default 'referral',
  -- the referred person whose conversion earned this code, so the same
  -- referral can never mint a second discount if provisioning retries.
  referred_profile_id uuid references public.profiles(id) on delete set null,
  redeemed boolean not null default false,
  redeemed_by uuid references public.profiles(id),
  redeemed_review_id uuid references public.whatsapp_review_queue(id),
  created_at timestamptz not null default now(),
  redeemed_at timestamptz
);

alter table public.discount_codes enable row level security;

create policy "Users can view their own discount codes"
  on public.discount_codes for select
  using (auth.uid() = owner_id);

alter table public.whatsapp_review_queue
  add column discount_code_id uuid references public.discount_codes(id),
  add column amount_charged_zar numeric(10,2);

-- Extend the new-account trigger to generate a referral code and resolve
-- referred_by from a referred_by_code passed in signup metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, phone_number, title, referral_code, referred_by)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'candidate'),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone_number',
    new.raw_user_meta_data->>'title',
    upper(substr(replace(new.id::text, '-', ''), 1, 8)),
    (
      select id from public.profiles
      where referral_code = upper(new.raw_user_meta_data->>'referred_by_code')
    )
  );
  return new;
end;
$$;
