-- ============================================================
-- STEP 1 of 2 — run this ALONE first, then run setup-guest-login.sql
-- Adds the "guest" value to user_role. Must commit before use
-- (Postgres cannot use a new enum value in the same transaction).
-- ============================================================

alter type public.user_role add value if not exists 'guest';
