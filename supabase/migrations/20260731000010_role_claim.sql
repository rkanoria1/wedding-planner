-- ============================================================
-- Put the user's role into auth.users.raw_app_meta_data so the
-- middleware can read it straight from the JWT instead of querying
-- the profiles table on EVERY navigation (that query was ~half the
-- per-click latency).
--
-- app_metadata is chosen deliberately: unlike user_metadata it cannot
-- be changed by the user, only by the service role — so it stays a
-- trustworthy signal. public.profiles remains the source of truth and
-- a trigger keeps the claim in sync.
-- ============================================================

create or replace function public.sync_role_claim()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update auth.users
  set raw_app_meta_data =
        coalesce(raw_app_meta_data, '{}'::jsonb)
        || jsonb_build_object('role', new.role::text)
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists sync_role_claim_trg on public.profiles;
create trigger sync_role_claim_trg
  after insert or update of role on public.profiles
  for each row execute function public.sync_role_claim();

-- backfill everyone who already exists
update auth.users u
set raw_app_meta_data =
      coalesce(u.raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object('role', p.role::text)
from public.profiles p
where p.id = u.id
  and coalesce(u.raw_app_meta_data ->> 'role', '') is distinct from p.role::text;
