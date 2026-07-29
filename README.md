# Rahul's Wedding Planner 💍

A premium, festive wedding-planning workspace — Mehendi to Walima — for the whole
family. Tasks, a critical vendor **Booking Tracker**, shopping, budget, guests,
vendors, analytics and more, with realtime sync, role-based access, dark mode and
confetti on milestones.

Built with **Next.js 16 (App Router) · React · TypeScript · Tailwind CSS v4 ·
shadcn/ui (Base UI) · Supabase (Auth/DB/Storage/Realtime) · Recharts · Framer
Motion · Lucide**.

---

## Features

- **Dashboard** — live countdown, animated emerald→gold progress ring, planning-%
  elapsed, urgent/today tasks, budget/shopping/booking/guest status, recent
  activity, quick notes, quick actions, and a red-flag banner for overdue bookings.
- **Events** — dynamic workspaces (Mehendi, Haldi, Nikah, Walima + add your own).
  Each has its own dashboard, tasks, shopping, budget, notes, files, members and
  completion %. Confetti fires when every task in an event is done.
- **Tasks** — Kanban (drag & drop), Table (with bulk edit), List and Calendar
  views. Priority, status, checklist, comments, assignees, completion %, and an
  urgency engine (Overdue/Critical/Urgent/Upcoming) that colours by due date.
- **Booking Tracker** — per-category booking status (Not Booked → Enquired →
  Negotiating → Booked → Confirmed) with an interactive stepper, contract upload,
  advances/balances, trials/fittings timeline, and a **lead-time urgency engine**
  that flags each unbooked category Red/Orange/Yellow/Green based on how close the
  wedding is versus that category's typical lead time (Venue ~9 mo, Makeup ~3 mo…).
- **Shopping** — categorised items, budget vs actual, stores, assignees, purchased
  toggle, receipt uploads.
- **Budget** — allocations & spend per event/category, advances, pending vendor
  payments, charts (allocated vs spent, spend breakdown).
- **Guests** — bride/groom side, family/friends/VIP, RSVP, invitations, food prefs,
  head counts, WhatsApp deep links, search & filters.
- **Vendors** — directory with ratings, advances, balances, WhatsApp/call links.
- **Analytics** — task progress per event, cumulative spend, RSVP breakdown,
  shopping by category (all colourblind-safe, light + dark).
- **Extras** — notification center, ⌘K global search, activity log, quick notes,
  settings (wedding date, members, roles), dark/light mode, mobile responsive.

## Roles

- **Admin** — full access (first account to sign up becomes Admin automatically).
- **Family / Volunteer** — read everything; edit only the tasks/shopping assigned
  to them. Enforced by Postgres Row Level Security, not just the UI.

---

## Requirements

- **Node.js 20+** (built and tested on Node 22). Next.js 16 will not run on old Node.
- **Docker Desktop** — only for running Supabase locally.
- **Supabase CLI** — `npx supabase` (no global install needed).

---

## Run locally

```bash
# 1. install deps
npm install

# 2. start the local Supabase stack (Docker). Applies migrations + seed.
npx supabase start

# 3. create .env.local from the values `supabase start` printed
cp .env.example .env.local
#   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from the CLI output>

# 4. run the app
npm run dev        # http://localhost:3000
```

The seed creates demo data and these logins (password `password123` for all):

| Email               | Role      |
| ------------------- | --------- |
| rahul@wedding.app   | Admin     |
| amma@wedding.app    | Family    |
| arjun@wedding.app   | Family    |
| priya@wedding.app   | Family    |
| zaid@wedding.app    | Volunteer |
| sara@wedding.app    | Volunteer |

---

## Use a hosted Supabase project

1. In the project's **SQL Editor**, run the migrations in order from
   [`supabase/migrations/`](supabase/migrations):
   `20260716000001_init.sql`, then `20260716000002_bookings.sql`, then
   `20260716000003_grants.sql`.
   (If the base schema is already applied and you only need the Booking Tracker,
   just run [`supabase/hosted-setup-bookings.sql`](supabase/hosted-setup-bookings.sql).)
2. (Optional) paste [`supabase/seed.sql`](supabase/seed.sql) to load demo data.
   Skip this for a clean workspace — just sign up in the app and the **first
   account becomes Admin**.
3. Create the two **public Storage buckets** if they weren't created by the
   migration: `wedding-files` and `receipts`.
4. Put your project URL + anon/publishable key in `.env.local`.

> **Note:** manually-seeded demo users need their auth token columns set to empty
> strings (GoTrue rejects NULLs). The seed handles this for local; on hosted,
> prefer signing up real accounts over pasting the demo users.

---

## Deploy to Vercel

1. Push this folder to a Git repo and import it in Vercel.
2. Set environment variables (Project → Settings → Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. In Supabase → Authentication → URL Configuration, add your Vercel domain to the
   redirect/site URLs.
4. Deploy. Next.js is auto-detected; no extra build config needed.

---

## Project structure

```
src/
  app/
    (app)/              authenticated area (shares the shell + auth gate)
      page.tsx          dashboard
      tasks/ bookings/ shopping/ budget/ guests/ vendors/ analytics/ activity/ settings/
      events/[id]/      dynamic event workspace
    login/              auth screen
    layout.tsx          root layout, self-hosted fonts
  components/
    shell/              sidebar, topbar, search, notifications, theme toggle
    dashboard/ tasks/ bookings/ budget/ shopping/ events/ charts/ shared/  feature UI
    ui/                 shadcn/ui (Base UI) primitives
  lib/
    data-context.tsx    realtime Supabase store (one subscription, all tables)
    wedding.ts          urgency engine, progress math, event themes, formatters
    bookings.ts         lead-time urgency + booking status/stats helpers
    supabase/           browser + server clients
  proxy.ts              auth middleware (Next 16 renamed middleware → proxy)
supabase/
  migrations/           schema, RLS, triggers, storage, realtime
  seed.sql              demo data
  hosted-setup-bookings.sql   paste-in Booking Tracker table for a hosted project
```
