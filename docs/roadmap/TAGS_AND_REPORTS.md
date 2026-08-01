# Tags and Reports (Roadmap / Spec)

> **Status: Roadmap only.** This document is a future-domain
> specification. It does **not** alter the canonical ontology
> (`docs/DOMAIN_MODEL.md`), the Drizzle schema (`packages/db`),
> RLS, or the work order lifecycle. New entities listed here
> require an ontology-review PR before any schema work begins.
>
> Target phase mapping: **unsequenced.** Priority depends on the pilot
> scenario decision (`WORKSIE_GTM_PROJECT_PLAN.md` backlog #5, a Hold
> Gate).

## Purpose

Two back-office surfaces that fall out of proof-of-work data already captured:
**finding** artifacts across jobs, and **handing them off** as a document.

## 1. Tags

### Core Principle

**Tags are a retrieval tool, not an ontology.**

Worksie's doctrine is "model capability, not catalog" (`WORKSIE_SPINE.md` #2).
Tags do not violate that as long as they stay a user-applied retrieval label
and never become a place where business rules hide. A tag must not gate
anything.

### Relationship to the dispatch trade taxonomy

`SUBCONTRACTOR_DISPATCH.md` §6.5 proposes a curated trade-category taxonomy,
and `TILE_BATH_DOMAIN_PACK.md` seeds `trade_categories`. Those are **not**
this.

| | Purpose | Who sets it | Gates anything? |
|---|---|---|---|
| Trade taxonomy | Match a contractor to a job | Curated, system-owned | Yes — dispatch eligibility |
| Tags | Find things later | Free, user-applied | Never |

Keeping them separate is deliberate. Collapsing them would let an operator
accidentally change dispatch eligibility by typing a label on a photo.

### Proposed shape

Polymorphic, `tenant_id`-scoped:

- `Tag` — `id`, `tenant_id`, `name`, `created_at`, `updated_at`; unique on
  `(tenant_id, name)`.
- `Taggable` — `tag_id`, `tenant_id`, `taggable_type`, `taggable_id`.
  - `FOREIGN KEY (tenant_id, tag_id) REFERENCES tags (tenant_id, id)`
  - `UNIQUE (tenant_id, tag_id, taggable_type, taggable_id)`

Applying to artifacts requires the `unique (tenant_id, id)` that landed on
`proof_of_work_artifacts` in Phase 3.5.

**The two sides of this row have different enforceability, and earlier drafts
of this spec conflated them.**

The **tag side is not polymorphic** and gets Hard Rule #1 from the database for
free: the composite FK above makes it structurally impossible to attach a tag
belonging to one tenant to a row in another. That constraint should be written,
not deferred.

The **taggable side is polymorphic**, and that is the half a single composite
constraint cannot express. Tenant pinning there has to be asserted per-type,
via either per-type FKs or a trigger. Note it in the ontology-review PR — it is
the one place this design does not get Hard Rule #1 for free.

The uniqueness constraint is separate from tenant pinning and does its own job:
without it the same tag can be applied to the same row repeatedly, which turns
every "show me everything tagged X" query into a `DISTINCT` and lets a
double-tap in the field silently inflate counts.

### Competitive note

`Tag` is one of only two objects CompanyCam gave full CRUD in their public API
(`/tags`, `/photos/{id}/tags`), which is evidence that cross-job retrieval
carries real back-office weight at volume rather than being a nice-to-have.

## 2. Reports

### Core Principle

**Deterministic and templated. Never narrated.**

`PRD.md` §Out of Scope (v1) bars *"AI-generated narrative reports. Reserved for
later."* `TILE_BATH_DOMAIN_PACK.md` independently bars *"auto-narration of
completion reports."*

This spec stays inside both. A report here is a **rendering of data that
already exists** — work order, line items, checklist steps, artifacts,
sign-off — into a fixed template. No model generates prose. Nothing in the
output is not already a row.

That boundary is not a limitation to work around; it is what makes the output
admissible as proof-of-work. A narrated summary is an assertion. A rendered
record is evidence.

### Proposed shape

- `ReportTemplate` — `id`, `tenant_id`, `name`, layout definition, branding,
  `revision` (monotonic), `created_at`, `updated_at`.
- `GeneratedReport` — `id`, `tenant_id`, `work_order_id`, `report_template_id`,
  `template_revision`, `file_id`, `content_hash`, `generated_at`,
  `generated_by`.

A generated report is itself durable evidence, so it gets a `content_hash` for
the same reason artifacts do.

**A report must remain reproducible after its template changes.** A bare
`report_template_id` does not achieve that: rebranding or relaying out a
template silently changes what regenerating an old report produces, so the
stored `content_hash` no longer matches anything reproducible and the report
stops being evidence. `GeneratedReport` therefore pins the exact
`template_revision` it was rendered from, and template revisions are immutable
once referenced — an edit creates a new revision rather than mutating the one
in use. (Embedding a full template snapshot per report is the alternative;
immutable revisions are cheaper and give the same guarantee.)

This mirrors `work_orders.service_snapshot_json` (Hard Rule #2): the rule set
in force when the record was created is frozen with the record, so later
configuration changes cannot rewrite the past.

**Lifecycle convention.** `ReportTemplate` follows the standard
`created_at` / `updated_at` convention in `DOMAIN_MODEL.md`. `GeneratedReport`
is **append-only** and deliberately carries no `updated_at`: a rendered record
is evidence, and evidence that can be edited in place is not evidence. It is
superseded by generating a new report, never mutated. This is an explicit
exception to the convention, stated here so the ontology-review PR can accept
or reject it rather than infer it from an omission.

### Composition

Roughly 80% derivable from existing rows today: `work_orders` +
`work_order_line_items` + `checklist_steps` + `proof_of_work_artifacts` +
`customer_signoffs`. What is missing is a renderer and a template model.

`tiptap-ruby` is worth noting as prior art for the *shape* of the problem, not
the stack: CompanyCam models rich text once and renders it to HTML, Markdown,
and plain text, so the same document is displayable, exportable, and
searchable. If Worksie renders reports, one canonical document model beats
three renderers.

### Competitive note

CompanyCam markets Photo Reports but exposes **no report endpoint** in their
public API — reports are web-app-only and cannot be automated. An
API-addressable report is a differentiator, not parity.

## Open questions

- Does a report render at completion, or on demand? On demand keeps the
  content current; at completion freezes it, which is what evidence usually
  wants. Frozen is probably right, consistent with `service_snapshot_json`.
- Do annotations (`CAPTURE_INTEGRITY.md`) appear in reports? If so, the
  renderer needs the overlay, not just the file bytes.
- Should a report be a `ProofOfWorkArtifact` with `kind = pdf`, or its own
  entity? Reusing the artifact keeps one storage path; a separate entity
  avoids implying a report is field-captured evidence. Leaning separate.

## Dependencies

- Tags on artifacts require the Phase 3.5 `unique (tenant_id, id)` (landed).
- Reports require a rendering runtime. No API routes or edge functions exist
  yet, so this is blocked on that regardless of priority.

## Explicitly not in this spec

- AI-generated narrative, summaries, or auto-tagging — barred by `PRD.md` and
  `TILE_BATH_DOMAIN_PACK.md`.
- Tags gating dispatch, payout, or any state transition.
- Replacing the dispatch trade taxonomy.
- Customer-facing shareable report links — `PRD.md` bars a customer
  self-service portal beyond sign-off.
