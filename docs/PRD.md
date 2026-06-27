# Worksie PRD

User-flow level product requirements. Pairs with `WORKSIE_SPINE.md` (identity)
and `DOMAIN_MODEL.md` (entities).

## Personas

- **Operator** — owns or runs the business. Configures services, rules,
  payout, and onboarding. Uses web admin primarily, mobile sometimes.
- **Back office** — handles scheduling, compliance review, invoicing,
  payout. Web admin.
- **Field worker** — performs the install / removal / service. 1099 in the
  default model. Mobile-first.
- **Customer** — receives the service. Limited surface area in v1: signs a
  completion form, may view a job summary.

## Top-Level Flows (v1)

1. **Business configuration.** Operator defines services, required gear,
   required documents, safety rules, and payout rules. Capability model.
2. **Contractor onboarding.** Worker accepts invite, submits W-9, COI,
   license, insurance, signs safety acknowledgements. See
   `ONBOARDING_FLOWS.md`.
3. **Work order creation.** Operator/back-office creates a work order from
   a service definition. Auto-populated with required checklists, gear,
   safety steps, and required proof-of-work.
4. **Dispatch.** Work order is assigned to a contractor. Notification +
   pull from "available" queue.
5. **Field execution.** Contractor opens work order on mobile. Offline-
   tolerant. Captures photos with GPS, completes checklists, signs forms,
   marks completion. See `WORK_ORDER_LIFECYCLE.md`.
6. **Customer sign-off.** Customer signs a completion form on the
   contractor's device.
7. **Compliance + audit.** Back office reviews proof-of-work, confirms
   compliance gates passed.
8. **Payout.** Weekly payout job rolls up completed work orders into a
   payout period, computes piece-rate or completion-based amounts, and
   emits a payout draft. See `PAYOUT_RULES.md`.

## Approved Pilot Scenario

Phase 4 starts with the **accessibility ramp install workflow**. This is the
first concrete workflow used to prove the v1 flows without claiming client
pilot or paid-product readiness.

Pilot flow:

1. Operator configures an accessibility ramp install service definition.
2. Back office confirms contractor compliance before dispatch.
3. Back office creates and assigns a tenant-scoped ramp install work order.
4. Field worker opens the work order on mobile, follows the checklist, and
   captures required proof.
5. Customer signs completion on the worker device.
6. Back office reviews proof and marks the work order payout-draft-ready.

Pilot success criteria:

- Tenant-aware service and work-order read models are visible with fixture
  data.
- The mobile work-order surface can represent checklist, proof, and sign-off
  requirements.
- Compliance remains a gate before dispatch.
- Payout remains evidence modeling only; no live payout automation is in scope.

## Non-Negotiables

- Field UI must work offline.
- Required documents must be expirable and must gate dispatch.
- Proof-of-work artifacts (photos, signatures, completion checklists) are
  bound to a work order and never standalone.
- All state is per-tenant. Tenants do not see each other's data.
- Role-based access at the row level, not just at the route level.

## Explicitly Out of Scope (v1)

- Real-time chat. Notifications only.
- 3D LiDAR scanning. Reserved for later.
- AI-generated narrative reports. Reserved for later.
- Template marketplace. Reserved for later.
- Customer self-service portal beyond the sign-off step.
- W-2 payroll. Worksie's payout is 1099-only in v1.

## Success Criteria (v1)

- A configured business can run a real install end-to-end without paper.
- A field worker with intermittent signal can complete a work order with
  full proof-of-work, and that proof reconciles cleanly when they get
  signal.
- A weekly payout draft can be produced from the work orders completed
  in the prior Mon–Sun, broken down by contractor and line item.
- A compliance gate (e.g., expired COI) actually blocks dispatch.

## Open Questions

- Single-tenant per Supabase project vs. multi-tenant via RLS? Default
  assumption: **multi-tenant with RLS** by `tenant_id`. Revisit if a
  customer demands data isolation at the project level.
- Payout approval flow: one-click approve vs. multi-step review? Default:
  **two-step (draft → approve)** for v1.
- Customer signature: in-app webview vs. emailed link? Default: **in-app
  on contractor's device** for v1.
