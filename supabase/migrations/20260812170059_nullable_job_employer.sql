-- Jobs synced from an external board (e.g. Adzuna) have no employer account
-- on the platform — model that honestly with a null employer_id rather than
-- inventing a fake employer profile to satisfy a NOT NULL constraint.
alter table public.jobs alter column employer_id drop not null;
