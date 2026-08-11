-- Career Passport: a permanent, reusable career profile that sits above
-- individual resumes. One passport can inform many tailored CVs.
create table if not exists career_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  professional_title text,
  years_experience int,
  career_level text,
  industry text,
  target_roles text[] not null default '{}',
  preferred_locations text[] not null default '{}',
  salary_min numeric,
  salary_max numeric,
  employment_type text,
  work_preference text,
  skills text[] not null default '{}',
  qualifications text[] not null default '{}',
  certifications text[] not null default '{}',
  languages text[] not null default '{}',
  linkedin_url text,
  portfolio_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table career_profiles enable row level security;

create policy "Career profiles are manageable by owner"
  on career_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
