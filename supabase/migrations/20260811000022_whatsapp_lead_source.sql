-- Track where a candidate account originated (e.g. self-signup vs. WhatsApp
-- automation) and store their WhatsApp number so repeat inbound messages can
-- be matched back to the same account instead of creating duplicates.
alter table public.profiles
  add column if not exists phone_number text,
  add column if not exists source text not null default 'app';

create unique index if not exists profiles_phone_number_key
  on public.profiles (phone_number)
  where phone_number is not null;
