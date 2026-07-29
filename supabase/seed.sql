-- ============================================================
-- RAHUL'S WEDDING PLANNER — demo seed data
-- Safe to run once on a fresh database (local `supabase db reset`
-- runs it automatically; on hosted Supabase paste into SQL editor).
-- Demo logins all use password: password123
--   rahul@wedding.app  (Admin)
--   amma@wedding.app   (Family)  arjun@wedding.app (Family)  priya@wedding.app (Family)
--   zaid@wedding.app   (Volunteer)  sara@wedding.app (Volunteer)
-- ============================================================

-- ---------- demo users ----------
do $$
declare
  u record;
begin
  for u in
    select * from (values
      ('a0000000-0000-0000-0000-000000000001'::uuid, 'rahul@wedding.app', 'Rahul Kanoria', 'admin',     '+919810000001'),
      ('a0000000-0000-0000-0000-000000000002'::uuid, 'amma@wedding.app',  'Meena Kanoria', 'family',    '+919810000002'),
      ('a0000000-0000-0000-0000-000000000003'::uuid, 'arjun@wedding.app', 'Arjun Kanoria', 'family',    '+919810000003'),
      ('a0000000-0000-0000-0000-000000000004'::uuid, 'priya@wedding.app', 'Priya Sharma',  'family',    '+919810000004'),
      ('a0000000-0000-0000-0000-000000000005'::uuid, 'zaid@wedding.app',  'Zaid Khan',     'volunteer', '+919810000005'),
      ('a0000000-0000-0000-0000-000000000006'::uuid, 'sara@wedding.app',  'Sara Ali',      'volunteer', '+919810000006')
    ) as t(id, email, full_name, role, phone)
  loop
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                            raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values ('00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
            crypt('password123', gen_salt('bf')), now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('full_name', u.full_name, 'role', u.role, 'phone', u.phone),
            now(), now())
    on conflict (id) do nothing;

    insert into auth.identities (id, user_id, provider_id, identity_data, provider,
                                 last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), u.id, u.id::text,
            jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
            'email', now(), now(), now())
    on conflict do nothing;
  end loop;
end $$;

-- profiles are created by the on_auth_user_created trigger; make sure roles stuck
update public.profiles set role = 'admin'     where id = 'a0000000-0000-0000-0000-000000000001';
update public.profiles set role = 'volunteer' where id in ('a0000000-0000-0000-0000-000000000005','a0000000-0000-0000-0000-000000000006');

-- ---------- settings ----------
update public.app_settings
set couple_names = 'Rahul & Ananya', wedding_date = '2027-01-15', planning_start = '2026-06-01'
where id = 1;

-- ---------- events ----------
insert into public.events (id, name, description, event_date, theme, icon, venue, sort_order) values
  ('e0000000-0000-0000-0000-000000000001', 'Mehendi',          'An evening of henna, music and marigolds for the ladies of both families.', '2027-01-13', 'henna',     'Flower2',  'Kanoria Residence Lawn',   1),
  ('e0000000-0000-0000-0000-000000000002', 'Haldi',            'Turmeric ceremony at sunrise with close family.',                            '2027-01-14', 'marigold',  'Sun',      'Kanoria Residence Terrace', 2),
  ('e0000000-0000-0000-0000-000000000003', 'Nikah',            'The main ceremony — solemn, elegant, unforgettable.',                        '2027-01-15', 'emerald',   'Gem',      'The Imperial Gardens',      3),
  ('e0000000-0000-0000-0000-000000000004', 'Walima Reception', 'Grand reception dinner for all guests.',                                     '2027-01-17', 'champagne', 'PartyPopper', 'Grand Hyatt Ballroom',   4);

insert into public.event_members (event_id, profile_id) values
  ('e0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002'),
  ('e0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000004'),
  ('e0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000006'),
  ('e0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000002'),
  ('e0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000005'),
  ('e0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000001'),
  ('e0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000003'),
  ('e0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000004'),
  ('e0000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000001'),
  ('e0000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000003'),
  ('e0000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000005');

-- ---------- vendors ----------
insert into public.vendors (id, name, category, phone, total_amount, advance_paid, booked, rating, notes) values
  ('b0000000-0000-0000-0000-000000000001', 'Lens & Light Studios',   'Photographer',   '+919820011001', 350000, 100000, true,  5, 'Covers all four events. Drone add-on confirmed.'),
  ('b0000000-0000-0000-0000-000000000002', 'Gulmohar Decor Co.',     'Decorator',      '+919820011002', 800000, 200000, true,  4, 'Marigold + jasmine theme for Haldi, emerald drapes for Nikah.'),
  ('b0000000-0000-0000-0000-000000000003', 'Zaika Caterers',         'Catering',       '+919820011003', 1200000, 300000, true, 5, 'Tasting done. Hyderabadi + Awadhi menu.'),
  ('b0000000-0000-0000-0000-000000000004', 'Meher Beauty Artistry',  'Makeup',         '+919820011004', 150000, 50000,  true,  5, 'Bridal + 3 family members, all events.'),
  ('b0000000-0000-0000-0000-000000000005', 'Henna by Farah',         'Mehendi Artist', '+919820011005', 60000,  15000,  true,  4, 'Bridal mehendi + 25 guests.'),
  ('b0000000-0000-0000-0000-000000000006', 'DJ Nucleya Beats',       'DJ',             '+919820011006', 90000,  0,      false, null, 'Waiting on quote for reception after-party.'),
  ('b0000000-0000-0000-0000-000000000007', 'The Imperial Gardens',   'Venue',          '+919820011007', 1500000, 500000, true, 5, 'Nikah venue. Includes valet + generators.'),
  ('b0000000-0000-0000-0000-000000000008', 'Noor Jewels',            'Jeweler',        '+919820011008', 2200000, 800000, true, 5, 'Polki set + gold kadas. Final fitting in Nov.');

-- ---------- budgets ----------
insert into public.budgets (event_id, category, allocated) values
  ('e0000000-0000-0000-0000-000000000001', 'Decorations', 150000),
  ('e0000000-0000-0000-0000-000000000001', 'Food',        200000),
  ('e0000000-0000-0000-0000-000000000001', 'Mehendi Artist', 60000),
  ('e0000000-0000-0000-0000-000000000001', 'Clothes',     100000),
  ('e0000000-0000-0000-0000-000000000002', 'Decorations', 80000),
  ('e0000000-0000-0000-0000-000000000002', 'Food',        100000),
  ('e0000000-0000-0000-0000-000000000003', 'Venue',       1500000),
  ('e0000000-0000-0000-0000-000000000003', 'Catering',    700000),
  ('e0000000-0000-0000-0000-000000000003', 'Jewelry',     2500000),
  ('e0000000-0000-0000-0000-000000000003', 'Clothes',     600000),
  ('e0000000-0000-0000-0000-000000000003', 'Photography', 350000),
  ('e0000000-0000-0000-0000-000000000004', 'Venue',       900000),
  ('e0000000-0000-0000-0000-000000000004', 'Catering',    500000),
  ('e0000000-0000-0000-0000-000000000004', 'Lighting',    120000),
  (null,                                    'Wedding Cards', 80000),
  (null,                                    'Return Gifts',  150000);

-- ---------- expenses ----------
insert into public.expenses (event_id, vendor_id, category, description, amount, kind, paid, paid_on) values
  ('e0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000007', 'Venue',       'Imperial Gardens booking advance',      500000, 'advance', true,  '2026-06-20'),
  ('e0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'Catering',    'Zaika caterers advance',                300000, 'advance', true,  '2026-06-25'),
  ('e0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000008', 'Jewelry',     'Polki bridal set advance',              800000, 'advance', true,  '2026-07-01'),
  ('e0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Photography', 'Photography package advance',           100000, 'advance', true,  '2026-07-05'),
  ('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'Mehendi Artist', 'Henna by Farah booking',             15000,  'advance', true,  '2026-07-08'),
  ('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Decorations', 'Mehendi decor advance',                 50000,  'advance', true,  '2026-07-10'),
  ('e0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Decorations', 'Haldi marigold decor advance',          30000,  'advance', true,  '2026-07-10'),
  ('e0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 'Decorations', 'Reception decor advance',               120000, 'advance', true,  '2026-07-12'),
  (null, null, 'Wedding Cards', 'Sample invitation cards (3 designs)',                            4500,   'expense', true,  '2026-07-06'),
  ('e0000000-0000-0000-0000-000000000003', null, 'Clothes', 'Sherwani fabric — Raymond',          38000,  'expense', true,  '2026-07-11'),
  ('e0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004', 'Makeup',     'Makeup artist advance',                  50000,  'advance', true,  '2026-07-13'),
  ('e0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', 'Catering',   'Reception catering balance (due Dec)',   400000, 'vendor_payment', false, '2026-12-15');

-- ---------- tasks ----------
insert into public.tasks (id, event_id, name, description, category, priority, status, due_date, completion, created_by, sort_order) values
  -- Nikah
  ('c0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000003', 'Book Imperial Gardens venue', 'Sign contract, pay advance, confirm backup generator.', 'Venue', 'critical', 'completed', '2026-06-20', 100, 'a0000000-0000-0000-0000-000000000001', 1),
  ('c0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000003', 'Finalize Nikah guest list', 'Merge both families'' lists, dedupe, cap at 400.', 'Guests', 'critical', 'in_progress', '2026-07-18', 60, 'a0000000-0000-0000-0000-000000000001', 2),
  ('c0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000003', 'Order wedding invitations', 'Pick from the 3 shortlisted designs, order 450 cards.', 'Wedding Cards', 'high', 'in_progress', '2026-07-25', 40, 'a0000000-0000-0000-0000-000000000001', 3),
  ('c0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000003', 'Sherwani stitching & fittings', 'Two fittings scheduled; final by December.', 'Clothes', 'high', 'in_progress', '2026-09-15', 30, 'a0000000-0000-0000-0000-000000000001', 4),
  ('c0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000003', 'Book qazi and witnesses', 'Confirm qazi availability and nikahnama paperwork.', 'Ceremony', 'critical', 'not_started', '2026-07-14', 0, 'a0000000-0000-0000-0000-000000000001', 5),
  ('c0000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000003', 'Finalize catering menu', 'Lock the Awadhi menu; confirm veg counter and live kebab station.', 'Food', 'high', 'waiting', '2026-08-05', 70, 'a0000000-0000-0000-0000-000000000001', 6),
  ('c0000000-0000-0000-0000-000000000007', 'e0000000-0000-0000-0000-000000000003', 'Bridal jewelry final fitting', 'Noor Jewels fitting appointment in November.', 'Jewelry', 'medium', 'not_started', '2026-11-10', 0, 'a0000000-0000-0000-0000-000000000001', 7),
  ('c0000000-0000-0000-0000-000000000008', 'e0000000-0000-0000-0000-000000000003', 'Arrange guest transportation', 'Shuttle service from 3 pickup points to venue.', 'Logistics', 'medium', 'not_started', '2026-12-01', 0, 'a0000000-0000-0000-0000-000000000001', 8),
  -- Mehendi
  ('c0000000-0000-0000-0000-000000000011', 'e0000000-0000-0000-0000-000000000001', 'Confirm mehendi artist headcount', 'Farah needs final count of guests wanting henna.', 'Mehendi', 'high', 'in_progress', '2026-07-16', 50, 'a0000000-0000-0000-0000-000000000001', 1),
  ('c0000000-0000-0000-0000-000000000012', 'e0000000-0000-0000-0000-000000000001', 'Order marigold & jasmine flowers', 'Bulk order from Ghazipur flower market.', 'Flowers', 'medium', 'in_progress', '2026-07-22', 25, 'a0000000-0000-0000-0000-000000000001', 2),
  ('c0000000-0000-0000-0000-000000000013', 'e0000000-0000-0000-0000-000000000001', 'Plan sangeet-style playlist', 'Mix of old Bollywood + Punjabi hits for the ladies'' evening.', 'Music', 'low', 'not_started', '2026-10-01', 0, 'a0000000-0000-0000-0000-000000000001', 3),
  ('c0000000-0000-0000-0000-000000000014', 'e0000000-0000-0000-0000-000000000001', 'Buy bangles & parandi favors', '60 sets of glass bangles as mehendi favors.', 'Return Gifts', 'medium', 'blocked', '2026-08-20', 10, 'a0000000-0000-0000-0000-000000000001', 4),
  -- Haldi
  ('c0000000-0000-0000-0000-000000000021', 'e0000000-0000-0000-0000-000000000002', 'Source organic haldi & rose petals', 'Order from the organic store in Khan Market.', 'Ceremony', 'medium', 'completed', '2026-07-10', 100, 'a0000000-0000-0000-0000-000000000001', 1),
  ('c0000000-0000-0000-0000-000000000022', 'e0000000-0000-0000-0000-000000000002', 'Arrange yellow seating & cushions', 'Floor seating for 50, marigold garlands on railings.', 'Decorations', 'medium', 'in_progress', '2026-07-30', 45, 'a0000000-0000-0000-0000-000000000001', 2),
  ('c0000000-0000-0000-0000-000000000023', 'e0000000-0000-0000-0000-000000000002', 'Book dhol players', 'Two dhol players for 2 hours, morning slot.', 'Music', 'low', 'not_started', '2026-09-05', 0, 'a0000000-0000-0000-0000-000000000001', 3),
  -- Walima
  ('c0000000-0000-0000-0000-000000000031', 'e0000000-0000-0000-0000-000000000004', 'Negotiate DJ quote', 'DJ Nucleya Beats quote pending; compare with 2 alternatives.', 'Music', 'high', 'waiting', '2026-07-20', 20, 'a0000000-0000-0000-0000-000000000001', 1),
  ('c0000000-0000-0000-0000-000000000032', 'e0000000-0000-0000-0000-000000000004', 'Design stage & lighting layout', 'Champagne-gold stage backdrop, warm ambient lighting.', 'Stage', 'high', 'in_progress', '2026-08-15', 35, 'a0000000-0000-0000-0000-000000000001', 2),
  ('c0000000-0000-0000-0000-000000000033', 'e0000000-0000-0000-0000-000000000004', 'Shortlist return gifts', 'Dry fruit boxes vs. silver coins vs. attar bottles.', 'Return Gifts', 'medium', 'in_progress', '2026-07-17', 50, 'a0000000-0000-0000-0000-000000000001', 3),
  ('c0000000-0000-0000-0000-000000000034', 'e0000000-0000-0000-0000-000000000004', 'Book reception ballroom', 'Grand Hyatt ballroom for 600 guests.', 'Venue', 'critical', 'completed', '2026-07-01', 100, 'a0000000-0000-0000-0000-000000000001', 4),
  ('c0000000-0000-0000-0000-000000000035', 'e0000000-0000-0000-0000-000000000004', 'Plan couple entry sequence', 'Cold pyros + instrumental track; rehearse in January.', 'Ceremony', 'low', 'not_started', '2026-12-20', 0, 'a0000000-0000-0000-0000-000000000001', 5),
  -- General (no event)
  ('c0000000-0000-0000-0000-000000000041', null, 'Build wedding website & RSVP form', 'Simple site with schedule, map links and RSVP.', 'Digital', 'medium', 'in_progress', '2026-08-01', 55, 'a0000000-0000-0000-0000-000000000001', 1),
  ('c0000000-0000-0000-0000-000000000042', null, 'Book honeymoon flights', 'Compare Maldives vs. Santorini for late January.', 'Honeymoon', 'medium', 'not_started', '2026-09-30', 0, 'a0000000-0000-0000-0000-000000000001', 2),
  ('c0000000-0000-0000-0000-000000000043', null, 'Apply for marriage registration slot', 'Court registration appointment for February.', 'Legal', 'high', 'not_started', '2026-08-10', 0, 'a0000000-0000-0000-0000-000000000001', 3);

insert into public.task_assignees (task_id, profile_id) values
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002'),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004'),
  ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000003'),
  ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000002'),
  ('c0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000005'),
  ('c0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000004'),
  ('c0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000006'),
  ('c0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000004'),
  ('c0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000002'),
  ('c0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000002'),
  ('c0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000005'),
  ('c0000000-0000-0000-0000-000000000023', 'a0000000-0000-0000-0000-000000000005'),
  ('c0000000-0000-0000-0000-000000000031', 'a0000000-0000-0000-0000-000000000003'),
  ('c0000000-0000-0000-0000-000000000032', 'a0000000-0000-0000-0000-000000000003'),
  ('c0000000-0000-0000-0000-000000000033', 'a0000000-0000-0000-0000-000000000006'),
  ('c0000000-0000-0000-0000-000000000034', 'a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000041', 'a0000000-0000-0000-0000-000000000003'),
  ('c0000000-0000-0000-0000-000000000042', 'a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000043', 'a0000000-0000-0000-0000-000000000001');

insert into public.task_checklist_items (task_id, label, done, sort_order) values
  ('c0000000-0000-0000-0000-000000000002', 'Collect groom-side list from Amma', true, 1),
  ('c0000000-0000-0000-0000-000000000002', 'Collect bride-side list', true, 2),
  ('c0000000-0000-0000-0000-000000000002', 'Dedupe and merge in guest manager', false, 3),
  ('c0000000-0000-0000-0000-000000000002', 'Get final sign-off from both families', false, 4),
  ('c0000000-0000-0000-0000-000000000003', 'Shortlist 3 designs', true, 1),
  ('c0000000-0000-0000-0000-000000000003', 'Approve wording (English + Urdu)', false, 2),
  ('c0000000-0000-0000-0000-000000000003', 'Place order for 450 cards', false, 3),
  ('c0000000-0000-0000-0000-000000000006', 'Tasting session', true, 1),
  ('c0000000-0000-0000-0000-000000000006', 'Confirm live counters', false, 2),
  ('c0000000-0000-0000-0000-000000000032', 'Approve stage render', true, 1),
  ('c0000000-0000-0000-0000-000000000032', 'Lighting plot walkthrough at venue', false, 2);

insert into public.task_comments (task_id, author_id, body) values
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Groom-side list is done — 212 names. Sending it over tonight.'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Great, will merge this weekend.'),
  ('c0000000-0000-0000-0000-000000000031', 'a0000000-0000-0000-0000-000000000003', 'Nucleya Beats said quote by Friday. Also pinged SoundCraft as backup.'),
  ('c0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000004', 'So far 38 guests have said yes to henna. Closing count tomorrow.');

-- ---------- shopping ----------
insert into public.shopping_items (event_id, name, category, quantity, budget, actual_price, store, purchased, assigned_to, notes) values
  ('e0000000-0000-0000-0000-000000000003', 'Bridal lehenga',            'Clothes',      1,  350000, null,   'Sabyasachi, Mehrauli',      false, 'a0000000-0000-0000-0000-000000000004', 'Appointment booked for Aug 2'),
  ('e0000000-0000-0000-0000-000000000003', 'Groom sherwani',            'Clothes',      1,  120000, 118000, 'Raymond Custom',            true,  'a0000000-0000-0000-0000-000000000001', 'Fabric bought, stitching on'),
  ('e0000000-0000-0000-0000-000000000003', 'Polki bridal set',          'Jewelry',      1,  2200000, null,  'Noor Jewels',               false, 'a0000000-0000-0000-0000-000000000002', 'Advance paid'),
  ('e0000000-0000-0000-0000-000000000003', 'Gold kadas (pair)',         'Jewelry',      2,  300000, null,   'Noor Jewels',               false, 'a0000000-0000-0000-0000-000000000002', null),
  ('e0000000-0000-0000-0000-000000000001', 'Marigold strings',          'Flowers',      200, 40000, null,   'Ghazipur Mandi',            false, 'a0000000-0000-0000-0000-000000000006', 'Order 1 week before'),
  ('e0000000-0000-0000-0000-000000000001', 'Glass bangles favor sets',  'Return Gifts', 60, 30000,  null,   'Lajpat Nagar',              false, 'a0000000-0000-0000-0000-000000000002', 'Blocked on final guest count'),
  ('e0000000-0000-0000-0000-000000000001', 'Mehendi outfit (bride)',    'Clothes',      1,  60000,  54000,  'Anita Dongre',              true,  'a0000000-0000-0000-0000-000000000004', null),
  ('e0000000-0000-0000-0000-000000000002', 'Organic haldi (5kg)',       'Food',         5,  3000,   2400,   'Khan Market Organics',      true,  'a0000000-0000-0000-0000-000000000002', null),
  ('e0000000-0000-0000-0000-000000000002', 'Yellow cushions & drapes',  'Decorations',  50, 25000,  null,   'Gulmohar Decor',            false, 'a0000000-0000-0000-0000-000000000005', null),
  ('e0000000-0000-0000-0000-000000000004', 'Return gift boxes (dry fruit)', 'Return Gifts', 300, 150000, null, 'Khari Baoli wholesale',  false, 'a0000000-0000-0000-0000-000000000006', 'Sample approved'),
  ('e0000000-0000-0000-0000-000000000004', 'Stage floral arch',         'Stage',        1,  80000,  null,   'Gulmohar Decor',            false, 'a0000000-0000-0000-0000-000000000005', null),
  ('e0000000-0000-0000-0000-000000000004', 'Fairy lights (500m)',       'Lighting',     500, 35000, null,   'Bhagirath Palace',          false, 'a0000000-0000-0000-0000-000000000005', null),
  (null, 'Wedding invitation cards',       'Wedding Cards', 450, 80000, null,            'Chawri Bazar printers',     false, 'a0000000-0000-0000-0000-000000000004', 'Design being finalized'),
  (null, 'Welcome hampers for outstation guests', 'Return Gifts', 40, 60000, null,       'Foodhall',                  false, 'a0000000-0000-0000-0000-000000000003', null);

-- ---------- guests ----------
insert into public.guests (name, side, grp, rsvp, invitation_sent, food_pref, phone, head_count, notes) values
  ('Nana & Nani ji',        'groom', 'vip',     'confirmed', true,  'Veg',     '+919811100001', 2, 'Front row seating'),
  ('Dadaji',                'groom', 'vip',     'confirmed', true,  'Veg',     '+919811100002', 1, 'Wheelchair access needed'),
  ('Sharma Uncle family',   'groom', 'family',  'confirmed', true,  'Non-veg', '+919811100003', 4, null),
  ('Kanoria cousins (Mumbai)', 'groom', 'family', 'pending', true,  'Non-veg', '+919811100004', 6, 'Flights in Jan'),
  ('Ananya''s parents',     'bride', 'vip',     'confirmed', true,  'Non-veg', '+919811100005', 2, null),
  ('Ananya''s Mausi family','bride', 'family',  'confirmed', true,  'Veg',     '+919811100006', 5, null),
  ('College gang (Rahul)',  'groom', 'friends', 'maybe',     true,  'Non-veg', '+919811100007', 8, 'Group booking hotel'),
  ('Office team — Housing', 'groom', 'friends', 'pending',   false, null,      '+919811100008', 12, 'Invite after cards arrive'),
  ('Zainab & family',       'bride', 'friends', 'confirmed', true,  'Halal',   '+919811100009', 3, null),
  ('Mehra Aunty',           'groom', 'family',  'declined',  true,  null,      '+919811100010', 1, 'Traveling abroad'),
  ('Dr. Iyer family',       'bride', 'family',  'confirmed', true,  'Veg',     '+919811100011', 4, null),
  ('Khan Sahab (qazi)',     'both',  'vip',     'confirmed', false, 'Halal',   '+919811100012', 1, 'Nikah officiant'),
  ('School friends (Ananya)','bride','friends', 'pending',   false, null,      '+919811100013', 6, null),
  ('Bua ji & family',       'groom', 'family',  'confirmed', true,  'Veg',     '+919811100014', 4, null),
  ('Chachu (Dubai)',        'groom', 'vip',     'maybe',     true,  'Non-veg', '+971501100015', 3, 'Flight depends on visa'),
  ('Neighbours — Block C',  'both',  'friends', 'pending',   false, 'Veg',     '+919811100016', 10, 'Walima only'),
  ('Ananya''s Nani',        'bride', 'vip',     'confirmed', true,  'Veg',     '+919811100017', 1, null),
  ('Tennis club friends',   'groom', 'friends', 'pending',   false, null,      '+919811100018', 5, 'Walima only'),
  ('Rizvi family',          'bride', 'family',  'confirmed', true,  'Halal',   '+919811100019', 4, null),
  ('Mamaji (Kolkata)',      'groom', 'vip',     'confirmed', true,  'Non-veg', '+919811100020', 3, 'Staying 5 days');

-- ---------- notes ----------
insert into public.notes (event_id, author_id, body, pinned) values
  (null, 'a0000000-0000-0000-0000-000000000001', 'Theme lock: emerald + gold across all stationery and decor. Share swatch with all vendors.', true),
  ('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Qazi needs both witnesses'' ID copies a week before the Nikah.', true),
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'Farah suggested booking a second artist if guest count crosses 40.', false),
  (null, 'a0000000-0000-0000-0000-000000000002', 'Book mausiji''s wheelchair-friendly cab for all four events.', false);

-- ---------- activity ----------
insert into public.activity_log (actor_id, action, entity, entity_id, detail) values
  ('a0000000-0000-0000-0000-000000000001', 'completed', 'task', 'c0000000-0000-0000-0000-000000000034', 'Book reception ballroom'),
  ('a0000000-0000-0000-0000-000000000002', 'completed', 'task', 'c0000000-0000-0000-0000-000000000021', 'Source organic haldi & rose petals'),
  ('a0000000-0000-0000-0000-000000000001', 'added', 'expense', null, 'Makeup artist advance — ₹50,000'),
  ('a0000000-0000-0000-0000-000000000004', 'purchased', 'shopping_item', null, 'Mehendi outfit (bride) — ₹54,000'),
  ('a0000000-0000-0000-0000-000000000001', 'added', 'vendor', 'b0000000-0000-0000-0000-000000000006', 'DJ Nucleya Beats');

-- ---------- booking tracker ----------
-- Wedding is 2027-01-15. Demo mixes confirmed, in-progress and overdue bookings.
insert into public.bookings (category, vendor_name, event_id, status, booking_date, contract_signed, advance_paid, balance_due, final_payment_due, contact_person, contact_phone, trial_scheduled, fitting_date, notes, sort_order) values
  ('Venue',                      'The Imperial Gardens',  'e0000000-0000-0000-0000-000000000003', 'confirmed',   '2026-06-20', true,  500000, 1000000, '2027-01-05', 'Mr. Kapoor',   '+919820011007', null,        null,        'Includes valet, generators and bridal suite.', 1),
  ('Food Catering',              'Zaika Caterers',        'e0000000-0000-0000-0000-000000000003', 'booked',      '2026-06-25', true,  300000, 900000,  '2026-12-15', 'Chef Imran',   '+919820011003', '2026-08-02', null,        'Final tasting for Awadhi menu on Aug 2.', 2),
  ('Photographer',               'Lens & Light Studios',  null,                                    'confirmed',   '2026-07-05', true,  100000, 250000,  '2027-01-10', 'Aditi',        '+919820011001', null,        null,        'Covers all four functions + drone.', 3),
  ('Videographer',               null,                    null,                                    'not_booked',  null,         false, 0,      0,       null,         null,           null,            null,        null,        'Shortlist 3 cinematic teams — URGENT, ideally booked months ago.', 4),
  ('Decoration',                 'Gulmohar Decor Co.',    null,                                    'negotiating', null,         false, 0,      0,       null,         'Ravi Gulmohar','+919820011002', null,        null,        'Waiting on revised quote for all 4 functions.', 5),
  ('Accommodation / Guest Hotel','Taj City Centre',       'e0000000-0000-0000-0000-000000000004', 'enquired',    null,         false, 0,      0,       null,         'Reservations', '+919820011021', null,        null,        '40 rooms block for outstation guests, 14-17 Jan.', 6),
  ('Jeweler',                    'Noor Jewels',           'e0000000-0000-0000-0000-000000000003', 'confirmed',   '2026-07-01', true,  800000, 1400000, '2026-12-20', 'Noor Bhai',    '+919820011008', null,        null,        'Polki set + kadas. Final fitting in Nov.', 7),
  ('Invitation Cards Printing',  'Chawri Bazar Printers', null,                                    'negotiating', null,         false, 0,      0,       null,         'Suresh',       '+919820011022', null,        null,        '450 cards, emerald-gold letterpress sample approved.', 8),
  ('Wedding Clothes / Tailor',   'Raymond Custom',        'e0000000-0000-0000-0000-000000000003', 'booked',      '2026-07-11', false, 38000,  80000,   '2026-12-01', 'Master Javed', '+919820011023', null,        '2026-09-15', 'Sherwani stitching on. Two fittings planned.', 9),
  ('Mehendi Artist',             'Henna by Farah',        'e0000000-0000-0000-0000-000000000001', 'booked',      '2026-07-08', true,  15000,  45000,   '2027-01-10', 'Farah',        '+919820011005', '2026-08-20', null,       'Bridal + 25 guests. Sample session Aug 20.', 10),
  ('DJ / Sound',                 'DJ Nucleya Beats',      'e0000000-0000-0000-0000-000000000004', 'enquired',    null,         false, 0,      0,       null,         'Nucleya',      '+919820011006', null,        null,        'Quote promised by Friday; SoundCraft as backup.', 11),
  ('Lighting',                   null,                    'e0000000-0000-0000-0000-000000000004', 'not_booked',  null,         false, 0,      0,       null,         null,           null,            null,        null,        'Bhagirath Palace vendors — visit planned.', 12),
  ('Makeup Artist',              'Meher Beauty Artistry', null,                                    'booked',      '2026-07-13', true,  50000,  100000,  '2027-01-12', 'Meher',        '+919820011004', '2026-09-05', null,       'Bridal trial on Sep 5, look board shared.', 13),
  ('Transportation',             null,                    null,                                    'not_booked',  null,         false, 0,      0,       null,         null,           null,            null,        null,        'Need 3 shuttle buses + vintage car for entry.', 14),
  ('Flowers',                    null,                    'e0000000-0000-0000-0000-000000000001', 'not_booked',  null,         false, 0,      0,       null,         null,           null,            null,        null,        'Ghazipur mandi bulk order closer to the date.', 15);
