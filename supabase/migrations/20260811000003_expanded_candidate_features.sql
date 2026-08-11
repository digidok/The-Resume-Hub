-- Credits & plan on profiles
alter table public.profiles
  add column plan text not null default 'free' check (plan in ('free', 'pro')),
  add column credits_remaining integer not null default 20;

-- Rework application status set + interview tracking
update public.applications set status = 'interviewing' where status = 'reviewed';
update public.applications set status = 'offer' where status = 'accepted';

alter table public.applications drop constraint applications_status_check;
alter table public.applications add constraint applications_status_check
  check (status in ('submitted', 'interviewing', 'offer', 'rejected'));
alter table public.applications alter column status set default 'submitted';
alter table public.applications add column interview_scheduled_at timestamptz;

-- Cover letters
create table public.cover_letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  title text not null default 'Untitled Cover Letter',
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cover_letters enable row level security;

create policy "Cover letters are manageable by owner"
  on public.cover_letters for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index cover_letters_user_id_idx on public.cover_letters(user_id);

-- Saved jobs (bookmarks)
create table public.saved_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, job_id)
);

alter table public.saved_jobs enable row level security;

create policy "Saved jobs are manageable by owner"
  on public.saved_jobs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index saved_jobs_user_id_idx on public.saved_jobs(user_id);

-- Follow-ups (candidate reminders tied to an application)
create table public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  due_date date not null,
  note text,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.follow_ups enable row level security;

create policy "Follow-ups are manageable by owner"
  on public.follow_ups for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index follow_ups_user_id_idx on public.follow_ups(user_id);
create index follow_ups_application_id_idx on public.follow_ups(application_id);
