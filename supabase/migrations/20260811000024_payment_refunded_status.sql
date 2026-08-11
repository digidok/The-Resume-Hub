-- Allow admins to mark a payment as refunded (manual reconciliation for
-- refunds issued directly through the Payfast dashboard).
alter table public.payments drop constraint payments_status_check;
alter table public.payments
  add constraint payments_status_check check (status in ('pending', 'complete', 'failed', 'refunded'));
