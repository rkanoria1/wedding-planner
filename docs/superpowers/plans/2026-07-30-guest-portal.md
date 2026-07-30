# Guest Portal Implementation Plan

> **For agentic workers:** Implement task-by-task. User authorized full build while AFK.

**Goal:** Ship guest portal with shared guest code, Timeline, Lookbook, Blessings, Moments, soft moderation.

**Architecture:** `(guest)` route group + middleware role gates + new Supabase tables/RLS.

**Tech Stack:** Next.js App Router, Supabase Auth/RLS, existing UI kit.

---

### Task 1: Schema + guest auth SQL
- Migration `20260730000009_guest_portal.sql`
- `setup-guest-login.sql`

### Task 2: Types + data context + middleware
### Task 3: Login tabs + guest shell
### Task 4: Guest feature pages
### Task 5: Family editors + moderation
### Task 6: Build verify
