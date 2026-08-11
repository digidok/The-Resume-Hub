-- Private bucket for raw CV files uploaded through the CV import pipeline
-- (PDF/DOCX/DOC/images). Private because CVs contain personal information.
-- Path convention: {user_id}/{filename}
insert into storage.buckets (id, name, public)
values ('cv-uploads', 'cv-uploads', false)
on conflict (id) do nothing;

create policy "Users can upload their own CV files"
  on storage.objects for insert
  with check (
    bucket_id = 'cv-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can view their own CV files"
  on storage.objects for select
  using (
    bucket_id = 'cv-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own CV files"
  on storage.objects for delete
  using (
    bucket_id = 'cv-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Provenance: which source file a resume was imported from, if any.
alter table public.resumes add column if not exists source_file_path text;
