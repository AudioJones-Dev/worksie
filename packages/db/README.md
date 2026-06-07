# @worksie/db

`@worksie/db` owns the Drizzle schema and database client for Worksie.

## Migration Ownership

- Drizzle schema source lives in `packages/db/src/schema/`.
- Generated and hand-written SQL migrations live in `supabase/migrations/`.
- Supabase CLI is the migration runner for local database state.
- Use `supabase db reset` to apply checked-in migrations locally.
- Use `drizzle-kit generate` only when intentionally generating a new
  Drizzle-authored schema migration.

`0001_phase_2_rls_and_audit.sql` is hand-written because it owns Supabase RLS,
policies, and audit/append-only behavior that should not be skipped by relying
on Drizzle migration metadata alone.
