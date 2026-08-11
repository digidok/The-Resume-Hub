create table if not exists recruiter_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  job_id uuid references public.jobs (id) on delete set null,
  channel text not null check (channel in ('linkedin', 'email', 'whatsapp')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table recruiter_messages enable row level security;

create policy "Recruiter messages are manageable by owner"
  on recruiter_messages for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
