-- ============================================================
-- Give each QR its own context, so a code placed in a hotel room can
-- greet guests differently from one on an invitation card or venue sign.
-- ============================================================

alter table public.guest_invites
  add column if not exists variant text not null default 'general',
  add column if not exists heading text,
  add column if not exists message text,
  add column if not exists focus_event_id uuid references public.events(id) on delete set null;

alter table public.guest_invites drop constraint if exists guest_invites_variant_check;
alter table public.guest_invites
  add constraint guest_invites_variant_check
  check (variant in ('general', 'room', 'venue'));

-- Redeem now also returns the context, so /g/<token> can personalise the
-- landing. Still SECURITY DEFINER: the table itself stays unreadable, so
-- tokens can't be enumerated.
drop function if exists public.redeem_guest_invite(text);
create or replace function public.redeem_guest_invite(t text)
returns table (ok boolean, variant text, heading text, message text, focus_event_id uuid)
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.guest_invites gi
  set uses = gi.uses + 1, last_used_at = now()
  where gi.token = t and gi.active;

  return query
  select true, gi.variant, gi.heading, gi.message, gi.focus_event_id
  from public.guest_invites gi
  where gi.token = t and gi.active;

  if not found then
    return query select false, null::text, null::text, null::text, null::uuid;
  end if;
end;
$$;

revoke all on function public.redeem_guest_invite(text) from public;
grant execute on function public.redeem_guest_invite(text) to anon, authenticated;

-- Look up an already-redeemed invite's display fields (no token listing).
create or replace function public.guest_invite_context(t text)
returns table (variant text, heading text, message text, focus_event_id uuid)
language sql
security definer
set search_path = public
as $$
  select gi.variant, gi.heading, gi.message, gi.focus_event_id
  from public.guest_invites gi
  where gi.token = t and gi.active;
$$;

revoke all on function public.guest_invite_context(text) from public;
grant execute on function public.guest_invite_context(text) to anon, authenticated;
