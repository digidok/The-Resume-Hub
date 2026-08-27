create table public.error_logs (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  digest text,
  route_path text,
  route_type text,
  request_path text,
  request_method text,
  created_at timestamptz not null default now()
);

alter table public.error_logs enable row level security;

create policy "Admins can view error logs"
  on public.error_logs for select
  using (public.is_admin());

create index error_logs_created_at_idx on public.error_logs(created_at desc);
