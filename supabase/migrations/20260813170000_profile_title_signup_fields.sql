-- Add an optional salutation/title field, and pick up phone_number and
-- title from signup metadata (previously only role + full_name were
-- copied into the new profile row; phone_number was only ever set later
-- via WhatsApp intake or an admin edit).
alter table public.profiles add column if not exists title text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, phone_number, title)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'candidate'),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone_number',
    new.raw_user_meta_data->>'title'
  );
  return new;
end;
$$;
