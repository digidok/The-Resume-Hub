-- Extend admin read access to the remaining candidate data so the admin
-- user-detail page can show a full profile (cover letters, saved jobs,
-- career passport) in addition to resumes/applications/payments already
-- covered by is_admin() policies.

create policy "Admins can view all cover letters"
  on public.cover_letters for select
  using (public.is_admin());

create policy "Admins can view all saved jobs"
  on public.saved_jobs for select
  using (public.is_admin());

create policy "Admins can view all career profiles"
  on public.career_profiles for select
  using (public.is_admin());
