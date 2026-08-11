-- AI-drafted follow-up email text, kept alongside the existing reminder
alter table public.follow_ups
  add column draft_subject text,
  add column draft_body text,
  add column sent boolean not null default false;
