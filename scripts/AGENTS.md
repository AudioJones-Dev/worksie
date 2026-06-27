# AGENTS.md

## Purpose

Own repository utility scripts and script-specific verification workflows.

## Ownership

- `verify-rls/` owns the RLS verification harness.
- Root owns repository-wide validation and safety rules.

## Local Contracts

- Scripts must avoid secret leakage in logs and generated output.
- Prefer deterministic, repeatable checks over one-off shell behavior.
- Do not add destructive scripts without explicit approval and documented
  rollback behavior.

## Work Guidance

## Verification

- Run the touched script package's verification command when available.
- Root closeout still requires `pnpm lint` and `pnpm build`.

## Child DOX Index

- `verify-rls/AGENTS.md` - RLS verification harness.
