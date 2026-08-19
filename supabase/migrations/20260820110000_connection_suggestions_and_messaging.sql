-- Same-field connection suggestions: a SECURITY DEFINER function that
-- returns only safe, public profile fields (never phone/plan/credits/etc.)
-- for candidates in the caller's own industry who aren't already
-- connected (in any status) — the profiles table itself stays locked
-- down to owner/connected-only visibility.
create or replace function public.get_suggested_connections(p_limit integer default 6)
returns table (id uuid, full_name text, headline text, avatar_url text, industry text)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.full_name, p.headline, p.avatar_url, cp.industry
  from profiles p
  join career_profiles cp on cp.user_id = p.id
  where p.role = 'candidate'
    and p.id <> auth.uid()
    and cp.industry is not null
    and cp.industry = (select industry from career_profiles where user_id = auth.uid())
    and not exists (
      select 1 from connections c
      where (c.requester_id = auth.uid() and c.recipient_id = p.id)
         or (c.requester_id = p.id and c.recipient_id = auth.uid())
    )
  order by p.updated_at desc
  limit p_limit;
$$;

grant execute on function public.get_suggested_connections(integer) to authenticated;

-- Messaging, scoped strictly to accepted connections
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.connections(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  job_id uuid references public.jobs(id) on delete set null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "Connection participants can view messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.connections c
      where c.id = messages.connection_id
        and c.status = 'accepted'
        and (c.requester_id = auth.uid() or c.recipient_id = auth.uid())
    )
  );

create policy "Connection participants can send messages"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.connections c
      where c.id = messages.connection_id
        and c.status = 'accepted'
        and (c.requester_id = auth.uid() or c.recipient_id = auth.uid())
    )
  );

create policy "Recipients can mark messages read"
  on public.messages for update
  using (
    exists (
      select 1 from public.connections c
      where c.id = messages.connection_id
        and (c.requester_id = auth.uid() or c.recipient_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.connections c
      where c.id = messages.connection_id
        and (c.requester_id = auth.uid() or c.recipient_id = auth.uid())
    )
  );

create index messages_connection_id_idx on public.messages(connection_id, created_at);
