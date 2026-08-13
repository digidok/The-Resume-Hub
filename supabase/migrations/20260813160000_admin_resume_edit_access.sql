-- Let admins update (not just view) any candidate's resume, and manage
-- resume photos on their behalf, so staff can open a candidate's CV and
-- make requested edits directly (matches the "assist with making changes"
-- support workflow, e.g. via WhatsApp).

create policy "Admins can update all resumes"
  on public.resumes for update
  using (public.is_admin());

create policy "Admins can insert resume photos"
  on storage.objects for insert
  with check (bucket_id = 'resume-photos' and public.is_admin());

create policy "Admins can update resume photos"
  on storage.objects for update
  using (bucket_id = 'resume-photos' and public.is_admin());

create policy "Admins can delete resume photos"
  on storage.objects for delete
  using (bucket_id = 'resume-photos' and public.is_admin());
