-- ============================================================
-- Table privileges for the API roles. Row visibility is still
-- governed by the RLS policies defined in the earlier migrations;
-- these grants only give the roles the base privilege PostgREST needs.
-- ============================================================

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- keep future tables working too
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage, select on sequences to authenticated;
