# @worksie/db

`@worksie/db` owns the Drizzle schema and database client for Worksie.

## Migration Ownership

- Drizzle schema source lives in `packages/db/src/schema/`.
- Generated and hand-written SQL migrations live in `supabase/migrations/`.
- Supabase CLI is the migration runner for local database state.
- Use `supabase db reset` to apply checked-in migrations locally.
- Use `drizzle-kit generate` only when intentionally generating a new
  Drizzle-authored schema migration.

`0001_phase_2_rls_and_audit.sql` and `0002_phase_2_schema_rls_hardening.sql`
are hand-written because they own Supabase RLS, policies, audit/append-only
behavior, and column-scoped `SET NULL` composite FKs that Drizzle cannot emit.
None of that should be skipped by relying on Drizzle migration metadata alone.

## Journal Adoption

Every migration in `supabase/migrations/` must have a matching entry in
`meta/_journal.json`, including hand-written ones.

`drizzle-kit` derives the next filename prefix from the last journal entry:

```js
const idx = lastEntryInJournal === undefined ? 0 : lastEntryInJournal.idx + 1;
```

A hand-written migration that is not journalled therefore does not advance the
counter, and the next `drizzle-kit generate` reuses a prefix that is already on
disk. Because the Supabase CLI applies migrations in filename order, the new
migration would sort ahead of later hand-written ones and run out of sequence.

When adding a hand-written migration:

1. Append a `_journal.json` entry — `idx`, `version: "7"`, `when` (epoch ms),
   `tag` matching the `.sql` basename, `breakpoints: true`.
2. Add `meta/<prefix>_snapshot.json`. If the migration changes nothing Drizzle
   models (RLS, policies, triggers, functions), copy the previous snapshot and
   set `id` to a fresh UUID and `prevId` to the previous snapshot's `id`.
   `drizzle-kit` diffs against the **last** journalled snapshot, so this chain
   must stay unbroken or the next generated migration will be wrong.
3. Confirm `pnpm --filter @worksie/db generate` reports
   `No schema changes, nothing to migrate` before committing.
