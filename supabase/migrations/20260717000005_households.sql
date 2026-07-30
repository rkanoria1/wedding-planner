-- ============================================================
-- Two family workspaces (households): Rahul's family & Somya's family
-- Shared: events + app_settings (wedding date). Private per family:
-- tasks, guests, budget, shopping, vendors, expenses, bookings,
-- performances, notes, files, activity. Each family is branded.
-- ============================================================

-- ---------- households (per-family branding) ----------
create table if not exists public.households (
  id text primary key,             -- 'rahul' | 'somya'
  app_title text not null,         -- shown as the app name
  greeting_name text not null,     -- used in the dashboard greeting
  couple_names text not null default 'Rahul & Somya',
  sort_order int not null default 0
);

insert into public.households (id, app_title, greeting_name, couple_names, sort_order) values
  ('rahul', 'Rahul''s Wedding', 'Kanorias', 'Rahul & Somya', 1),
  ('somya', 'Somya''s Wedding', 'Sarafs', 'Somya & Rahul', 2)
on conflict (id) do nothing;

alter table public.households enable row level security;
drop policy if exists "read households" on public.households;
create policy "read households" on public.households for select to authenticated using (true);
grant select on public.households to authenticated;

-- ---------- each profile belongs to a household ----------
alter table public.profiles add column if not exists household text references public.households(id);

-- ---------- helpers ----------
create or replace function public.current_household()
returns text language sql stable security definer set search_path = public as $$
  select household from public.profiles where id = auth.uid();
$$;

create or replace function public.set_household()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.household is null then
    new.household := public.current_household();
  end if;
  return new;
end $$;

-- ---------- per-family tables: add column, backfill, trigger, scoped RLS ----------
do $$
declare
  t text;
  p text;
  tables text[] := array[
    'tasks','shopping_items','budgets','vendors','expenses','guests',
    'notes','event_files','activity_log','bookings','performances'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I add column if not exists household text references public.households(id)', t);
    -- existing rows belong to Rahul's family by default
    execute format('update public.%I set household = ''rahul'' where household is null', t);
    -- default the household on insert to the logged-in family
    execute format('drop trigger if exists set_household_trg on public.%I', t);
    execute format('create trigger set_household_trg before insert on public.%I for each row execute function public.set_household()', t);
    -- drop every existing policy, then add a clean household-scoped set
    for p in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
      execute format('drop policy %I on public.%I', p, t);
    end loop;
    execute format(
      'create policy "hh read" on public.%I for select to authenticated using (household = public.current_household())', t);
    execute format(
      'create policy "hh write" on public.%I for all to authenticated using (public.is_admin() and household = public.current_household()) with check (public.is_admin() and household = public.current_household())', t);
  end loop;
end $$;

-- ---------- task child tables: scope via their parent task's household ----------
do $$
declare
  t text;
  p text;
  children text[] := array['task_assignees','task_checklist_items','task_comments'];
begin
  foreach t in array children loop
    for p in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
      execute format('drop policy %I on public.%I', p, t);
    end loop;
    execute format(
      'create policy "hh read" on public.%I for select to authenticated using (exists (select 1 from public.tasks tk where tk.id = task_id and tk.household = public.current_household()))', t);
    execute format(
      'create policy "hh write" on public.%I for all to authenticated using (exists (select 1 from public.tasks tk where tk.id = task_id and tk.household = public.current_household())) with check (exists (select 1 from public.tasks tk where tk.id = task_id and tk.household = public.current_household()))', t);
  end loop;
end $$;
