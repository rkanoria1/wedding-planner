-- ============================================================
-- Cross-family sharing (shared tasks) + shared photo gallery
-- ============================================================

-- ---------- shared tasks: visible to BOTH families ----------
alter table public.tasks add column if not exists shared boolean not null default false;

drop policy if exists "hh read" on public.tasks;
drop policy if exists "hh write" on public.tasks;
create policy "hh read" on public.tasks for select to authenticated
  using (household = public.current_household() or shared or public.is_superadmin());
create policy "hh write" on public.tasks for all to authenticated
  using ((public.is_admin() and (household = public.current_household() or shared)) or public.is_superadmin())
  with check ((public.is_admin() and (household = public.current_household() or shared)) or public.is_superadmin());

-- task child tables: follow a shared parent too
do $$
declare t text; children text[] := array['task_assignees','task_checklist_items','task_comments'];
begin
  foreach t in array children loop
    execute format('drop policy if exists "hh read" on public.%I', t);
    execute format('drop policy if exists "hh write" on public.%I', t);
    execute format(
      'create policy "hh read" on public.%I for select to authenticated using (public.is_superadmin() or exists (select 1 from public.tasks tk where tk.id = task_id and (tk.household = public.current_household() or tk.shared)))', t);
    execute format(
      'create policy "hh write" on public.%I for all to authenticated using (public.is_superadmin() or exists (select 1 from public.tasks tk where tk.id = task_id and (tk.household = public.current_household() or tk.shared))) with check (public.is_superadmin() or exists (select 1 from public.tasks tk where tk.id = task_id and (tk.household = public.current_household() or tk.shared)))', t);
  end loop;
end $$;

-- ---------- shared photo gallery (inspiration + album) ----------
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete set null,
  url text not null,
  caption text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.photos enable row level security;
-- shared across both families
create policy "read photos" on public.photos for select to authenticated using (true);
create policy "write photos" on public.photos for all to authenticated using (true) with check (true);
grant select, insert, update, delete on public.photos to authenticated;
alter publication supabase_realtime add table public.photos;
