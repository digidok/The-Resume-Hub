-- Targets and results for the business tracker. Admin only.
-- A result below target is a "miss"; the owner then writes a cause and a plan (the miss report).
create table public.business_targets (
  id uuid primary key default gen_random_uuid(),
  area text not null check (char_length(area) between 1 and 80),
  measure text not null check (char_length(measure) between 1 and 160),
  unit text not null default 'count' check (unit in ('count', 'zar', 'percent')),
  period text not null default 'week' check (period in ('week', 'month')),
  target numeric(14, 2) not null check (target >= 0),
  owner_name text not null check (char_length(owner_name) between 1 and 80),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.business_target_results (
  id uuid primary key default gen_random_uuid(),
  target_id uuid not null references public.business_targets(id) on delete cascade,
  period_end date not null,
  actual numeric(14, 2) not null check (actual >= 0),
  -- The target as it stood when the result was recorded, so later changes do not rewrite history.
  target_at_time numeric(14, 2) not null check (target_at_time >= 0),
  note text check (char_length(note) <= 500),
  miss_cause text check (char_length(miss_cause) <= 1000),
  miss_plan text check (char_length(miss_plan) <= 1000),
  miss_new_date date,
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (target_id, period_end)
);
create index business_target_results_target_idx on public.business_target_results(target_id, period_end desc);

alter table public.business_targets enable row level security;
alter table public.business_target_results enable row level security;

create policy "Admins manage targets" on public.business_targets
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage target results" on public.business_target_results
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
