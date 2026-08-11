-- Candidates can accept/decline a sent offer; accepting moves the
-- application to 'hired' (unlocks the employer's induction module).
alter table public.offer_letters drop constraint offer_letters_status_check;
alter table public.offer_letters add constraint offer_letters_status_check
  check (status in ('draft', 'sent', 'accepted', 'declined'));

alter table public.applications drop constraint applications_status_check;
alter table public.applications add constraint applications_status_check
  check (status in ('submitted', 'interviewing', 'offer', 'hired', 'rejected'));

-- Candidates need to keep seeing the offer after they've responded to it,
-- not just while it's still 'sent'.
drop policy "Candidates can view offer letters sent to them" on public.offer_letters;
create policy "Candidates can view offer letters sent to them"
  on public.offer_letters for select
  using (
    status in ('sent', 'accepted', 'declined')
    and exists (
      select 1 from public.applications
      where applications.id = offer_letters.application_id
      and applications.candidate_id = auth.uid()
    )
  );

-- Candidates can't update applications.status directly (only employers can,
-- via the existing employer policy), so accepting/declining an offer goes
-- through these SECURITY DEFINER functions instead, which validate the
-- caller owns the application before making the paired update.
create or replace function public.accept_offer(p_offer_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_application_id uuid;
begin
  select application_id into v_application_id
  from public.offer_letters
  where id = p_offer_id and status = 'sent';

  if v_application_id is null then
    raise exception 'offer not found or not awaiting a response';
  end if;

  if not exists (
    select 1 from public.applications
    where id = v_application_id and candidate_id = auth.uid()
  ) then
    raise exception 'not authorized for this offer';
  end if;

  update public.offer_letters set status = 'accepted', updated_at = now() where id = p_offer_id;
  update public.applications set status = 'hired' where id = v_application_id;
end;
$$;

create or replace function public.decline_offer(p_offer_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_application_id uuid;
begin
  select application_id into v_application_id
  from public.offer_letters
  where id = p_offer_id and status = 'sent';

  if v_application_id is null then
    raise exception 'offer not found or not awaiting a response';
  end if;

  if not exists (
    select 1 from public.applications
    where id = v_application_id and candidate_id = auth.uid()
  ) then
    raise exception 'not authorized for this offer';
  end if;

  update public.offer_letters set status = 'declined', updated_at = now() where id = p_offer_id;
end;
$$;

revoke all on function public.accept_offer(uuid) from public;
revoke all on function public.decline_offer(uuid) from public;
grant execute on function public.accept_offer(uuid) to authenticated;
grant execute on function public.decline_offer(uuid) to authenticated;
