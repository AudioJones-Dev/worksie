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
> **Migration status, corrected.** An earlier draft said any item here could be
> built "without a further schema migration." That is false. What Phase 3.5
> actually did was remove the *blocking* schema work, not all of it:
>
> | Item | Further migration? |
> |---|---|
> | Audio proof-of-work (§3) | **No** — `audio` is already in the enum |
> | Capture-location verification (§1) | **No** if the deviation is derived at read time; **yes** if it is stored on the artifact |
> | Annotations (§2) | **Yes** — needs a new `ProofOfWorkAnnotation` table |
>
> The `unique (tenant_id, id)` that landed on `proof_of_work_artifacts` is what
> makes the annotations table *possible* — before it, nothing could reference an
> artifact through a tenant-pinned composite FK. It is a precondition, not a
> substitute.

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

**Evaluated only when all three inputs are present.** `geofence_radius_m` is
nullable, `work_orders.gps` may be unset, and artifact `gps` is routinely null.
If any of the three is missing the result is **`unknown`**, not a deviation. A
missing input is indistinguishable from a revoked location permission, and
recording it as a deviation would flag honest work as suspect — the exact
failure this section exists to avoid. `unknown` and `within_radius` are both
non-deviations; only an evaluated comparison exceeding the radius is one.

**Flag, do not block.** Where a deviation *is* evaluated, record it; do not
reject the insert or block the state transition.

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
- ~~Should a null `gps` be treated as a deviation, or as "unknown"?~~
  **Decided: `unknown`**, generalised to all three inputs. Specified above.
- Should `geofence_radius_m` default from the `ServiceDefinition`? A roofing
  job and a multi-building campus have very different reasonable radii.
- Does a flagged artifact still satisfy a `requires_photo` checklist step?
  Recommend **yes** — otherwise "flag not block" is a block by another name.

## 2. Annotations

Markup on an artifact: draw, arrow, text, measurement callout.

Depends on the `unique (tenant_id, id)` that landed on
`proof_of_work_artifacts` in Phase 3.5. To be precise about what that bought:
a single-column reference to the artifact's primary key was always possible.
What was not possible was a **tenant-pinned composite FK** —
`(tenant_id, artifact_id)` referencing `(tenant_id, id)` — which is what makes
it structurally impossible for one tenant's annotation to attach to another
tenant's artifact. Every other tenant-scoped parent already carried that
constraint; this table was the omission.

Proposed shape: `ProofOfWorkAnnotation` with

- `id` — stable primary key. Required for citation, for deduplicating retried
  offline inserts, and for audit. Without its own identity an annotation cannot
  be referenced, and the upload queue cannot tell a retry from a new one.
- `tenant_id`, `artifact_id` — with the composite FK above
- author, `created_at`
- a geometry/style payload

Annotations are **additive overlays** — the stored file bytes are never
modified, so `content_hash` stays valid and the original evidence remains
unaltered. They are also **append-only**: never edited or replaced in place, a
correction is a new annotation, and removal is a soft delete. That matters for
a proof-of-work system: an annotation is commentary on evidence, not a
replacement for it, and commentary that can be silently rewritten afterwards
carries no more weight than editable evidence would.

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
