# Worksie

Mobile-first configurable operations platform for blue-collar businesses.
Worksie models what a business is *capable of performing* and turns that
model into field-ready execution: onboarding, dispatch, work orders,
safety, documentation, proof-of-work, and 1099 payout.

> **Status:** Architecture decision branch. The legacy Vite + Firebase
> scaffold in this directory is being retired. See
> [`docs/WORKSIE_SPINE.md`](docs/WORKSIE_SPINE.md) and
> [`docs/FIREBASE_MIGRATION_PLAN.md`](docs/FIREBASE_MIGRATION_PLAN.md).

## Start Here

| Doc                                                                | What it covers                                          |
|--------------------------------------------------------------------|---------------------------------------------------------|
| [`docs/WORKSIE_SPINE.md`](docs/WORKSIE_SPINE.md)                   | Product identity, doctrine, canonical stack             |
| [`docs/PRD.md`](docs/PRD.md)                                       | Personas, top-level flows, v1 scope                     |
| [`docs/DOMAIN_MODEL.md`](docs/DOMAIN_MODEL.md)                     | Entities, relationships, hard rules                     |
| [`docs/TECH_STACK_DECISION.md`](docs/TECH_STACK_DECISION.md)       | Why Supabase + Next.js + Expo + PowerSync               |
| [`docs/OFFLINE_FIRST_ARCHITECTURE.md`](docs/OFFLINE_FIRST_ARCHITECTURE.md) | Sync classes, conflict rules, upload queue       |
| [`docs/ONBOARDING_FLOWS.md`](docs/ONBOARDING_FLOWS.md)             | Tenant and contractor onboarding, compliance gate       |
| [`docs/WORK_ORDER_LIFECYCLE.md`](docs/WORK_ORDER_LIFECYCLE.md)     | States, transitions, proof-of-work gates                |
| [`docs/PAYOUT_RULES.md`](docs/PAYOUT_RULES.md)                     | Piece-rate / completion / hourly, weekly periods        |
| [`docs/FIREBASE_MIGRATION_PLAN.md`](docs/FIREBASE_MIGRATION_PLAN.md) | What legacy artifacts remain and when they go         |

## Canonical Stack

| Layer            | Choice                          |
|------------------|---------------------------------|
| Web admin        | Next.js + TypeScript            |
| Mobile field app | Expo (React Native)             |
| Database         | Supabase Postgres               |
| Auth             | Supabase Auth                   |
| Storage          | Supabase Storage                |
| Offline sync     | PowerSync + SQLite              |
| Schema/ORM       | Drizzle                         |
| Web hosting      | Vercel                          |
| Mobile builds    | EAS                             |
| Payments (later) | Stripe Connect                  |
| Email (later)    | Resend                          |
| SMS (later)      | Twilio                          |

Firebase is deprecated as forward architecture. See the migration plan.

## Repo Layout (Current vs. Target)

**Current (legacy scaffold, being retired):**

```
Worksie/
├── src/              # Vite + React SPA (legacy)
├── public/           # Includes Firebase messaging SW (legacy)
├── docs/             # Canonical product docs (this directory)
├── dataset/          # Training/eval schema
├── prompts/          # Agent prompts
├── scripts/          # (Firebase deploy script removed)
├── firebase.json     # Legacy hosting config
└── package.json      # Still references firebase npm pkg (legacy)
config/
└── worksie-remote-config.json   # Legacy Remote Config snapshot
```

**Target after Phase 1 (see `docs/FIREBASE_MIGRATION_PLAN.md`):**

```
worksie/
├── apps/
│   ├── web/        # Next.js admin
│   └── mobile/     # Expo field app
├── packages/
│   ├── db/         # Drizzle schema + migrations
│   ├── domain/     # Rules engine, lifecycle, payout
│   ├── ui/         # Shared tokens / primitives
│   └── config/
├── docs/
├── prompts/
└── dataset/
```

## Reference Domain Pack

Worksie is being designed against a real Florida accessibility-install
operator. The reference domain pack includes:

- EZ-ACCESS ADA ramps and steps
- Ramp recovery and removal
- Complete Access and Red Team vertical lifts
- Bruno and Harmar stair, vertical, and vehicle lifts
- Mobile homes and trailers
- Skirting and skirt removal
- Hurricane tie-downs
- Electrical exposure, heavy lifting, heat/hydration safety
- 1099 subcontractor onboarding (W-9, COI, license, insurance,
  safety acknowledgements)
- Monday payout for prior-week completed work
- Piece-rate and completion-based invoicing

Worksie must generalize beyond this pack, but it must work cleanly for it.

## Building the Legacy Scaffold

The existing Vite scaffold still builds; it's kept around only until the
Phase 1 monorepo replaces it. It is **not** the future of the product.

```bash
cd Worksie
npm install
npm run dev
```

Anything in `Worksie/src/`, `Worksie/firebase.json`,
`Worksie/public/firebase-messaging-sw.js`, the `firebase` npm dependency
in `Worksie/package.json`, and `config/worksie-remote-config.json` will
be deleted in the Phase 1 branch.

## Contributing Direction Changes

The **spine** is the contract. If a product, scope, or stack decision
changes and `docs/WORKSIE_SPINE.md` doesn't reflect the change, the
change isn't done.
