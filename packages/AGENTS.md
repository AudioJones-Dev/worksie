# AGENTS.md

## Purpose

Own shared workspace package contracts for Worksie.

## Ownership

- `auth/` owns shared auth and tenant helpers.
- `config/` owns the shared ESLint preset.
- `db/` owns Drizzle schema and database client.
- `domain/` owns shared domain constants and state names.

Worksie does not maintain a shared utility-type package or a shared UI package.
Brand design tokens are recorded in `docs/01-SPECIFICATION/DESIGN_TOKENS.md`.
Introducing either package again requires a real second consumer first.

## Local Contracts

- Keep package APIs stable and intentional; shared package changes can affect
  both web and mobile.
- Preserve TypeScript strictness and workspace package imports.
- Do not move database schema ownership out of `packages/db`.

## Work Guidance

## Verification

- Run the touched package's lint/build/typecheck script when available.
- Root closeout still requires `pnpm lint` and `pnpm build`.

## Child DOX Index

- `db/AGENTS.md` - Drizzle schema, database client, and migration ownership.
- `auth/`, `config/`, and `domain/` are currently governed by this
  `packages/AGENTS.md`.
