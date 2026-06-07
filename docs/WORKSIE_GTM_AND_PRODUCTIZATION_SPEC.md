---
title: Worksie - GTM + Productization Spec
status: snapshot
version: v0.1
owner: AJ Digital LLC / Audio Jones
source: G:\AJ-INTERNAL\AJ-DIGITAL-VAULT\02-PROJECTS\WORKSIE_GTM_AND_PRODUCTIZATION_SPEC.md
source_standard: G:\AJ-INTERNAL\AJ-DIGITAL-VAULT\08-KNOWLEDGE\DOCTRINE\Standards\CANONICAL_GTM_AND_PRODUCTIZATION_STANDARD.md
source_registry: G:\AJ-INTERNAL\AJ-DIGITAL-VAULT\08-KNOWLEDGE\DOCTRINE\ONTOLOGY\CANONICAL_REGISTRY_ENTRIES.md
record_type: asset
asset_type: App
productization_lane: Client Delivery Tool
target_lane: Paid Product
product_readiness_stage: Internal prototype
monetization_model: Subscription
monetization_visibility: internal-only
gtm_motion: Onboarding
created: 2026-06-01
updated: 2026-06-01
---

# Worksie - GTM + Productization Spec

This is a repo-local snapshot of the Worksie GTM/productization reference so
future build work can evaluate scope, readiness, and commercialization claims
without needing immediate access to the AJ Digital vault.

The canonical source remains the AJ Digital vault. If this file conflicts with
the vault source or canonical registry, the vault source wins.

## 1. Executive Summary

Worksie is a mobile-first configurable operations platform for blue-collar
businesses. Its current business role is a client delivery tool: an AJ-owned
product/app asset used to model field-service capability, operational workflow,
proof-of-work, compliance, and payout logic. Its intended trajectory is paid
product, but current evidence supports only internal prototype maturity, not
client pilot or paid launch.

## 2. Source of Truth

- Vault spec:
  `G:\AJ-INTERNAL\AJ-DIGITAL-VAULT\02-PROJECTS\WORKSIE_GTM_AND_PRODUCTIZATION_SPEC.md`
- Standard:
  `G:\AJ-INTERNAL\AJ-DIGITAL-VAULT\08-KNOWLEDGE\DOCTRINE\Standards\CANONICAL_GTM_AND_PRODUCTIZATION_STANDARD.md`
- Registry:
  `G:\AJ-INTERNAL\AJ-DIGITAL-VAULT\08-KNOWLEDGE\DOCTRINE\ONTOLOGY\CANONICAL_REGISTRY_ENTRIES.md`
- Project register:
  `G:\AJ-INTERNAL\AJ-DIGITAL-VAULT\00-CONTROL\PROJECT_REGISTER.md` entry 11
- Repo GTM project plan:
  [`docs/WORKSIE_GTM_PROJECT_PLAN.md`](WORKSIE_GTM_PROJECT_PLAN.md)
- Repo notes:
  `G:\AJ-INTERNAL\AJ-DIGITAL-VAULT\02-PROJECTS\WORKSIE_NOTES.md`
- Implementation repo:
  `AudioJones-Dev/worksie` / `C:\dev\worksie`

This spec consumes those sources. It does not redefine axis vocabulary,
promote readiness, or approve public product claims.

## 3. Asset Classification

`ASSET_TYPE = App`

Worksie is structurally an app: a pnpm/Turbo monorepo containing a Next.js web
admin app, an Expo mobile app, shared packages, Supabase/Postgres migrations,
and a Drizzle schema package.

## 4. Productization Lane

`PRODUCTIZATION_LANE = Client Delivery Tool`

This is the current role because Worksie is not yet a standalone paid product
in evidence. It is an AJ-owned operational product/app asset that can support
client delivery patterns once enough implementation exists beyond the schema
and scaffold layers.

## 5. Target Lane

`TARGET_LANE = Paid Product`

The target role is paid product because Worksie is being shaped as a repeatable
field-operations platform, not a one-off internal utility. The target remains
directional until client-pilot evidence exists.

## 6. Product Readiness Stage

`PRODUCT_READINESS_STAGE = Internal prototype`

Worksie has a mature documentation and schema foundation, including Phase 2
canonical Drizzle schema and Supabase migrations. The user-facing web and
mobile surfaces remain scaffold-level, so the current stage should not be
advanced to client pilot.

## 7. Monetization Model

`MONETIZATION_MODEL = Subscription` - visibility `internal-only`

Subscription is the likely paid-product model if Worksie advances, but
subscription/SaaS language should remain internal until product readiness
reaches at least client pilot and public positioning is approved.

## 8. GTM Motion

`GTM_MOTION = Onboarding`

Worksie's buyer/user motion is onboarding: it would move a service business
from loose operational process into a configured field workflow system with
tenant setup, service definitions, compliance gates, dispatch flow,
proof-of-work, and payout setup.

## 9. Current Use Case

Current use is product architecture, repo implementation, and doctrine-aligned
reference work. The repo is the canonical implementation surface for Worksie
and a Tier 1 strategic reference for ontology-first schema, proof-of-work
systems, mobile field operations, and signed-document gates.

## 10. Target User / ICP

Primary users are owner/operators, small back-office teams, and field workers
in blue-collar service-installation businesses. The reference domain is
accessibility and home-modification operations: ramps, lifts, skirting,
tie-downs, contractor onboarding, compliance documents, proof capture, and
1099 payout.

## 11. Problem Being Solved

Worksie addresses the operational gap where blue-collar field businesses rely
on paper, generic CRMs, photo logs, spreadsheets, and tribal process to manage
job readiness, dispatch, proof-of-work, compliance, and subcontractor payout.

## 12. Desired Outcome

A configured business can run a real install end-to-end without paper: define
services and rules, onboard contractors, dispatch compliant workers, capture
required proof, get customer sign-off, reconcile offline work, and generate
payout-ready records.

## 13. Positioning

Current canonical positioning: "Mobile-first configurable operations platform
for blue-collar businesses."

Worksie should be positioned around operational readiness, proof-of-work,
capability-modeled workflows, and field execution. It should not be framed as a
generic CRM, photo log, accounting system, or public SaaS product until
readiness evidence supports that claim.

## 14. Differentiation / Moat

- Capability-first model: services are modeled by what a business can perform,
  with gear, documents, safety rules, checklists, and payout rules.
- Proof-over-status doctrine: completion depends on evidence, not a checkbox.
- Field-first architecture: mobile and offline-tolerant workflow are primary.
- Compliance as a first-class object: expirable documents and safety
  acknowledgements gate dispatch.
- Payout as workflow: payout drafts derive from completed work orders and line
  items.
- Doctrine extraction value: Worksie is a reference repo for ontology-first
  schema and operational workflow gates.

## 15. Funnel / Conversion Path

The future funnel role is onboarding, not top-of-funnel awareness. A buyer
would likely enter through an operational diagnostic, vertical playbook, or
service-business readiness conversation, then use Worksie as the configured
execution layer.

## 16. Demo Strategy

Near-term demo should stay internal and evidence-based:

- Show service definition setup.
- Show contractor compliance gates.
- Show mobile work order execution concept.
- Show proof-of-work and customer sign-off model.
- Show payout draft derivation from completed work.

Do not demo as production-ready until Phase 3 tenancy/auth/RLS and a first
domain slice are implemented and validated.

## 17. Diagnostic / Lead Capture Role

Worksie is not currently classified as a diagnostic or lead magnet. It may
receive qualified opportunities from diagnostics focused on field operations,
revenue leakage, missed proof, compliance risk, or payout friction, but those
diagnostics should be separate assets if created.

## 18. Required Evidence Before Promotion

Current-stage evidence:

- `PROJECT_REGISTER.md` classifies Worksie as `Internal prototype`.
- Local repo exists at `C:\dev\worksie` and is aligned with
  `AudioJones-Dev/worksie`.
- Phase 2 canonical Drizzle schema and Supabase migrations have landed.
- Repo docs define product spine, PRD, domain model, offline architecture,
  onboarding, work-order lifecycle, and payout rules.
- `pnpm lint` and `pnpm build` passed locally on 2026-06-01, with Node-version
  caveat.

Gate to `Client pilot`:

- Phase 3 tenant/auth/RLS boundary completed and reviewed.
- First domain slice implemented with real web/mobile workflow beyond scaffold.
- Seed or fixture data supports a realistic install flow.
- Preview/mobile screenshots exist for relevant UI states if UI changes land.
- A defined pilot scenario names the client/operator workflow and expected
  outcome.

Gate to `Paid Product`:

- At least one client-pilot workflow proves repeatable deployment.
- Attribution-clear client outcome is documented.
- Onboarding path, support model, security posture, pricing hypothesis, and
  rollback/exit plan are documented.
- Public subscription/SaaS language is approved through strategy and visibility
  gates.

## 19. Success Criteria

- All six axes are assigned from registry enums: yes.
- Readiness stage is backed by evidence: yes, for internal prototype only.
- Monetization visibility is set: yes, internal-only.
- No orthogonality violation: yes. App is structural, Client Delivery Tool is
  current role, Paid Product is target, Subscription is monetization model, and
  Onboarding is buyer motion.
- No undefined vocabulary introduced: yes.

## 20. Required Assets

- Worksie product roadmap aligned to current Phase 2/Phase 3 state.
- Phase 3 auth/RLS/tenant boundary review.
- First domain-slice PR plan.
- Pilot scenario document.
- Demo data/fixtures for accessibility install workflow.
- UI screenshots in PRs for mobile and desktop changes.
- Future public positioning page only after readiness gates advance.

## 21. Tool Stack

- Web admin: Next.js App Router + TypeScript
- Mobile field app: Expo + TypeScript + Expo Router
- Database: Supabase Postgres
- Auth: Supabase Auth
- Storage: Supabase Storage
- Offline sync: PowerSync + SQLite
- Schema/ORM: Drizzle
- Web hosting: Vercel
- Mobile builds: EAS

Firebase is deprecated and must not be reintroduced.

## 22. Data / Attribution Requirements

Worksie needs outcome evidence tied to operational visibility and execution
quality:

- Time from work-order creation to dispatch.
- Compliance blocks detected before dispatch.
- Proof artifacts captured per work order.
- Offline capture and sync success.
- Completed work orders converted into payout draft lines.
- Reduction in manual spreadsheet/paper handling.
- Pilot operator feedback on repeatability and trust.

## 23. Integrations

Active/planned implementation surfaces from repo docs:

- Supabase Postgres/Auth/Storage
- Drizzle schema and migrations
- PowerSync/SQLite offline sync
- Vercel for web admin
- EAS for mobile builds

## 24. Deferred Integrations

- Stripe Connect for future payments/payout rails
- Resend for email
- Twilio for SMS
- Any client-specific data import
- Any secret-dependent provider setup

Deferred integrations require `.env.example`/placeholder handling and separate
explicit approval before secret work.

## 25. Security / Privacy Constraints

- No committed secrets, service-account JSON, or provider credentials.
- Tenant isolation and role-based row-level access must be validated before
  pilot claims.
- Contractor documents, W-9/COI/license/insurance artifacts, customer
  signatures, GPS, and proof photos are sensitive operational data.
- Public demos must use fictional or sanitized data only.

## 26. Delivery / Fulfillment Model

Current delivery model is internal prototype development. Future client
delivery would likely be an installed/configured operating system for a service
business, with AJ Digital configuring services, compliance requirements, safety
packs, work-order flows, and reporting/payout logic.

## 27. Risks / Constraints

- Overstating maturity as SaaS or paid product before client-pilot evidence.
- Blurring Worksie with AJ Digital OS, Javi, ResponseOS, or client-delivery
  tooling.
- Merging stale PRs that predate the current doctrine and Phase 2 state.
- Reintroducing Firebase or legacy architecture.
- Advancing UI/product claims before auth/RLS/tenancy and first domain slice
  are real.
- Treating subscription as public positioning before visibility approval.

## 28. Open Questions

- What is the next scoped Worksie milestone after Phase 2 schema and docs
  cleanup?
- Should PR #29 or PR #30 be consolidated into a single accepted positioning
  addendum?
- Should PR #31 schema/RLS hardening be reviewed and merged before any Phase 3
  product slice?
- Which exact vertical pilot should define the first client-pilot scenario?
- What is the approved pricing hypothesis once readiness advances?

## 29. Agent Dispatch Plan

Any Worksie build dispatch must cite:

- `record_type = asset`
- `ASSET_TYPE = App`
- `PRODUCTIZATION_LANE = Client Delivery Tool`
- `TARGET_LANE = Paid Product`
- `PRODUCT_READINESS_STAGE = Internal prototype`
- `MONETIZATION_MODEL = Subscription`
- `GTM_MOTION = Onboarding`

The registry remains the source of truth for axis values.

## 30. Next Actions

Use [`docs/WORKSIE_GTM_PROJECT_PLAN.md`](WORKSIE_GTM_PROJECT_PLAN.md) for the
project-manager sequence, safe gates, hold gates, and GTM backlog.

1. Review open Worksie PRs for stale/conflicting scope before any merge work.
2. Prepare a narrow Phase 3 readiness brief focused on PR #31 and
   tenant/auth/RLS implications.
3. Choose the first pilot scenario or confirm that Worksie stays internal until
   more implementation lands.
4. Only after a separate approval gate, create a scoped implementation plan for
   the first domain slice.

## 31. Change Log

- v0.1 | 2026-06-01 | Repo snapshot created from the vault
  GTM/Productization spec using PROJECT_REGISTER entry 11 and Worksie repo
  evidence.
