-- Rename the default/flagship resume template from "executive-navy" to "katali".
-- Backfill any resumes already created with the old id so they keep rendering correctly.
update public.resumes set template = 'katali' where template = 'executive-navy';
alter table public.resumes alter column template set default 'katali';
