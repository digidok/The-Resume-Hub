-- Private bucket for employer-uploaded interview note files (PDF/doc).
-- Path convention: {application_id}/{filename}
insert into storage.buckets (id, name, public)
values ('interview-notes', 'interview-notes', false)
on conflict (id) do nothing;

create policy "Employers can upload interview notes for their applications"
  on storage.objects for insert
  with check (
    bucket_id = 'interview-notes'
    and exists (
      select 1 from public.applications a
      join public.jobs j on j.id = a.job_id
      where a.id::text = (storage.foldername(name))[1]
      and j.employer_id = auth.uid()
    )
  );

create policy "Employers can view interview notes for their applications"
  on storage.objects for select
  using (
    bucket_id = 'interview-notes'
    and exists (
      select 1 from public.applications a
      join public.jobs j on j.id = a.job_id
      where a.id::text = (storage.foldername(name))[1]
      and j.employer_id = auth.uid()
    )
  );

create policy "Employers can delete interview notes for their applications"
  on storage.objects for delete
  using (
    bucket_id = 'interview-notes'
    and exists (
      select 1 from public.applications a
      join public.jobs j on j.id = a.job_id
      where a.id::text = (storage.foldername(name))[1]
      and j.employer_id = auth.uid()
    )
  );

-- Tracks metadata for uploaded files (storage.objects alone doesn't give us
-- a convenient per-application listing with RLS matching our other tables).
create table public.interview_note_files (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  employer_id uuid not null references public.profiles(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  uploaded_at timestamptz not null default now()
);

alter table public.interview_note_files enable row level security;

create policy "Employers manage their own interview note file records"
  on public.interview_note_files for all
  using (
    exists (
      select 1 from public.applications a
      join public.jobs j on j.id = a.job_id
      where a.id = interview_note_files.application_id
      and j.employer_id = auth.uid()
    )
  )
  with check (
    auth.uid() = employer_id
    and exists (
      select 1 from public.applications a
      join public.jobs j on j.id = a.job_id
      where a.id = interview_note_files.application_id
      and j.employer_id = auth.uid()
    )
  );

create index interview_note_files_application_id_idx on public.interview_note_files(application_id);
