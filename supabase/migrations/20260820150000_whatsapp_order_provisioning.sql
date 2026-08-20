-- Phases 3 & 4 of the WhatsApp-first done-for-you CV/LinkedIn service:
-- auto-provisioning a real platform account once payment is confirmed, and
-- tracking the 30-day free aftercare window that account gets.
alter table public.whatsapp_review_queue
  add column payment_confirmed_at timestamptz,
  add column access_expires_at timestamptz,
  add column provisioned_profile_id uuid references public.profiles(id) on delete set null,
  add column provisioned_resume_id uuid references public.resumes(id) on delete set null;
