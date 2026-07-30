-- ============================================================
-- Guest portal: role, content tables, RLS walls
-- ============================================================

-- ---------- guest role (must be top-level; DO NOT wrap in a transaction/DO
-- block that also uses the value — Postgres requires a commit first) ----------
alter type public.user_role add value if not exists 'guest';

create or replace function public.is_guest()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'guest'
  );
$$;

create or replace function public.is_planner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'family', 'volunteer')
  );
$$;

-- ---------- timeline ----------
create table if not exists public.timeline_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  starts_at timestamptz not null,
  title text not null,
  note text,
  people text,
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists timeline_items_event_idx on public.timeline_items (event_id, sort_order, starts_at);

alter table public.timeline_items enable row level security;

drop policy if exists "guest read timeline" on public.timeline_items;
drop policy if exists "planner read timeline" on public.timeline_items;
drop policy if exists "admin write timeline" on public.timeline_items;

create policy "planner read timeline" on public.timeline_items
  for select to authenticated
  using (public.is_planner());

create policy "guest read timeline" on public.timeline_items
  for select to authenticated
  using (public.is_guest() and published = true);

create policy "admin write timeline" on public.timeline_items
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update, delete on public.timeline_items to authenticated;

-- ---------- lookbooks ----------
create table if not exists public.lookbooks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references public.events (id) on delete cascade,
  cover_url text,
  outfit_notes text,
  jewelry_notes text,
  colors jsonb not null default '[]'::jsonb,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lookbook_photos (
  id uuid primary key default gen_random_uuid(),
  lookbook_id uuid not null references public.lookbooks (id) on delete cascade,
  url text not null,
  caption text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.lookbooks enable row level security;
alter table public.lookbook_photos enable row level security;

drop policy if exists "planner read lookbooks" on public.lookbooks;
drop policy if exists "guest read lookbooks" on public.lookbooks;
drop policy if exists "admin write lookbooks" on public.lookbooks;
drop policy if exists "planner read lookbook_photos" on public.lookbook_photos;
drop policy if exists "guest read lookbook_photos" on public.lookbook_photos;
drop policy if exists "admin write lookbook_photos" on public.lookbook_photos;

create policy "planner read lookbooks" on public.lookbooks
  for select to authenticated using (public.is_planner());
create policy "guest read lookbooks" on public.lookbooks
  for select to authenticated using (public.is_guest() and published = true);
create policy "admin write lookbooks" on public.lookbooks
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "planner read lookbook_photos" on public.lookbook_photos
  for select to authenticated
  using (
    public.is_planner()
    or (
      public.is_guest()
      and exists (
        select 1 from public.lookbooks lb
        where lb.id = lookbook_id and lb.published = true
      )
    )
  );
create policy "admin write lookbook_photos" on public.lookbook_photos
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.lookbooks to authenticated;
grant select, insert, update, delete on public.lookbook_photos to authenticated;

-- ---------- blessings ----------
create table if not exists public.blessings (
  id uuid primary key default gen_random_uuid(),
  body text not null,
  author_label text not null,
  hidden boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.blessings enable row level security;

drop policy if exists "read blessings" on public.blessings;
drop policy if exists "insert blessings" on public.blessings;
drop policy if exists "admin mod blessings" on public.blessings;

create policy "read blessings" on public.blessings
  for select to authenticated
  using (
    (public.is_guest() and hidden = false)
    or public.is_planner()
  );

create policy "insert blessings" on public.blessings
  for insert to authenticated
  with check (public.is_guest() or public.is_planner());

create policy "admin mod blessings" on public.blessings
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admin delete blessings" on public.blessings
  for delete to authenticated
  using (public.is_admin());

grant select, insert, update, delete on public.blessings to authenticated;

-- ---------- photos: guest fields + soft hide ----------
alter table public.photos
  add column if not exists source text not null default 'family',
  add column if not exists author_label text,
  add column if not exists hidden boolean not null default false;

alter table public.photos drop constraint if exists photos_source_check;
alter table public.photos
  add constraint photos_source_check check (source in ('family', 'guest'));

drop policy if exists "read photos" on public.photos;
drop policy if exists "write photos" on public.photos;
drop policy if exists "insert photos" on public.photos;
drop policy if exists "update photos" on public.photos;
drop policy if exists "delete photos" on public.photos;

create policy "read photos" on public.photos
  for select to authenticated
  using (
    (public.is_guest() and hidden = false)
    or public.is_planner()
  );

create policy "insert photos" on public.photos
  for insert to authenticated
  with check (public.is_guest() or public.is_planner());

create policy "update photos" on public.photos
  for update to authenticated
  using (public.is_admin() or uploaded_by = auth.uid())
  with check (public.is_admin() or uploaded_by = auth.uid());

create policy "delete photos" on public.photos
  for delete to authenticated
  using (public.is_admin() or uploaded_by = auth.uid());

-- ---------- wall off planning reads from guests ----------
-- Drop legacy open-read policies; recreate planner-only. Household policies
-- (hh read) remain but must also exclude guests — recreate them when present.

create or replace function public.deny_guest_read(tbl regclass, policy_name text)
returns void
language plpgsql
as $$
begin
  execute format('drop policy if exists %I on %s', policy_name, tbl);
exception when undefined_object then null;
end;
$$;

select public.deny_guest_read('public.tasks', 'read tasks');
select public.deny_guest_read('public.task_assignees', 'read task_assignees');
select public.deny_guest_read('public.task_checklist_items', 'read checklist');
select public.deny_guest_read('public.task_comments', 'read comments');
select public.deny_guest_read('public.shopping_items', 'read shopping');
select public.deny_guest_read('public.vendors', 'read vendors');
select public.deny_guest_read('public.guests', 'read guests');
select public.deny_guest_read('public.activity_log', 'read activity');
select public.deny_guest_read('public.notes', 'read notes');
select public.deny_guest_read('public.event_files', 'read files');
select public.deny_guest_read('public.bookings', 'read bookings');
select public.deny_guest_read('public.performances', 'read performances');
select public.deny_guest_read('public.notifications', 'read own notifications');
select public.deny_guest_read('public.events', 'read events');
select public.deny_guest_read('public.app_settings', 'read settings');
select public.deny_guest_read('public.profiles', 'read profiles');

-- Guest-safe shared reads
create policy "read events" on public.events
  for select to authenticated
  using (public.is_guest() or public.is_planner());

create policy "read settings" on public.app_settings
  for select to authenticated
  using (public.is_guest() or public.is_planner());

create policy "read profiles" on public.profiles
  for select to authenticated
  using (
    public.is_planner()
    or (public.is_guest() and id = auth.uid())
  );

-- Planner-only open reads (covers tables that never had hh policies, and
-- acts as a second gate alongside hh policies via AND... wait, OR.
-- So we MUST patch hh policies to require is_planner().)

do $$
declare
  t text;
  has_shared boolean;
  has_hh boolean;
begin
  foreach t in array array[
    'tasks','shopping_items','vendors','guests','bookings','performances',
    'notes','event_files','activity_log'
  ] loop
    select exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = t and column_name = 'household'
    ) into has_hh;
    select exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = t and column_name = 'shared'
    ) into has_shared;

    execute format('drop policy if exists %I on public.%I', 'hh read', t);
    execute format('drop policy if exists %I on public.%I', 'planner read ' || t, t);
    execute format('drop policy if exists %I on public.%I', 'read ' || t, t);

    if has_hh and has_shared then
      execute format(
        'create policy "hh read" on public.%I for select to authenticated using (public.is_planner() and (household = public.current_household() or shared or public.is_superadmin()))',
        t
      );
    elsif has_hh then
      execute format(
        'create policy "hh read" on public.%I for select to authenticated using (public.is_planner() and (household = public.current_household() or public.is_superadmin()))',
        t
      );
    else
      execute format(
        'create policy "planner read %s" on public.%I for select to authenticated using (public.is_planner())',
        t, t
      );
    end if;
  end loop;
end $$;

-- Task children
drop policy if exists "hh read" on public.task_assignees;
drop policy if exists "hh read" on public.task_checklist_items;
drop policy if exists "hh read" on public.task_comments;
drop policy if exists "read task_assignees" on public.task_assignees;
drop policy if exists "read checklist" on public.task_checklist_items;
drop policy if exists "read comments" on public.task_comments;

create policy "hh read" on public.task_assignees for select to authenticated
  using (public.is_planner() and exists (
    select 1 from public.tasks tk where tk.id = task_id
      and (tk.household = public.current_household() or tk.shared or public.is_superadmin())
  ));
create policy "hh read" on public.task_checklist_items for select to authenticated
  using (public.is_planner() and exists (
    select 1 from public.tasks tk where tk.id = task_id
      and (tk.household = public.current_household() or tk.shared or public.is_superadmin())
  ));
create policy "hh read" on public.task_comments for select to authenticated
  using (public.is_planner() and exists (
    select 1 from public.tasks tk where tk.id = task_id
      and (tk.household = public.current_household() or tk.shared or public.is_superadmin())
  ));

drop policy if exists "read own notifications" on public.notifications;
create policy "read own notifications" on public.notifications
  for select to authenticated
  using (public.is_planner() and profile_id = auth.uid());

-- realtime for new tables (ignore if already added)
do $$ begin
  alter publication supabase_realtime add table public.timeline_items;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.lookbooks;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.lookbook_photos;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.blessings;
exception when duplicate_object then null;
end $$;