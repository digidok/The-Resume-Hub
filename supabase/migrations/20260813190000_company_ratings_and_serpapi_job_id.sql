-- Google Local company ratings, shown as a lightweight trust signal on job
-- listings (a Glassdoor-lite, without building a review system). Cached
-- per company/country rather than looked up per page view, since SerpApi's
-- free tier is a single 250-searches/month pool shared with the jobs sync.
create table public.company_ratings (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  country text not null default 'South Africa',
  rating numeric,
  reviews_count integer,
  fetched_at timestamptz not null default now(),
  constraint company_ratings_unique unique (company, country)
);

alter table public.company_ratings enable row level security;

create policy "Company ratings are viewable by anyone"
  on public.company_ratings for select
  using (true);

-- Google's own job_id for SerpApi-sourced (Google Jobs) rows — lets the
-- stale-listing cleanup re-check a specific listing via the Jobs Listing
-- API instead of blindly closing it after STALE_AFTER_DAYS.
alter table public.jobs add column if not exists serpapi_job_id text;
