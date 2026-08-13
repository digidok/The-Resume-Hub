-- Make the new "Executive Navy" template the default for newly created resumes.
-- Existing resumes keep whatever template they already have.
alter table public.resumes alter column template set default 'executive-navy';
