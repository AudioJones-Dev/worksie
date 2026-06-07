---
title: Worksie - GTM Safe-Gate Review
status: draft
version: v0.1
owner: AJ Digital LLC / Audio Jones
related_plan: docs/WORKSIE_GTM_PROJECT_PLAN.md
related_spec: docs/WORKSIE_GTM_AND_PRODUCTIZATION_SPEC.md
created: 2026-06-02
updated: 2026-06-02
---

# Worksie - GTM Safe-Gate Review

This review implements the first safe gates from the Worksie GTM Project Plan.
It is a reference for future Codex, Claude, and GitHub work. It does not merge,
close, approve, deploy, promote readiness, or change public positioning.

Current classification remains:

- `PRODUCTIZATION_LANE = Client Delivery Tool`
- `TARGET_LANE = Paid Product`
- `PRODUCT_READINESS_STAGE = Internal prototype`
- `MONETIZATION_MODEL = Subscription`
- `GTM_MOTION = Onboarding`

## 1. Review Verdict

Recommended next path:

1. Keep PR #33 as the current doctrine/reference PR.
2. Use this review to control stale PR disposition and future implementation.
3. Resolve positioning overlap before any new feature implementation.
4. Review Phase 3 schema/RLS hardening before the older auth-boundary PR.
5. Ask Audio before merging, closing, superseding, choosing a pilot scenario,
   approving public copy, changing production infrastructure, or starting code
   implementation.

Safe work may continue only as docs, review briefs, local validation, PR body
updates, or non-destructive inspection until the hold gates are cleared.

## 2. Open PR Triage

| PR | Scope | Status | Recommendation | Gate |
|---|---|---:|---|---|
| #33 | GTM/productization spec and project plan | Draft, current branch | Keep as the active doctrine/reference PR. Merge only after normal review. | Safe until merge |
| #31 | Phase 2 schema/RLS hardening | Draft, CI green | Review first for Phase 3 readiness. Likely next technical candidate after doctrine is accepted. Do not merge without Audio approval. | Hold for merge |
| #30 | PRD-only positioning addendum | Open, CI green | Do not merge together with #29. Either supersede with #29 or fold into a clean combined positioning update after doctrine review. | Hold |
| #29 | Dedicated positioning doc plus PRD/spine/README updates | Open, CI green | Better discovery than #30, but still overlaps doctrine and public boundary language. Reconcile before merge. | Hold |
| #28 | Competitor feature review | Draft | Keep as research input only. Do not treat as product direction until positioning is settled. | Safe review |
| #27 | LGA roadmap docs | Draft | Defer. Roadmap work should follow pilot scenario selection. | Safe review |
| #26 | Phase 3 tenant/auth boundary foundation | Draft, older than #31 | Re-review after #31 because it assumes earlier Phase 2 hardening state. May need refresh/rebase/split. | Hold for merge |
| #19 | Mobile-first documentation | Draft, older | Likely superseded by current spine/GTM docs. Review before close. | Hold for close |
| #18 | Nested app CI bootstrap | Draft, older | Likely superseded by current repo setup. Review before close. | Hold for close |
| #17 | Repo readiness bootstrap | Draft, older | Likely superseded by current repo setup. Review before close. | Hold for close |
| #16 | Firebase messaging initialization | Open, older | Conflicts with "Firebase retired from forward architecture." Recommend close/supersede unless Audio explicitly revives. | Hold |
| #14 | Prisma invoice billingBatch | Open, older | Conflicts with current Drizzle/Supabase and payout-domain direction. Recommend close/supersede. | Hold |
| #13 | Backend contract review with Prisma/OpenAPI/seed | Open, older | Conflicts with current canonical stack unless reworked. Recommend close/supersede. | Hold |
| #12 | OpenAPI nullable fix | Open, older | Stale unless current API contract still uses it. Recommend close after review. | Hold |
| #6 | OpenAPI/Prisma/seed backend | Open, older | Conflicts with Drizzle/Supabase direction. Recommend close/supersede. | Hold |
| #5 | Voice/vision roadmap | Open, older | Defer. Not part of internal-prototype to client-pilot path. | Hold |
| #4 | Promo banner realtime | Open, older | Not aligned to current Phase 3 readiness path. Recommend close/supersede after review. | Hold |
| #3 | Stripe payment integration | Open, older | Too early for paid-product gate. Defer or close until pilot evidence exists. | Hold |
| #2 | Promo banner bug | Open, older | Not aligned to current GTM readiness path. Recommend close/supersede after review. | Hold |
| #1 | ML model canary | Open, older | Not aligned to current GTM readiness path. Recommend close/supersede after review. | Hold |

## 3. Positioning PR Review

PR #29 and PR #30 overlap. Both define Worksie around operational readiness
and use the same core USP:

> Worksie turns every field job into a validated, billable, approval-ready
> record automatically.

Comparison:

| Item | PR #29 | PR #30 |
|---|---|---|
| Files touched | README, `docs/WORKSIE_SPINE.md`, `docs/PRD.md`, new `docs/COMPETITIVE_POSITIONING.md` | `docs/PRD.md` only |
| Discoverability | Stronger; adds a dedicated positioning artifact | Weaker; hides boundary inside PRD |
| Risk | Broader doc-surface change and more chance of doctrine drift | Less surface area, but duplicates a future canonical source |
| Recommended use | Preferred source if Audio wants a standalone positioning doc | Use as source material, not a separate merge path |

Recommendation:

- Do not merge both.
- Prefer one consolidated positioning pass after PR #33 is accepted.
- If choosing between the two, PR #29 is the better base because future agents
  need a dedicated positioning reference, but it must be reconciled against
  `WORKSIE_GTM_AND_PRODUCTIZATION_SPEC.md` before merge.
- Treat any public-facing SaaS/subscription/product language as a hold gate.

## 4. Phase 3 Readiness Brief

Two open PRs matter for Phase 3:

| PR | Role | Key risk | Recommendation |
|---|---|---|---|
| #31 | Schema/RLS hardening follow-up to Phase 2 | Touches migrations, RLS, FKs, CI, and append-only behavior | Review first. It appears to address known Phase 2 hardening findings and should shape Phase 3 technical readiness. |
| #26 | Tenant/auth boundary foundation | Built against an older Phase 2 state and defers some hardening now addressed by #31 | Re-review only after #31 disposition is known. It may need refresh, split, or replacement. |

Minimum validation before merging Phase 3 technical work:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- Relevant DB/RLS verification against a fresh PostgreSQL/Supabase-compatible
  local target
- Migration review for tenant isolation, cross-tenant FK safety, append-only
  event behavior, idempotency, and client/server secret separation

Phase 3 merge is a hold gate because it changes the database/auth boundary.

## 5. Pilot Scenario Options

These are options only. Selection is a hold gate because it sets product
direction.

| Option | Scenario | Why it fits | Risk |
|---|---|---|---|
| A | Accessibility ramp or lift install workflow | Matches existing AJ Digital client context, proof-of-work needs, compliance checks, sign-off, and payout-readiness | Could become too client-specific if not framed as a reusable operations pattern |
| B | General contractor punch-list completion workflow | Broad blue-collar applicability and clear mobile proof loop | May dilute the accessibility/home-modification advantage |
| C | Inspection and approval checklist workflow | Strong approval-ready record narrative | May under-test dispatch, contractor compliance, and payout readiness |

Recommended pilot path:

- Use Option A as the first scenario candidate.
- Frame it as a reusable "regulated field-service proof workflow," not a
  one-client custom build.
- Do not start implementation until Audio approves the pilot scenario.

## 6. Future Work Rules

Future agents should use this sequence:

1. Start with `docs/WORKSIE_GTM_AND_PRODUCTIZATION_SPEC.md`.
2. Then read `docs/WORKSIE_GTM_PROJECT_PLAN.md`.
3. Then read this review before touching open PRs or Phase 3 work.
4. Keep work docs-only until positioning and Phase 3 hold gates are approved.
5. After approval, implement the smallest domain slice that proves the selected
   pilot scenario.

Do not use stale Firebase, Prisma, OpenAPI, promo-banner, Stripe, or ML canary
PRs as forward build direction unless Audio explicitly reopens that path.

## 7. Hold Gates Now Reached

Audio approval is required for:

- Closing or merging stale PRs.
- Selecting PR #29, PR #30, or a consolidated replacement path.
- Merging PR #31 or #26.
- Choosing the pilot scenario.
- Starting code implementation for the first domain slice.
- Publishing public product/SaaS/subscription copy.
- Any production deploy, secret handling, billing, or client-data work.

## 8. Safe Next Actions

Codex may continue safely with:

- Using `docs/reviews/WORKSIE_PHASE_3_REVIEW_CHECKLIST.md` to review PR #31
  before PR #26.
- Using `docs/reviews/WORKSIE_POSITIONING_CONSOLIDATION_CHECKLIST.md` to
  consolidate PR #29/#30 without duplicating doctrine.
- Updating PR #33 with this review and validation results.
- Running local validation.
- Watching CI for PR #33.

## 9. Change Log

- v0.1 | 2026-06-02 | Added open PR triage, positioning recommendation,
  Phase 3 readiness brief, pilot scenario options, and future-work rules.
- v0.2 | 2026-06-02 | Linked concrete Phase 3 and positioning consolidation
  checklists for the next safe-gate reviews.
