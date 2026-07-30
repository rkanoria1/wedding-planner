-- ============================================================
-- STEP 2 of 2 — Shared GUEST access code
-- Prerequisites:
--   1. Run supabase/add-guest-role.sql FIRST (alone) and confirm success
--   2. Run supabase/migrations/20260730000009_guest_portal.sql (if not yet)
-- Then run THIS file.
-- 1. Change the code below (min 6 chars).
-- 2. Paste into Supabase SQL Editor and run. Safe to re-run.
-- ============================================================

-- Fail fast with a clear message if step 1 was skipped
do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'user_role' and e.enumlabel = 'guest'
  ) then
    raise exception 'Enum value user_role.guest is missing. Run supabase/add-guest-role.sql first (by itself), then re-run this script.';
  end if;
end $$;

do $$
declare
  guest_email text := 'guests@rahul-somya.app';
  guest_code text := 'welcome2027'; -- ← change this
  uid uuid;
begin
  delete from auth.users where email = guest_email;
  uid := gen_random_uuid();

  -- Do NOT put role=guest in metadata: handle_new_user() casts it during INSERT.
  -- Create as family, then flip the profile to guest after the trigger runs.
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    guest_email, crypt(guest_code, gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', 'Wedding Guests', 'role', 'family'),
    now(), now(),
    '', '', '', '', '', '', '', ''
  );

  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), uid, uid::text,
    jsonb_build_object('sub', uid::text, 'email', guest_email, 'email_verified', true),
    'email', now(), now(), now()
  );

  -- Bypass profiles_guard_role (checks auth.uid() / is_admin) for this setup script
  alter table public.profiles disable trigger profiles_guard_role;
  update public.profiles
  set role = 'guest', full_name = 'Wedding Guests', household = null
  where id = uid;
  alter table public.profiles enable trigger profiles_guard_role;
end $$;
