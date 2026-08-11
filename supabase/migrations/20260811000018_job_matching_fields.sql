-- Extend the existing jobs table (additive only, no data loss) with the
-- fields needed for real job-match scoring and richer search/filtering.
alter table public.jobs
  add column if not exists province text,
  add column if not exists country text not null default 'South Africa',
  add column if not exists industry text,
  add column if not exists experience_min int,
  add column if not exists experience_max int,
  add column if not exists qualification_requirements text,
  add column if not exists skills text[] not null default '{}',
  add column if not exists application_url text,
  add column if not exists source text,
  add column if not exists posted_at timestamptz not null default now(),
  add column if not exists closing_date timestamptz;
