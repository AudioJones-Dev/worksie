# AGENTS.md

## Purpose

Own Supabase local configuration, migrations, metadata, and seed SQL.

## Ownership

- `config.toml` owns local Supabase CLI configuration.
- `migrations/` owns checked-in SQL migrations and Drizzle metadata.
- `seed/` owns seed fixtures.
- `../packages/db/` owns Drizzle schema source and database client code.

## Local Contracts

- Treat migrations as durable database history; do not rewrite applied
  migration intent casually.
- Preserve RLS, policy, audit, and append-only behavior.
- Do not commit real secrets, service-role keys, client data, or credentialed
  fixtures.
- Coordinate schema changes with `packages/db/AGENTS.md`.

## Work Guidance

## Verification

- Run `supabase db reset` when migration or seed behavior must be validated
  and local Supabase is available.
- Run `pnpm --filter @worksie/db build` when migration changes correspond to
  Drizzle schema changes.
- Root closeout still requires `pnpm lint` and `pnpm build`.

## Child DOX Index

- `migrations/` and `seed/` are currently governed by this `supabase/AGENTS.md`.
