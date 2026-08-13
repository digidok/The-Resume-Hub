-- LinkedIn-style connections: candidates and employers can send/accept
-- connection requests to build a professional network. Kept simple on
-- purpose: a request is either 'pending' or 'accepted' — declining a
-- request or removing a connection is just deleting the row, so either
-- side can always re-request later.
create table public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint connections_no_self_connection check (requester_id <> recipient_id)
);

-- Order-independent uniqueness: A->B and B->A count as the same pair.
create unique index connections_unique_pair_idx
  on public.connections (least(requester_id, recipient_id), greatest(requester_id, recipient_id));

create index connections_requester_idx on public.connections (requester_id);
create index connections_recipient_idx on public.connections (recipient_id);

create or replace function public.set_connections_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger connections_set_updated_at
before update on public.connections
for each row
execute function public.set_connections_updated_at();

alter table public.connections enable row level security;

create policy "Users can view their own connections"
  on public.connections for select
  using (auth.uid() = requester_id or auth.uid() = recipient_id);

create policy "Users can send connection requests"
  on public.connections for insert
  with check (auth.uid() = requester_id);

create policy "Recipients can accept connection requests"
  on public.connections for update
  using (auth.uid() = recipient_id and status = 'pending')
  with check (auth.uid() = recipient_id and status = 'accepted');

create policy "Either side can remove a connection or request"
  on public.connections for delete
  using (auth.uid() = requester_id or auth.uid() = recipient_id);

-- Two users who have a connection (pending or accepted) between them can
-- see each other's basic profile — needed to show a requester's name/photo
-- on an incoming request, and either party's card once connected.
create policy "Connected users can view each other's profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.connections
      where (connections.requester_id = auth.uid() and connections.recipient_id = profiles.id)
         or (connections.recipient_id = auth.uid() and connections.requester_id = profiles.id)
    )
  );
