-- Document Studio requests from the public /services page (Resume Document Hub).
-- Written only by the server (service role); readable by admins.
create table public.studio_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  status text not null default 'new'
    check (status in ('new', 'in_progress', 'delivered', 'cancelled')),
  document_type text not null,
  template_style text not null,
  company_name text not null,
  contact_name text not null,
  email text not null,
  phone text,
  deadline date,
  brief text,
  files jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.studio_requests enable row level security;

create policy "Admins can view studio requests"
  on public.studio_requests for select
  using (public.is_admin());

create policy "Admins can update studio requests"
  on public.studio_requests for update
  using (public.is_admin())
  with check (public.is_admin());

create index studio_requests_created_at_idx on public.studio_requests(created_at desc);
create index studio_requests_email_idx on public.studio_requests(email, created_at desc);

-- Private bucket for client logos, recordings and supporting documents.
-- Path convention: {reference}/{kind}-{filename}. Uploads happen through
-- signed upload URLs issued by the server, so no public insert policy exists.
insert into storage.buckets (id, name, public, file_size_limit)
values ('studio-uploads', 'studio-uploads', false, 52428800)
on conflict (id) do nothing;

create policy "Admins can view studio uploads"
  on storage.objects for select
  using (bucket_id = 'studio-uploads' and public.is_admin());
