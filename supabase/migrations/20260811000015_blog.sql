create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles (id) on delete set null,
  title text not null,
  slug text unique not null,
  excerpt text not null default '',
  content text not null default '',
  category text not null default 'General',
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table blog_posts enable row level security;

create policy "Published posts are publicly readable"
  on blog_posts for select
  using (published);

create policy "Admins can view all posts"
  on blog_posts for select
  using (public.is_admin());

create policy "Admins can manage posts"
  on blog_posts for all
  using (public.is_admin())
  with check (public.is_admin());

insert into blog_posts (title, slug, excerpt, content, category, published, published_at)
values
(
  'Your rights under the LRA: what every employee should know',
  'employee-rights-under-the-lra',
  'A plain-language overview of the protections South Africa''s Labour Relations Act gives employees — from unfair dismissal to the right to join a union.',
  E'The Labour Relations Act (LRA) is the main law governing the relationship between employers and employees in South Africa. This is a general overview, not legal advice — if you''re facing a specific dispute, speak to a labour lawyer, your union, or the CCMA.\n\n**Protection against unfair dismissal**\nYour employer needs both a fair reason (related to your conduct, capacity, or the operational needs of the business) and a fair process before dismissing you. If you believe you were dismissed unfairly, you can refer a dispute to the CCMA — usually within 30 days of the dismissal.\n\n**The right to join a trade union**\nEvery employee has the right to join a trade union of their choice and to take part in its activities, without being victimised for doing so.\n\n**Protection against unfair labour practices**\nThis covers things like unfair suspension, unfair demotion, unfair disciplinary action short of dismissal, and unfair failure to reinstate someone after a fixed-term contract.\n\n**Retrenchment (operational requirements dismissals)**\nIf your employer wants to retrench you for operational reasons, they must follow a consultation process — including considering alternatives to retrenchment and, in larger dismissals, giving notice to the CCMA.\n\n**Where to get help**\nThe CCMA (Commission for Conciliation, Mediation and Arbitration) handles most labour disputes for free. Many employees also have access to their union''s legal support, or can consult a labour attorney.',
  'Employee rights',
  true,
  now()
),
(
  'What employers owe employees: a fair-process checklist',
  'employer-obligations-fair-process-checklist',
  'Disciplinary hearings, retrenchments, and everyday management decisions all need a fair process under the LRA. Here''s what "fair" typically means in practice.',
  E'South African labour law expects employers to follow a fair process, not just have a fair reason, before taking action against an employee. This is general information, not legal advice — get advice specific to your situation from a labour lawyer or your employer body.\n\n**Before a disciplinary hearing**\n- Give the employee written notice of the allegations against them, with enough time to prepare.\n- Let them have a representative (usually a colleague or union representative) present.\n- Give them a chance to state their case and respond to the evidence.\n\n**Before a dismissal**\n- Make sure the reason for dismissal falls into one of the recognised categories: conduct, capacity, or operational requirements.\n- Keep a clear record of warnings, performance reviews, or incidents that led to the decision.\n\n**Before a retrenchment**\n- Consult meaningfully with affected employees (or their union) about alternatives, selection criteria, and severance pay — this isn''t a formality, it has to be a genuine engagement.\n- Use fair, objective selection criteria (like LIFO — last in, first out — or a scorecard) rather than arbitrary choices.\n\n**Record-keeping**\nKeep documentation of every step. If a dispute ends up at the CCMA, the employer carries the burden of showing the dismissal or action was both substantively and procedurally fair.',
  'Employer obligations',
  true,
  now()
),
(
  'CCMA disputes 101: what candidates and employers should expect',
  'ccma-disputes-101',
  'A quick guide to what happens when a labour dispute is referred to the CCMA, from conciliation to arbitration.',
  E'The CCMA is where most individual labour disputes in South Africa are resolved. This is general information, not legal advice.\n\n**Step 1 — Referral**\nEither party refers the dispute to the CCMA, usually within 30 days of the incident (dismissal disputes) or a longer period for other types of disputes.\n\n**Step 2 — Conciliation**\nA CCMA commissioner tries to help both sides reach a settlement. Most disputes are resolved at this stage.\n\n**Step 3 — Arbitration**\nIf conciliation fails, the dispute may proceed to arbitration, where a commissioner hears evidence from both sides and makes a binding ruling.\n\n**What to bring**\nEmployment contracts, warning letters, payslips, correspondence, and any other documents relevant to the dispute. Witnesses can also testify.\n\n**Timelines matter**\nMissing the referral deadline can mean losing the right to have your case heard, so act promptly if you believe you have a dispute.',
  'Employee rights',
  true,
  now()
)
on conflict (slug) do nothing;
