# Capture Integrity (Roadmap / Spec)

> **Status: Roadmap only.** This document is a future-domain
> specification. It does **not** alter the canonical ontology
> (`docs/DOMAIN_MODEL.md`), the Drizzle schema (`packages/db`),
> RLS, or the work order lifecycle. New entities listed here
> require an ontology-review PR before any schema work begins.
>
> Target phase mapping: **unsequenced.** Priority depends on the pilot
> scenario decision (`WORKSIE_GTM_PROJECT_PLAN.md` backlog #5, a Hold
> Gate).
>
> **Migration status per item:**
>
> | Item | Further migration? |
> |---|---|
> | Audio proof-of-work (§3) | **No** — `audio` is in the enum |
> | Capture-location verification (§1) | **No** if the deviation is derived at read time; **yes** if stored on the artifact |
> | Annotations (§2) | **Yes** — needs a new `ProofOfWorkAnnotation` table |
>
> The Phase 3.5 columns removed the *blocking* schema work, not all of it. The
> `unique (tenant_id, id)` on `proof_of_work_artifacts` is a precondition for
> the annotations table — without it nothing can reference an artifact through
> a tenant-pinned composite FK — not a substitute for it.

## Purpose

Make captured proof-of-work *verifiable*, not merely *present*.

Worksie already binds every artifact to a work order and stamps it with
`gps`, `captured_at`, and `captured_by`. This roadmap uses those stamps to
answer a question the current model records the inputs for but never asks:
**was this evidence actually produced where and when it claims?**

## Core Principle

**Proof-of-work is a claim until something checks it.**

Doctrine #4 says "marked complete is not complete" — a photo is the proof. But
an unverified photo is just a different kind of self-report. The gap between
"a photo exists" and "a photo was taken at the job site" is where disputes,
chargebacks, and rework arguments actually live.

## Competitive note

CompanyCam runs Uber's H3 hexagonal geo-indexing (`h3_ruby`), Elasticsearch
geo-proximity search (`graphql-searchkick` exposes
`coordinates: {near, within}`), and carries a `geofence` array on their Project
object. Their public API exposes **none of it as behavior** — no enter/exit
events, no radius semantics, no capture verification. They built the capability
and did not productize it.

See `docs/reviews/competitor-companycam-engineering.md` §2 (their unproductized H3 + geofence infrastructure) and §6g.

## 1. Capture-location verification

### Relationship to subcontractor dispatch

`SUBCONTRACTOR_DISPATCH.md` sets a standing default: geographic gating on
assignment is a **soft warning in v1, not a hard block**, because "ops people
know their crews."

**This spec does not reverse that**, because it asks a different question:

| | Question | Subject |
|---|---|---|
| `SUBCONTRACTOR_DISPATCH.md` | May this contractor take a job this far away? | The **assignment** |
| This spec | Was this photo taken at the job site? | The **artifact** |

A contractor legitimately travelling outside their service radius is a business
judgement. A completion photo taken twenty miles from the address is a data
problem. Both defaults can be soft; they are not the same default.

### Proposed behavior

`work_orders.geofence_radius_m` (landed, nullable, currently unread) defines
the expected capture radius. On artifact insert, the server compares
`proof_of_work_artifacts.gps` against `work_orders.gps`.

**Flag, do not block.** Record the deviation; do not reject the insert or block
the state transition.

Rationale: GPS fails routinely and legitimately in the field — inside metal
buildings, in basements, under dense canopy, on a device with location
permission revoked. A hard block strands a crew that did the work correctly and
teaches them to distrust the app. A flag surfaces the same information to the
back office without putting the field worker in a position they cannot resolve
on site.

Blocking remains available later; it is a policy read of the same column, not a
schema change.

### Open questions

- Where does the flag live? A column on the artifact, or a derived view? A
  column is simpler; a view avoids storing a judgement that the radius config
  can retroactively change.
- Should a null `gps` be treated as a deviation, or as "unknown"? Recommend
  **unknown** — indistinguishable from a permissions problem.
- Should `geofence_radius_m` default from the `ServiceDefinition`? A roofing
  job and a multi-building campus have very different reasonable radii.
- Does a flagged artifact still satisfy a `requires_photo` checklist step?
  Recommend **yes** — otherwise "flag not block" is a block by another name.

## 2. Annotations

Markup on an artifact: draw, arrow, text, measurement callout.

Depends on the `unique (tenant_id, id)` that landed on
`proof_of_work_artifacts` in Phase 3.5 — an annotation child needs a
tenant-pinned composite FK to its parent artifact, and before that constraint
existed nothing could reference an artifact at all.

Proposed shape: `ProofOfWorkAnnotation` with `artifact_id`, `tenant_id`,
author, `created_at`, and a geometry/style payload. Annotations are **additive
overlays** — the stored file bytes are never modified, so `content_hash` stays
valid and the original evidence remains unaltered. That matters for a
proof-of-work system: an annotation is commentary on evidence, not a
replacement for it.

CompanyCam markets annotations but exposes no annotation object in their
public API, so their integration partners cannot reach them programmatically.

## 3. Audio proof-of-work

`audio` landed in `PROOF_OF_WORK_KINDS` in Phase 3.5. Nothing consumes it yet.

Needs: mobile capture UI, a Storage path, and a decision on whether audio
satisfies any checklist step requirement (`requires_photo` and
`requires_signature` are the only step gates today; there is no
`requires_note`).

Transcription is explicitly **not** proposed here.
`PRD.md` §Out of Scope bars AI-generated narrative reports in v1, and
`TILE_BATH_DOMAIN_PACK.md` bars auto-narration. Audio is a captured artifact,
not a generated one.

## Dependencies

- Phase 3.5 affordance columns (landed): `content_hash`, `processing_status`,
  `body`, `audio` kind, `geofence_radius_m`, `unique (tenant_id, id)`.
- Mobile capture UI — does not exist yet (`apps/mobile` is a single stub
  screen). Everything here is blocked on that regardless of priority.

## Explicitly not in this spec

- Reversing `SUBCONTRACTOR_DISPATCH.md`'s soft-warning default on assignment.
- Hard-blocking a state transition on GPS.
- Photo-AI auto-tagging, auto-narration, or transcription.
- Editing stored file bytes for any reason.
