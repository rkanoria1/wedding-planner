-- ============================================================
-- Remove the Budget / expense-tracking module entirely.
-- Dropping the tables cascades their policies, triggers and FKs,
-- and removes them from the realtime publication automatically.
-- ============================================================

drop table if exists public.expenses cascade;
drop table if exists public.budgets cascade;
