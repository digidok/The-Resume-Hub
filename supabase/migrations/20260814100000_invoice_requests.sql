-- Employer-requested invoices: an alternative to instant PayFast card
-- checkout for employers who need to pay via EFT against a formal invoice
-- (common for South African B2B procurement). Employer requests one for a
-- product they choose; admin issues an invoice number and, once paid,
-- marks it paid — which grants the same profile benefits a successful
-- PayFast subscription payment would, and is logged in the same payments
-- ledger for a consistent history/audit trail.
create table public.invoice_requests (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.profiles(id) on delete cascade,
  package_id text not null,
  amount_zar numeric(10,2) not null,
  company_name text not null,
  contact_person text not null,
  billing_email text not null,
  vat_number text,
  billing_address text,
  notes text,
  status text not null default 'requested' check (status in ('requested', 'invoiced', 'paid', 'cancelled')),
  invoice_number text,
  issued_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.invoice_requests enable row level security;

create policy "Employers can view their own invoice requests"
  on public.invoice_requests for select
  using (auth.uid() = employer_id);

create policy "Employers can request an invoice"
  on public.invoice_requests for insert
  with check (auth.uid() = employer_id);

create policy "Admins can view all invoice requests"
  on public.invoice_requests for select
  using (public.is_admin());

create policy "Admins can update all invoice requests"
  on public.invoice_requests for update
  using (public.is_admin());

create index invoice_requests_employer_id_idx on public.invoice_requests(employer_id);

-- Lets an admin log a "marked paid" invoice in the same payments ledger a
-- card checkout uses, so it shows up in both the employer's own Payment
-- history and the admin Payments page consistently.
create policy "Admins can insert payments"
  on public.payments for insert
  with check (public.is_admin());

alter table public.payments
  drop constraint payments_payment_type_check,
  add constraint payments_payment_type_check
    check (payment_type in ('once_off', 'subscription_initial', 'subscription_renewal', 'invoice'));
