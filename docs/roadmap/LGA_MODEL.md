# LGA Model (Roadmap / Spec)

> **Status: Roadmap only.** This document is a future-domain
> specification. It does **not** alter the canonical ontology
> (`docs/DOMAIN_MODEL.md`), the Drizzle schema (`packages/db`),
> RLS, or the work order lifecycle. New entities listed here
> require an ontology-review PR before any schema work begins.
>
> Target phase mapping (see "Phase mapping" below): **Phase 4+**.

## Purpose

Define the commercial pipeline that the Worksie operator — referred to in
this doc as the **LGA** (the contractor running a lead-to-payout
commercial pipeline with subcontractors performing the field work) —
needs to run an end-to-end job. The pipeline spans lead intake,
opportunity quoting, contract execution, work-order dispatch, proof of
work, customer sign-off, subcontractor payout, and margin attribution.

The existing canonical model covers the **execution half** (work order →
proof → payout) very well. This roadmap covers the **commercial half**
(lead → opportunity → estimate → contract) that sits in front of it, and
the **margin/attribution half** that sits behind it.

## Operating Term

**LGA** in this document is shorthand for "the operating contractor that
owns the customer relationship, signs the customer contract, dispatches
subcontractors, and collects payment." It is not a new entity. It maps
onto an existing `Tenant` + `BusinessProfile` + `Membership(role=operator)`.

A future role expansion may add `subcontractor_business` to model
sub-businesses as first-class tenants with their own crews; that is
**out of scope** for this roadmap and is called out under "Open
questions."

## Layered Architecture

Worksie today covers layers 4–6. This roadmap adds layers 1–3 in front
and layers 7–9 behind. The execution layers (4–6) remain authoritative
and unchanged.

| # | Layer            | Owns                                                | Today                |
|---|------------------|-----------------------------------------------------|----------------------|
| 1 | Lead             | acquisition + intake                                | NEW                  |
| 2 | Opportunity      | quoting + estimate lifecycle                        | NEW                  |
| 3 | Contract         | customer agreement + e-sign gating                  | NEW                  |
| 4 | Work order       | operational execution                               | DONE (Phase 2)       |
| 5 | Dispatch         | subcontractor orchestration                         | partial (compliance) |
| 6 | Proof            | evidence + customer sign-off                        | DONE (Phase 2)       |
| 7 | Payout           | subcontractor compensation                          | partial (rules only) |
| 8 | Margin           | LGA economics (revenue − COGS − fees)               | NEW                  |
| 9 | Attribution      | acquisition channel + cost                          | NEW                  |

## Core Principle (carries the model)

**Signed documents are workflow gates.**

The commercial pipeline progresses by executed legal artifacts, not by
self-reported status. Every advance is gated by a signed document:

```
Customer signs contract       →  Work Order may leave `draft`
Subcontractor signs sub agreement →  Subcontractor becomes dispatchable
Customer signs completion form   →  Work Order may leave `awaiting_signoff`
LGA signs payout release         →  Payout Line eligible for `paid`
```

This is the same shape the existing model already uses for compliance
(W-9 / COI / safety acknowledgements gate dispatch). This roadmap
generalizes that pattern into a first-class document/e-sign layer (see
`DOCUMENTS_AND_ESIGN.md`).

## Proposed New Entities

These are **proposed**, not adopted. Each must clear ontology review
before any Drizzle work.

### Lead
Inbound interest from a prospective customer, before any quoting.
- `id`, `tenant_id`
- `source` (FK → `LeadSource` — see `Attribution`)
- `captured_at`, `captured_by` (nullable for inbound forms)
- `contact_name`, `phone`, `email`, `address`
- `interest_category` (e.g. `tub_to_shower`, `ramp_install`)
- `status` ∈ `{new, contacted, qualified, disqualified, converted}`
- `converted_opportunity_id` (nullable)

### Opportunity
A qualified lead becoming a deal. One or more Estimates may attach.
- `id`, `tenant_id`
- `lead_id` (nullable for direct entry)
- `customer_id` (created or matched at conversion)
- `service_definition_id` (the capability being quoted)
- `status` ∈ `{open, quoting, presented, won, lost, expired}`
- `expected_close_at`, `won_at`, `lost_reason`

### Estimate
A versioned price proposal under an Opportunity.
- `id`, `tenant_id`, `opportunity_id`
- `version` (monotonic per opportunity)
- `line_items_json` (frozen snapshot at presentation time)
- `subtotal`, `tax`, `total`
- `valid_until`
- `status` ∈ `{draft, presented, accepted, declined, superseded}`
- `accepted_envelope_id` (FK → DocumentEnvelope — see `DOCUMENTS_AND_ESIGN.md`)

### ChangeOrder
A scoped amendment to an executed contract. Re-signed by the customer.
- `id`, `tenant_id`, `work_order_id`
- `delta_line_items_json` (additive or subtractive)
- `delta_total`
- `reason`
- `envelope_id` (FK → DocumentEnvelope)
- `status` ∈ `{draft, presented, accepted, declined}`

### LeadSource (attribution)
A configured acquisition channel.
- `id`, `tenant_id`
- `name` (e.g. `google_lsa`, `home_advisor`, `referral_neighbor`,
  `truck_signage`)
- `category` ∈ `{paid_search, paid_social, referral, organic, offline,
  partnership}`
- `cost_model` ∈ `{cpc, cpl, flat_monthly, revenue_share}`
- `active` (bool)

### AttributionTouch
A captured touchpoint from lead intake. Multiple per Lead allowed.
- `id`, `tenant_id`, `lead_id`
- `lead_source_id`
- `occurred_at`
- `medium` (free text — e.g. `web_form`, `phone`, `chat`)
- `utm_json` (nullable)

### Assignment
Distinct from `WorkOrder`: an assignment is the *offer* and the
*acceptance* of a work order to a specific subcontractor. A work order
may go through multiple assignments before being completed (decline,
reassignment). See `SUBCONTRACTOR_DISPATCH.md`.

- `id`, `tenant_id`, `work_order_id`
- `subcontractor_membership_id`
- `offered_at`, `responded_at`, `accepted_at`
- `status` ∈ `{offered, accepted, declined, rescinded, expired}`
- `agreement_envelope_id` (FK → DocumentEnvelope — the per-job sub
  agreement if used, else null when an MSA covers it)

The full document / envelope / signer schema lives in
`DOCUMENTS_AND_ESIGN.md`.

## Lifecycle Overview (end-to-end)

```
Lead (new → qualified)
  └── Opportunity (open → quoting → presented)
        └── Estimate v1, v2, ... (draft → presented → accepted)
              └── Customer contract envelope SIGNED  ────────────────┐
                    └── WorkOrder (draft → scheduled)                │
                          └── Assignment (offered → accepted)        │
                                 ─ subcontractor agreement SIGNED ───┤
                                └── WorkOrder (dispatched → in_progress
                                       → awaiting_signoff)            │
                                      └── Customer completion SIGNED ─┤
                                            └── WorkOrder (completed   │
                                                  → invoiced)          │
                                                  └── PayoutLine       │
                                                        eligible ─────┘
                                                        → paid
                                                  └── MarginRecord
                                                        emitted
```

Each `SIGNED` step is an executed `DocumentEnvelope`. The signing event
is what flips the gate; the upstream status fields are derived, not
source of truth.

## Relationship To Existing Entities

| New                | Relates to                                          |
|--------------------|-----------------------------------------------------|
| `Lead`             | new; `LeadSource`                                   |
| `Opportunity`      | `Customer`, `ServiceDefinition`                     |
| `Estimate`         | `Opportunity`, `DocumentEnvelope`                   |
| `ChangeOrder`      | `WorkOrder`, `DocumentEnvelope`                     |
| `Assignment`       | `WorkOrder`, `Membership(role=contractor)`,         |
|                    | `DocumentEnvelope`                                  |
| `LeadSource`       | new                                                 |
| `AttributionTouch` | `Lead`, `LeadSource`                                |
| `MarginRecord`     | `WorkOrder`, `PayoutLine`, `Estimate`               |

`WorkOrder` gains optional foreign keys to `Opportunity` and to the
customer contract `DocumentEnvelope`. These are **additive** and
backward-compatible with the Phase 2 schema.

## Phase Mapping (recommended)

| Phase | Slice                                                       |
|-------|-------------------------------------------------------------|
| 4     | `Lead`, `LeadSource`, `AttributionTouch`, `Opportunity`,    |
|       | `Estimate` (draft → presented → accepted lifecycle, no      |
|       | e-sign integration — accepted = operator marks accepted)    |
| 5     | `DocumentTemplate`, `DocumentEnvelope`, `DocumentSigner`,   |
|       | `SignedDocumentArtifact`, `SignatureAuditTrail`             |
|       | (see `DOCUMENTS_AND_ESIGN.md`); retrofits Estimate          |
|       | acceptance + customer contract gating                       |
| 6     | `Assignment`, subcontractor agreement gating                |
|       | (see `SUBCONTRACTOR_DISPATCH.md`)                           |
| 7     | `MarginRecord` + attribution reporting                      |
|       | (see `PAYOUT_AND_MARGIN.md`)                                |
| 8     | First domain packs (tile/bath — see                         |
|       | `TILE_BATH_DOMAIN_PACK.md`)                                 |

Each phase ships with: ontology PR → schema PR → backend PR → UI PR.
No schema lands without a docs update first.

## Hard Rules (proposed — to harden during ontology review)

1. Every commercial entity (`Lead`, `Opportunity`, `Estimate`,
   `ChangeOrder`, `Assignment`, `LeadSource`, `AttributionTouch`,
   `MarginRecord`) carries `tenant_id`. RLS by tenant, same as today.
2. An `Estimate` is **frozen** at `presented`. Edits create a new
   version. The accepted version's snapshot becomes the contract scope.
3. A `WorkOrder` may not leave `draft` for `scheduled` unless its
   linked customer-contract envelope is in `executed` status (when the
   linkage exists; backward-compatible nullable in Phase 4 ramp).
4. An `Assignment` may not enter `accepted` unless the subcontractor's
   per-job or MSA envelope is `executed` AND the existing compliance
   gate is green.
5. A `MarginRecord` is computed from frozen snapshots
   (`estimate.line_items_json`, `service_snapshot_json`, payout-rule
   snapshot). Margin numbers do not retroactively change when rates,
   estimates, or services are edited later.
6. `LeadSource` is configuration. Deleting one is forbidden once it has
   `AttributionTouch` history; soft-deactivate via `active = false`.

## Provider-Abstracted Concepts

These should land behind interfaces so the platform is not locked to a
single vendor. The provider seam belongs in `apps/web` / a server
package, not in `packages/domain`.

- **E-sign provider** — DocuSign, Dropbox Sign, Anvil, Adobe Sign,
  native EIDAS/UETA-compliant flow. See `DOCUMENTS_AND_ESIGN.md`.
- **Payment rails / payout** — Stripe Connect (current direction),
  Adyen, manual ACH. See `PAYOUT_AND_MARGIN.md`.
- **Lead intake channels** — web form, Zapier inbound, marketplace
  webhooks (Angi/Thumbtack/Home Advisor), email parsing. Channels write
  `Lead` + `AttributionTouch` through a normalized intake API.
- **Communications** — email (Resend), SMS (Twilio) for envelope
  delivery and reminders.

The domain model must not import any provider SDK.

## Architecture Risks

1. **Ontology bloat.** Adding ten entities at once is the single biggest
   risk to the discipline that kept Phase 2 clean. Mitigation: phase
   the additions (Phase 4 vs 5 vs 6), and gate each set behind an
   ontology PR.
2. **E-sign timing.** Treating documents as gates means an outage at
   the e-sign provider blocks the pipeline. Mitigation: native fallback
   path (in-app signature capture is already supported for customer
   sign-off) and clear "manual override with audit reason" for
   operators.
3. **Estimate edit churn.** Sales reps will want to "fix typos" on a
   presented estimate. Mitigation: edits create a new version; the
   prior version stays for audit. The UI surfaces this clearly.
4. **Margin denormalization.** Margin queries want pre-aggregated rows;
   computing on the fly across snapshots is expensive at scale. See
   `PAYOUT_AND_MARGIN.md` for the materialization plan.
5. **Lead attribution data quality.** UTM/source data is noisy.
   Treating `LeadSource` as configuration (curated, not free text)
   protects reporting; `medium` and `utm_json` carry the raw mess.
6. **Subcontractor identity model.** Today a `contractor` membership is
   a person under one tenant. A "subcontractor business" with its own
   crew is not modeled. The Phase 6 Assignment slice should be designed
   to accept either, with the multi-person sub-business deferred.
7. **Offline behavior of commercial entities.** `Lead`, `Opportunity`,
   `Estimate` are office work, not field work. They are Class D
   (server-only) in `OFFLINE_FIRST_ARCHITECTURE.md` terms. The field
   app does not need them in SQLite.

## Open Questions

- Is the LGA always a single tenant, or does a multi-region operator
  want one tenant with many `BusinessProfile`s? Default: single tenant
  per LGA; revisit if multi-region surfaces real friction.
- Does a subcontractor ever sign once (MSA covering all future jobs)
  vs. per-job? Default: both supported — MSA satisfies the gate; per-
  job envelope optional.
- Where does the Stripe Connect onboarding sit — under `Membership`
  (the sub) or under a separate `PayoutAccount` entity? Defer to
  Phase 7.
- Are leads ever shared between tenants (lead marketplace)? Out of
  scope; would be a separate model entirely.

## Out of Scope (for this roadmap doc)

- Implementation details of the e-sign integration (covered in
  `DOCUMENTS_AND_ESIGN.md`).
- Domain packs beyond tile/bath (covered separately when added).
- Customer self-service portal beyond receiving / signing documents.
- Lead routing / round-robin assignment to sales reps.
- Multi-LGA marketplace economics.

## Required Follow-ups Before Implementation

1. Ontology PR adding the proposed entities to `DOMAIN_MODEL.md` (only
   after this roadmap is reviewed and accepted).
2. `packages/domain` update to extend `ENTITY_NAMES` and add new
   string-literal enums.
3. Schema PR generating Drizzle tables (Phase 4 slice first).
4. RLS PR extending tenant-scoped policies to new tables.
5. Backend service PR implementing gating transitions.
6. UI PR for operator-facing CRUD.

No step is skippable. No step happens out of order.
