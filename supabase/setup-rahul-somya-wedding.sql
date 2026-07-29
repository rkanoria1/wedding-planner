-- ============================================================
-- RAHUL & SOMYA — real wedding setup
-- Paste into your Supabase SQL Editor and run.
-- Sets the couple + date and creates the five functions as event
-- workspaces. Replaces any existing events (and anything tied to them).
-- Run supabase/hosted-setup-bookings.sql first if the bookings table
-- doesn't exist yet.
--
-- Schedule (event_date is a calendar day; time-of-day is noted in the
-- description and reflected by the order):
--   Myrah    — 28 Jan, morning
--   Sangeet  — 28 Jan, night
--   Haldi    — 29 Jan, morning
--   Varmala  — 29 Jan, evening
--   Phera    — 29 Jan, night (main ceremony)
-- ============================================================

-- couple + date
update public.app_settings
set couple_names  = 'Rahul & Somya',
    wedding_date  = '2027-01-29',
    planning_start = '2026-07-01',
    currency      = '₹'
where id = 1;

-- start the events clean, then add the five functions in order
delete from public.events;

insert into public.events (id, name, description, event_date, theme, icon, sort_order) values
  ('f0000000-0000-0000-0000-000000000001', 'Myrah',   'Mayra / bhaat — maternal family''s blessings and gifts. 28 Jan, morning.', '2027-01-28', 'sapphire', 'Gift',     1),
  ('f0000000-0000-0000-0000-000000000002', 'Sangeet', 'A night of music and dance for both families. 28 Jan, night.',             '2027-01-28', 'lavender', 'Music',    2),
  ('f0000000-0000-0000-0000-000000000003', 'Haldi',   'Turmeric ceremony with close family. 29 Jan, morning.',                    '2027-01-29', 'marigold', 'Sun',      3),
  ('f0000000-0000-0000-0000-000000000004', 'Varmala', 'Jaimala — the garland exchange as the couple meets. 29 Jan, evening.',     '2027-01-29', 'rose',     'Flower2',  4),
  ('f0000000-0000-0000-0000-000000000005', 'Phera',   'The saat phere — the main wedding ceremony. 29 Jan, night.',               '2027-01-29', 'emerald',  'Sparkles', 5);
