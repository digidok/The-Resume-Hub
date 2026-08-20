-- Phase 2 of the WhatsApp-first done-for-you CV/LinkedIn service: the
-- "payment timing fix" from the build plan — Payfast link generation must
-- only happen once BOTH the admin (whatsapp_review_queue.status = 'approved',
-- from Phase 1) AND the client have approved, not immediately after the
-- preview is sent. Rather than trusting n8n's own workflow ordering (which is
-- exactly what caused the original bug), dual approval is now a real,
-- server-verified precondition — see the client-decision route.
alter table public.whatsapp_review_queue
  add column client_status text not null default 'pending'
    check (client_status in ('pending', 'approved', 'changes_requested')),
  add column client_notes text,
  add column client_approved_at timestamptz;
