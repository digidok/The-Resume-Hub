-- Optional hiring-manager / recruiter contact details on job postings.
alter table public.jobs
  add column if not exists hiring_manager_name text,
  add column if not exists hiring_manager_title text,
  add column if not exists hiring_manager_email text;

-- Allow saved_jobs to bookmark listings from outside Resume Hub (via the
-- "Save to Resume Hub" bookmarklet), not just jobs already on our own board.
alter table public.saved_jobs
  alter column job_id drop not null,
  add column if not exists external_title text,
  add column if not exists external_company text,
  add column if not exists external_location text,
  add column if not exists external_url text;

alter table public.saved_jobs
  add constraint saved_jobs_source_check
  check (job_id is not null or (external_title is not null and external_url is not null));
