alter table public.jobs add column dedupe_key text;

comment on column public.jobs.dedupe_key is
  'Normalized title|company|location fingerprint used to catch duplicate listings across sources/redirect URLs that application_url alone misses. Nullable — only synced-job inserts populate it going forward; existing rows backfill lazily.';

create index jobs_dedupe_key_open_idx on public.jobs(dedupe_key) where status = 'open';
