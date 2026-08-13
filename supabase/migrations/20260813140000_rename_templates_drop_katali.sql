-- Drop the "Katali" brand name from resume templates in favour of plain, common names.
update public.resumes set template = 'professional' where template = 'katali';
update public.resumes set template = 'executive-portfolio' where template = 'katali-pro-portfolio';
update public.resumes set template = 'executive-portfolio-no-photo' where template = 'katali-pro-portfolio-no-photo';
alter table public.resumes alter column template set default 'professional';
