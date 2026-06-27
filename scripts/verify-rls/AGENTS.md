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

## Child DOX Index

- No child `AGENTS.md` files are currently required under `scripts/verify-rls/`.
