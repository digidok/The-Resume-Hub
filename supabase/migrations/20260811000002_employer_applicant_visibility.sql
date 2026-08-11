-- Employers can view the profile of a candidate who applied to one of their jobs
create policy "Employers can view applicant profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.applications
      join public.jobs on jobs.id = applications.job_id
      where applications.candidate_id = profiles.id
      and jobs.employer_id = auth.uid()
    )
  );

-- Employers can view resumes submitted with an application to their jobs
create policy "Employers can view submitted application resumes"
  on public.resumes for select
  using (
    exists (
      select 1 from public.applications
      join public.jobs on jobs.id = applications.job_id
      where applications.resume_id = resumes.id
      and jobs.employer_id = auth.uid()
    )
  );
