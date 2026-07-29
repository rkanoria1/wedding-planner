-- ============================================================
-- RAHUL'S WEDDING PLANNER — initial schema
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- enums ----------
create type public.user_role as enum ('admin', 'family', 'volunteer');
create type public.task_status as enum ('not_started', 'in_progress', 'waiting', 'blocked', 'completed', 'cancelled');
create type public.task_priority as enum ('critical', 'high', 'medium', 'low');
create type public.rsvp_status as enum ('pending', 'confirmed', 'declined', 'maybe');
create type public.guest_side as enum ('bride', 'groom', 'both');
create type public.guest_group as enum ('family', 'friends', 'vip');
create type public.payment_kind as enum ('expense', 'advance', 'vendor_payment');

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default 'Guest',
  role public.user_role not null default 'family',
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ---------- app settings (singleton) ----------
create table public.app_settings (
  id int primary key default 1 check (id = 1),
  couple_names text not null default 'Rahul & Somya',
  wedding_date date not null default '2027-01-29',
  planning_start date not null default current_date,
  currency text not null default '₹'
);
insert into public.app_settings (id) values (1);

-- ---------- events ----------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  event_date date,
  theme text not null default 'emerald',      -- gradient key: henna | marigold | emerald | champagne | rose | sapphire | sunset | lavender
  icon text not null default 'Sparkles',
  venue text,
  archived boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.event_members (
  event_id uuid not null references public.events (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  primary key (event_id, profile_id)
);

-- ---------- tasks ----------
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events (id) on delete cascade,
  name text not null,
  description text,
  category text not null default 'General',
  priority public.task_priority not null default 'medium',
  status public.task_status not null default 'not_started',
  due_date date,
  completion int not null default 0 check (completion between 0 and 100),
  sort_order int not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.task_assignees (
  task_id uuid not null references public.tasks (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  primary key (task_id, profile_id)
);

create table public.task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  label text not null,
  done boolean not null default false,
  sort_order int not null default 0
);

create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

-- ---------- shopping ----------
create table public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events (id) on delete cascade,
  name text not null,
  category text not null default 'Clothes',
  quantity int not null default 1,
  budget numeric(12,2) not null default 0,
  actual_price numeric(12,2),
  store text,
  purchased boolean not null default false,
  assigned_to uuid references public.profiles (id) on delete set null,
  receipt_url text,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------- budget ----------
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events (id) on delete cascade,
  category text not null,
  allocated numeric(12,2) not null default 0,
  unique nulls not distinct (event_id, category)
);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'Other',
  phone text,
  total_amount numeric(12,2) not null default 0,
  advance_paid numeric(12,2) not null default 0,
  booked boolean not null default false,
  rating int check (rating between 1 and 5),
  notes text,
  created_at timestamptz not null default now()
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events (id) on delete cascade,
  vendor_id uuid references public.vendors (id) on delete set null,
  category text not null default 'General',
  description text not null,
  amount numeric(12,2) not null default 0,
  kind public.payment_kind not null default 'expense',
  paid boolean not null default true,
  paid_on date default current_date,
  created_at timestamptz not null default now()
);

-- ---------- guests ----------
create table public.guests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  side public.guest_side not null default 'groom',
  grp public.guest_group not null default 'family',
  rsvp public.rsvp_status not null default 'pending',
  invitation_sent boolean not null default false,
  food_pref text,
  phone text,
  head_count int not null default 1,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------- notifications / activity / notes / files ----------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  detail text,
  created_at timestamptz not null default now()
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  body text not null,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.event_files (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events (id) on delete cascade,
  name text not null,
  path text not null,
  size bigint not null default 0,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- helper functions
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_task_assignee(t_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.task_assignees where task_id = t_id and profile_id = auth.uid());
$$;

-- first sign-up becomes admin; others default to role in metadata or 'family'
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  new_role public.user_role;
begin
  if (select count(*) from public.profiles) = 0 then
    new_role := 'admin';
  else
    new_role := coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'family');
  end if;
  insert into public.profiles (id, full_name, role, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new_role,
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- only admins may change roles
create or replace function public.guard_role_change()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only an admin can change roles';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_role_change();

-- keep tasks.updated_at / completed_at in sync
create or replace function public.touch_task()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  if new.status = 'completed' and old.status is distinct from 'completed' then
    new.completed_at := now();
    new.completion := 100;
  elsif new.status <> 'completed' then
    new.completed_at := null;
  end if;
  return new;
end;
$$;

create trigger tasks_touch
  before update on public.tasks
  for each row execute function public.touch_task();

-- notify a member when they are assigned a task
create or replace function public.notify_task_assignment()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  t record;
begin
  select name, event_id into t from public.tasks where id = new.task_id;
  if new.profile_id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000') then
    insert into public.notifications (profile_id, title, body, link)
    values (new.profile_id, 'New task assigned to you', t.name, '/tasks?task=' || new.task_id);
  end if;
  return new;
end;
$$;

create trigger task_assignee_notify
  after insert on public.task_assignees
  for each row execute function public.notify_task_assignment();

-- ============================================================
-- row level security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.app_settings enable row level security;
alter table public.events enable row level security;
alter table public.event_members enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;
alter table public.task_checklist_items enable row level security;
alter table public.task_comments enable row level security;
alter table public.shopping_items enable row level security;
alter table public.budgets enable row level security;
alter table public.vendors enable row level security;
alter table public.expenses enable row level security;
alter table public.guests enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_log enable row level security;
alter table public.notes enable row level security;
alter table public.event_files enable row level security;

-- everyone signed in can read the workspace
create policy "read profiles" on public.profiles for select to authenticated using (true);
create policy "read settings" on public.app_settings for select to authenticated using (true);
create policy "read events" on public.events for select to authenticated using (true);
create policy "read event_members" on public.event_members for select to authenticated using (true);
create policy "read tasks" on public.tasks for select to authenticated using (true);
create policy "read task_assignees" on public.task_assignees for select to authenticated using (true);
create policy "read checklist" on public.task_checklist_items for select to authenticated using (true);
create policy "read comments" on public.task_comments for select to authenticated using (true);
create policy "read shopping" on public.shopping_items for select to authenticated using (true);
create policy "read budgets" on public.budgets for select to authenticated using (true);
create policy "read vendors" on public.vendors for select to authenticated using (true);
create policy "read expenses" on public.expenses for select to authenticated using (true);
create policy "read guests" on public.guests for select to authenticated using (true);
create policy "read activity" on public.activity_log for select to authenticated using (true);
create policy "read notes" on public.notes for select to authenticated using (true);
create policy "read files" on public.event_files for select to authenticated using (true);

-- profiles: update own row (role change guarded by trigger) or admin
create policy "update own profile" on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin());

-- settings: admin only
create policy "admin update settings" on public.app_settings for update to authenticated
  using (public.is_admin());

-- admin-managed tables
create policy "admin write events" on public.events for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin write event_members" on public.event_members for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin write budgets" on public.budgets for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin write vendors" on public.vendors for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin write expenses" on public.expenses for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin write guests" on public.guests for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin write task_assignees" on public.task_assignees for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- tasks: admin full; assignees may update their own tasks
create policy "admin insert tasks" on public.tasks for insert to authenticated
  with check (public.is_admin());
create policy "admin delete tasks" on public.tasks for delete to authenticated
  using (public.is_admin());
create policy "update tasks" on public.tasks for update to authenticated
  using (public.is_admin() or public.is_task_assignee(id));

-- checklist: admin or task assignee
create policy "write checklist" on public.task_checklist_items for all to authenticated
  using (public.is_admin() or public.is_task_assignee(task_id))
  with check (public.is_admin() or public.is_task_assignee(task_id));

-- comments: anyone signed in can comment as themselves; author or admin can delete
create policy "insert comments" on public.task_comments for insert to authenticated
  with check (author_id = auth.uid());
create policy "delete comments" on public.task_comments for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

-- shopping: admin full; assigned member can update their item
create policy "admin insert shopping" on public.shopping_items for insert to authenticated
  with check (public.is_admin());
create policy "admin delete shopping" on public.shopping_items for delete to authenticated
  using (public.is_admin());
create policy "update shopping" on public.shopping_items for update to authenticated
  using (public.is_admin() or assigned_to = auth.uid());

-- notifications: own only (insert open so triggers/app can fan out)
create policy "read own notifications" on public.notifications for select to authenticated
  using (profile_id = auth.uid());
create policy "insert notifications" on public.notifications for insert to authenticated
  with check (true);
create policy "update own notifications" on public.notifications for update to authenticated
  using (profile_id = auth.uid());
create policy "delete own notifications" on public.notifications for delete to authenticated
  using (profile_id = auth.uid());

-- activity: append-only from the app
create policy "insert activity" on public.activity_log for insert to authenticated
  with check (actor_id = auth.uid());

-- notes: author or admin
create policy "insert notes" on public.notes for insert to authenticated
  with check (author_id = auth.uid());
create policy "update notes" on public.notes for update to authenticated
  using (author_id = auth.uid() or public.is_admin());
create policy "delete notes" on public.notes for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

-- files: any member can upload; uploader or admin can delete
create policy "insert files" on public.event_files for insert to authenticated
  with check (uploaded_by = auth.uid());
create policy "delete files" on public.event_files for delete to authenticated
  using (uploaded_by = auth.uid() or public.is_admin());

-- ============================================================
-- storage buckets
-- ============================================================

insert into storage.buckets (id, name, public)
values ('wedding-files', 'wedding-files', true), ('receipts', 'receipts', true)
on conflict (id) do nothing;

create policy "authenticated upload wedding files" on storage.objects for insert to authenticated
  with check (bucket_id in ('wedding-files', 'receipts'));
create policy "public read wedding files" on storage.objects for select
  using (bucket_id in ('wedding-files', 'receipts'));
create policy "authenticated delete wedding files" on storage.objects for delete to authenticated
  using (bucket_id in ('wedding-files', 'receipts'));

-- ============================================================
-- realtime
-- ============================================================

alter publication supabase_realtime add table
  public.profiles, public.app_settings, public.events, public.event_members,
  public.tasks, public.task_assignees, public.task_checklist_items, public.task_comments,
  public.shopping_items, public.budgets, public.vendors, public.expenses,
  public.guests, public.notifications, public.activity_log, public.notes, public.event_files;
