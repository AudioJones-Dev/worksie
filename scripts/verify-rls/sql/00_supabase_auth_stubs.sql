-- Supabase auth surface stubs for local RLS verification.
--
-- The canonical migrations depend on:
--   - auth.uid()         (returns the current JWT 'sub' claim)
--   - role `authenticated`
--   - role `service_role`
--
-- A real Supabase project provides these. For a plain Postgres used in
-- CI / local verification we stub them faithfully enough that the RLS
-- policies behave identically to a real environment.

CREATE SCHEMA IF NOT EXISTS auth;

-- Roles. `service_role` is created but the verify-rls script never
-- switches to it — it stays on the superuser to bypass RLS for seeding
-- and assertion-time queries that need to see across tenants.
DO $$ BEGIN
  CREATE ROLE authenticated;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE ROLE service_role;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- auth.uid(): read the `sub` claim from the request GUC. Mirrors the
-- behaviour Supabase's GoTrue layer injects via PostgREST.
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

-- Allow `authenticated` to use the public schema and read tables. RLS
-- still gates row visibility — these grants are required so policy
-- predicates can even be evaluated.
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
