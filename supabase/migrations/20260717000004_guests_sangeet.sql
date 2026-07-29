-- ============================================================
-- Smarter guest list + Sangeet performance planner
-- ============================================================

-- which wedding functions each guest is invited to
alter table public.guests
  add column if not exists invited_events uuid[] not null default '{}';

-- ---------- sangeet performance lineup ----------
create table if not exists public.performances (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events (id) on delete set null,  -- usually the Sangeet
  title text not null,                 -- e.g. "Cousins group dance"
  song text,
  performers text,
  rehearsal_date date,
  duration_min int,
  status text not null default 'planned',   -- planned | rehearsing | ready
  sort_order int not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger performances_touch
  before update on public.performances
  for each row execute function public.touch_updated_at();

alter table public.performances enable row level security;

create policy "read performances" on public.performances for select to authenticated using (true);
create policy "admin write performances" on public.performances for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.performances to authenticated;

alter publication supabase_realtime add table public.performances;
