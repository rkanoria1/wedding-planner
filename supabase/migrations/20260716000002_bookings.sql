-- ============================================================
-- Critical Booking Tracker — per-category vendor booking status
-- Separate from public.vendors (contact directory). This tracks the
-- BOOKING lifecycle with lead-time urgency, trials/fittings and contracts.
-- ============================================================

create type public.booking_status as enum (
  'not_booked', 'enquired', 'negotiating', 'booked', 'confirmed', 'cancelled'
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  category text not null,                       -- one of the required booking categories
  vendor_name text,
  event_id uuid references public.events (id) on delete set null,  -- wedding function
  status public.booking_status not null default 'not_booked',
  booking_date date,
  contract_signed boolean not null default false,
  advance_paid numeric(12,2) not null default 0,
  balance_due numeric(12,2) not null default 0,
  final_payment_due date,
  contact_person text,
  contact_phone text,
  trial_scheduled date,                         -- makeup trial / catering tasting / sample
  fitting_date date,                            -- clothes fitting
  notes text,
  contract_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger bookings_touch
  before update on public.bookings
  for each row execute function public.touch_updated_at();

alter table public.bookings enable row level security;

create policy "read bookings" on public.bookings for select to authenticated using (true);
create policy "admin write bookings" on public.bookings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

alter publication supabase_realtime add table public.bookings;
