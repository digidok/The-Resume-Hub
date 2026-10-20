-- Staff roles beyond "admin". Administrators keep full access; staff members get
-- only the areas their role needs (see src/lib/business/guard.ts).
create table public.staff_members (
  user_id uuid not null references public.profiles(id) on delete cascade,
  staff_role text not null check (staff_role in ('recruiter', 'consultant', 'payroll', 'delivery')),
  created_at timestamptz not null default now(),
  primary key (user_id, staff_role)
);
alter table public.staff_members enable row level security;

create policy "Admins manage staff" on public.staff_members
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Staff read own roles" on public.staff_members
  for select to authenticated using (user_id = auth.uid());

-- True for administrators, or for staff holding any of the given roles.
create or replace function public.has_staff_role(p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
      or exists (
        select 1 from public.staff_members
        where user_id = auth.uid() and staff_role = any(p_roles)
      )
$$;
revoke all on function public.has_staff_role(text[]) from public, anon;
grant execute on function public.has_staff_role(text[]) to authenticated;

-- Staff (not only admins) may record their own actions in the audit log.
create policy "Staff write audit log" on public.audit_log
  for insert to authenticated with check (
    public.has_staff_role(array['recruiter', 'consultant', 'payroll', 'delivery'])
  );

-- Lets an administrator turn an email address into a user id when adding staff.
-- Returns nothing for non-administrators.
create or replace function public.find_user_id_by_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select u.id from auth.users u
  where public.is_admin() and lower(u.email) = lower(p_email)
  limit 1
$$;
revoke all on function public.find_user_id_by_email(text) from public, anon;
grant execute on function public.find_user_id_by_email(text) to authenticated;
