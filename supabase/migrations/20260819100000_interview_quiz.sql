create table public.quiz_responses (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  user_id uuid references public.profiles(id) on delete set null,
  name text,
  phone text,
  email text,
  urgency text,
  industry text,
  pain_point text,
  experience_level text,
  format_pref text,
  timeline text,
  plan_variant text,
  completed boolean not null default false,
  payment_id uuid references public.payments(id) on delete set null,
  utm_source text,
  nurture_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.quiz_responses enable row level security;

-- All writes happen server-side through the service-role client (quiz
-- submission, payment linking) — no anonymous/browser insert or update
-- policy, matching the WhatsApp lead-capture route's pattern. Regular
-- users can only ever read their own row once signed in.
create policy "Users can view their own quiz responses"
  on public.quiz_responses for select
  using (auth.uid() = user_id);

create policy "Admins can view all quiz responses"
  on public.quiz_responses for select
  using (public.is_admin());

alter table public.quiz_responses add constraint quiz_responses_session_id_key unique (session_id);
create index quiz_responses_session_id_idx on public.quiz_responses(session_id);
create index quiz_responses_phone_idx on public.quiz_responses(phone);
create index quiz_responses_user_id_idx on public.quiz_responses(user_id);

alter table public.payments
  add column if not exists quiz_response_id uuid references public.quiz_responses(id) on delete set null;
