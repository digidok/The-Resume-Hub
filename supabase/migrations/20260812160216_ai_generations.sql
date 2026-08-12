-- AI Generator: one record per job-specific generation run (tailored resume
-- + cover letter + skill-match data), with a per-generation review checklist
-- the candidate must complete before submitting.
create table public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  source_resume_id uuid not null references public.resumes(id) on delete cascade,
  tailored_resume_id uuid not null references public.resumes(id) on delete cascade,
  cover_letter_id uuid not null references public.cover_letters(id) on delete cascade,
  matched_skills text[] not null default '{}',
  skills_to_address text[] not null default '{}',
  profile_match_pct integer,
  application_id uuid references public.applications(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ai_generations enable row level security;

create policy "AI generations are manageable by owner"
  on public.ai_generations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index ai_generations_user_id_idx on public.ai_generations(user_id);
create index ai_generations_job_id_idx on public.ai_generations(job_id);

create table public.review_checklist (
  id uuid primary key default gen_random_uuid(),
  ai_generation_id uuid not null unique references public.ai_generations(id) on delete cascade,
  resume_reviewed boolean not null default false,
  cover_letter_reviewed boolean not null default false,
  contact_confirmed boolean not null default false,
  work_auth_confirmed boolean not null default false,
  salary_confirmed boolean not null default false,
  questions_done boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.review_checklist enable row level security;

create policy "Review checklists are manageable by owner"
  on public.review_checklist for all
  using (
    exists (
      select 1 from public.ai_generations
      where ai_generations.id = review_checklist.ai_generation_id
      and ai_generations.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.ai_generations
      where ai_generations.id = review_checklist.ai_generation_id
      and ai_generations.user_id = auth.uid()
    )
  );

-- Link a submitted application back to the cover letter used, so the
-- Applications page can surface it later.
alter table public.applications add column cover_letter_id uuid references public.cover_letters(id) on delete set null;
