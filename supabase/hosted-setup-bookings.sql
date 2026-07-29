-- ============================================================
-- HOSTED SETUP — Booking Tracker table
-- Paste this whole file into the Supabase SQL Editor of your project
-- (dyjfhnwwfyxjjaqblssq) and run it. Your project already has the rest
-- of the schema; this only adds the new `bookings` table + its policies.
-- Safe to run once. Re-running errors on the type/table already existing.
-- ============================================================

create type public.booking_status as enum (
  'not_booked', 'enquired', 'negotiating', 'booked', 'confirmed', 'cancelled'
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  vendor_name text,
  event_id uuid references public.events (id) on delete set null,
  status public.booking_status not null default 'not_booked',
  booking_date date,
  contract_signed boolean not null default false,
  advance_paid numeric(12,2) not null default 0,
  balance_due numeric(12,2) not null default 0,
  final_payment_due date,
  contact_person text,
  contact_phone text,
  trial_scheduled date,
  fitting_date date,
  notes text,
  contract_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger bookings_touch
  before update on public.bookings
  for each row execute function public.touch_updated_at();

alter table public.bookings enable row level security;

create policy "read bookings" on public.bookings for select to authenticated using (true);
create policy "admin write bookings" on public.bookings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- table privileges (RLS still governs row access)
grant select, insert, update, delete on public.bookings to authenticated;

-- live updates
alter publication supabase_realtime add table public.bookings;
