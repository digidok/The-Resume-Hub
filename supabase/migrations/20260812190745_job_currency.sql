-- Jobs now sync from multiple countries (Adzuna covers ZA/IN/SG on the same
-- account) — salary figures come back in each country's local currency, so
-- track it explicitly instead of assuming everything is Rand.
alter table public.jobs add column currency text not null default 'ZAR';
