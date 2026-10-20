-- Appointment booking: consultations, screening calls and interviews.
-- Times are stored in UTC; availability is defined in South African time (SAST, UTC+2, no DST).
-- Slots are computed server-side with the service role, so the public never reads these tables.

create table public.appointment_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  duration_minutes int not null check (duration_minutes between 10 and 240),
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.appointment_types enable row level security;
create policy "Staff manage appointment types" on public.appointment_types
  for all to authenticated using (public.has_staff_role(array['consultant', 'recruiter']))
  with check (public.has_staff_role(array['consultant', 'recruiter']));

-- Weekly opening hours. weekday: 0 = Sunday ... 6 = Saturday (SAST).
create table public.availability_windows (
  id uuid primary key default gen_random_uuid(),
  weekday int not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  check (end_time > start_time)
);
alter table public.availability_windows enable row level security;
create policy "Staff manage availability" on public.availability_windows
  for all to authenticated using (public.has_staff_role(array['consultant', 'recruiter']))
  with check (public.has_staff_role(array['consultant', 'recruiter']));

-- Days or periods when nobody is available (holidays, leave).
create table public.availability_blocks (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  check (ends_at > starts_at)
);
alter table public.availability_blocks enable row level security;
create policy "Staff manage availability blocks" on public.availability_blocks
  for all to authenticated using (public.has_staff_role(array['consultant', 'recruiter']))
  with check (public.has_staff_role(array['consultant', 'recruiter']));

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  type_id uuid not null references public.appointment_types(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'booked'
    check (status in ('booked', 'completed', 'cancelled', 'no_show')),
  name text not null,
  email text not null,
  phone text,
  topic text,
  notes text,
  manage_token text not null unique,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  -- One team calendar: two booked appointments can never overlap. This is what
  -- makes double-booking impossible even if two people click the same slot at once.
  constraint appointments_no_overlap exclude using gist (tstzrange(starts_at, ends_at, '[)') with &&)
    where (status = 'booked')
);
alter table public.appointments enable row level security;
create index appointments_start_idx on public.appointments(starts_at);
create index appointments_email_idx on public.appointments(lower(email));

create policy "Staff manage appointments" on public.appointments
  for all to authenticated using (public.has_staff_role(array['consultant', 'recruiter']))
  with check (public.has_staff_role(array['consultant', 'recruiter']));
create policy "People view own appointments" on public.appointments
  for select to authenticated using (lower(email) = public.current_verified_email());

-- Defaults: Monday to Friday 09:00 to 16:00 SAST, and three appointment types.
insert into public.availability_windows (weekday, start_time, end_time)
select d, time '09:00', time '16:00' from generate_series(1, 5) d;

insert into public.appointment_types (slug, name, description, duration_minutes, sort_order) values
  ('business-consultation', 'Business consultation', 'Talk through the business service you need and get next steps.', 30, 1),
  ('career-consultation', 'Career guidance consultation', 'One-on-one session with a career consultant.', 45, 2),
  ('screening-call', 'Screening or recruitment call', 'Discuss background screening or a recruitment or staffing need.', 30, 3);
