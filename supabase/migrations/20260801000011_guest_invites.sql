-- ============================================================
-- Revocable QR invite tokens.
--
-- Previously the QR encoded the guest password itself (/g/welcome2027),
-- which leaked it into browser history, screenshots and logs — and the
-- same string could be typed into the login form. Now the QR carries an
-- opaque random token that is NOT a credential: it can be revoked or
-- reissued without changing the guest code, and it grants nothing on its
-- own (the server exchanges it for the guest session).
--
-- Tokens are never selectable in bulk — redemption goes through a
-- SECURITY DEFINER function so they can't be enumerated.
-- ============================================================

create table if not exists public.guest_invites (
  token text primary key,
  label text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  uses int not null default 0
);

alter table public.guest_invites enable row level security;

-- planners manage invites; nobody else can read the table at all
drop policy if exists "planner manage invites" on public.guest_invites;
create policy "planner manage invites" on public.guest_invites
  for all to authenticated
  using (public.is_planner())
  with check (public.is_planner());

grant select, insert, update, delete on public.guest_invites to authenticated;

-- Redeem: returns true and records usage. Callable by anonymous scanners.
-- SECURITY DEFINER so the table itself stays unreadable (no enumeration).
create or replace function public.redeem_guest_invite(t text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  ok boolean;
begin
  update public.guest_invites
  set uses = uses + 1, last_used_at = now()
  where token = t and active
  returning true into ok;

  return coalesce(ok, false);
end;
$$;

revoke all on function public.redeem_guest_invite(text) from public;
grant execute on function public.redeem_guest_invite(text) to anon, authenticated;
