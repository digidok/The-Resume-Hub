-- Bulk recruitment workspace: talent pool, client vacancies, pipeline, placements and timesheets.
-- Staff-only. Candidates are contacted only when consent is recorded as given.

create extension if not exists pg_trgm;

create table public.talent_pool (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text unique,
  phone text,
  location text,
  headline text,
  skills text[] not null default '{}',
  experience_years int check (experience_years between 0 and 60),
  availability text not null default 'unknown' check (availability in ('immediate', 'within_month', 'later', 'unknown')),
  cv_path text,
  source text,
  consent_status text not null default 'pending' check (consent_status in ('given', 'pending', 'withdrawn')),
  consent_at timestamptz,
  unsub_token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  search_blob text not null default '',
  notes text,
  created_at timestamptz not null default now()
);
alter table public.talent_pool enable row level security;
create index talent_pool_search_idx on public.talent_pool using gin (search_blob gin_trgm_ops);
create index talent_pool_created_idx on public.talent_pool (created_at desc);

-- Keeps one lowercase text column to search across name, headline, location and skills.
create or replace function public.talent_pool_set_search()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.search_blob := lower(
    coalesce(new.full_name, '') || ' ' || coalesce(new.headline, '') || ' ' ||
    coalesce(new.location, '') || ' ' || coalesce(array_to_string(new.skills, ' '), '')
  );
  return new;
end;
$$;
create trigger talent_pool_search before insert or update on public.talent_pool
  for each row execute function public.talent_pool_set_search();

create policy "Recruiters manage talent pool" on public.talent_pool
  for all to authenticated using (public.has_staff_role(array['recruiter']))
  with check (public.has_staff_role(array['recruiter']));

create table public.vacancies (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  client_name text not null,
  client_email text,
  title text not null,
  description text,
  location text,
  headcount int not null default 1 check (headcount between 1 and 10000),
  employment_type text not null default 'temporary'
    check (employment_type in ('temporary', 'fixed_term', 'permanent', 'project')),
  status text not null default 'open' check (status in ('open', 'on_hold', 'filled', 'closed')),
  start_date date,
  created_at timestamptz not null default now()
);
alter table public.vacancies enable row level security;
create policy "Recruiters manage vacancies" on public.vacancies
  for all to authenticated using (public.has_staff_role(array['recruiter']))
  with check (public.has_staff_role(array['recruiter']));

create table public.vacancy_candidates (
  id uuid primary key default gen_random_uuid(),
  vacancy_id uuid not null references public.vacancies(id) on delete cascade,
  talent_id uuid not null references public.talent_pool(id) on delete cascade,
  stage text not null default 'sourced'
    check (stage in ('sourced', 'shortlisted', 'interview', 'offered', 'placed', 'rejected', 'withdrawn')),
  notes text,
  updated_at timestamptz not null default now(),
  unique (vacancy_id, talent_id)
);
alter table public.vacancy_candidates enable row level security;
create index vacancy_candidates_vacancy_idx on public.vacancy_candidates (vacancy_id, stage);
create policy "Recruiters manage pipeline" on public.vacancy_candidates
  for all to authenticated using (public.has_staff_role(array['recruiter']))
  with check (public.has_staff_role(array['recruiter']));

-- People we employ and place with a client (temporary employment services).
create table public.placements (
  id uuid primary key default gen_random_uuid(),
  vacancy_id uuid references public.vacancies(id) on delete set null,
  talent_id uuid not null references public.talent_pool(id),
  client_name text not null,
  role_title text not null,
  start_date date not null,
  end_date date,
  pay_basis text not null default 'hourly' check (pay_basis in ('hourly', 'daily', 'monthly')),
  pay_rate numeric(12, 2) not null check (pay_rate >= 0),
  bill_rate numeric(12, 2) not null check (bill_rate >= 0),
  status text not null default 'active' check (status in ('active', 'ended')),
  created_at timestamptz not null default now()
);
alter table public.placements enable row level security;
create policy "Recruiters and payroll manage placements" on public.placements
  for all to authenticated using (public.has_staff_role(array['recruiter', 'payroll']))
  with check (public.has_staff_role(array['recruiter', 'payroll']));

-- Units worked per week. `units` is hours, days or months depending on the placement's pay basis.
create table public.placement_timesheets (
  id uuid primary key default gen_random_uuid(),
  placement_id uuid not null references public.placements(id) on delete cascade,
  week_ending date not null,
  units numeric(8, 2) not null check (units >= 0),
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (placement_id, week_ending)
);
alter table public.placement_timesheets enable row level security;
create policy "Recruiters and payroll manage timesheets" on public.placement_timesheets
  for all to authenticated using (public.has_staff_role(array['recruiter', 'payroll']))
  with check (public.has_staff_role(array['recruiter', 'payroll']));
