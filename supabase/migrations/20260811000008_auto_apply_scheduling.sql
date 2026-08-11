-- Persistent per-candidate auto-apply settings (powers the scheduled/background run)
create table public.auto_apply_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  resume_id uuid not null references public.resumes(id) on delete cascade,
  keywords text not null,
  location text,
  enabled boolean not null default true,
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.auto_apply_settings enable row level security;

create policy "Auto-apply settings are manageable by owner"
  on public.auto_apply_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- In-app notification feed
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null default 'info',
  title text not null,
  body text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "Notifications are viewable by owner"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Notifications are updatable by owner"
  on public.notifications for update
  using (auth.uid() = user_id);

create index notifications_user_id_idx on public.notifications(user_id);

-- Server-only secret store for the scheduled auto-apply cron job. No RLS
-- policies are granted, so this table is only ever readable via the
-- SECURITY DEFINER function below (which bypasses RLS) — never directly by
-- an anon/authenticated client, even though those roles can call the function.
create table public.cron_secrets (
  key text primary key,
  value text not null
);

alter table public.cron_secrets enable row level security;

-- Applies every enabled auto-apply candidate to newly-matching open jobs they
-- haven't already applied to, logs an in-app notification when it applies to
-- anything, and returns per-user results (including email, for the calling
-- route to send a notification email) so it never needs its own database
-- credentials beyond what the RPC call already grants it.
create or replace function public.run_scheduled_auto_apply(p_secret text)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_expected text;
  v_setting record;
  v_job record;
  v_email text;
  v_applied_count integer;
  v_results jsonb := '[]'::jsonb;
begin
  select value into v_expected from public.cron_secrets where key = 'auto_apply_cron_secret';
  if v_expected is null or p_secret is null or p_secret <> v_expected then
    raise exception 'unauthorized';
  end if;

  for v_setting in
    select * from public.auto_apply_settings where enabled = true
  loop
    v_applied_count := 0;

    for v_job in
      select j.id
      from public.jobs j
      where j.status = 'open'
        and not exists (
          select 1 from public.applications a
          where a.job_id = j.id and a.candidate_id = v_setting.user_id
        )
        and (
          v_setting.location is null or v_setting.location = '' or
          j.location ilike '%' || v_setting.location || '%'
        )
        and exists (
          select 1
          from unnest(string_to_array(v_setting.keywords, ',')) as kw
          where trim(kw) <> '' and (j.title || ' ' || j.description) ilike '%' || trim(kw) || '%'
        )
    loop
      insert into public.applications (job_id, candidate_id, resume_id, cover_note)
      values (
        v_job.id, v_setting.user_id, v_setting.resume_id,
        'Submitted automatically by Resume Hub Auto-Apply based on your saved keywords.'
      )
      on conflict (job_id, candidate_id) do nothing;
      v_applied_count := v_applied_count + 1;
    end loop;

    update public.auto_apply_settings
    set last_run_at = now()
    where user_id = v_setting.user_id;

    if v_applied_count > 0 then
      insert into public.notifications (user_id, type, title, body)
      values (
        v_setting.user_id,
        'auto_apply',
        'Auto-apply found new matches',
        'Resume Hub auto-applied to ' || v_applied_count || ' new job' ||
          case when v_applied_count = 1 then '' else 's' end || ' for you.'
      );

      select u.email into v_email from auth.users u where u.id = v_setting.user_id;
      v_results := v_results || jsonb_build_object(
        'user_id', v_setting.user_id, 'email', v_email, 'applied', v_applied_count
      );
    end if;
  end loop;

  return jsonb_build_object('ran_at', now(), 'results', v_results);
end;
$$;

revoke all on function public.run_scheduled_auto_apply(text) from public;
grant execute on function public.run_scheduled_auto_apply(text) to anon, authenticated;
