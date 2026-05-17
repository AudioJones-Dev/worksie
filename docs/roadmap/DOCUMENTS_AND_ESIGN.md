# Documents and E-Sign (Roadmap / Spec)

> **Status: Roadmap only.** This document is a future-domain
> specification. It does **not** alter the canonical ontology
> (`docs/DOMAIN_MODEL.md`), the Drizzle schema (`packages/db`),
> RLS, or the work order lifecycle. New entities listed here
> require an ontology-review PR before any schema work begins.
>
> Target phase mapping: **Phase 5** (after Phase 4 lead/opportunity
> slice and before Phase 6 subcontractor dispatch refactor).

## Purpose

Define the document and e-signature subsystem that turns legal artifacts
into operational gates. Pairs with `LGA_MODEL.md` (the commercial
pipeline that this subsystem unblocks), `WORK_ORDER_LIFECYCLE.md` (the
state machine signed artifacts gate), and `ONBOARDING_FLOWS.md` (the
existing compliance gate this generalizes).

## Core Principle

**Executed documents are state transitions.**

The existing model already enforces this for safety acknowledgements and
customer sign-off. This roadmap promotes the pattern to a first-class
subsystem so that:

- Customer contracts gate `Work Order` entry into `scheduled`.
- Subcontractor agreements (MSA or per-job) gate `Assignment` into
  `accepted`.
- Change orders gate scope changes on an in-flight work order.
- Customer completion forms gate `awaiting_signoff → completed`.
- Payout releases (when adopted) gate `approved → paid` per contractor.

Every gate listed above is a `DocumentEnvelope` reaching `executed`.

## What This Replaces / Extends

| Today                                    | After this roadmap                       |
|------------------------------------------|------------------------------------------|
| `CustomerSignoff` (single-purpose row)   | a `DocumentEnvelope` of template type    |
|                                          | `customer_completion`, with the existing |
|                                          | row preserved for backward compat        |
| `SafetyAcknowledgement` (single-purpose) | a `DocumentEnvelope` of template type    |
|                                          | `safety_pack_v{n}`, preserved row        |
| Contractor doc uploads                   | unchanged; W-9/COI/license remain        |
|                                          | `ContractorDocument` (uploaded artifact, |
|                                          | not signed flow)                         |

The existing single-purpose rows stay. New gates use the envelope model.
Migration is additive: legacy data does not need to be re-keyed.

## Proposed New Entities

### DocumentTemplate
A reusable, versioned template for a class of document.
- `id`, `tenant_id`
- `kind` ∈ `{customer_contract, change_order, subcontractor_msa,
  subcontractor_per_job, customer_completion, safety_pack,
  payout_release, custom}`
- `name`
- `version` (monotonic per template)
- `body_ref` (storage path to the templated body — Markdown, MDX, or
  PDF with field markers)
- `signer_roles_json` (e.g. `["customer", "lga_operator"]`)
- `field_schema_json` (named merge fields the renderer will fill)
- `active` (bool — only `active` templates can be enveloped)

### DocumentEnvelope
An instance of a template prepared for signing against a specific
business object.
- `id`, `tenant_id`
- `template_id`, `template_version` (frozen at creation)
- `subject_type` (e.g. `opportunity`, `work_order`, `assignment`,
  `change_order`, `payout_period`)
- `subject_id` (the referenced row id)
- `rendered_body_ref` (storage path of the rendered, frozen artifact
  sent to signers — never re-rendered)
- `field_values_json` (the resolved merge data, frozen)
- `created_at`, `created_by`
- `status` ∈ `{draft, sent, partially_signed, executed, declined,
  voided, expired}`
- `sent_at`, `executed_at`, `expires_at` (nullable)
- `provider` ∈ `{native, docusign, dropbox_sign, anvil, other}`
- `provider_envelope_id` (nullable; external provider id)

### DocumentSigner
A required signer on an envelope.
- `id`, `tenant_id`
- `envelope_id`
- `role` (matches one of the template's `signer_roles_json`)
- `party_type` ∈ `{user, customer, contact}`
- `user_id` (nullable — internal signers)
- `customer_id` (nullable — when the signer is the work order's
  customer)
- `contact_name`, `contact_email`, `contact_phone` (free-text for
  external signers)
- `order_index` (signing order; 0 = first)
- `signed_at` (nullable until signed)
- `signature_artifact_id` (FK → SignedDocumentArtifact, nullable)
- `status` ∈ `{pending, viewed, signed, declined, expired}`

### SignedDocumentArtifact
The immutable, executed signed PDF (or equivalent) and its hash.
- `id`, `tenant_id`
- `envelope_id`
- `signer_id`
- `file_id` (Supabase Storage — the per-signer signed page set OR the
  combined fully-executed artifact for the final signer)
- `sha256` (content hash, recorded at write time)
- `kind` ∈ `{per_signer, fully_executed}`
- `produced_at`

### SignatureAuditTrail
Append-only event log per envelope. Mirrors the durability discipline of
`WorkOrderEvent`.
- `id`, `tenant_id`
- `envelope_id`
- `signer_id` (nullable for system events)
- `event` ∈ `{created, sent, viewed, signed, declined, voided,
  reminder_sent, expired, executed}`
- `at`
- `actor` (user id, nullable — null for provider webhook events)
- `source` ∈ `{web_admin, mobile, system, provider_webhook}`
- `payload_json` (provider event payload, redacted of PII not needed)

Never updated. Never deleted. Survives envelope `voided`.

## Envelope Lifecycle

```
draft
  └── sent
        ├── partially_signed
        │     └── executed     (all signers signed)
        ├── declined           (any signer declined)
        ├── voided             (operator action; terminal)
        └── expired            (past expires_at without execution)
```

`executed` is the only terminal state that flips a downstream gate.

`voided` requires `reason` (same convention as `WorkOrderEvent.reason`
for `cancelled`/`voided`).

## Gate Mapping

The mapping between envelope `kind` and the downstream state it
unblocks:

| Template kind            | Subject       | Gates                                  |
|--------------------------|---------------|----------------------------------------|
| `customer_contract`      | `opportunity` | `Opportunity → won`; permits WorkOrder |
|                          |               | creation                               |
| `change_order`           | `work_order`  | applying scope delta to live WorkOrder |
| `subcontractor_msa`      | `membership`  | sub becomes eligible for `Assignment`  |
| `subcontractor_per_job`  | `assignment`  | `Assignment → accepted`                |
| `customer_completion`    | `work_order`  | `awaiting_signoff → completed`         |
| `safety_pack`            | `membership`  | safety pack satisfied for dispatch     |
| `payout_release`         | `payout_period`| `approved → paid` for that period     |

Each row above must have a documented enforcement point in code (a
guard on the relevant transition) before the gate is wired up. Gates
land per phase, not all at once.

## Provider Abstraction

The platform must not be vendor-locked. A `DocumentSigningProvider`
interface lives in the server layer (proposed: `packages/services` or
`apps/web/lib/esign`).

```ts
interface DocumentSigningProvider {
  createEnvelope(input: CreateEnvelopeInput): Promise<EnvelopeRef>;
  sendEnvelope(envelopeId: string): Promise<void>;
  voidEnvelope(envelopeId: string, reason: string): Promise<void>;
  fetchSignedArtifact(envelopeId: string): Promise<ArtifactBytes>;
  handleWebhook(payload: unknown): Promise<EnvelopeEvent[]>;
}
```

A **native provider** must exist (in-app signature capture using the
same flow today's `CustomerSignoff` uses — canvas signature stored to
Supabase Storage, audit row written). The native provider is what
keeps the field flow working when the third-party provider is down or
when the tenant has opted out of an external e-sign vendor.

Third-party providers are adapters around the same interface. The first
adapter is **deferred to ontology review** — likely Dropbox Sign or
DocuSign based on pricing and reliability.

`packages/domain` must not import any provider SDK. Provider names live
as a string-literal enum in `packages/domain` so the rest of the system
can pattern-match without depending on adapter code.

## Rendering and Storage

- Template bodies live in Supabase Storage under a `templates/` prefix.
- Rendered envelope bodies (the frozen artifact sent to signers) live
  under `envelopes/<envelope_id>/rendered.pdf`. Never overwritten.
- Per-signer signed artifacts live under
  `envelopes/<envelope_id>/signers/<signer_id>.pdf`.
- The fully-executed combined PDF lives under
  `envelopes/<envelope_id>/executed.pdf` and is the legal artifact.
- All artifacts are hashed (`sha256`) at write time; the hash is
  recorded on the `SignedDocumentArtifact` row.

Storage paths are by id, not by name, so renames in the UI never break
references.

## Offline Behavior

- **Customer completion** sign-off happens on the contractor's device at
  the job site. This must work offline. The flow is the existing
  `CustomerSignoff` pattern: capture signature → write artifact locally
  → enqueue upload → server creates the envelope retroactively (or
  binds to a pre-created envelope) on receipt.
- **All other envelopes** (contracts, change orders, MSAs) are office
  work or remote signing. They live in Class D (server-only) in
  `OFFLINE_FIRST_ARCHITECTURE.md` terms.

## Hard Rules (proposed)

1. Every envelope and every audit row carries `tenant_id`. RLS by
   tenant, same as today.
2. `DocumentTemplate.body_ref` is **immutable** for a given
   `template_id, version`. Edits create a new version.
3. `DocumentEnvelope.rendered_body_ref` is **frozen at `sent`**. Never
   re-rendered. The legal artifact must equal what the signers saw.
4. `SignatureAuditTrail` is append-only. Same DB-level guard pattern as
   `work_order_events` (BEFORE UPDATE / DELETE trigger raising).
5. `SignedDocumentArtifact.file_id` and `sha256` are write-once. Edits
   create a new row.
6. A gate transition guard rejects the move if the linked envelope is
   not `executed` (or not present when required by the gate map).
7. Operator override is permitted only via an explicit
   `SignatureAuditTrail` event of `event = voided` with a non-empty
   `payload_json.override_reason`. No silent bypass.
8. PII in `payload_json` is redacted to the minimum needed for support
   debugging — never store full signed bodies in the audit row.

## Architecture Risks

1. **Provider drift.** Each e-sign vendor models signers, events, and
   webhooks slightly differently. The adapter layer must normalize
   aggressively; the domain must not see vendor-specific fields.
2. **Template editing UX.** Operators will want WYSIWYG. The freezing
   discipline (versioned templates, frozen rendered bodies) is what
   keeps audit honest, and the UI has to make versioning obvious.
3. **Long-lived envelope state.** Envelopes can sit in `sent` for
   weeks. Reminders, expirations, and stale-cleanup are
   operational concerns the v1 build cannot skip.
4. **Webhook security.** Provider webhooks must verify signatures and
   write through the same audit trail. A spoofed `executed` event
   would flip a downstream gate falsely.
5. **Backwards compatibility with existing `CustomerSignoff`.** The
   existing single-purpose row stays. New work order completion flows
   should write *both* the legacy row and a `DocumentEnvelope` until
   the legacy row is fully retired (separate doc PR).
6. **Storage cost.** Every signed artifact is permanent. Plan retention
   policies (off-platform cold storage after N years) as part of the
   Phase 5 design, even if implementation is deferred.

## Open Questions

- Do we ever want operator-only internal envelopes (e.g. internal
  approval workflows)? Default: no, defer; today's gates all have an
  external signer.
- Should `DocumentTemplate.body_ref` support multiple formats
  (MDX/PDF/HTML)? Default: pick one (MDX rendered to PDF) for v1; allow
  pure PDF upload as a fallback for legal templates a firm already owns.
- Do we sign with the LGA's letterhead or with a Worksie-branded
  envelope? Default: LGA letterhead; Worksie is plumbing.
- Wet-signature workflow (signer prints, signs, scans back) — supported
  or rejected? Default: support via "upload executed copy" path with the
  same `SignedDocumentArtifact` row; this preserves the audit shape.
- How are signed documents surfaced to customers post-execution? Email
  the PDF, or a long-lived link? Default: both, behind tenant config.

## Phase Mapping (recommended)

| Phase | Slice                                                       |
|-------|-------------------------------------------------------------|
| 5.0   | `DocumentTemplate`, `DocumentEnvelope`, `DocumentSigner`,   |
|       | `SignedDocumentArtifact`, `SignatureAuditTrail` schema +    |
|       | RLS                                                         |
| 5.1   | Native provider (in-app signature capture) — retrofits      |
|       | `CustomerSignoff` write path                                |
| 5.2   | First third-party provider adapter behind interface         |
| 5.3   | Customer contract gate on `WorkOrder` creation              |
| 5.4   | Subcontractor MSA + per-job gate on `Assignment`            |
| 5.5   | Change order flow on in-flight work orders                  |

## Out of Scope (for this roadmap doc)

- Contract authoring AI (clause generation, redlining).
- Negotiation flows (counter-offers, multi-round redlines).
- Notarization integration.
- Identity verification beyond signer email + signature capture.
- Watermarking / DRM beyond what the e-sign provider supplies.
- Customer-side document portal (separate UI roadmap).
