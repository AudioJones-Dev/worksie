# Tech Stack Decision

This document records the canonical Worksie stack and the reasoning behind it.
It supersedes any earlier "React + Firebase" framing.

## Decision

Worksie is built on:

- **Next.js + TypeScript** for the web admin / configuration portal
- **Expo (React Native)** for the mobile-first field worker app
- **Supabase Postgres** as the system of record
- **Supabase Auth** for users, contractors, tenants, role-based access
- **Supabase Storage** for photos, documents, signatures, W-9s, COIs,
  insurance docs, proof-of-work media
- **PowerSync + SQLite** for offline-first mobile sync
- **Drizzle** (preferred) or **Prisma** for schema/migrations
- **Vercel** for web deployment
- **EAS** for mobile builds
- **Stripe Connect** (later) for contractor payouts
- **Resend** (later) for email
- **Twilio** (later) for SMS

## What This Replaces

| Was                                | Becomes                          |
|------------------------------------|----------------------------------|
| Firebase Auth                      | Supabase Auth                    |
| Firestore                          | Supabase Postgres                |
| Firebase Storage                   | Supabase Storage                 |
| Firebase Hosting                   | Vercel (web), EAS (mobile)       |
| Firebase Remote Config             | Postgres-backed config tables    |
| Firebase Cloud Messaging           | Expo Push / web push (later)     |
| Vite + plain React (single SPA)    | Next.js web + Expo mobile        |

## Why Not Firebase

Firebase was the original direction. It is being retired because:

1. **Relational domain.** Worksie is fundamentally relational: tenants,
   businesses, services, work orders, line items, photos, contractors,
   docs, payouts, payout periods. Document stores fight this shape.
2. **Compliance gates need joins.** "Does this contractor have a current
   W-9, COI, and license for this service in this jurisdiction?" is a join
   problem, not a document-read problem.
3. **Payouts need transactions.** Weekly payout calculation across many
   work orders for many contractors wants real SQL.
4. **Offline-first wants a relational mirror.** PowerSync + SQLite gives a
   queryable local DB that mirrors Postgres. Firestore offline is a cache,
   not a relational store.
5. **Lock-in.** Firestore queries, security rules, and Cloud Functions are
   non-portable. Postgres is portable.
6. **Two-app shape.** Worksie wants a real web admin and a real mobile
   app. Vite-only React inside Firebase Hosting was scaffolded as one SPA.

## Why Supabase Specifically

- Postgres, Auth, Storage, Realtime, Edge Functions in one platform.
- Row-level security maps cleanly to per-tenant, per-role access.
- Plays well with Drizzle/Prisma; schema lives in code.
- Plays well with PowerSync for offline sync.
- Local dev story (Supabase CLI) is real.

Neon was considered. Neon is a great Postgres host but ships without auth,
storage, realtime, or RLS-first design. Picking Neon would mean re-building
those layers ourselves; Supabase already provides them.

## Why Next.js + Expo (Not Vite SPA)

- Next.js gives server actions, route handlers, and middleware — useful for
  webhooks (Stripe), background jobs, and admin auth.
- Expo gives the mobile app a real native shell, push notifications,
  camera, GPS, file system, and offline storage.
- A Vite SPA inside Firebase Hosting cannot deliver the offline-first field
  experience the product requires.

## Why PowerSync

- Production-grade Postgres ↔ SQLite sync engine.
- Field workers operate offline on job sites; PowerSync resolves their work
  back to Postgres when signal returns.
- Conflict semantics are configurable per table.
- Mobile-side queries hit local SQLite, so the field UI stays fast even on
  bad networks.

Alternatives considered:
- **WatermelonDB** — strong local DB, but sync layer is DIY.
- **Replicache / Zero** — promising, less mature for this shape.
- **Firestore offline** — see "Why Not Firebase".

## Why Drizzle (Default)

- TypeScript-first schema.
- Migrations live in code, reviewed in PRs.
- Lightweight; doesn't fight Supabase RLS.
- Easy to share types between `apps/web`, `apps/mobile`, and
  `packages/domain`.

Prisma remains an acceptable alternate if the team prefers its generator
ergonomics. Pick one in Phase 1 and stay.

## What This Decision Does Not Cover

- The internal repo layout (monorepo vs. split). See `WORKSIE_SPINE.md`
  "What Lives Where" and the recommended layout in `FIREBASE_MIGRATION_PLAN.md`.
- Specific schema. See `DOMAIN_MODEL.md`.
- Offline conflict rules per table. See `OFFLINE_FIRST_ARCHITECTURE.md`.
- Payment processor wiring. Stripe Connect, when introduced, will get its
  own decision doc.
