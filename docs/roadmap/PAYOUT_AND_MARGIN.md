# Payout and Margin (Roadmap / Spec)

> **Status: Roadmap only.** This document is a future-domain
> specification. It does **not** alter the canonical ontology
> (`docs/DOMAIN_MODEL.md`), the Drizzle schema (`packages/db`),
> RLS, or `docs/PAYOUT_RULES.md`. New entities listed here
> require an ontology-review PR before any schema work begins.
>
> Target phase mapping: **Phase 7** (after Phase 6 subcontractor
> dispatch).

## Purpose

Extend today's subcontractor-payout model with: (a) gating payout
eligibility on customer sign-off and signed payout releases, (b) margin
calculation per work order and per opportunity, and (c) attribution
reporting (cost-per-lead, cost-per-acquired-job, channel ROI). Pairs
with `PAYOUT_RULES.md` (the existing 1099 rollup), `LGA_MODEL.md` (the
end-to-end pipeline this measures), and `DOCUMENTS_AND_ESIGN.md` (the
release envelope that gates the final payout step).

## What This Replaces / Extends

| Today (`docs/PAYOUT_RULES.md`)         | After this roadmap                       |
|----------------------------------------|------------------------------------------|
| `PayoutLine` computed from work order  | unchanged shape; new eligibility checks  |
| Period flow `open → draft → approved   | unchanged; adds optional `payout_release`|
| → paid`                                | envelope gating `approved → paid`        |
| Manual "paid" mark by operator         | preserved as fallback; Stripe Connect    |
|                                        | webhook becomes primary path             |
| No margin tracking                     | new `MarginRecord` per work order +      |
|                                        | rollup views                             |
| No attribution                         | new `AttributionTouch` / `LeadSource`    |
|                                        | join to revenue                          |

Nothing in `PAYOUT_RULES.md` is invalidated by this roadmap. The
existing piece-rate / completion-flat / hourly-capped modes stand. The
weekly Mon–Sun period default stands. The append-only correction rule
stands.

## Payout Eligibility — Refined

Today: a `PayoutLine` is emitted when the work order is `completed`
(or `invoiced`, per tenant policy).

After this roadmap, eligibility composes three gates:

1. **Work-order state gate** (today). Work order is `completed` /
   `invoiced` per tenant policy.
2. **Customer sign-off gate** (today, generalized). The work order's
   `CustomerSignoff` row exists OR the linked `customer_completion`
   `DocumentEnvelope` is `executed`. Either satisfies — see
   `DOCUMENTS_AND_ESIGN.md` on the dual-write retention.
3. **Sub agreement gate** (new). The accepted `Assignment` for the
   work order references an `executed` MSA or per-job envelope; the
   payout line cannot point at a sub who never signed.

The `approved → paid` transition on a `PayoutPeriod` additionally
gates on the **payout release envelope** when the tenant has enabled it
(default: off; opt-in per `BusinessProfile`). The release is a
per-period signed acknowledgement from the LGA, useful for tenants who
want a paper trail on what was disbursed in a period.

## Proposed New Entities

### MarginRecord
A frozen per-work-order economics row, written when the work order
enters `invoiced` and updated only via append-only corrections (same
discipline as `PayoutLine`).

- `id`, `tenant_id`, `work_order_id`
- `opportunity_id` (nullable for direct-entry jobs)
- `estimate_id` (the accepted version)
- `revenue` (contract amount frozen from accepted estimate)
- `cogs_subcontractor` (sum of `PayoutLine.amount` for this work order)
- `cogs_materials` (from `MaterialCost` rows; see below)
- `cogs_other` (permits, dump fees, etc.)
- `processing_fees` (Stripe / ACH fees, when known)
- `gross_margin` = `revenue − (cogs_subcontractor + cogs_materials +
  cogs_other + processing_fees)`
- `gross_margin_pct`
- `computed_at`
- `recomputed_from` (nullable; FK to a prior `MarginRecord` when a
  correction supersedes)

### MaterialCost
Operator-entered materials cost tied to a work order. Lightweight in
v1.

- `id`, `tenant_id`, `work_order_id`
- `description`
- `amount`
- `recorded_at`, `recorded_by`
- `source` ∈ `{operator_entry, receipt_upload, supplier_invoice}`
- `attachment_file_id` (nullable; receipt scan)

### MarginCorrection
Append-only correction row when a material cost is added late or a
payout reversal happens.

- `id`, `tenant_id`, `work_order_id`
- `prior_margin_record_id`
- `new_margin_record_id`
- `delta_revenue`, `delta_cogs_subcontractor`, `delta_cogs_materials`,
  `delta_cogs_other`, `delta_processing_fees`
- `reason` (required)
- `created_at`, `created_by`

### Attribution rollup (read-side; not a separate write entity)

A periodic job materializes a view joining:
- `LeadSource` × `AttributionTouch` × `Lead` × `Opportunity` ×
  `WorkOrder` × `MarginRecord`

into per-period channel rows containing:
- leads, qualified leads, opportunities, won, contract value,
  recognized revenue, cogs, gross margin, channel spend, CPL, CAC,
  margin per acquired job.

This is reporting infrastructure (Class D server-only); it does not
need real-time writes.

## Margin Calculation Discipline

1. **Snapshots only.** Every input to a margin number is frozen at the
   event that triggered the write:
   - `revenue` = accepted estimate's total at acceptance time
   - `cogs_subcontractor` = sum of `PayoutLine.amount` whose
     `work_order_id` matches and whose `PayoutPeriod.paid_on` is set
     (or `approved`, per tenant policy)
   - `cogs_materials` = sum of `MaterialCost.amount` at the time of
     compute
   - `processing_fees` = sum of recorded fees on the work order
2. **Append-only corrections.** A late receipt, a payout reversal, or
   a change order writes a `MarginCorrection` and emits a new
   `MarginRecord`. The prior record stays.
3. **No retroactive rewriting.** Editing a `ServiceDefinition`'s
   default payout rule does not change historical `MarginRecord`s.
   Same principle as `service_snapshot_json` in the existing model.
4. **Currency.** Amounts are stored in minor units (cents) as integers.
   Currency is tenant-scoped (single currency per tenant in v1).
5. **Change orders** flow through as additional revenue on the same
   work order; a `MarginCorrection` row records the delta.

## Attribution Tracking

The chain runs: `LeadSource → AttributionTouch → Lead → Opportunity →
WorkOrder → MarginRecord`.

Attribution rules:

1. **First-touch source** is the `LeadSource` from the earliest
   `AttributionTouch` on a lead. Reported as default for CAC.
2. **Last-touch source** is the `LeadSource` from the latest touch
   before conversion. Reported as a secondary view.
3. **Channel spend** is operator-entered per `LeadSource` per period
   (or pulled from an integration in a later phase). Lives in a
   simple `ChannelSpend` table:
   - `id`, `tenant_id`, `lead_source_id`, `period_start`, `period_end`,
     `amount`, `notes`
4. **CAC** = `sum(ChannelSpend.amount) / count(Opportunities won
   attributed to that source)` per period.
5. **CPL** = `sum(ChannelSpend.amount) / count(Leads attributed)` per
   period.
6. **Margin attribution** = `sum(MarginRecord.gross_margin)` joined
   through the chain.

These are reports, not entities. Materialize when query cost demands
it; until then, run live against the joined views.

## Provider-Abstracted Concepts

- **Payout rails.** Stripe Connect is the planned primary integration
  (per `WORKSIE_SPINE.md`). The abstraction lives in a server-side
  `PayoutDispatcher` interface so manual ACH / Zelle / paper-check
  paths remain supported. Provider events (Stripe webhooks) flip
  `PayoutPeriod.status: approved → paid` once settled.
- **Channel spend ingestion.** Manual entry for v1. Future:
  Google Ads / Meta Ads / Angi API integrations behind a
  `ChannelSpendProvider` interface. Out of scope for Phase 7.
- **Fee accounting.** Stripe reports per-payout fees; the dispatcher
  writes them to the work order(s) covered by the payout for
  margin accuracy.

The domain layer must not import provider SDKs.

## Reporting Surfaces

The output of this layer is reports, not workflow UI. The proposed
operator-facing reports for Phase 7:

- **Margin by work order** — table, drillable to inputs.
- **Margin by service** — rollup across all work orders of a
  `ServiceDefinition` over a period.
- **Margin by subcontractor** — useful for renegotiating rates.
- **Margin by channel** — `LeadSource` × `MarginRecord` join.
- **Funnel by channel** — leads, qualified, won, lost reasons.
- **CAC, CPL, channel ROI** — per period, with trend.
- **Payout register** — same as today, plus eligibility-failure column
  for items pending a sign-off.

These render in the web admin. The mobile app does not show them.

## Hard Rules (proposed)

1. Every margin / cost / attribution row carries `tenant_id`. RLS by
   tenant.
2. `MarginRecord` is append-only. Corrections write a new record and a
   `MarginCorrection` row pointing both ways.
3. `PayoutLine` eligibility for a payout period requires:
   - work order's customer sign-off envelope (or legacy
     `CustomerSignoff` row) present
   - accepted `Assignment` envelope `executed`
   Lines failing eligibility surface in `draft` review with a
   structured reason; they do not silently roll forward.
4. `PayoutPeriod.status: approved → paid` is gated by tenant policy:
   manual mark (default), Stripe Connect webhook (when enabled), or
   `payout_release` envelope `executed` (when enabled). The three are
   composable; the transition fires when all enabled gates pass.
5. `MaterialCost` rows are append-only after the work order enters
   `invoiced`. Late material costs become `MarginCorrection`s, not
   in-place edits.
6. `ChannelSpend` rows are per-period; editing a closed period (past
   `cutoff_at`) is forbidden — corrections via a new row in the next
   period with a reason.
7. Currency arithmetic uses integers (minor units). No floats.

## Architecture Risks

1. **Margin number trust.** If operators don't believe the margin row,
   they ignore it. Mitigation: every `MarginRecord` is drillable to
   its inputs (estimate version, payout lines, material costs, fees)
   in one click. Show the formula in the UI.
2. **Late materials cost flood.** Operators enter materials cost
   sporadically. Mitigation: a "needs materials cost" queue surfacing
   work orders in `invoiced` with `cogs_materials = 0`. Don't block
   payout on it; surface it for completeness.
3. **Fee attribution.** Stripe payouts bundle multiple work orders'
   payments into a single transfer with a single fee. The dispatcher
   must apportion the fee proportionally; the algorithm is documented
   in the implementation, not hidden.
4. **Attribution chain breakage.** A lead created by a manual operator
   entry has no `AttributionTouch`. Treat as `LeadSource = 'direct'`
   (a system-seeded source) so reports stay total-revenue-honest.
5. **Privacy / scope of attribution data.** UTM data and channel
   ingestion can pull sensitive customer info. The model stores
   minimum needed; integrations land in a separate phase with their
   own privacy review.
6. **Tenancy of channel spend.** Channel spend is per-tenant. A future
   multi-business operator (multiple `BusinessProfile`s under one
   tenant) wants per-profile spend. Default: tenant-scope in v1;
   open question to revisit.

## Open Questions

- Should `MarginRecord` be computed on every payout event or as a
  scheduled batch? Default: **event-driven** (write on `invoiced`,
  rewrite on each `MarginCorrection`-worthy event). Batches are
  reconciliation, not source of truth.
- Should we model AR (customer payment received) separately from
  contract execution? Default: **yes**, but Phase 7+ — an `Invoice`
  + `Payment` pair, driven by Stripe Invoices. Margin's `revenue`
  becomes "recognized revenue" gated on collection, not on contract
  signing.
- Multi-currency? Default: **no** for v1; one currency per tenant.
- Do we track GP vs NP (gross vs net of overhead)? Default: **gross
  only**; net needs an overhead allocation model we don't have.
- Do we publish margin to the field worker? Default: **no** — the
  contractor sees their pay, not the LGA's margin.

## Phase Mapping (recommended)

| Phase | Slice                                                          |
|-------|----------------------------------------------------------------|
| 7.0   | Payout eligibility refinement (customer sign-off + sub         |
|       | envelope checks) without margin or attribution                 |
| 7.1   | Stripe Connect adapter behind `PayoutDispatcher`; webhook      |
|       | drives `approved → paid`                                       |
| 7.2   | `MaterialCost` entity + UI for entry                           |
| 7.3   | `MarginRecord` + `MarginCorrection` schema + computation       |
| 7.4   | Operator reports: margin by work order / service / sub         |
| 7.5   | `ChannelSpend` + first-touch / last-touch attribution joins    |
| 7.6   | Channel reports: CAC, CPL, channel ROI                         |
| 7.7   | Optional `payout_release` envelope gate                        |

## Out of Scope (for this roadmap doc)

- AR / invoicing the customer (separate Phase 7+ slice).
- Accounting integration (QuickBooks, Xero) — separate doc.
- 1099 filing (Worksie produces totals, the operator's accountant
  files).
- Overhead allocation / net profit modeling.
- Multi-currency / FX handling.
- Forecasting and predictive reporting.
- Operator commission splits / sales rep payouts.
