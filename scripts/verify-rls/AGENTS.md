# AGENTS.md

## Purpose

Own the local RLS verification harness.

## Ownership

- `src/index.ts` owns the TypeScript verification runner.
- `sql/` owns SQL support fixtures for verification.
- `package.json` owns script entry points for this harness.

## Local Contracts

- Keep verification fixtures explicit and auditable.
- Do not log secrets or service-role values.
- Keep auth stubs limited to local verification behavior.

## Work Guidance

## Verification

- Run `pnpm --filter @worksie/verify-rls build` when changing the harness.
- Run the package verification script when local Supabase/database prerequisites
  are available.
- Root closeout still requires `pnpm lint` and `pnpm build`.

### Running without the Supabase CLI

`sql/00_supabase_auth_stubs.sql` provides `auth.uid()` and the `authenticated`
/ `service_role` roles, so the harness runs against plain Postgres. Use this
when the Supabase CLI is unavailable — it is the fastest way to prove a new
migration does not weaken the tenant boundary.

```bash
docker run -d --name worksie-verify \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=worksie \
  -p 55432:5432 postgres:15

# stubs first, then every migration in supabase/migrations/ in order
docker exec -i worksie-verify psql -U postgres -d worksie -v ON_ERROR_STOP=1 \
  < scripts/verify-rls/sql/00_supabase_auth_stubs.sql

WORKSIE_VERIFY_DATABASE_URL="postgres://postgres:postgres@127.0.0.1:55432/worksie" \
  pnpm --filter @worksie/verify-rls verify

docker rm -f worksie-verify
```

Match the container's `postgres:` major version to `supabase/config.toml`
(`major_version`), or the run proves nothing about the deployed database.

## Child DOX Index

- No child `AGENTS.md` files are currently required under `scripts/verify-rls/`.
