-- Public bucket for resume profile photos — public because shared resumes
-- at /r/[slug] are viewed by unauthenticated visitors.
-- Path convention: {user_id}/{filename}
insert into storage.buckets (id, name, public)
values ('resume-photos', 'resume-photos', true)
on conflict (id) do nothing;

create policy "Anyone can view resume photos"
  on storage.objects for select
  using (bucket_id = 'resume-photos');

create policy "Users can upload their own resume photos"
  on storage.objects for insert
  with check (
    bucket_id = 'resume-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own resume photos"
  on storage.objects for update
  using (
    bucket_id = 'resume-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own resume photos"
  on storage.objects for delete
  using (
    bucket_id = 'resume-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
