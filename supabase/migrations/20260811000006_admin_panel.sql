-- Admin role (no self-serve signup path — promoted manually via SQL)
alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('candidate', 'employer', 'admin'));

-- Helper to check admin status without RLS recursion on direct policy subqueries
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Platform-wide read/write access for admins
create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "Admins can update all profiles"
  on public.profiles for update
  using (public.is_admin());

create policy "Admins can view all jobs"
  on public.jobs for select
  using (public.is_admin());

create policy "Admins can update all jobs"
  on public.jobs for update
  using (public.is_admin());

create policy "Admins can view all applications"
  on public.applications for select
  using (public.is_admin());

create policy "Admins can view all payments"
  on public.payments for select
  using (public.is_admin());

create policy "Admins can view all resumes"
  on public.resumes for select
  using (public.is_admin());
