# Guest Portal Design — Rahul & Somya Wedding

**Date:** 2026-07-30  
**Status:** Approved in brainstorming; awaiting user review of this spec  
**Scope:** Shared guest-code access + guest-only experience (Timeline, Lookbook, Blessings, Moments) with soft moderation. No planning surfaces for guests.

---

## Goals

- Give wedding guests a beautiful, emotional portal — not the family planning app.
- Guests authenticate with one shared **guest access code**.
- Guests can **view** curated content and **contribute** blessings & photos.
- Family retains full planner; can **hide/delete** guest posts (soft moderation).
- Guests must never see tasks, bookings, shopping, vendors, guest-list admin, settings, activity, or family switcher.

## Non-goals

- Per-guest invite links / personal accounts.
- Approve-before-publish workflow.
- Budget / cost features (already removed from planner UI).
- Simple mode for parents (explicitly declined).

---

## Decisions (locked)

| Topic | Choice |
|--------|--------|
| Login | Shared guest access code (same pattern as family codes) |
| Permissions | View + contribute (blessings & photos) |
| Identity | Display name asked once, stored in `localStorage` |
| Moderation | Soft — posts live immediately; family can hide/delete |
| Architecture | Separate guest portal route group + guest shell |

---

## Architecture

### Auth

- Add a dedicated Supabase auth user, e.g. `guests@rahul-somya.app`, password = guest code.
- Setup via SQL script mirroring `supabase/setup-family-login.sql`.
- Profile: `role = 'guest'`, `full_name` can be “Wedding Guests” (display name for posts comes from localStorage, not profile).
- Extend `UserRole`: `"admin" | "family" | "volunteer" | "guest"`.

### Login UX

- Login page offers clear paths: **Family** vs **Guest** (or single code field that tries family emails first, then guest email).
- Preferred: explicit toggle/tabs so guests don’t confuse codes.
- On success: guests → guest Home; family → planner `/`.

### Routing

- **Guest route group:** e.g. `src/app/(guest)/…` with its own layout/shell.
  - `/` guest home (or `/welcome` — pick one canonical path and redirect).
  - `/timeline`
  - `/lookbook`
  - `/blessings`
  - `/moments`
- **Planner route group:** existing `(app)` routes unchanged for non-guest roles.
- **Middleware (`proxy.ts`):**
  - Unauthenticated → `/login`
  - `role === guest` on planner routes → redirect to guest Home
  - Non-guest on guest-only routes → redirect to planner `/` (keep portals separate by default)

### Guest shell

Nav only:

1. Home  
2. Timeline  
3. Lookbook  
4. Blessings  
5. Moments  

No global search over planning data, no notifications center tied to tasks, no family switcher, no admin compare.

First visit after login: lightweight modal/sheet — “What should we call you?” → save `guestDisplayName` in `localStorage`.

---

## Features

### Home

- Couple names, wedding date, countdown.
- Next upcoming celebration (from events / timeline).
- Large entry cards into Timeline, Lookbook, Blessings, Moments.
- No planning progress rings, overdue bookings, shopping stats, etc.

### Ceremony Timeline (guest: read-only)

**Family (planner):**  
CRUD timeline items per `event_id`: `starts_at` (time or datetime), `title`, optional `note`, optional `people` (free text), `sort_order`, `published` (default true).

**Guest:**  
Event switcher (Mehendi / Sangeet / Phera…). Vertical jewel-box timeline of published items.

### Event Lookbook (guest: read-only)

**Family (planner):**  
Per event lookbook: cover image, outfit notes, jewelry notes, color swatches (list of hex/labels), reference photo URLs, `published`.

**Guest:**  
Browse boards per event; gallery/swipe presentation. No editing.

### Blessings Wall (guest: contribute)

- Guests submit `{ body, author_label, hidden default false }`.
- Author label = display name from localStorage.
- Appear immediately on the wall.
- Family can set `hidden = true` or delete from planner moderation UI.

### Moments / photos (guest: contribute)

- Reuse or extend `photos` table with:
  - `source`: `'family' | 'guest'`
  - `author_label`: text for guest uploads
  - `hidden`: boolean (default false)
  - optional `caption`
- Guests upload to storage; row created with `source = guest`.
- Gallery for guests shows non-hidden photos (family + guest, or guest-facing published set — prefer all non-hidden for a shared Moments feel).
- Family can hide/delete; filter “From guests” in planner Moments.

### Optional later (same portal, out of v1)

- Travel / stay tips page  
- “Who’s who” (couple & parents)  
- Voice blessings  

---

## Data model (new / extended)

### New tables

**`timeline_items`**
- `id`, `event_id`, `starts_at` (timestamptz or time+date), `title`, `note`, `people`, `sort_order`, `published`, `created_at`

**`lookbooks`** (one per event) or **`lookbook_items`**
- Prefer: `lookbooks` (`event_id` unique, cover_url, outfit_notes, jewelry_notes, colors jsonb, published)
- Plus `lookbook_photos` (`lookbook_id`, `url`, `caption`, `sort_order`) if multiple refs needed

**`blessings`**
- `id`, `body`, `author_label`, `hidden`, `created_at`
- Optional `created_by` (guest auth user id) for audit

### Extend `photos`
- `source`, `author_label`, `hidden`, `caption` (if missing)

### Profiles
- Allow `role = 'guest'`

---

## RLS (summary)

| Table | Guest | Family/Admin |
|--------|--------|----------------|
| timeline_items | SELECT where `published` | full CRUD |
| lookbooks / lookbook_photos | SELECT where `published` | full CRUD |
| blessings | INSERT; SELECT where `not hidden` | full + hide |
| photos | INSERT (guest source); SELECT where `not hidden` | full + hide |
| tasks, bookings, shopping_items, vendors, guests, notes, etc. | **deny** | existing policies |

Exact policy SQL lands in a migration; principle is deny-by-default for planning tables for `guest` role.

---

## Family moderation UX

- Moments: filter “Guest uploads”; hide / delete actions.
- Blessings: list in planner (new page or Moments-adjacent panel) with hide / delete.
- Timeline & Lookbook editors: under each event in planner (tabs or Settings → events), admin-only.

---

## Implementation phases

1. **Foundation** — `guest` role, guest auth SQL, login UX, middleware redirects, empty guest shell + Home.  
2. **Timeline** — schema + family editor + guest view.  
3. **Lookbook** — schema + family editor + guest view.  
4. **Blessings + Moments contribute** — schema flags, guest posting, soft mod UI.  
5. **Polish** — motion, empty states, shareable deep links within guest portal.

---

## Success criteria

- Guest code opens only the five guest areas; deep-linking to `/tasks` redirects Home.
- Family planner unchanged for planning workflows.
- Guest can post a blessing and a photo that appear immediately and can be hidden by admin.
- RLS prevents guest client from reading planning tables even if UI is bypassed.

---

## Open points (resolved defaults)

- Canonical guest base path: **`/welcome`** as guest Home, with sibling routes under `(guest)`.  
- Login: **explicit Family | Guest tabs** (not silent code probing only).  
- Voice blessings: **not in v1**.
