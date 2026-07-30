-- ============================================================
-- Super-admin account (oversight of BOTH families).
-- Logs in ONLY via the hidden /admin page. household is NULL so
-- is_superadmin() sees everything.
--
-- 1. Change admin_code below (min 6 chars). Keep it private.
-- 2. Keep admin_email = NEXT_PUBLIC_ADMIN_EMAIL in the app
--    (default: admin@rahul-somya.app).
-- 3. Requires the superadmin migration (20260718000007) to have run.
-- ============================================================

do $$
declare
  uid         uuid := gen_random_uuid();
  admin_email text := 'admin@rahul-somya.app';   -- must match NEXT_PUBLIC_ADMIN_EMAIL
  admin_code  text := 'rahsom123';        -- <-- your private admin passcode
begin
  delete from auth.users where email = admin_email;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    admin_email, crypt(admin_code, gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', 'Wedding Admin', 'role', 'admin'),
    now(), now(),
    '', '', '', '', '', '', '', ''
  );

  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), uid, uid::text,
    jsonb_build_object('sub', uid::text, 'email', admin_email, 'email_verified', true),
    'email', now(), now(), now()
  );

  -- admin role, NO household → is_superadmin() true → sees both families
  update public.profiles
  set role = 'admin', full_name = 'Wedding Admin', household = null
  where id = uid;
end $$;
