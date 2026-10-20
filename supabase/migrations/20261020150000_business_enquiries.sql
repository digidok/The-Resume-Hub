-- Public business enquiries from the division landing pages. Written by the
-- server (service role) after validation; readable and manageable by admins.
create table public.business_enquiries (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  division text not null,
  service text not null,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'quoted', 'won', 'lost')),
  business_name text not null,
  contact_name text not null,
  email text not null,
  phone text,
  engagement text not null default 'once-off' check (engagement in ('once-off', 'recurring')),
  turnaround text,
  requirement text not null,
  details jsonb not null default '{}'::jsonb,
  consent_at timestamptz not null,
  marketing_consent boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);
alter table public.business_enquiries enable row level security;

create policy "Admins view enquiries" on public.business_enquiries
  for select using (public.is_admin());
create policy "Admins update enquiries" on public.business_enquiries
  for update using (public.is_admin()) with check (public.is_admin());

create index business_enquiries_created_idx on public.business_enquiries(created_at desc);
create index business_enquiries_email_idx on public.business_enquiries(email, created_at desc);
