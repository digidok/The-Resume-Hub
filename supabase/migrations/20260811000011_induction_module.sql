-- One induction/onboarding module per employer, taken by a candidate after
-- they accept an offer (application status = 'hired').
create table public.induction_modules (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null unique references public.profiles(id) on delete cascade,
  title text not null default 'Company Induction',
  content text not null default '',
  pass_threshold integer not null default 80 check (pass_threshold between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.induction_modules enable row level security;

create policy "Employers manage their own induction module"
  on public.induction_modules for all
  using (auth.uid() = employer_id)
  with check (auth.uid() = employer_id);

create table public.induction_questions (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.induction_modules(id) on delete cascade,
  question text not null,
  options jsonb not null default '[]'::jsonb,
  correct_option_index integer not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.induction_questions enable row level security;

create policy "Employers manage their own induction questions"
  on public.induction_questions for all
  using (
    exists (
      select 1 from public.induction_modules
      where induction_modules.id = induction_questions.module_id
      and induction_modules.employer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.induction_modules
      where induction_modules.id = induction_questions.module_id
      and induction_modules.employer_id = auth.uid()
    )
  );

-- Deliberately no candidate-facing RLS policy here: correct_option_index
-- must never reach the client directly. Candidates only ever see questions
-- (without answers) via get_induction_module(), and get graded server-side
-- via submit_induction_attempt().

create table public.induction_attempts (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.induction_modules(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  score integer not null,
  passed boolean not null,
  answers jsonb not null default '[]'::jsonb,
  completed_at timestamptz not null default now()
);

alter table public.induction_attempts enable row level security;

create policy "Candidates can view their own induction attempts"
  on public.induction_attempts for select
  using (auth.uid() = candidate_id);

create policy "Employers can view induction attempts for their module"
  on public.induction_attempts for select
  using (
    exists (
      select 1 from public.induction_modules
      where induction_modules.id = induction_attempts.module_id
      and induction_modules.employer_id = auth.uid()
    )
  );

create index induction_attempts_application_id_idx on public.induction_attempts(application_id);

-- Returns the module + questions (without correct answers) for a hired
-- candidate's own application, or null if not authorized / no module exists.
create or replace function public.get_induction_module(p_application_id uuid)
returns jsonb
language plpgsql
security definer set search_path = public
stable
as $$
declare
  v_employer_id uuid;
  v_module record;
  v_questions jsonb;
begin
  select jobs.employer_id into v_employer_id
  from public.applications
  join public.jobs on jobs.id = applications.job_id
  where applications.id = p_application_id
  and applications.candidate_id = auth.uid()
  and applications.status = 'hired';

  if v_employer_id is null then
    return null;
  end if;

  select * into v_module from public.induction_modules where employer_id = v_employer_id;
  if v_module is null then
    return null;
  end if;

  select coalesce(
    jsonb_agg(jsonb_build_object('id', id, 'question', question, 'options', options) order by position),
    '[]'::jsonb
  )
  into v_questions
  from public.induction_questions
  where module_id = v_module.id;

  return jsonb_build_object(
    'module_id', v_module.id,
    'title', v_module.title,
    'content', v_module.content,
    'pass_threshold', v_module.pass_threshold,
    'questions', v_questions
  );
end;
$$;

revoke all on function public.get_induction_module(uuid) from public;
grant execute on function public.get_induction_module(uuid) to authenticated;

-- Grades the candidate's submitted answers server-side (so correct answers
-- never need to reach the client) and records the attempt.
-- p_answers shape: {"<question_id>": <selected_option_index>, ...}
create or replace function public.submit_induction_attempt(p_application_id uuid, p_answers jsonb)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_employer_id uuid;
  v_module record;
  v_question record;
  v_answer_index integer;
  v_correct_count integer := 0;
  v_total integer := 0;
  v_score integer;
  v_passed boolean;
begin
  select jobs.employer_id into v_employer_id
  from public.applications
  join public.jobs on jobs.id = applications.job_id
  where applications.id = p_application_id
  and applications.candidate_id = auth.uid()
  and applications.status = 'hired';

  if v_employer_id is null then
    raise exception 'not authorized for this application';
  end if;

  select * into v_module from public.induction_modules where employer_id = v_employer_id;
  if v_module is null then
    raise exception 'no induction module found';
  end if;

  for v_question in
    select id, correct_option_index from public.induction_questions where module_id = v_module.id
  loop
    v_total := v_total + 1;
    v_answer_index := (p_answers ->> v_question.id::text)::integer;
    if v_answer_index = v_question.correct_option_index then
      v_correct_count := v_correct_count + 1;
    end if;
  end loop;

  if v_total = 0 then
    raise exception 'induction module has no questions yet';
  end if;

  v_score := round((v_correct_count::numeric / v_total) * 100);
  v_passed := v_score >= v_module.pass_threshold;

  insert into public.induction_attempts (module_id, application_id, candidate_id, score, passed, answers)
  values (v_module.id, p_application_id, auth.uid(), v_score, v_passed, p_answers);

  return jsonb_build_object('score', v_score, 'passed', v_passed, 'correct', v_correct_count, 'total', v_total);
end;
$$;

revoke all on function public.submit_induction_attempt(uuid, jsonb) from public;
grant execute on function public.submit_induction_attempt(uuid, jsonb) to authenticated;
