-- ============================================================
-- Shared GUEST access code (one code for all wedding guests)
-- 1. Change the code below (min 6 chars).
-- 2. Paste into Supabase SQL Editor and run. Safe to re-run.
-- Requires guest portal migration (20260730000009_guest_portal.sql).
-- ============================================================

do $$
declare
  guest_email text := 'guests@rahul-somya.app';
  guest_code text := 'welcome2027'; -- ← change this
  uid uuid;
begin
  delete from auth.users where email = guest_email;
  uid := gen_random_uuid();

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    guest_email, crypt(guest_code, gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', 'Wedding Guests', 'role', 'guest'),
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

  update public.profiles
  set role = 'guest', full_name = 'Wedding Guests', household = null
  where id = uid;
end $$;
