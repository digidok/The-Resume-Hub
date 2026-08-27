create table public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  feature text not null,
  model text not null,
  input_tokens integer,
  output_tokens integer,
  estimated_cost_zar numeric(10,4),
  success boolean not null default true,
  error_message text,
  created_at timestamptz not null default now()
);

alter table public.ai_usage_events enable row level security;

create policy "Users can insert their own AI usage events"
  on public.ai_usage_events for insert
  with check (auth.uid() = user_id);

create policy "Admins can view all AI usage events"
  on public.ai_usage_events for select
  using (public.is_admin());

create index ai_usage_events_created_at_idx on public.ai_usage_events(created_at desc);
create index ai_usage_events_user_id_idx on public.ai_usage_events(user_id);
create index ai_usage_events_feature_idx on public.ai_usage_events(feature);
