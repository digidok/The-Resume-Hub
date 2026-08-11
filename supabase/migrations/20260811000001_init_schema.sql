-- Profiles: one row per authenticated user
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'candidate' check (role in ('candidate', 'employer')),
  full_name text,
  headline text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Profiles are updatable by owner"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Profiles are insertable by owner"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create a profile row when a new auth user signs up
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'candidate'),
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Resumes
create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Untitled Resume',
  slug text unique not null,
  template text not null default 'classic',
  content jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.resumes enable row level security;

create policy "Resumes are manageable by owner"
  on public.resumes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Public resumes are viewable by anyone"
  on public.resumes for select
  using (is_public = true);

create index resumes_user_id_idx on public.resumes(user_id);

-- Jobs
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  company text not null,
  location text,
  employment_type text not null default 'full_time' check (employment_type in ('full_time','part_time','contract','internship')),
  description text not null,
  salary_min integer,
  salary_max integer,
  status text not null default 'open' check (status in ('open','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.jobs enable row level security;

create policy "Open jobs are viewable by anyone"
  on public.jobs for select
  using (status = 'open');

create policy "Employers can view their own jobs regardless of status"
  on public.jobs for select
  using (auth.uid() = employer_id);

create policy "Jobs are manageable by owning employer"
  on public.jobs for insert
  with check (auth.uid() = employer_id);

create policy "Jobs are updatable by owning employer"
  on public.jobs for update
  using (auth.uid() = employer_id);

create policy "Jobs are deletable by owning employer"
  on public.jobs for delete
  using (auth.uid() = employer_id);

create index jobs_status_idx on public.jobs(status);
create index jobs_employer_id_idx on public.jobs(employer_id);

-- Applications
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  resume_id uuid not null references public.resumes(id) on delete cascade,
  cover_note text,
  status text not null default 'submitted' check (status in ('submitted','reviewed','rejected','accepted')),
  created_at timestamptz not null default now(),
  unique (job_id, candidate_id)
);

alter table public.applications enable row level security;

create policy "Candidates can view their own applications"
  on public.applications for select
  using (auth.uid() = candidate_id);

create policy "Employers can view applications to their jobs"
  on public.applications for select
  using (
    exists (
      select 1 from public.jobs
      where jobs.id = applications.job_id
      and jobs.employer_id = auth.uid()
    )
  );

create policy "Candidates can apply"
  on public.applications for insert
  with check (auth.uid() = candidate_id);

create policy "Employers can update application status on their jobs"
  on public.applications for update
  using (
    exists (
      select 1 from public.jobs
      where jobs.id = applications.job_id
      and jobs.employer_id = auth.uid()
    )
  );

create index applications_job_id_idx on public.applications(job_id);
create index applications_candidate_id_idx on public.applications(candidate_id);

-- AI resume reviews
create table public.ai_reviews (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references public.resumes(id) on delete cascade,
  job_description text,
  score integer,
  feedback jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.ai_reviews enable row level security;

create policy "AI reviews are manageable by resume owner"
  on public.ai_reviews for all
  using (
    exists (
      select 1 from public.resumes
      where resumes.id = ai_reviews.resume_id
      and resumes.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.resumes
      where resumes.id = ai_reviews.resume_id
      and resumes.user_id = auth.uid()
    )
  );

create index ai_reviews_resume_id_idx on public.ai_reviews(resume_id);
