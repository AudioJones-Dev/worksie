---
title: Phase 4 - Accessibility Ramp First Slice Task Spec
status: draft
version: v0.1
owner: AJ Digital LLC / Audio Jones
related_spine: docs/WORKSIE_SPINE.md
related_prd: docs/PRD.md
related_plan: docs/WORKSIE_GTM_PROJECT_PLAN.md
created: 2026-06-27
updated: 2026-06-27
---

# Phase 4 - Accessibility Ramp First Slice Task Spec

This is the DMAIC build charter and implementation task spec for the first
Phase 4 slice after Sprint -1 consolidation and pilot-scenario approval.

The approved pilot scenario is the **accessibility ramp install workflow**.
The first implementation slice must prove the workflow as a tenant-aware,
read-only domain surface before adding mutations, payout automation, live
client data, or production deployment.

## 1. DMAIC Build Charter

- Mode: greenfield
- Date / owner: 2026-06-27 / AJ Digital LLC, implemented by Codex after
  explicit approval

### Define

Problem statement:

Worksie has Phase 3 tenant/auth/RLS boundary evidence and a full schema, but it
does not yet expose a real domain workflow beyond scaffold routes. Future work
needs a small, testable Phase 4 slice that demonstrates the approved
accessibility ramp install workflow without overbuilding, claiming client-pilot
readiness, or introducing live client data.

In scope:

- Define and implement a tenant-aware read model for one accessibility ramp
  install work order.
- Use existing domain concepts: service definition, customer, contractor
  membership, compliance state, work order, checklist steps, proof
  requirements, customer sign-off, line items, and payout-draft-ready marker.
- Add fictional or sanitized fixture data that represents an accessibility ramp
  install.
- Expose a minimal web admin read-only surface for the back-office/operator
  view.
- Expose a minimal mobile read-only surface for the field-worker work-order
  view.
- Preserve Phase 3 auth/tenant boundaries on web surfaces.
- Commit desktop and iPhone screenshots for any UI PR that implements this
  spec.

Out of scope:

- Live client data.
- Work-order creation, assignment, checklist completion, proof upload, or
  sign-off mutations.
- Payout line generation, Stripe Connect, payment processing, or 1099 export.
- PowerSync/offline write behavior.
- Production deployment or public SaaS/product claims.
- New database migrations unless implementation discovery proves the existing
  schema cannot represent the read model.
- Client-specific hardcoding.

Voice of the customer:

- Operator/back office needs to see whether Worksie can represent a ramp install
  as a dispatchable, proof-driven job.
- Field worker needs a mobile-first view of the assigned work, checklist,
  required proof, and customer sign-off requirement.
- Audio needs evidence that Phase 4 can proceed without drifting into a custom
  client app, premature SaaS launch, or payout automation.

Acceptance criteria:

- A fixture accessibility ramp install service definition includes required
  gear, required documents, required safety steps, a checklist template,
  customer sign-off requirement, and a payout rule reference.
- A fixture work order renders with tenant id, customer/site summary,
  assigned contractor, status, checklist steps, proof requirements, sign-off
  requirement, line items, and payout-draft-ready state.
- Web admin can show the ramp work order read-only from a tenant-aware route.
- Mobile can show the ramp work order read-only in a field-worker-oriented
  layout.
- The slice does not add live external integrations, secrets, payment flows, or
  production deployment behavior.
- Local validation passes with Node 20 / pnpm 9: lint, build, typecheck, and
  test.
- UI implementation PRs include desktop and iPhone screenshots under
  `docs/screenshots/<branch>/` and link them in the PR body.

### Measure

Greenfield signal:

- Add implementation tests that assert the accessibility ramp fixture projects
  into the expected read model shape.
- Add or update UI smoke coverage where the repo has an available test harness.
  If no UI test harness exists yet, the PR must document that gap and provide
  Playwright screenshots as evidence for desktop and iPhone viewports.
- Re-run existing repo validation:
  - `pnpm lint`
  - `pnpm build`
  - `pnpm typecheck`
  - `pnpm test`

Target:

- All listed validation commands exit 0.
- Read-model tests prove the fixture cannot drop tenant id, service name,
  work-order status, checklist requirements, proof requirements, sign-off
  requirement, or payout-draft-ready marker.
- Screenshots show non-empty web and mobile states for the ramp install flow.

### Analyze

Considered approaches:

| Approach | Tradeoff | Decision |
|---|---|---|
| DB-first end-to-end slice with mutations | Strongest realism, but risks schema churn, mutation logic, and overbuilding before the read model is proven | Defer |
| Static UI-only fixture | Fastest visual proof, but weak tenant/auth evidence and easy to drift from schema/domain docs | Reject |
| Existing-schema read model with fictional fixtures and protected read-only UI | Proves the workflow shape while preserving Phase 3 boundaries and limiting blast radius | Choose |

Chosen design:

Use the existing schema/domain contract and create a narrow read-model layer for
the accessibility ramp install workflow. The first implementation should prefer
typed fixtures and adapters over database mutations. If the implementation uses
database seed data, it must use fictional or sanitized values and preserve RLS
verification. The web view remains protected by Phase 3 tenant context. The
mobile view can use the same read-model contract but must stay read-only.

Main risk:

The slice could become too client-specific. Control this by naming the scenario
as an accessibility ramp install while keeping the read model generic:
`serviceDefinition`, `workOrder`, `checklist`, `proofRequirements`,
`signoff`, and `payoutReadiness`.

### Improve Handoff

Implementation may start only after Audio explicitly approves this task spec.

Recommended first PR sequence:

1. **Phase 4A - read model and fixtures**
   - Add typed read-model contracts.
   - Add fictional accessibility ramp install fixture data.
   - Add unit tests for the read-model projection.
2. **Phase 4B - web admin read-only view**
   - Add a protected tenant-aware work-order route.
   - Render the ramp install summary, compliance state, checklist/proof
     requirements, sign-off requirement, and payout-draft-ready marker.
   - Capture desktop and iPhone screenshots.
3. **Phase 4C - mobile read-only view**
   - Add a field-worker-oriented work-order screen.
   - Render assignment, site, checklist/proof requirements, and sign-off
     requirement.
   - Capture desktop and iPhone screenshots where supported by the web/mobile
     preview path.

If implementation can safely fit 4A and 4B in one small PR, that is acceptable.
Do not combine all future workflow mutations into this first slice.

### Control

The completed implementation must leave behind:

- Tests for the accessibility ramp read-model fixture.
- PR screenshots for UI states.
- Updated docs if implementation changes scope, ownership, routes, or
  verification.
- PR body checklist showing local validation and GitHub CI.
- No promotion of Worksie beyond `Internal prototype`.

## 2. Domain Contract For The First Slice

Use existing schema/domain names where possible:

- `Tenant`
- `BusinessProfile`
- `ServiceDefinition`
- `DocumentType`
- `PayoutRule`
- `ChecklistTemplate`
- `Customer`
- `Membership`
- `ContractorDocument`
- `SafetyAcknowledgement`
- `WorkOrder`
- `WorkOrderLineItem`
- `ChecklistInstance`
- `ChecklistStep`
- `ProofOfWorkArtifact`
- `CustomerSignoff`

Minimum fixture values:

- Service: `Accessibility Ramp Install`
- Category: `ramp_install`
- Gear examples: ramp sections, handrails, anchors, drill, levels, PPE
- Required documents: W-9, COI, state or county license when applicable
- Safety steps: heavy lifting, electrical exposure check, heat hydration
- Checklist examples:
  - verify site access and measurements
  - stage ramp sections
  - install and anchor ramp
  - install handrails
  - capture final photos
  - collect customer sign-off
- Work order status for read-only demo: `dispatched` or `in_progress`
- Payout readiness state: evidence marker only, not generated payout lines

## 3. Implementation Boundaries

Allowed:

- Typed fixtures.
- Read-model functions.
- Read-only web route or component.
- Read-only mobile screen.
- Unit tests for projection logic.
- UI screenshots for PR evidence.

Requires separate approval:

- Database migrations.
- RLS policy changes.
- Work-order mutation flows.
- File upload, camera capture, or signature capture.
- PowerSync/offline sync implementation.
- Payout generation or payment integration.
- Production deployment.
- Public positioning or pricing copy.

## 4. Verification Plan

Before opening or updating an implementation PR:

```bash
npm exec --yes --package=node@20 --package=pnpm@9.12.0 -- pnpm lint
npm exec --yes --package=node@20 --package=pnpm@9.12.0 -- pnpm build
npm exec --yes --package=node@20 --package=pnpm@9.12.0 -- pnpm typecheck
npm exec --yes --package=node@20 --package=pnpm@9.12.0 -- pnpm test
```

If web UI changes:

- Capture Playwright desktop screenshot at `1440x1200`.
- Capture Playwright iPhone screenshot at `390x844`.
- Commit screenshots to `docs/screenshots/<branch>/`.
- Link screenshots in the PR body.

If database or RLS behavior changes:

- Run the relevant `@worksie/verify-rls` checks.
- Document whether local Supabase was available.

## 5. Approval Gate

This document clears planning only. It does not authorize code implementation.

Audio must approve the Phase 4 task spec before Codex starts runtime changes.
After approval, implementation should begin with Phase 4A unless a fresh repo
inspection shows a smaller safe first step.

## 6. Open Questions

- Should Phase 4A use typed in-repo fixtures only, or also add a Supabase seed
  file for the ramp install scenario?
- Should the first web surface be `/work-orders` list plus detail, or a single
  `/work-orders/ramp-install-demo` detail route?
- Should the first mobile surface be fixture-only or share a package-level
  read-model adapter with the web app from the first PR?
