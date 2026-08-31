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

## Drizzle Metadata Reconstruction

`supabase/migrations/meta/` was reconstructed after the fact. Read this before
touching it.

- `0000_snapshot.json` describes the schema **after**
  `0002_phase_2_schema_rls_hardening.sql`, not after `0000`. It was regenerated
  in place when `src/schema/tables.ts` was hardened to tenant-scoped composite
  foreign keys, without a new snapshot file being written.
- `0001_snapshot.json` and `0002_snapshot.json` are **copies** of that same
  content with chained `prevId` values. They are not faithful historical states
  and must not be read as a record of what the schema looked like at those
  points. They exist so the snapshot chain is well-formed and so `drizzle-kit`
  numbers the next generated migration correctly.
- Only the newest snapshot is used as the diff base, so duplicating rather than
  reconstructing costs nothing mechanically. Reconstructing a faithful pre-`0002`
  snapshot by hand would be error-prone and would not change any output.
- `_journal.json` entries for `0001` and `0002` use the git author timestamps of
  those migration files, not the time the entries were added.

Without these entries `drizzle-kit generate` numbered its next output `0001_`,
colliding with the already-applied `0001_phase_2_rls_and_audit.sql`. The Supabase
CLI applies migrations in filename order, so that collision would make ordering
depend on lexical accident.

Never renumber or rename an existing migration file: the Supabase CLI tracks
applied migrations by name, and renaming one breaks tracking wherever it has
already run.
