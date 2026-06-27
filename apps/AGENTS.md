# AGENTS.md

## Purpose

Own application workspace rules for Worksie user-facing apps.

## Ownership

- `apps/web/` owns the Next.js web admin app.
- `apps/mobile/` owns the Expo mobile field app.
- Root owns product phase discipline, remote iPhone workflow, branch/PR rules,
  and repository-wide validation.

## Local Contracts

- App changes must preserve the canonical stack in `README.md`.
- Do not implement domain features before the Phase 3 auth, RLS, and tenancy
  boundary is in place.
- UI changes must follow the root remote iPhone workflow: desktop and iPhone
  screenshots committed under `docs/screenshots/<pr-or-branch>/` and linked
  in the PR.

## Work Guidance

## Verification

- Run `pnpm lint` and `pnpm build` from the repository root before declaring
  app work done.
- For UI changes, run a Playwright screenshot pass at desktop `1440x1200` and
  iPhone `390x844` viewports.

## Child DOX Index

- `web/AGENTS.md` - Next.js admin app.
- `mobile/AGENTS.md` - Expo field app.
