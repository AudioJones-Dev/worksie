# AGENTS.md

## Purpose

Own the Worksie web admin app.

## Ownership

- `src/app/` owns App Router routes, layouts, global CSS, and route handlers.
- `src/lib/supabase/` owns web Supabase clients.
- `src/lib/tenant/` owns tenant context helpers.
- `src/middleware.ts` owns request middleware.

## Local Contracts

- Use Next.js App Router with TypeScript and Tailwind.
- Keep Supabase SSR/browser client behavior tenant-safe.
- Preserve `GET /healthz` behavior unless the task explicitly changes the
  health contract.
- Do not introduce Firebase or Firebase-compatible dependencies.

## Work Guidance

## Verification

- Run `pnpm --filter @worksie/web lint` when touching web app code.
- Run `pnpm --filter @worksie/web build` when touching routes, middleware,
  configs, Supabase helpers, or UI.
- Root closeout still requires `pnpm lint` and `pnpm build`.

## Child DOX Index

- No child `AGENTS.md` files are currently required under `apps/web/`.
