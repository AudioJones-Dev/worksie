# Worksie PRD

User-flow level product requirements. Pairs with `WORKSIE_SPINE.md` (identity)
and `DOMAIN_MODEL.md` (entities).

## Competitive Positioning & Product Boundary Addendum

Worksie's defensible product position is: **Worksie turns every field job
into a validated, billable, approval-ready record — automatically.**

Worksie is **not** a CRM, scheduling platform, accounting tool, generic form
builder, or photo documentation app. It is the operational readiness layer
for field-service and contractor operations: the system of record for whether
field work has the required proof, context, approvals, and automation signals
needed before downstream business systems can act on it.

The core question Worksie answers is:

> Is this field job complete, documented, approved, and ready to bill?

### Product Boundary

Worksie should own the job-completion evidence and readiness workflow, not
the entire contractor business stack. Specifically, Worksie owns:

- Field proof capture: photos, signatures, checklists, forms, GPS/context,
  and other proof artifacts tied directly to a work order.
- Dynamic submission workflows: tenant-specific requirements that change by
  service type, job status, customer requirement, compliance rule, or other
  operational condition.
- Readiness scoring: explicit completeness and exception signals that show
  whether a job can move forward.
- Approval routing: review, rejection, resubmission, and approval handoffs
  for documented field work.
- Billing readiness: evidence that a job has the documentation and approvals
  needed before invoicing, payout, customer acceptance, or compliance review.
- Operational memory: historical completeness data, approval patterns,
  workflow exceptions, and tenant-specific rules that improve future job
  execution.
- Downstream automation triggers: events and payloads that notify or update
  CRM, accounting, scheduling, compliance, storage, and reporting systems
  once field work is ready.

Worksie should integrate with CRM, accounting, scheduling, storage, and other
field-service systems rather than replacing them. Those systems remain the
right places for sales pipeline, customer relationship management, calendar
optimization, payroll, inventory, marketing automation, general ledger, and
broad financial reporting. Worksie sits between field execution and those
systems, validating that work is complete enough to move forward.

### Initial MVP Wedge

The MVP should focus on documentation-heavy contractor or inspection workflows
where incomplete field documentation delays payment, approval, compliance, or
customer acceptance. Good early wedges include jobs that require structured
proof-of-work, multiple required artifacts, customer or back-office sign-off,
and clear consequences when documentation is missing or rejected.

The MVP should not expand into scheduling, payroll, inventory management,
marketing automation, or full CRM/accounting replacement. Work assignment,
customer records, invoices, and other downstream objects may be referenced or
synced only as needed to support capture, validation, approval, billing
readiness, audit evidence, or automation triggers.

### Long-Term Moat

Worksie's long-term moat should come from:

- Operational memory across completed and rejected jobs.
- Tenant-specific workflow rules that encode how each business proves work.
- Completeness data that identifies missing evidence, recurring exceptions,
  and readiness risk before back-office review.
- Approval patterns that help route, prioritize, and improve future
  submissions.
- Integration depth with the systems that receive ready-to-bill or
  ready-to-approve work.

### MVP Feature Decision Rule

Every MVP feature must directly support at least one of these outcomes:

- Capture required field evidence.
- Validate job completeness.
- Route or record approval.
- Establish billing readiness.
- Preserve audit evidence.
- Trigger downstream automation.

If a proposed MVP feature does not support one of those outcomes, it belongs
outside the MVP.

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
