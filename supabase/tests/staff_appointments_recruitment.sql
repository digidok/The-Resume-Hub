-- Access-rule tests for staff roles, appointments and the recruitment workspace.
-- Run against a scratch database (see supabase/tests/README.md). Prints PASS/FAIL lines and raises on any FAIL.
insert into auth.users values
 ('00000000-0000-0000-0000-0000000000c1','consultant@x.com',now()),
 ('00000000-0000-0000-0000-0000000000c2','recruiter@x.com',now()),
 ('00000000-0000-0000-0000-0000000000c3','payroll@x.com',now()),
 ('00000000-0000-0000-0000-0000000000c4','delivery@x.com',now()),
 ('00000000-0000-0000-0000-0000000000c5','client@x.com',now()),
 ('00000000-0000-0000-0000-0000000000c6','other@x.com',now()),
 ('00000000-0000-0000-0000-0000000000ad','admin@x.com',now());
insert into public.profiles(id, role) values
 ('00000000-0000-0000-0000-0000000000c1','candidate'),('00000000-0000-0000-0000-0000000000c2','candidate'),
 ('00000000-0000-0000-0000-0000000000c3','candidate'),('00000000-0000-0000-0000-0000000000c4','candidate'),
 ('00000000-0000-0000-0000-0000000000c5','candidate'),('00000000-0000-0000-0000-0000000000c6','candidate'),
 ('00000000-0000-0000-0000-0000000000ad','admin');
insert into public.staff_members values
 ('00000000-0000-0000-0000-0000000000c1','consultant'),('00000000-0000-0000-0000-0000000000c2','recruiter'),
 ('00000000-0000-0000-0000-0000000000c3','payroll'),('00000000-0000-0000-0000-0000000000c4','delivery');

insert into public.appointments(reference,type_id,starts_at,ends_at,name,email,manage_token)
select 'APT-1', id, '2030-01-07 07:00+00', '2030-01-07 07:30+00', 'Client', 'client@x.com', 'tok1' from public.appointment_types limit 1;
insert into public.appointments(reference,type_id,starts_at,ends_at,name,email,manage_token)
select 'APT-2', id, '2030-01-08 07:00+00', '2030-01-08 07:30+00', 'Other', 'other@x.com', 'tok2' from public.appointment_types limit 1;
insert into public.talent_pool(full_name,email,skills,location) values ('Thandi Test','t@x.com','{welding,safety}','Johannesburg');
insert into public.vacancies(reference,client_name,title) values ('V-1','Acme','Welder');
insert into public.placements(talent_id,client_name,role_title,start_date,pay_rate,bill_rate)
select id,'Acme','Welder','2030-01-01',50,70 from public.talent_pool;

do $$
declare
  res text := ''; n int; failed boolean := false;
  consultant uuid := '00000000-0000-0000-0000-0000000000c1';
  recruiter  uuid := '00000000-0000-0000-0000-0000000000c2';
  payroll    uuid := '00000000-0000-0000-0000-0000000000c3';
  delivery   uuid := '00000000-0000-0000-0000-0000000000c4';
  client     uuid := '00000000-0000-0000-0000-0000000000c5';
  adm        uuid := '00000000-0000-0000-0000-0000000000ad';
begin
  -- helper: run a count as a user
  create temp table results(name text, ok boolean);
  grant all on results to authenticated, anon;

  -- as_user(uid) via set_config + set role
  perform set_config('request.jwt.claims', json_build_object('sub', consultant)::text, true); set local role authenticated;
  insert into results select 'consultant sees appointments', (select count(*) from public.appointments) = 2;
  insert into results select 'consultant blocked from talent pool', (select count(*) from public.talent_pool) = 0;
  insert into results select 'consultant blocked from placements', (select count(*) from public.placements) = 0;
  insert into results select 'consultant has role', public.has_staff_role(array['consultant']) and not public.has_staff_role(array['payroll']);
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', recruiter)::text, true); set local role authenticated;
  insert into results select 'recruiter sees talent pool', (select count(*) from public.talent_pool) = 1;
  insert into results select 'recruiter sees vacancies', (select count(*) from public.vacancies) = 1;
  insert into results select 'recruiter sees appointments', (select count(*) from public.appointments) = 2;
  insert into results select 'recruiter sees placements', (select count(*) from public.placements) = 1;
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', payroll)::text, true); set local role authenticated;
  insert into results select 'payroll sees placements', (select count(*) from public.placements) = 1;
  insert into results select 'payroll blocked from talent pool', (select count(*) from public.talent_pool) = 0;
  insert into results select 'payroll blocked from appointments', (select count(*) from public.appointments) = 0;
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', delivery)::text, true); set local role authenticated;
  insert into results select 'delivery blocked from recruitment and appointments',
    (select count(*) from public.talent_pool) + (select count(*) from public.appointments) + (select count(*) from public.placements) = 0;
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', client)::text, true); set local role authenticated;
  insert into results select 'client sees only own appointment', (select count(*) from public.appointments) = 1
     and (select email from public.appointments) = 'client@x.com';
  insert into results select 'client blocked from talent pool', (select count(*) from public.talent_pool) = 0;
  insert into results select 'client cannot read staff roles', (select count(*) from public.staff_members) = 0;
  begin
    insert into public.staff_members values (client, 'recruiter');
    insert into results values ('client cannot make themselves staff', false);
  exception when others then insert into results values ('client cannot make themselves staff', true); end;
  begin
    update public.appointments set status = 'cancelled' where email = 'other@x.com';
    get diagnostics n = row_count;
    insert into results values ('client cannot edit appointments', n = 0);
  end;
  reset role;

  set local role anon;
  insert into results select 'anon sees no appointments', (select count(*) from public.appointments) = 0;
  begin perform public.has_staff_role(array['recruiter']); insert into results values ('anon cannot call has_staff_role', false);
  exception when others then insert into results values ('anon cannot call has_staff_role', true); end;
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', adm)::text, true); set local role authenticated;
  insert into results select 'admin sees everything',
    (select count(*) from public.talent_pool) = 1 and (select count(*) from public.appointments) = 2 and (select count(*) from public.staff_members) = 4;
  reset role;

  -- staff can write the audit log, but nobody can edit or delete it
  perform set_config('request.jwt.claims', json_build_object('sub', recruiter)::text, true); set local role authenticated;
  insert into public.audit_log(actor_id, action, entity) values (recruiter, 'test', 'x');
  update public.audit_log set action = 'tampered'; get diagnostics n = row_count;
  insert into results values ('staff audit log is append-only (update)', n = 0);
  delete from public.audit_log; get diagnostics n = row_count;
  insert into results values ('staff audit log is append-only (delete)', n = 0);
  reset role;

  -- double booking is impossible
  begin
    insert into public.appointments(reference,type_id,starts_at,ends_at,name,email,manage_token)
    select 'APT-3', id, '2030-01-07 07:15+00', '2030-01-07 07:45+00', 'Late', 'late@x.com', 'tok3' from public.appointment_types limit 1;
    insert into results values ('overlapping booking is rejected', false);
  exception when exclusion_violation then insert into results values ('overlapping booking is rejected', true); end;
  -- back-to-back is allowed
  insert into public.appointments(reference,type_id,starts_at,ends_at,name,email,manage_token)
    select 'APT-4', id, '2030-01-07 07:30+00', '2030-01-07 08:00+00', 'Next', 'next@x.com', 'tok4' from public.appointment_types limit 1;
  insert into results values ('back-to-back booking is allowed', true);
  -- a cancelled booking frees the slot
  update public.appointments set status = 'cancelled' where reference = 'APT-1';
  insert into public.appointments(reference,type_id,starts_at,ends_at,name,email,manage_token)
    select 'APT-5', id, '2030-01-07 07:00+00', '2030-01-07 07:30+00', 'Reuse', 'reuse@x.com', 'tok5' from public.appointment_types limit 1;
  insert into results values ('cancelled slot can be rebooked', true);

  -- talent pool search column + unique email
  insert into results select 'search blob is built', search_blob like '%thandi%johannesburg%welding%' from public.talent_pool where email = 't@x.com';
  begin insert into public.talent_pool(full_name, email) values ('Dup', 't@x.com'); insert into results values ('duplicate email rejected', false);
  exception when unique_violation then insert into results values ('duplicate email rejected', true); end;

  select string_agg(format('%s %s', case when ok then 'PASS' else 'FAIL' end, name), E'\n') into res from results;
  select bool_or(not ok) into failed from results;
  raise notice E'\n%', res;
  if failed then raise exception 'one or more access tests failed'; end if;
end $$;
