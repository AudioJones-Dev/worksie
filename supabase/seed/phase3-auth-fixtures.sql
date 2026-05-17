-- Phase 3 local-only auth fixtures.
--
-- Creates two operator-tenant pairs you can sign into via the Supabase
-- local dashboard's "Authentication → Users → Invite user" flow. After
-- you create an auth.users row by email, paste its id below and run
-- this file with `psql` against the local Supabase Postgres.
--
-- DO NOT run this in production. It hardcodes test emails and uses
-- deterministic UUIDs so reruns are idempotent.
--
-- Usage:
--   1. supabase start
--   2. supabase db reset            # applies 0000 + 0001
--   3. Create two test users in Supabase Studio (or supabase auth admin):
--        operator-a@worksie.test
--        operator-b@worksie.test
--      Copy each user's id (auth.users.id).
--   4. Replace the placeholders below and run:
--        psql "$WORKSIE_VERIFY_DATABASE_URL" -f supabase/seed/phase3-auth-fixtures.sql

-- ---- Replace these two before running. -----------------------------------
\set auth_a_id   '00000000-0000-0000-0000-000000000001'
\set auth_b_id   '00000000-0000-0000-0000-000000000002'

-- Deterministic Worksie ids so the seed is rerunnable.
\set tenant_a    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
\set tenant_b    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
\set user_a      'a1111111-1111-1111-1111-111111111111'
\set user_b      'b1111111-1111-1111-1111-111111111111'

BEGIN;

INSERT INTO tenants (id, name, timezone)
VALUES
  (:'tenant_a', 'Acme Ramps', 'America/Chicago'),
  (:'tenant_b', 'Sunbelt Lifts', 'America/Denver')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, auth_user_id, email, display_name)
VALUES
  (:'user_a', :'auth_a_id', 'operator-a@worksie.test', 'Operator A'),
  (:'user_b', :'auth_b_id', 'operator-b@worksie.test', 'Operator B')
ON CONFLICT (id) DO NOTHING;

INSERT INTO memberships (tenant_id, user_id, role, status)
VALUES
  (:'tenant_a', :'user_a', 'operator', 'active'),
  (:'tenant_b', :'user_b', 'operator', 'active')
ON CONFLICT (tenant_id, user_id) DO NOTHING;

COMMIT;
