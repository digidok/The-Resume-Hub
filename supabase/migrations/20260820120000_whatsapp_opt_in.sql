-- Candidates opt in before Resume Hub sends them status updates over WhatsApp
-- (in addition to already having a phone_number on file). Defaults to false —
-- it's flipped on automatically the first time someone successfully applies
-- via the WhatsApp apply flow, and can be turned off anytime in Profile settings.
alter table public.profiles add column whatsapp_opt_in boolean not null default false;
