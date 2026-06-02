---
title: Worksie - GTM Project Plan
status: draft
version: v0.1
owner: AJ Digital LLC / Audio Jones
related_spec: docs/WORKSIE_GTM_AND_PRODUCTIZATION_SPEC.md
safe_gate_review: docs/reviews/WORKSIE_GTM_SAFE_GATE_REVIEW.md
created: 2026-06-01
updated: 2026-06-02
---

# Worksie - GTM Project Plan

This plan turns the Worksie GTM/productization reference into an execution
sequence. It is written for project management: what moves next, which gates
can run without interruption, and which gates require Audio to stop and decide.

Worksie remains classified as:

- `record_type = asset`
- `ASSET_TYPE = App`
- `PRODUCTIZATION_LANE = Client Delivery Tool`
- `TARGET_LANE = Paid Product`
- `PRODUCT_READINESS_STAGE = Internal prototype`
- `MONETIZATION_MODEL = Subscription`
- `GTM_MOTION = Onboarding`

This plan does not promote Worksie to client pilot or paid product. It defines
the work required before those promotions can be considered.

## 1. Project Manager Summary

The recommended path is to move Worksie from internal prototype toward a
client-pilot-ready asset through controlled gates:

1. Stabilize repo and open PR state.
2. Settle product positioning and product-boundary docs.
3. Decide and validate the Phase 3 tenancy/auth/RLS path.
4. Define the first pilot scenario and first domain slice.
5. Build the first domain slice behind evidence gates.
6. Prepare a private demo and pilot-readiness review.
7. Only then consider public GTM language, pricing, or paid-product claims.

Default operating rule: safe gates continue without pausing. Pause only when a
gate changes strategy, public claims, product lane/readiness, secrets,
production infrastructure, client commitments, or irreversible repo state.

## 2. Workstream Map

| Workstream | Purpose | Current status | Next owner |
|---|---|---|---|
| Repo hygiene | Keep `main`, PRs, CI, and docs trustworthy | Active; PR #33 open | Codex |
| Positioning | Align product boundary and competitive wording | PR #29/#30 open | Codex review, Audio decision |
| Schema/RLS hardening | Decide whether PR #31 is the next merge candidate | PR #31 open draft | Codex review |
| Pilot scenario | Define the first real-world install workflow | Not selected | Audio decision after Codex brief |
| First domain slice | Implement the smallest useful flow after Phase 3 gate | Not started | Codex after approval |
| GTM assets | Demo script, private proof, future public copy | Not started | Codex/Claude after evidence |
| Measurement | Define pilot outcome and attribution proof | Not started | Codex/Claude |

## 3. Gate Policy

### Safe Gates - Continue Without Interruption

Codex or Claude may proceed through these without waiting for Audio unless a
new risk appears:

- Read-only repo inspection.
- Git status, branch, remote, and PR inventory checks.
- Documentation-only edits that do not change public positioning claims.
- Draft specs, project plans, review briefs, and checklists.
- README/doc index updates that point to existing docs.
- Stale PR triage reports.
- Local validation commands: `pnpm lint`, `pnpm build`, and non-destructive
  typecheck/test commands already defined by the repo.
- Draft PR creation for docs-only or review-only work.
- PR body updates that report facts, test results, screenshots, or known
  caveats.
- GitHub CI status checks.
- Issue/ticket drafting.

### Hold Gates - Pause For Audio

Pause and ask for explicit approval before:

- Changing `PRODUCTIZATION_LANE`, `TARGET_LANE`, or
  `PRODUCT_READINESS_STAGE`.
- Moving Worksie from internal prototype to client pilot.
- Approving public SaaS/subscription/product language.
- Choosing the first pilot customer, vertical, or live client scenario.
- Merging stale or high-risk PRs if their scope conflicts with current
  doctrine.
- Modifying secrets, env values, credentials, service-account files, or client
  data.
- Production deploys, Vercel project changes, EAS production builds, domain
  changes, billing, or financial actions.
- Destructive git/file actions, force pushes, resets, file deletion, or archive
  execution.
- Reintroducing Firebase or any deprecated forward architecture.
- Sending communications in Audio's name.

### Escalation Rule

If a task is safe but reveals a product-direction contradiction, stop at a
written diagnosis and identify the decision needed. Do not resolve strategy by
implementation.

## 4. Phase Plan

### Phase 0 - Current-State Control

Objective: know the exact repo, PR, and doctrine state before touching product
implementation.

Tasks:

- Verify local branch, remote, and clean worktree.
- Confirm PR #33 remains docs-only and green.
- Inventory open PRs by age, scope, and conflict risk.
- Identify stale PRs that predate the Phase 2 canonical schema and Firebase
  retirement direction.
- Produce a merge/close/rebase recommendation table.

Exit gate:

- A PR triage table exists.
- No implementation starts.
- Audio only needs to intervene if a stale PR should be closed, merged, or
  superseded.

### Phase 1 - Product Boundary Alignment

Objective: resolve product wording and boundary before new feature work.

Tasks:

- Review PR #29 and PR #30 for overlap.
- Recommend one of: merge one, supersede both with a clean combined PR, or keep
  both closed in favor of the current GTM spec.
- Confirm whether Worksie's public-facing line remains "Mobile-first
  configurable operations platform for blue-collar businesses."
- Ensure `WORKSIE_SPINE.md`, `PRD.md`, README, and GTM spec do not conflict.

Exit gate:

- One authoritative product-boundary path is selected.
- Audio decision required only if public positioning or PR disposition changes.

### Phase 2 - Phase 3 Readiness Brief

Objective: decide whether Phase 3 tenancy/auth/RLS can safely advance.

Tasks:

- Review PR #31 against current `main`.
- Identify whether PR #31 should be refreshed, merged, split, or replaced.
- Check migration implications and tenant-boundary risk.
- Confirm validation commands needed for schema/RLS work.

Exit gate:

- A Phase 3 readiness brief exists.
- Audio decision required before merging schema/RLS hardening or authorizing
  implementation work.

### Phase 3 - Pilot Scenario Definition

Objective: define the smallest real operational flow that proves Worksie can
become client-pilot-ready.

Recommended pilot scenario:

- Accessibility ramp or lift install workflow.
- Operator configures service definition.
- Contractor compliance is checked.
- Work order is created and dispatched.
- Mobile worker completes checklist and captures proof.
- Customer sign-off is captured.
- Completed work becomes payout-draft-ready.

Exit gate:

- Pilot scenario has actor, data, flow, success criteria, and non-goals.
- Audio must approve the pilot scenario because it determines product
  direction.

### Phase 4 - First Domain Slice Implementation Plan

Objective: produce the build plan for the first useful slice after Phase 3 is
approved.

Likely first slice:

- Tenant-aware read model.
- Service definitions.
- Work orders read-only/admin view.
- Seed/fixture data.
- Basic mobile work-order view.
- No payout automation beyond evidence modeling.

Exit gate:

- Implementation plan is scoped to one PR or a small PR sequence.
- No code starts until the Phase 3 gate and pilot scenario are approved.

### Phase 5 - Private Demo Package

Objective: demonstrate the intended operational outcome without public claims.

Tasks:

- Build private demo script.
- Add fixture data.
- Capture desktop and iPhone screenshots if UI exists.
- Document what is real, mocked, fixture-only, and not ready.
- Tie demo proof to readiness gates.

Exit gate:

- Private demo shows an operational workflow.
- Demo is not marketed as paid product readiness.

### Phase 6 - Client Pilot Readiness Review

Objective: determine whether Worksie can advance from internal prototype to
client pilot.

Required evidence:

- Tenant/auth/RLS path validated.
- First domain slice works in local and preview environments.
- Pilot scenario can be completed with fixture or safe pilot data.
- Security/privacy constraints are documented.
- Support/rollback plan exists.
- Outcome and attribution measures are defined.

Exit gate:

- Audio approves or rejects readiness-stage promotion.

### Phase 7 - Paid Product Gate

Objective: decide whether the target lane can move from directional to
commercial.

Do not begin this phase until client-pilot evidence exists.

Required evidence:

- Repeatable deploy.
- Attribution-clear client outcome.
- Onboarding path.
- Support model.
- Pricing hypothesis.
- Security posture.
- Public positioning approval.

Exit gate:

- Audio approves public product/subscription language, or Worksie remains
  client-delivery/internal.

## 5. Immediate Backlog

| Order | Task | Gate type | Owner | Output |
|---|---|---|---|---|
| 1 | Triage open PRs #1-#31 for stale/conflicting scope | Safe | Codex | PR disposition table |
| 2 | Compare PR #29 and #30 positioning docs | Safe | Codex | Recommendation |
| 3 | Review PR #31 Phase 3 hardening | Safe until merge decision | Codex | Readiness brief |
| 4 | Draft pilot scenario options | Safe | Codex/Claude | 2-3 options |
| 5 | Choose pilot scenario | Hold | Audio | Approved scenario |
| 6 | Draft first domain-slice implementation plan | Safe after scenario | Codex | Build plan |
| 7 | Approve implementation | Hold | Audio | Proceed gate |

Current safe-gate implementation reference:

- `docs/reviews/WORKSIE_GTM_SAFE_GATE_REVIEW.md` records the open PR triage,
  PR #29/#30 positioning comparison, PR #31/#26 Phase 3 readiness brief,
  pilot scenario options, and hold gates for future work.

## 6. Project Manager Operating Rules

- Keep one active implementation workstream at a time.
- Prefer docs/review PRs before code PRs when product direction is unclear.
- Merge or close stale PRs before starting work that could conflict with them.
- Treat `main` plus canonical vault/register state as authority.
- Do not use old Firebase-era PRs as build direction unless explicitly
  re-reviewed and reconciled.
- Use draft PRs by default.
- Update PR bodies with test plans and current status.
- For UI work, follow `AGENTS.md`: desktop and iPhone screenshots go into the
  PR, not local-only output.
- Do not mark a promotion gate complete because docs exist; promotion requires
  evidence.

## 7. Communication Cadence

Autonomous updates should be short and evidence-based:

- "Safe gate completed: <gate>. Evidence: <command/file/PR>."
- "Hold gate reached: <decision>. Recommended option: <one path>. Risk:
  <specific risk>."
- "Blocked by external state: <state>. Continuing with <safe adjacent task>."

Avoid asking Audio to decide minor mechanics. Ask only when the decision changes
direction, commitment, public claims, money, secrets, production, client data,
or irreversible state.

## 8. Definition Of Done For GTM Readiness

Worksie is GTM-ready only when:

- Client-pilot readiness is approved with evidence.
- Public positioning is approved.
- Pricing/packaging is approved.
- Onboarding motion is documented and tested.
- Security/privacy posture is documented.
- A demo or pilot workflow is reproducible.
- Measurement and attribution are defined.
- The repo has green validation and a trusted deploy/preview path.

Until then, Worksie remains an internal prototype with a paid-product target.

## 9. Change Log

- v0.1 | 2026-06-01 | Initial PM plan created to govern Worksie GTM
  execution, safe gates, hold gates, and next backlog.
- v0.2 | 2026-06-02 | Linked the safe-gate review artifact for PR triage,
  positioning overlap, Phase 3 readiness, and future implementation control.
