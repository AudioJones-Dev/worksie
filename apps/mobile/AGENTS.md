# AGENTS.md

## Purpose

Own the Worksie mobile field app.

## Ownership

- `app/` owns Expo Router screens and layout.
- `app.json`, `babel.config.js`, and Expo package settings own mobile runtime
  configuration.

## Local Contracts

- Use Expo, Expo Router, React Native, and TypeScript.
- Keep the mobile app aligned with the field-worker execution model in
  `docs/PRD.md` and `docs/WORK_ORDER_LIFECYCLE.md`.
- Do not implement offline/domain feature slices before the relevant phase
  gate is satisfied.

## Work Guidance

## Verification

- Run `pnpm --filter @worksie/mobile lint` when touching mobile app code.
- Run `pnpm --filter @worksie/mobile build` when touching screens, config, or
  mobile TypeScript.
- Root closeout still requires `pnpm lint` and `pnpm build`.

## Child DOX Index

- No child `AGENTS.md` files are currently required under `apps/mobile/`.
