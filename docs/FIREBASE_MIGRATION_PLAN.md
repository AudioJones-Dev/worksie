# Firebase Migration / Removal Plan

> **Phase 1 status (`feat/phase-1-monorepo-scaffold`):** the legacy
> artifacts inventoried below have been **removed**. The `Worksie/`
> subfolder and the top-level `config/` directory no longer exist. Docs,
> dataset, and prompts now live at repo root. Sections below preserve the
> original plan for historical context.

Worksie's current scaffold contains Firebase code from the previous direction.
That direction is retired (see `TECH_STACK_DECISION.md`). This document
inventories the remaining Firebase artifacts and classifies each one.

## Classification Legend

- **Remove now** — delete in this branch; nothing depends on it post-decision.
- **Archive as legacy** — keep on disk for reference until Phase 1
  scaffolding lands, then delete.
- **Replace later** — wiring must be re-implemented on the canonical stack.
  Keep the file in place for now so we don't break the existing dev build;
  delete when its replacement ships.

This branch (`claude/remove-firebase-stack-decision-*`) is a **decision
branch**, not a code-rip branch. Source files referenced by `App.jsx` stay in
place so the existing scaffold continues to build for anyone who clones it
between now and Phase 1. The "Remove now" items here are the docs/config
files that would otherwise mislead future agents.

## Inventory

| Path                                              | Type                       | Classification     | Notes                                                                                  |
|---------------------------------------------------|----------------------------|--------------------|----------------------------------------------------------------------------------------|
| `Worksie/firebase.json`                           | Hosting config             | Archive as legacy  | Vercel + EAS replace this. Delete in Phase 1.                                          |
| `Worksie/public/firebase-messaging-sw.js`         | FCM service worker         | Replace later      | Push notifications move to Expo Push (mobile) and web push if/when needed.             |
| `Worksie/src/logic/firebase.js`                   | Firebase init + FCM token  | Replace later      | Replaced by Supabase client init and Expo push registration.                           |
| `Worksie/src/logic/remoteConfig.js`               | Firebase Remote Config     | Replace later      | Replaced by a Postgres-backed config table; reads via Supabase client.                 |
| `Worksie/src/App.jsx`                             | App entrypoint             | Replace later      | Currently imports `firebase.js` and `remoteConfig.js`. Rewritten in Phase 1.           |
| `Worksie/package.json` (`firebase` dep)           | npm dependency             | Replace later      | Drop when Phase 1 monorepo scaffolding lands.                                          |
| `Worksie/scripts/deploy.sh`                       | Firebase deploy script     | Remove now         | Replaced by Vercel + EAS workflows. No legacy value.                                   |
| `config/worksie-remote-config.json`               | Remote Config payload      | Archive as legacy  | Useful as a reference for what feature flags and i18n strings existed. Migrate values into the new config table during Phase 1, then delete. |
| `README.md`                               | Docs                       | Rewrite now        | Done in this branch.                                                                   |
| `dataset/worksie_training_schema.jsonl`   | Training schema            | Rewrite now        | Done in this branch.                                                                   |
| `prompts/prompt_deployment_trigger.md`    | Agent prompt               | Rewrite now        | Done in this branch.                                                                   |
| `prompts/prompt_blueprint_mapper.md`      | Agent prompt               | Rewrite now        | Done in this branch.                                                                   |
| `prompts/prompt_training_orchestrator.md` | Agent prompt               | Rewrite now        | Done in this branch.                                                                   |
| `prompts/prompt_ui_designer.md`           | Agent prompt               | Rewrite now        | Done in this branch.                                                                   |
| `docs/worksie_folder_structure.txt`       | Layout reference           | Rewrite now        | Done in this branch.                                                                   |

## Phased Removal

### Phase 0 — this branch (decision)
- All "Rewrite now" items rewritten.
- `Worksie/scripts/deploy.sh` removed (Firebase-only, zero residual value).
- Existing `firebase.json`, `firebase-messaging-sw.js`, `src/logic/firebase.js`,
  `src/logic/remoteConfig.js`, and the `firebase` dependency stay in place
  to keep the legacy scaffold buildable until Phase 1 replaces it.
- New canonical docs land in `docs/`.

### Phase 1 — monorepo scaffolding
- Stand up the new repo layout (see "Target Repo Layout" below).
- Create `apps/web` (Next.js + TypeScript).
- Create `apps/mobile` (Expo).
- Create `packages/db` with Drizzle + Supabase migration baseline.
- Create `packages/domain` for rules engine / payout / lifecycle logic.
- The old `Worksie/src/`, `firebase.json`, `firebase-messaging-sw.js`,
  `firebase` npm dep, and `config/worksie-remote-config.json` are
  **deleted** at the end of Phase 1.

### Phase 2 — feature parity & beyond
- Push notifications via Expo Push.
- Stripe Connect onboarding for contractors.
- Resend + Twilio for transactional comms.
- Compliance gate hardening.
- Offline media upload queue robustness pass.

## Target Repo Layout

```
worksie/
├── apps/
│   ├── web/          # Next.js admin/config portal
│   └── mobile/       # Expo field app
├── packages/
│   ├── db/           # Drizzle schema, migrations, generated types
│   ├── domain/       # Business logic: rules, lifecycle, payout
│   ├── ui/           # Shared design tokens / primitive components
│   └── config/       # Shared runtime config types
├── docs/             # Spine, PRD, domain, lifecycle, payout, etc.
├── prompts/          # Agent prompts
└── dataset/          # Training/eval data
```

The current top-level `Worksie/` and `config/` directories collapse into
this layout in Phase 1. Docs, prompts, and the dataset move up to repo
root.

## Recommended Next Implementation Branch

```
feat/phase-1-monorepo-scaffold
```

This branch should:
1. Initialize the monorepo (pnpm or npm workspaces).
2. Scaffold `apps/web` with Next.js + TypeScript + Tailwind.
3. Scaffold `apps/mobile` with Expo + TypeScript.
4. Scaffold `packages/db` with Drizzle and a baseline schema generated
   from `DOMAIN_MODEL.md`.
5. Add a Supabase local dev config (`supabase/` directory).
6. Delete the legacy `Worksie/src/`, `firebase.json`,
   `firebase-messaging-sw.js`, `firebase` npm dependency, and
   `config/worksie-remote-config.json` once the new scaffolding boots.
7. Wire RLS policies that enforce `tenant_id` on every table.

## Recommended Phase 1 Implementation Prompt

> /goal
> Phase 1: stand up the Worksie monorepo on the canonical stack.
> Read `docs/WORKSIE_SPINE.md`, `TECH_STACK_DECISION.md`,
> `DOMAIN_MODEL.md`, `OFFLINE_FIRST_ARCHITECTURE.md`, and
> `FIREBASE_MIGRATION_PLAN.md` before touching code.
> Tasks:
> 1. Initialize a pnpm workspace at the repo root with `apps/web`,
>    `apps/mobile`, `packages/db`, `packages/domain`, `packages/ui`,
>    `packages/config`.
> 2. Scaffold `apps/web` with Next.js + TypeScript + Tailwind + ESLint.
> 3. Scaffold `apps/mobile` with Expo + TypeScript + Expo Router.
> 4. Scaffold `packages/db` with Drizzle. Create the baseline schema
>    derived from `DOMAIN_MODEL.md`. Include RLS on `tenant_id` for every
>    table.
> 5. Add a `supabase/` directory with Supabase local dev config.
> 6. Wire Supabase Auth into `apps/web` and `apps/mobile`.
> 7. Stub PowerSync configuration in `apps/mobile`.
> 8. Delete the legacy `Worksie/src/`, `firebase.json`,
>    `Worksie/public/firebase-messaging-sw.js`, the `firebase` dependency
>    in `Worksie/package.json`, and `config/worksie-remote-config.json`.
> 9. Update top-level `README.md` to point to the new app paths.
> Do **not** implement business logic yet. This branch is scaffolding only.
