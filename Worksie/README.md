# Worksie

Worksie is a **mobile-first, configurable operations platform for
blue-collar businesses**.

A business uses Worksie to model what it is *capable of performing*,
configure the rules that govern that work (skills, safety,
documentation, proof, payout), and run day-to-day field operations
from a phone — in trucks, on roofs, under porches, on the side of the
road.

> **Status:** Phase 0 — product foundation. The application code
> under `src/` is a placeholder scaffold from an earlier direction and
> is non-binding. Implementation begins in Phase 1 against the docs
> below.

## Core Principle

**Model what a business is capable of performing, not only what it
sells.**

A service is composed from capabilities. Capabilities drive who
qualifies, what safety rules fire, what documents are required, what
proof of completion looks like, and how payout is computed.

## Mobile-First by Default

Blue-collar work happens on phones, outdoors, with one hand. Worksie
is designed phone-first; desktop is a secondary surface for admin
configuration and review. Camera-first proof capture, GPS metadata,
offline-tolerant drafts, large tap targets, minimal typing — these are
non-negotiables, not nice-to-haves. See `docs/PRD.md` §4.

## What's in the Box

- **Multi-tenant** by `Business`.
- **Capability Catalog**, **Service Templates**, and **Job
  Configurations** per business.
- **Work Orders** with a gated lifecycle, satisfied by configurable
  **Contractor Requirements**, **Safety Rules**, **Documentation
  Rules**, and **Proof-of-Work Rules**.
- **1099 Contractor Onboarding** (W-9, COI, license, insurance,
  skills, tools, safety acks) — mobile-only path.
- **Payouts** with piece-rate, flat, hourly, and completion models;
  default cycle is **Monday for prior-week completed work**.
- **Invoices** with line items rolled up from approved work orders.
- **Audit Trail** — append-only, immutable, the source of truth for
  payout justification.
- **Domain Packs** — versioned bundles of capabilities/services/rules
  for a trade. v1 ships `florida-ramp-and-lift`.

## Reference Domain Pack

`florida-ramp-and-lift` — Florida Ramp & Lift, an accessibility
installation business. Covers EZ-ACCESS ramps & steps, ramp recovery,
Complete Access and Red Team vertical lifts, Bruno and Harmar stair /
vertical / vehicle lifts, mobile-home skirting (install + removal),
hurricane tie-downs, with safety rules for electrical exposure, heavy
lift, outdoor heat (hydration plan required), and a Monday
prior-week piece-rate payout cycle.

## Out of Scope (v1)

LiDAR, 3D preview, public template marketplace, advanced AI report
generation, complex marketplace features, automated payout release
(payouts are computed automatically; release is manual until audit
rules are battle-tested).

## Docs

- [`docs/PRD.md`](docs/PRD.md) — vision, principles, scope.
- [`docs/DOMAIN_MODEL.md`](docs/DOMAIN_MODEL.md) — entities, fields,
  relationships.
- [`docs/ONBOARDING_FLOWS.md`](docs/ONBOARDING_FLOWS.md) — business
  setup and 1099 contractor onboarding.
- [`docs/WORK_ORDER_LIFECYCLE.md`](docs/WORK_ORDER_LIFECYCLE.md) —
  state machine and rule gates.
- [`docs/PAYOUT_RULES.md`](docs/PAYOUT_RULES.md) — pricing models,
  cycles, eligibility, splits.
- [`docs/worksie_folder_structure.txt`](docs/worksie_folder_structure.txt) —
  target repo layout.
- [`dataset/worksie_training_schema.jsonl`](dataset/worksie_training_schema.jsonl) —
  domain exemplars used by agent prompts.
- [`prompts/`](prompts) — Claude agent prompts (domain-aware).

## Tech Stack (current scaffold)

- React 18 + Vite + Tailwind
- Firebase Hosting + Firebase Messaging (push) + Firebase Remote
  Config (theming / feature flags only)
- Firestore + Firebase Auth + Storage planned for Phase 1
- Stripe planned for Phase 4+ (payout release / customer payments)

## Local Setup

```bash
cd Worksie
npm install
npm run dev
```

Create a `.env` in `Worksie/` with your Firebase project credentials
(see Firebase Configuration below) and update
`public/firebase-messaging-sw.js` accordingly (service workers cannot
read `import.meta.env`).

```
VITE_FIREBASE_API_KEY="..."
VITE_FIREBASE_AUTH_DOMAIN="..."
VITE_FIREBASE_PROJECT_ID="..."
VITE_FIREBASE_STORAGE_BUCKET="..."
VITE_FIREBASE_MESSAGING_SENDER_ID="..."
VITE_FIREBASE_APP_ID="..."
```

## Deploy

```bash
npm run build
firebase deploy
```

## Firebase Remote Config

Theming and feature-flag config only — **business rules do not live
here.** Source of truth: `config/worksie-remote-config.json`. See
`src/logic/remoteConfig.js`.

## Roadmap

- **Phase 0 (now):** Documentation foundation. *No source code edits.*
- **Phase 1:** Firestore + Auth foundations, schema validators,
  tenant context.
- **Phase 2:** Business configuration UI (capabilities, services, job
  configurations, rules).
- **Phase 3:** Contractor onboarding (mobile-only path).
- **Phase 4:** Work order lifecycle + offline runtime.
- **Phase 5:** Invoicing + payout computation (manual release).
- **Phase 6:** Selective polish; reactivate deferred items only if
  validated.
