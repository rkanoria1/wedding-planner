-- ============================================================
-- RAHUL & SOMYA — shared family login
-- Creates ONE shared account. Everyone signs in with the same
-- access code (the code below is that account's password).
--
-- 1. Change fam_code to the code you want to share (min 6 chars).
-- 2. Keep fam_email identical to NEXT_PUBLIC_FAMILY_EMAIL in the app
--    (default: family@rahul-somya.app).
-- 3. Paste into the Supabase SQL Editor and run. Safe to re-run to
--    change the code.
-- ============================================================

do $$
declare
  uid       uuid := gen_random_uuid();
  fam_email text := 'family@rahul-somya.app';   -- must match NEXT_PUBLIC_FAMILY_EMAIL
  fam_code  text := 'somya0610';         -- <-- your shared access code
begin
  -- start clean so this script can be re-run to reset the code
  delete from auth.users where email = fam_email;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    fam_email, crypt(fam_code, gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', 'Rahul & Somya Family', 'role', 'admin'),
    now(), now(),
    '', '', '', '', '', '', '', ''   -- token columns must be '' (not NULL) for GoTrue
  );

  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), uid, uid::text,
    jsonb_build_object('sub', uid::text, 'email', fam_email, 'email_verified', true),
    'email', now(), now(), now()
  );

  -- the on-signup trigger creates the profile; make sure it's an admin
  update public.profiles
  set role = 'admin', full_name = 'Rahul & Somya Family'
  where id = uid;
end $$;
