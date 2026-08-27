alter table public.resumes
  add column parent_resume_id uuid references public.resumes(id) on delete set null;

create index if not exists resumes_parent_resume_id_idx on public.resumes(parent_resume_id);

comment on column public.resumes.parent_resume_id is
  'Set when this resume is a tailored copy created from another resume (e.g. via "Tailor CV to this job" or the language translator) — null means this is an original, not a derived version.';
