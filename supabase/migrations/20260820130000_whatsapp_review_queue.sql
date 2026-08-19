-- Phase 1 of the WhatsApp-first done-for-you CV/LinkedIn service: the admin
-- approval gate between "n8n generated a watermarked preview" and "the client
-- sees it". n8n (which owns the actual WhatsApp Business API + docgen
-- pipeline) posts here once a preview is ready; an admin approves, rejects,
-- or requests changes from this dashboard, and that decision is posted back
-- to n8n so it can resume the conversation (send the teaser, or ask the
-- client for clarification).
create table public.whatsapp_review_queue (
  id uuid primary key default gen_random_uuid(),
  customer_phone text not null,
  customer_name text,
  service_type text not null check (service_type in ('cv_cover_letter', 'linkedin_revamp')),
  template text,
  client_brief text,
  preview_storage_path text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'changes_requested')),
  admin_notes text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.whatsapp_review_queue enable row level security;

-- Only admins interact with this table through the app (n8n writes new rows
-- via the service-role client, which bypasses RLS entirely).
create policy "Admins manage the WhatsApp review queue"
  on public.whatsapp_review_queue for all
  using (public.is_admin())
  with check (public.is_admin());

create index whatsapp_review_queue_status_idx on public.whatsapp_review_queue(status, created_at);

-- Private bucket for the watermarked preview files admin reviews before a
-- client ever sees them. Path convention: {review_id}/{filename}
insert into storage.buckets (id, name, public)
values ('whatsapp-previews', 'whatsapp-previews', false)
on conflict (id) do nothing;

create policy "Admins can view WhatsApp order previews"
  on storage.objects for select
  using (bucket_id = 'whatsapp-previews' and public.is_admin());
