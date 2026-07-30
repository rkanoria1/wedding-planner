-- ============================================================
-- Super-admin: an oversight account that can see BOTH families.
-- A super-admin is an 'admin' profile with NO household.
-- We widen the per-family RLS policies so a super-admin bypasses
-- the household filter (reads and writes across both households).
-- ============================================================

create or replace function public.is_superadmin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and household is null
  );
$$;

-- direct household tables: read/write own household OR anything if super-admin
do $$
declare
  t text;
  tables text[] := array[
    'tasks','shopping_items','vendors','guests',
    'notes','event_files','activity_log','bookings','performances'
  ];
begin
  foreach t in array tables loop
    if to_regclass('public.' || t) is null then continue; end if;
    execute format('drop policy if exists "hh read" on public.%I', t);
    execute format('drop policy if exists "hh write" on public.%I', t);
    execute format(
      'create policy "hh read" on public.%I for select to authenticated using (household = public.current_household() or public.is_superadmin())', t);
    execute format(
      'create policy "hh write" on public.%I for all to authenticated using ((public.is_admin() and household = public.current_household()) or public.is_superadmin()) with check ((public.is_admin() and household = public.current_household()) or public.is_superadmin())', t);
  end loop;
end $$;

-- task child tables: scope via parent task's household OR super-admin
do $$
declare
  t text;
  children text[] := array['task_assignees','task_checklist_items','task_comments'];
begin
  foreach t in array children loop
    execute format('drop policy if exists "hh read" on public.%I', t);
    execute format('drop policy if exists "hh write" on public.%I', t);
    execute format(
      'create policy "hh read" on public.%I for select to authenticated using (public.is_superadmin() or exists (select 1 from public.tasks tk where tk.id = task_id and tk.household = public.current_household()))', t);
    execute format(
      'create policy "hh write" on public.%I for all to authenticated using (public.is_superadmin() or exists (select 1 from public.tasks tk where tk.id = task_id and tk.household = public.current_household())) with check (public.is_superadmin() or exists (select 1 from public.tasks tk where tk.id = task_id and tk.household = public.current_household()))', t);
  end loop;
end $$;
