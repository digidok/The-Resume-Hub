-- Phase 3-5 additions for the Resume Document Hub business portal:
-- team-member access, messages, delivery approval, feedback, screening cases,
-- tasks, audit log, pricing overrides, privacy requests, invoice payments.

-- 1. Business team members ---------------------------------------------------
create table public.business_members (
  id uuid primary key default gen_random_uuid(),
  owner_email text not null,
  member_email text not null,
  created_at timestamptz not null default now(),
  check (lower(owner_email) <> lower(member_email)),
  unique (owner_email, member_email)
);
alter table public.business_members enable row level security;

-- Emails whose business data the signed-in (verified) user may see:
-- their own, plus any owner who has added them as an authorised team member.
create or replace function public.visible_emails()
returns text[]
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(array_agg(distinct e), '{}')
  from (
    select public.current_verified_email() as e
    union
    select lower(owner_email) from public.business_members
     where lower(member_email) = public.current_verified_email()
  ) s
  where e is not null
$$;
revoke all on function public.visible_emails() from public, anon;
grant execute on function public.visible_emails() to authenticated;

create policy "Admins manage members" on public.business_members
  for all using (public.is_admin()) with check (public.is_admin());
create policy "Owners and members view" on public.business_members
  for select to authenticated using (
    lower(owner_email) = public.current_verified_email()
    or lower(member_email) = public.current_verified_email()
  );
create policy "Owners add members" on public.business_members
  for insert to authenticated with check (lower(owner_email) = public.current_verified_email());
create policy "Owners remove members" on public.business_members
  for delete to authenticated using (lower(owner_email) = public.current_verified_email());

-- 2. Recreate client policies so authorised team members see the owner's data
drop policy "Clients can view own studio requests" on public.studio_requests;
create policy "Clients can view own studio requests" on public.studio_requests
  for select to authenticated using (lower(email) = any(public.visible_emails()));

drop policy "Clients view own sent billing" on public.business_billing;
create policy "Clients view own sent billing" on public.business_billing
  for select to authenticated using (status <> 'draft' and lower(client_email) = any(public.visible_emails()));

drop policy "Clients view own deliverables" on public.business_deliverables;
create policy "Clients view own deliverables" on public.business_deliverables
  for select to authenticated using (
    exists (select 1 from public.studio_requests r
            where r.id = request_id and lower(r.email) = any(public.visible_emails()))
  );

drop policy "Clients read own studio deliveries" on storage.objects;
create policy "Clients read own studio deliveries" on storage.objects
  for select to authenticated using (
    bucket_id = 'studio-deliveries'
    and exists (select 1 from public.studio_requests r
                where r.reference = (storage.foldername(name))[1]
                  and lower(r.email) = any(public.visible_emails()))
  );
drop policy "Clients read own studio uploads" on storage.objects;
create policy "Clients read own studio uploads" on storage.objects
  for select to authenticated using (
    bucket_id = 'studio-uploads'
    and exists (select 1 from public.studio_requests r
                where r.reference = (storage.foldername(name))[1]
                  and lower(r.email) = any(public.visible_emails()))
  );

drop policy "Clients view own retainers" on public.business_retainers;
create policy "Clients view own retainers" on public.business_retainers
  for select to authenticated using (lower(client_email) = any(public.visible_emails()));

drop policy "Clients view own time entries" on public.business_time_entries;
create policy "Clients view own time entries" on public.business_time_entries
  for select to authenticated using (
    exists (select 1 from public.business_retainers b
            where b.id = retainer_id and lower(b.client_email) = any(public.visible_emails()))
  );

create or replace function public.respond_to_quote(p_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.business_billing
  set status = case when p_accept then 'accepted' else 'declined' end
  where id = p_id and kind = 'quote' and status = 'sent'
    and lower(client_email) = any(public.visible_emails());
  if not found then
    raise exception 'Quote not found or no longer open';
  end if;
end;
$$;

-- 3. Payments, contracts, delivery approval ---------------------------------
alter table public.business_billing
  add column payment_ref text unique,
  add column pf_payment_id text,
  add column paid_at timestamptz;

alter table public.business_retainers
  add column kind text not null default 'retainer' check (kind in ('retainer', 'corporate_contract')),
  add column end_date date;

alter table public.studio_requests add column approved_at timestamptz;

create or replace function public.approve_delivery(p_reference text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.studio_requests
  set approved_at = now()
  where reference = p_reference and status = 'delivered' and approved_at is null
    and lower(email) = any(public.visible_emails());
  if not found then
    raise exception 'Request not found or not ready for approval';
  end if;
end;
$$;
revoke all on function public.approve_delivery(text) from public, anon;
grant execute on function public.approve_delivery(text) to authenticated;
revoke all on function public.respond_to_quote(uuid, boolean) from public, anon;
grant execute on function public.respond_to_quote(uuid, boolean) to authenticated;

-- 4. Messages with the assigned contact -------------------------------------
create table public.business_messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.studio_requests(id) on delete cascade,
  sender_role text not null check (sender_role in ('client', 'team')),
  sender_email text not null,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
alter table public.business_messages enable row level security;
create index business_messages_request_idx on public.business_messages(request_id, created_at);

create policy "Admins manage messages" on public.business_messages
  for all using (public.is_admin()) with check (public.is_admin());
create policy "Clients view own messages" on public.business_messages
  for select to authenticated using (
    exists (select 1 from public.studio_requests r
            where r.id = request_id and lower(r.email) = any(public.visible_emails()))
  );
create policy "Clients post messages" on public.business_messages
  for insert to authenticated with check (
    sender_role = 'client'
    and lower(sender_email) = public.current_verified_email()
    and exists (select 1 from public.studio_requests r
                where r.id = request_id and lower(r.email) = any(public.visible_emails()))
  );

-- 5. Feedback ----------------------------------------------------------------
create table public.business_feedback (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.studio_requests(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 2000),
  created_at timestamptz not null default now()
);
alter table public.business_feedback enable row level security;
create policy "Admins view feedback" on public.business_feedback
  for select using (public.is_admin());
create policy "Clients view own feedback" on public.business_feedback
  for select to authenticated using (
    exists (select 1 from public.studio_requests r
            where r.id = request_id and lower(r.email) = any(public.visible_emails()))
  );
create policy "Clients leave feedback on delivered work" on public.business_feedback
  for insert to authenticated with check (
    exists (select 1 from public.studio_requests r
            where r.id = request_id and r.status = 'delivered'
              and lower(r.email) = any(public.visible_emails()))
  );

-- 6. Background screening cases ---------------------------------------------
create table public.screening_cases (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  client_email text not null,
  client_name text not null,
  candidate_name text not null,
  role_title text,
  lawful_purpose text not null,
  consent_status text not null default 'pending' check (consent_status in ('pending', 'received', 'declined')),
  consent_received_at timestamptz,
  consent_method text,
  status text not null default 'requested'
    check (status in ('requested', 'in_progress', 'completed', 'cancelled')),
  dispute_note text,
  report_path text,
  created_at timestamptz not null default now()
);
alter table public.screening_cases enable row level security;
create index screening_cases_email_idx on public.screening_cases(lower(client_email));

create table public.screening_checks (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.screening_cases(id) on delete cascade,
  check_type text not null,
  provider text,
  status text not null default 'requested'
    check (status in ('requested', 'in_progress', 'completed', 'discrepancy')),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.screening_checks enable row level security;

create policy "Admins manage screening cases" on public.screening_cases
  for all using (public.is_admin()) with check (public.is_admin());
create policy "Clients view own screening cases" on public.screening_cases
  for select to authenticated using (lower(client_email) = any(public.visible_emails()));
create policy "Admins manage screening checks" on public.screening_checks
  for all using (public.is_admin()) with check (public.is_admin());
create policy "Clients view own screening checks" on public.screening_checks
  for select to authenticated using (
    exists (select 1 from public.screening_cases c
            where c.id = case_id and lower(c.client_email) = any(public.visible_emails()))
  );

insert into storage.buckets (id, name, public, file_size_limit)
values ('screening-reports', 'screening-reports', false, 20971520)
on conflict (id) do nothing;
create policy "Admins manage screening reports" on storage.objects
  for all using (bucket_id = 'screening-reports' and public.is_admin())
  with check (bucket_id = 'screening-reports' and public.is_admin());
create policy "Clients read own screening reports" on storage.objects
  for select to authenticated using (
    bucket_id = 'screening-reports'
    and exists (select 1 from public.screening_cases c
                where c.reference = (storage.foldername(name))[1]
                  and lower(c.client_email) = any(public.visible_emails()))
  );

-- 7. Tasks --------------------------------------------------------------------
create table public.business_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  request_id uuid references public.studio_requests(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  due_date date,
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  created_at timestamptz not null default now()
);
alter table public.business_tasks enable row level security;
create policy "Admins manage tasks" on public.business_tasks
  for all using (public.is_admin()) with check (public.is_admin());

-- 8. Audit log (append-only: no update or delete policies) -------------------
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  action text not null,
  entity text not null,
  entity_id text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.audit_log enable row level security;
create index audit_log_created_idx on public.audit_log(created_at desc);
create policy "Admins read audit log" on public.audit_log
  for select using (public.is_admin());
create policy "Admins write audit log" on public.audit_log
  for insert with check (public.is_admin());

-- 9. Pricing and availability overrides (public read, admin write) -----------
create table public.catalog_overrides (
  service_id text primary key,
  from_zar numeric(12, 2),
  quote_only boolean not null default false,
  available boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.catalog_overrides enable row level security;
create policy "Anyone reads catalogue overrides" on public.catalog_overrides
  for select using (true);
create policy "Admins manage catalogue overrides" on public.catalog_overrides
  for all using (public.is_admin()) with check (public.is_admin());

-- 10. POPIA data requests (written by the server, managed by admins) ---------
create table public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  request_type text not null
    check (request_type in ('access', 'correction', 'deletion', 'marketing_opt_out', 'complaint')),
  name text not null,
  email text not null,
  details text,
  status text not null default 'new' check (status in ('new', 'in_progress', 'completed', 'refused')),
  created_at timestamptz not null default now(),
  handled_at timestamptz
);
alter table public.privacy_requests enable row level security;
create policy "Admins view privacy requests" on public.privacy_requests
  for select using (public.is_admin());
create policy "Admins update privacy requests" on public.privacy_requests
  for update using (public.is_admin()) with check (public.is_admin());
