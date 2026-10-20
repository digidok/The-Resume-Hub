-- Business dashboard (Resume Document Hub): quotes/invoices, delivered files,
-- retainers and hours. Clients see their own rows by VERIFIED email; admins see all.

-- Email of the signed-in user, only if it has been confirmed. Prevents someone
-- signing up with another company's address and reading its data.
create or replace function public.current_verified_email()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select lower(email) from auth.users
  where id = auth.uid() and email_confirmed_at is not null
$$;

revoke all on function public.current_verified_email() from public, anon;
grant execute on function public.current_verified_email() to authenticated;

-- Clients can read their own studio requests.
create policy "Clients can view own studio requests"
  on public.studio_requests for select
  using (lower(email) = public.current_verified_email());

-- Quotes and invoices -------------------------------------------------------
create table public.business_billing (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.studio_requests(id) on delete set null,
  client_email text not null,
  client_name text not null,
  kind text not null check (kind in ('quote', 'invoice')),
  number text not null unique,
  description text not null,
  amount_zar numeric(12, 2) not null check (amount_zar >= 0),
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'accepted', 'declined', 'paid', 'cancelled')),
  due_date date,
  created_at timestamptz not null default now()
);
alter table public.business_billing enable row level security;
create index business_billing_email_idx on public.business_billing(lower(client_email), created_at desc);

create policy "Admins manage billing" on public.business_billing
  for all using (public.is_admin()) with check (public.is_admin());
create policy "Clients view own sent billing" on public.business_billing
  for select using (status <> 'draft' and lower(client_email) = public.current_verified_email());

-- Clients accept or decline a quote that has been sent to them.
create or replace function public.respond_to_quote(p_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.business_billing
  set status = case when p_accept then 'accepted' else 'declined' end
  where id = p_id
    and kind = 'quote'
    and status = 'sent'
    and lower(client_email) = public.current_verified_email();
  if not found then
    raise exception 'Quote not found or no longer open';
  end if;
end;
$$;
revoke all on function public.respond_to_quote(uuid, boolean) from public, anon;
grant execute on function public.respond_to_quote(uuid, boolean) to authenticated;

-- Delivered files -----------------------------------------------------------
create table public.business_deliverables (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.studio_requests(id) on delete cascade,
  name text not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);
alter table public.business_deliverables enable row level security;

create policy "Admins manage deliverables" on public.business_deliverables
  for all using (public.is_admin()) with check (public.is_admin());
create policy "Clients view own deliverables" on public.business_deliverables
  for select using (
    exists (
      select 1 from public.studio_requests r
      where r.id = request_id and lower(r.email) = public.current_verified_email()
    )
  );

insert into storage.buckets (id, name, public, file_size_limit)
values ('studio-deliveries', 'studio-deliveries', false, 52428800)
on conflict (id) do nothing;

-- Path convention: {reference}/{filename}
create policy "Admins manage studio deliveries" on storage.objects
  for all using (bucket_id = 'studio-deliveries' and public.is_admin())
  with check (bucket_id = 'studio-deliveries' and public.is_admin());
create policy "Clients read own studio deliveries" on storage.objects
  for select using (
    bucket_id = 'studio-deliveries'
    and exists (
      select 1 from public.studio_requests r
      where r.reference = (storage.foldername(name))[1]
        and lower(r.email) = public.current_verified_email()
    )
  );
create policy "Clients read own studio uploads" on storage.objects
  for select using (
    bucket_id = 'studio-uploads'
    and exists (
      select 1 from public.studio_requests r
      where r.reference = (storage.foldername(name))[1]
        and lower(r.email) = public.current_verified_email()
    )
  );

-- Retainers and hours -------------------------------------------------------
create table public.business_retainers (
  id uuid primary key default gen_random_uuid(),
  client_email text not null,
  company_name text not null,
  plan_name text not null,
  monthly_hours numeric(6, 2) not null check (monthly_hours > 0),
  monthly_fee_zar numeric(12, 2) not null default 0,
  start_date date not null default current_date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.business_retainers enable row level security;
create index business_retainers_email_idx on public.business_retainers(lower(client_email));

create policy "Admins manage retainers" on public.business_retainers
  for all using (public.is_admin()) with check (public.is_admin());
create policy "Clients view own retainers" on public.business_retainers
  for select using (lower(client_email) = public.current_verified_email());

create table public.business_time_entries (
  id uuid primary key default gen_random_uuid(),
  retainer_id uuid not null references public.business_retainers(id) on delete cascade,
  entry_date date not null default current_date,
  hours numeric(5, 2) not null check (hours > 0 and hours <= 24),
  description text not null,
  created_at timestamptz not null default now()
);
alter table public.business_time_entries enable row level security;
create index business_time_entries_retainer_idx on public.business_time_entries(retainer_id, entry_date desc);

create policy "Admins manage time entries" on public.business_time_entries
  for all using (public.is_admin()) with check (public.is_admin());
create policy "Clients view own time entries" on public.business_time_entries
  for select using (
    exists (
      select 1 from public.business_retainers b
      where b.id = retainer_id and lower(b.client_email) = public.current_verified_email()
    )
  );
