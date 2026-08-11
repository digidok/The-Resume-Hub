-- The "Employers can view opted-in candidate profiles" policy queried
-- profiles from within its own policy check on profiles, causing
-- "infinite recursion detected in policy for relation profiles" on
-- every read of the table. Fix: move the "is this caller an employer"
-- check into a SECURITY DEFINER helper (bypasses RLS internally, same
-- pattern already used by is_admin()), so the policy no longer
-- re-triggers RLS evaluation on profiles.
create or replace function public.is_employer()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'employer');
$$;

drop policy if exists "Employers can view opted-in candidate profiles" on public.profiles;

create policy "Employers can view opted-in candidate profiles"
  on public.profiles for select
  using (role = 'candidate' and open_to_work = true and public.is_employer());
