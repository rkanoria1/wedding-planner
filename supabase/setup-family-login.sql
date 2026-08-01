-- ============================================================
-- RAHUL & SOMYA — two shared family logins
-- Rahul's family and Somya's family each get their OWN access code.
-- Each code signs into that family's private workspace (their own
-- tasks, guests, budget, etc.); the wedding date and the five
-- functions are shared between both.
--
-- 1. Change the two codes below (min 6 chars each).
-- 2. Paste into the Supabase SQL Editor and run. Safe to re-run to
--    reset the codes.
-- Requires the households migration (20260717000005) to have run first.
-- ============================================================

do $$
declare
  rec record;
begin
  for rec in
    select * from (values
      ('rahul-family@rahul-somya.app', 'rahul@98311', 'rahul', 'Rahul''s Family'),
      ('somya-family@rahul-somya.app', 'somyasaraf', 'somya', 'Somya''s Family')
    ) as t(email, code, household, display_name)
  loop
    -- start clean so this script can be re-run to reset a code
    delete from auth.users where email = rec.email;

    declare uid uuid := gen_random_uuid();
    begin
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change, email_change_token_new,
        email_change_token_current, phone_change, phone_change_token, reauthentication_token
      ) values (
        '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
        rec.email, crypt(rec.code, gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', rec.display_name, 'role', 'admin'),
        now(), now(),
        '', '', '', '', '', '', '', ''
      );

      insert into auth.identities (
        id, user_id, provider_id, identity_data, provider,
        last_sign_in_at, created_at, updated_at
      ) values (
        gen_random_uuid(), uid, uid::text,
        jsonb_build_object('sub', uid::text, 'email', rec.email, 'email_verified', true),
        'email', now(), now(), now()
      );

      -- the on-signup trigger creates the profile; set family + admin
      update public.profiles
      set role = 'admin', full_name = rec.display_name, household = rec.household
      where id = uid;
    end;
  end loop;
end $$;
