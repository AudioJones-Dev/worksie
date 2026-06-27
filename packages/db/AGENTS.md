# AGENTS.md

## Purpose

Own the Worksie database schema source, Drizzle client surface, and migration
coordination contract.

## Ownership

- `src/schema/` is the Drizzle schema source of truth.
- `src/client.ts` owns the database client.
- `drizzle.config.ts` owns Drizzle generation configuration.
- `../../supabase/migrations/` owns checked-in SQL migrations applied by the
  Supabase CLI.

## Local Contracts

- Follow `packages/db/README.md` for migration ownership.
- Use `drizzle-kit generate` only when intentionally generating a new
  Drizzle-authored schema migration.
- Hand-written RLS, policy, audit, and append-only behavior belongs in
  Supabase SQL migrations and must not be skipped because Drizzle metadata
  exists.
- Do not weaken tenant boundaries, RLS assumptions, audit behavior, or schema
  hard rules without an explicit task spec.

## Work Guidance

## Verification

- Run `pnpm --filter @worksie/db build` for database package changes.
- Run `supabase db reset` when migration behavior must be validated and local
  Supabase is available.
- Root closeout still requires `pnpm lint` and `pnpm build`.

## Child DOX Index

- No child `AGENTS.md` files are currently required under `packages/db/`.
