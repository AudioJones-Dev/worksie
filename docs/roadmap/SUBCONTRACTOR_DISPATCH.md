# Subcontractor Dispatch (Roadmap / Spec)

> **Status: Roadmap only.** This document is a future-domain
> specification. It does **not** alter the canonical ontology
> (`docs/DOMAIN_MODEL.md`), the Drizzle schema (`packages/db`),
> RLS, or the work order lifecycle. New entities listed here
> require an ontology-review PR before any schema work begins.
>
> Target phase mapping: **Phase 6** (after Phase 5 documents/e-sign).

## Purpose

Define the subcontractor side of the LGA pipeline: onboarding extension,
agreement signing, offer/accept dispatch, and the gates that decide
whether a work order is actually eligible to leave `scheduled`. Pairs
with `ONBOARDING_FLOWS.md` (the existing compliance gate this builds
on), `WORK_ORDER_LIFECYCLE.md` (the state machine being gated), and
`DOCUMENTS_AND_ESIGN.md` (the agreement signing layer).

## Where Today's Model Lands

Today's contractor onboarding produces a `Membership(role=contractor)`
with `ContractorDocument` rows for W-9 / COI / license and
`SafetyAcknowledgement` rows for required packs. The "compliance gate"
is a server-evaluated boolean per (contractor, service).

This roadmap **does not replace** any of that. It adds:

1. A **subcontractor agreement** layer (`DocumentEnvelope` of kind
   `subcontractor_msa` or `subcontractor_per_job`) that gates dispatch
   in addition to the existing compliance gate.
2. An **offer/accept** layer (`Assignment` entity) so a work order can
   be offered, declined, reassigned, and audited — distinct from the
   work order's own state machine.
3. Optional support for a **subcontractor as a business** (future), not
   just an individual; called out under Open Questions and explicitly
   deferred.

## Proposed New Entities

The `Assignment` entity is defined in `LGA_MODEL.md`. It is reproduced
here in summary because dispatch is the layer that uses it.

### Assignment (summary; canonical definition in `LGA_MODEL.md`)
- `id`, `tenant_id`, `work_order_id`
- `subcontractor_membership_id`
- `offered_at`, `responded_at`, `accepted_at`
- `status` ∈ `{offered, accepted, declined, rescinded, expired}`
- `agreement_envelope_id` (FK → `DocumentEnvelope`, nullable when MSA
  covers the job)
- `decline_reason` (nullable)
- `expires_at` (offer TTL)

### SubcontractorProfile (proposed extension on `Membership`)
Not a new table — additional columns on `Membership` or a sidecar.
- `stripe_connect_account_id` (nullable; payout target)
- `trade_categories` (jsonb; e.g. `["tile", "plumbing_rough"]`)
- `service_radius_miles` (nullable)
- `home_base_gps` (nullable)
- `accepts_after_hours` (bool)

Final placement (column on `memberships` vs. new `subcontractor_profiles`
table) is an ontology-review decision in Phase 6. Default: sidecar table
to keep `memberships` clean.

## Dispatch Eligibility Gate

A subcontractor is **dispatchable to a specific work order** iff **all**
of the following are true at evaluation time:

1. `Membership.role = contractor` AND `Membership.status = active`.
2. The existing compliance gate from `ONBOARDING_FLOWS.md` is green for
   the service definition referenced by the work order
   (`service_snapshot_json`).
3. An `MSA` envelope (`DocumentTemplate.kind = subcontractor_msa`) for
   this subcontractor in this tenant is `executed` AND not voided.
4. If the operator's policy for the service requires a per-job
   agreement, an `Assignment.agreement_envelope_id` envelope of kind
   `subcontractor_per_job` is `executed`.
5. The subcontractor has the trade category the service requires (when
   the service declares one).
6. The subcontractor's payout account is in a payable state (if Stripe
   Connect onboarding is required by tenant policy — see
   `PAYOUT_AND_MARGIN.md`).

Rules 1 and 2 exist today. Rules 3–6 are added by this roadmap.

The gate runs **server-side**. The result is denormalized to the
subcontractor's mobile assignment list, same as today.

## Offer / Accept Flow

```
WorkOrder.status = scheduled
  └── operator picks subcontractor (or auto-routing — out of scope v1)
        └── Assignment.created (status = offered)
              ├── notification fires (push/email/SMS)
              ├── waiting on response → status stays `offered`
              └── timer fires past `expires_at` → status = `expired`
                    └── work order returns to operator queue

subcontractor responds:
  decline → status = declined → work order returns to operator queue
  accept  → guard runs full Dispatch Eligibility Gate
            ├── any fail → reject; status stays `offered`; reason returned
            └── pass     → status = accepted
                  └── WorkOrder.status: scheduled → dispatched
                        └── WorkOrderEvent row written (existing)
```

Key properties:

- A work order may have many `Assignment` rows over its life
  (declines, expirations, reassignments). Only one may be `accepted`
  at a time.
- `WorkOrder.assigned_contractor_membership_id` is set when an
  `Assignment.status` becomes `accepted`, and cleared if the assignment
  is later rescinded before work starts.
- An accepted `Assignment` cannot be silently changed. Reassignment
  requires `rescinded` on the current and a new offered row.

## Operator Rescission

```
Assignment.status = accepted, WorkOrder.status ∈ {dispatched, in_progress}
  └── operator action: rescind with reason
        ├── Assignment.status = rescinded
        ├── WorkOrder.assigned_contractor_membership_id = null
        └── WorkOrder remains in current state — operator must
            re-offer (new Assignment) or cancel the work order
```

Field artifacts already captured (proof-of-work, signatures) remain
bound to the work order; rescission does not erase audit.

## Document Gating Map (subcontractor side)

| Envelope                  | Without it (current behavior) | With it (gated)                  |
|---------------------------|-------------------------------|----------------------------------|
| `subcontractor_msa`       | sub treated as dispatchable   | required `executed` once before  |
|                           | from compliance gate alone    | any Assignment accept            |
| `subcontractor_per_job`   | not enforced                  | required when service declares   |
|                           |                               | `per_job_agreement_required`     |
| `safety_pack` (per pack)  | satisfied today via           | bidirectional: existing          |
|                           | `SafetyAcknowledgement`       | `SafetyAcknowledgement` rows are |
|                           |                               | treated as satisfied; new packs  |
|                           |                               | sign via envelope flow           |
| `payout_release`          | manual mark today             | gates `approved → paid` per      |
|                           |                               | period (PAYOUT roadmap)          |

The mapping must not change retroactive enforcement — `executed` MSAs
that pre-date a tenant policy change satisfy the gate from the date
they were signed forward.

## Compliance Gate Composition

Today's gate is a single boolean. The Phase 6 gate is a *vector* of
checks with named failure reasons, surfaced to the operator UI and to
the subcontractor mobile UI as actionable items:

```ts
type DispatchGateResult =
  | { ok: true }
  | { ok: false; failed_checks: ReadonlyArray<DispatchCheckFailure> };

type DispatchCheckFailure =
  | { kind: "membership_inactive" }
  | { kind: "document_missing"; document_type: string }
  | { kind: "document_expired"; document_type: string; expired_on: string }
  | { kind: "safety_pack_unsigned"; pack: string; version: number }
  | { kind: "msa_missing" }
  | { kind: "msa_voided" }
  | { kind: "per_job_envelope_missing" }
  | { kind: "trade_category_mismatch"; required: string }
  | { kind: "payout_account_unverified" };
```

The shape lives in `packages/domain` once the ontology PR lands.

## Offline Behavior

- Subcontractor mobile sees a **filtered** assignment list — only
  offers and accepted work orders for this membership. This is Class B
  (server-authoritative, narrow write).
- Mobile may propose `Assignment.status: offered → accepted` or
  `offered → declined`. The server runs the gate; mobile shows the
  reasons on rejection.
- Mobile may NOT propose `rescinded`. That stays server-side / web
  admin.

The full work-order field flow (`in_progress → awaiting_signoff`, proof
of work, customer sign-off) is unchanged — see
`WORK_ORDER_LIFECYCLE.md` and `OFFLINE_FIRST_ARCHITECTURE.md`.

## Hard Rules (proposed)

1. Every `Assignment` carries `tenant_id`. RLS by tenant.
2. At most one `Assignment` per work order may be `accepted` at any
   time. Enforced by a partial unique index:
   `unique (work_order_id) where status = 'accepted'`.
3. `Assignment.status` transitions are append-only by intent — a row
   moves through `offered → (accepted | declined | rescinded | expired)`
   and stops. Re-offering creates a new row.
4. `WorkOrder.assigned_contractor_membership_id` may only become non-
   null as the side effect of an `Assignment.status = accepted`
   transition, and is cleared by `rescinded`.
5. The Dispatch Eligibility Gate is evaluated **at accept time** and
   **at dispatch time** (defense-in-depth). A document expiring between
   accept and dispatch must block.
6. The Dispatch Eligibility Gate result is logged with the
   `WorkOrderEvent` row written for `scheduled → dispatched`. The
   failure reasons array is preserved in `WorkOrderEvent.payload_json`
   when the transition is rejected and re-attempted.

## Provider-Abstracted Concepts

- **Notifications** — push (Expo), email (Resend), SMS (Twilio). The
  Assignment-offered event fans out via a notification interface;
  channel selection per tenant config.
- **Payout account verification** — Stripe Connect today; abstract
  behind a `PayoutAccountProvider` interface so a future ACH-only or
  manual path remains supported.

The domain must not import notification or payout SDKs directly.

## Architecture Risks

1. **Race on accept.** Two subs offered the same job both tap accept
   simultaneously. Mitigation: the partial unique index from Hard
   Rule #2 collapses one to a unique-violation; the loser gets a
   friendly "already assigned" message.
2. **Stale offer lingering.** Subs ignore offers. Mitigation: hard
   `expires_at` on every offer, default 24h, tenant-configurable;
   background job moves expired offers to `expired` and re-surfaces
   the work order in the operator queue.
3. **Gate evaluation cost.** Evaluating the gate across many possible
   subs to power an "available subs" picker is expensive. Mitigation:
   a denormalized `dispatch_eligibility` view or materialized table
   refreshed on the source events (document verify, MSA execute,
   acknowledgement sign).
4. **Subcontractor-as-business deferral.** The model assumes one
   subcontractor = one person. Bringing in sub-businesses with their
   own crews changes the join shape significantly. Mitigation: keep
   the `Assignment.subcontractor_membership_id` FK named generically
   enough that a future `subcontractor_party_id` can replace it without
   widespread rename.
5. **Rescission audit gaps.** If `WorkOrder.assigned_contractor` is
   cleared but no audit row is written, history is lost. Mitigation:
   every rescission writes both an `Assignment` status row update AND
   a `WorkOrderEvent` (with `to_state = scheduled`, `reason` required).

## Open Questions

- Auto-routing offers (round-robin, distance-based, skill-based) vs.
  operator-picks? Default: **operator-picks** for v1; auto-routing is
  a Phase 6.x follow-up behind a per-tenant flag.
- Group offers (offer to N subs, first-to-accept wins)? Default:
  **no** for v1 — produces messy gate races. Revisit after data.
- Subcontractor counter-proposals (price, schedule)? Default: **no**
  in v1; price is fixed in the upstream Estimate. A sub that wants
  more money declines and the operator re-offers at a higher rate
  manually.
- Trade categories: free-text or curated taxonomy? Default: **curated
  taxonomy** seeded per domain pack (e.g. tile/bath ships
  `tile_install`, `tile_demo`, `plumbing_rough`, `plumbing_finish`,
  `tub_install`, `vanity_install`). Free-text under a `notes` column
  for everything else.
- Geographic gating (work outside service radius)? Default: **soft
  warning** in v1, not a hard block; ops people know their crews.

## Phase Mapping (recommended)

| Phase | Slice                                                          |
|-------|----------------------------------------------------------------|
| 6.0   | `Assignment` schema + RLS; partial unique index; basic         |
|       | offer/accept/decline flow without per-job e-sign               |
| 6.1   | Integrate `subcontractor_msa` envelope into the gate           |
| 6.2   | Integrate `subcontractor_per_job` envelope (opt-in by service) |
| 6.3   | Structured `DispatchGateResult` surfaced to UI                 |
| 6.4   | Offer expiration job + reassignment flow                       |
| 6.5   | Trade-category taxonomy and matching                           |

## Out of Scope (for this roadmap doc)

- Subcontractor marketplace (matching subs to LGAs across tenants).
- Performance / quality scoring of subcontractors.
- Bidding flows (subs counter on price).
- Multi-crew sub-businesses (`subcontractor_party` model).
- In-app chat between operator and sub.
- Calendar-aware scheduling (avoid double-booking).
