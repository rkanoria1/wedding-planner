-- ============================================================
-- RAHUL & SOMYA — starter task checklist
-- Run ONCE, after setup-rahul-somya-wedding.sql (it uses the same
-- event ids). Adds a typical plan of tasks per function + general
-- essentials. All start Not Started; edit/assign/re-date in the app.
-- ============================================================

insert into public.tasks (event_id, name, description, category, priority, status, due_date, sort_order) values
  -- ---------- Myrah (28 Jan, morning) ----------
  ('f0000000-0000-0000-0000-000000000001', 'Confirm mama–mami guest list & bhaat gifts', 'Finalise which maternal relatives attend and the gifts/shagun exchanged.', 'Guests', 'high', 'not_started', '2026-12-15', 1),
  ('f0000000-0000-0000-0000-000000000001', 'Book pandit for Myrah rituals', 'Confirm priest and the small pooja for the bhaat ceremony.', 'Ceremony', 'high', 'not_started', '2026-11-01', 2),
  ('f0000000-0000-0000-0000-000000000001', 'Arrange traditional attire for maternal family', 'Coordinate colour-themed outfits for the mama-mami and close family.', 'Clothes', 'medium', 'not_started', '2026-12-20', 3),
  ('f0000000-0000-0000-0000-000000000001', 'Plan Myrah decor', 'Marigold + traditional setup for the morning ceremony.', 'Decorations', 'medium', 'not_started', '2027-01-12', 4),
  ('f0000000-0000-0000-0000-000000000001', 'Arrange morning breakfast & refreshments', 'Light traditional breakfast for the gathering.', 'Food', 'medium', 'not_started', '2027-01-18', 5),

  -- ---------- Sangeet (28 Jan, night) ----------
  ('f0000000-0000-0000-0000-000000000002', 'Book DJ & sound system', 'Lock the DJ and PA setup for the sangeet night.', 'Music', 'critical', 'not_started', '2026-09-15', 1),
  ('f0000000-0000-0000-0000-000000000002', 'Hire choreographer for family performances', 'Sessions for both families'' dance sets.', 'Music', 'high', 'not_started', '2026-10-15', 2),
  ('f0000000-0000-0000-0000-000000000002', 'Confirm sangeet-night dinner catering', 'Menu + counters for the evening.', 'Food', 'high', 'not_started', '2026-10-30', 3),
  ('f0000000-0000-0000-0000-000000000002', 'Sangeet outfits for bride & groom', 'Shopping / stitching for the sangeet look.', 'Clothes', 'high', 'not_started', '2026-11-15', 4),
  ('f0000000-0000-0000-0000-000000000002', 'Design sangeet stage, backdrop & lighting', 'Stage layout, backdrop and ambient lighting plan.', 'Stage', 'high', 'not_started', '2026-12-15', 5),
  ('f0000000-0000-0000-0000-000000000002', 'Book anchor / MC for the evening', 'Host to run the performances and games.', 'Music', 'medium', 'not_started', '2026-11-30', 6),
  ('f0000000-0000-0000-0000-000000000002', 'Finalise sangeet playlist & running order', 'Performance order + song list shared with DJ.', 'Music', 'medium', 'not_started', '2027-01-10', 7),

  -- ---------- Haldi (29 Jan, morning) ----------
  ('f0000000-0000-0000-0000-000000000003', 'Haldi outfits (yellow) for bride & groom', 'Coordinated yellow outfits for the ceremony.', 'Clothes', 'medium', 'not_started', '2026-12-20', 1),
  ('f0000000-0000-0000-0000-000000000003', 'Book dhol players for the morning', 'Two dhol players for the haldi.', 'Music', 'low', 'not_started', '2026-12-01', 2),
  ('f0000000-0000-0000-0000-000000000003', 'Yellow decor: marigold garlands & floor seating', 'Marigold theme, low seating, backdrop for photos.', 'Decorations', 'medium', 'not_started', '2027-01-12', 3),
  ('f0000000-0000-0000-0000-000000000003', 'Source organic haldi, rose petals & mustard oil', 'Ceremony supplies from a trusted store.', 'Ceremony', 'medium', 'not_started', '2027-01-22', 4),
  ('f0000000-0000-0000-0000-000000000003', 'Arrange haldi breakfast & snacks', 'Refreshments for family during the morning.', 'Food', 'medium', 'not_started', '2027-01-20', 5),

  -- ---------- Varmala (29 Jan, evening) ----------
  ('f0000000-0000-0000-0000-000000000004', 'Book photographer & videographer', 'Cover baraat, varmala and phera. Discuss drone/cinematic.', 'Photography', 'high', 'not_started', '2026-09-30', 1),
  ('f0000000-0000-0000-0000-000000000004', 'Plan varmala stage & floral backdrop', 'Stage design for the garland exchange.', 'Stage', 'high', 'not_started', '2026-12-20', 2),
  ('f0000000-0000-0000-0000-000000000004', 'Order fresh jaimala / varmala garlands', 'Two premium garlands, delivered day-of.', 'Flowers', 'high', 'not_started', '2027-01-25', 3),
  ('f0000000-0000-0000-0000-000000000004', 'Coordinate baraat & groom entry', 'Route, band/dhol, timing with the venue.', 'Logistics', 'medium', 'not_started', '2027-01-15', 4),
  ('f0000000-0000-0000-0000-000000000004', 'Plan couple entry sequence', 'Music cue, cold pyros, timing rehearsal.', 'Ceremony', 'low', 'not_started', '2027-01-22', 5),

  -- ---------- Phera (29 Jan, night — main) ----------
  ('f0000000-0000-0000-0000-000000000005', 'Confirm pandit & muhurat', 'Lock the priest and the auspicious phera time.', 'Ceremony', 'critical', 'not_started', '2026-10-01', 1),
  ('f0000000-0000-0000-0000-000000000005', 'Confirm phera-night guest dinner catering', 'Main dinner menu, counters and headcount.', 'Food', 'critical', 'not_started', '2026-10-30', 2),
  ('f0000000-0000-0000-0000-000000000005', 'Buy mangalsutra & wedding rings', 'Select and order with enough lead time.', 'Jewelry', 'high', 'not_started', '2026-11-15', 3),
  ('f0000000-0000-0000-0000-000000000005', 'Bridal lehenga final fitting', 'Final alterations for the phera outfit.', 'Clothes', 'high', 'not_started', '2026-12-10', 4),
  ('f0000000-0000-0000-0000-000000000005', 'Groom sherwani final fitting', 'Final alterations for the sherwani.', 'Clothes', 'high', 'not_started', '2026-12-10', 5),
  ('f0000000-0000-0000-0000-000000000005', 'Arrange mandap, havan & pooja samagri', 'Mandap decor, agni setup and all ritual items.', 'Ceremony', 'high', 'not_started', '2026-12-15', 6),
  ('f0000000-0000-0000-0000-000000000005', 'Vidaai arrangements (car decor, gifts)', 'Decorated car, vidaai gifts and logistics.', 'Logistics', 'medium', 'not_started', '2027-01-22', 7),

  -- ---------- General (whole wedding) ----------
  (null, 'Book main wedding venue / banquet', 'Shortlist, visit and book the venue for all functions.', 'Venue', 'critical', 'not_started', '2026-08-15', 1),
  (null, 'Finalise overall guest list', 'Merge both families'' lists, dedupe, set a cap.', 'Guests', 'high', 'not_started', '2026-09-30', 2),
  (null, 'Book bridal makeup artist', 'Trial + all-functions booking.', 'Makeup', 'high', 'not_started', '2026-09-15', 3),
  (null, 'Order wedding invitation cards', 'Design, wording, and print run.', 'Wedding Cards', 'high', 'not_started', '2026-10-15', 4),
  (null, 'Book mehndi artist', 'Bridal mehndi + guests.', 'Mehendi', 'medium', 'not_started', '2026-10-15', 5),
  (null, 'Arrange accommodation for outstation guests', 'Room block / hotel for guests travelling in.', 'Logistics', 'medium', 'not_started', '2026-11-30', 6),
  (null, 'Apply for marriage registration', 'Paperwork and appointment.', 'Legal', 'high', 'not_started', '2026-12-15', 7),
  (null, 'Plan honeymoon', 'Shortlist destinations and book flights.', 'Honeymoon', 'low', 'not_started', '2026-11-30', 8);

-- assign this starter plan to Rahul's family (change to 'somya' if you'd
-- rather it belong to Somya's family). Only fills rows that have no family yet.
update public.tasks set household = 'rahul' where household is null;
