-- Access-rule tests for business targets and results. Run after staff_appointments_recruitment.sql
-- (it creates the users). Prints PASS/FAIL lines and raises on any FAIL.
do $$
declare
  res text := ''; failed boolean := false; tid uuid;
  consultant uuid := '00000000-0000-0000-0000-0000000000c1';
  adm        uuid := '00000000-0000-0000-0000-0000000000ad';
begin
  create temp table results(name text, ok boolean);
  grant all on results to authenticated, anon;

  perform set_config('request.jwt.claims', json_build_object('sub', adm)::text, true); set local role authenticated;
  insert into public.business_targets(area, measure, target, owner_name) values ('Sales', 'Quotes sent', 10, 'Ayanda') returning id into tid;
  insert into public.business_target_results(target_id, period_end, actual, target_at_time) values (tid, '2030-01-04', 6, 10);
  insert into results select 'admin can record a result', (select count(*) from public.business_target_results) = 1;
  begin
    insert into public.business_target_results(target_id, period_end, actual, target_at_time) values (tid, '2030-01-04', 7, 10);
    insert into results values ('one result per target per week', false);
  exception when unique_violation then insert into results values ('one result per target per week', true); end;
  begin
    insert into public.business_targets(area, measure, target, owner_name) values ('Sales', 'Bad', -1, 'X');
    insert into results values ('negative target rejected', false);
  exception when check_violation then insert into results values ('negative target rejected', true); end;
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', consultant)::text, true); set local role authenticated;
  insert into results select 'staff cannot see targets', (select count(*) from public.business_targets) = 0;
  insert into results select 'staff cannot see results', (select count(*) from public.business_target_results) = 0;
  begin
    insert into public.business_targets(area, measure, target, owner_name) values ('Sales', 'Sneaky', 1, 'X');
    insert into results values ('staff cannot add a target', false);
  exception when insufficient_privilege then insert into results values ('staff cannot add a target', true); end;
  reset role;

  begin
    set local role anon;
    perform count(*) from public.business_targets;
    insert into results select 'anonymous sees no targets', true;
  exception when insufficient_privilege then insert into results values ('anonymous sees no targets', true); end;
  reset role;

  delete from public.business_targets where id = tid;
  insert into results select 'deleting a target removes its results', (select count(*) from public.business_target_results) = 0;

  select string_agg(format('%s %s', case when ok then 'PASS' else 'FAIL' end, name), E'\n') into res from results;
  select bool_or(not ok) into failed from results;
  raise notice E'\n%', res;
  if failed then raise exception 'one or more access tests failed'; end if;
end $$;
