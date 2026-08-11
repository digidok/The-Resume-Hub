-- Candidate opt-in to the employer candidate pool
alter table public.profiles
  add column open_to_work boolean not null default false;

-- Shortlist flag on applications (employer-controlled)
alter table public.applications
  add column shortlisted boolean not null default false;

-- Interview scorecards: structured employer feedback tied to an application
create table public.interview_scorecards (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  employer_id uuid not null references public.profiles(id) on delete cascade,
  ratings jsonb not null default '{}'::jsonb,
  notes text,
  recommendation text check (recommendation in ('strong_yes', 'yes', 'no', 'strong_no')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.interview_scorecards enable row level security;

create policy "Scorecards are manageable by the employer who owns the job"
  on public.interview_scorecards for all
  using (
    exists (
      select 1 from public.applications
      join public.jobs on jobs.id = applications.job_id
      where applications.id = interview_scorecards.application_id
      and jobs.employer_id = auth.uid()
    )
  )
  with check (
    auth.uid() = employer_id
    and exists (
      select 1 from public.applications
      join public.jobs on jobs.id = applications.job_id
      where applications.id = interview_scorecards.application_id
      and jobs.employer_id = auth.uid()
    )
  );

create index interview_scorecards_application_id_idx on public.interview_scorecards(application_id);

-- Offer letters: AI-assisted drafts tied to an application
create table public.offer_letters (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  employer_id uuid not null references public.profiles(id) on delete cascade,
  content text not null default '',
  status text not null default 'draft' check (status in ('draft', 'sent')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.offer_letters enable row level security;

create policy "Offer letters are manageable by the employer who owns the job"
  on public.offer_letters for all
  using (
    exists (
      select 1 from public.applications
      join public.jobs on jobs.id = applications.job_id
      where applications.id = offer_letters.application_id
      and jobs.employer_id = auth.uid()
    )
  )
  with check (
    auth.uid() = employer_id
    and exists (
      select 1 from public.applications
      join public.jobs on jobs.id = applications.job_id
      where applications.id = offer_letters.application_id
      and jobs.employer_id = auth.uid()
    )
  );

create policy "Candidates can view offer letters sent to them"
  on public.offer_letters for select
  using (
    status = 'sent'
    and exists (
      select 1 from public.applications
      where applications.id = offer_letters.application_id
      and applications.candidate_id = auth.uid()
    )
  );

create index offer_letters_application_id_idx on public.offer_letters(application_id);

-- Candidate pool: employers can view opted-in candidate profiles
-- (their public resumes are already visible to anyone via the existing
-- "Public resumes are viewable by anyone" policy)
create policy "Employers can view opted-in candidate profiles"
  on public.profiles for select
  using (
    role = 'candidate'
    and open_to_work = true
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employer')
  );
