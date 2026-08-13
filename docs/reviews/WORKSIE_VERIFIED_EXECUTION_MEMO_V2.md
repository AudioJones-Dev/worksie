---
title: Worksie - Verified Execution Strategy Memo (Corrected)
status: draft
version: v2.0
owner: AJ Digital LLC / Audio Jones
supersedes: externally produced verified-execution memo v1
related_review: docs/reviews/WORKSIE_VERIFIED_EXECUTION_REVIEW.md
created: 2026-08-13
updated: 2026-08-13
---

# Verified Execution — Strategy Memo (Corrected)

> **Status: strategy input only.** This memo is not doctrine. It does not
> change `WORKSIE_SPINE.md`, `PRD.md`, `DOMAIN_MODEL.md`, the Drizzle
> schema, or any public positioning. Every entity named as "proposed"
> requires an ontology-review PR before schema work, per
> `LGA_MODEL.md` §"Required Follow-ups Before Implementation".
>
> Positioning language here is **candidate wording pending Audio's
> approval** under `WORKSIE_POSITIONING_CONSOLIDATION_CHECKLIST.md` §8.
> Worksie remains an internal prototype.

This is a corrected rewrite of the original verified-execution memo. The
argument survives; the factual claims did not. Corrections are recorded in
`WORKSIE_VERIFIED_EXECUTION_REVIEW.md` and summarized in §3 below.

## 1. Diagnosis

Responding to CompanyCam research is not automatically dilution. It becomes
dilution if Worksie tries to become a better photo app, a better CRM, a
better FSM suite, or a generic all-in-one contractor OS.

The repo already carries the safeguard: `WORKSIE_SPINE.md` states Worksie is
"not another CRM or another photo log," and retires the "outpace CompanyCam"
framing. `competitor-companycam.md` §6 already concluded the same thing.

So the useful question is not *how do we beat CompanyCam?* It is:

> What contractor-operating problem has become newly solvable, and where are
> incumbents structurally poorly positioned to solve it?

**Candidate answer:** machine-verifiable field execution — completion,
compliance, and contractor payment that do not depend on office staff
manually reconstructing what happened after the crew leaves.

That question is close to Worksie's existing strengths. It is not yet
answered by Worksie's existing schema. Both halves of that sentence matter.

## 2. What Worksie actually owns today

Shipped and enforced, not aspirational. Every row here is anchored.

| Asset | What it does | Anchor |
|---|---|---|
| Compliance gating | W-9, COI, license, insurance modeled as expirable, gating documents. Expired doc blocks dispatch. | `document_types.gating`, `contractor_documents.{status,expires_on}`; Hard Rule #3 |
| Versioned safety acks | Pack version bump forces re-acknowledgement before dispatch. | `safety_packs.version`, `safety_acknowledgements` |
| Service Definition | Required gear, documents, safety steps, checklist template, payout rule per capability. | `service_definitions`; spine doctrine #2 |
| Frozen rule snapshot | `service_snapshot_json` freezes the rule set at creation; later config edits do not rewrite past jobs. | Hard Rule #2 |
| Server-gated proof-of-work | Cannot leave `in_progress` until every required-photo step has a photo and every required-signature step has a signature. Mobile proposes; server decides. | Hard Rule #4; `WORK_ORDER_LIFECYCLE.md` |
| Customer sign-off gate | No `awaiting_signoff → completed` without a `customer_signoffs` row when the snapshot requires it. | Hard Rule #4 |
| Append-only audit | Every transition writes exactly one `work_order_events` row. Never updated, never deleted, survives `cancelled` and `voided`. | Hard Rule #5 |
| Reversal-not-edit payout | `payout_lines` append-only inside an approved period. Corrections are new rows, not edits. | Hard Rule #6; `PAYOUT_RULES.md` |
| Offline as architecture | Four sync classes; server validates transitions against the lifecycle; stale-client transitions rejected with a readable error. | `OFFLINE_FIRST_ARCHITECTURE.md` |
| Row-level tenancy | Every row carries `tenant_id`; RLS enforced. | Hard Rule #1; PR #23 |

### 2a. The under-recognized asset

The three immutability rules — frozen snapshot (#2), append-only events
(#5), reversal-not-edit payout (#6) — are the most defensible thing Worksie
has shipped, and the original memo did not mention them.

They are what makes a **defensible dispute trail** possible: for any past
job, Worksie can reconstruct what the rules *were* at the time, who
transitioned it and when, and what was paid against it — with no path for
anyone to have quietly rewritten history.

A documentation-first competitor cannot retrofit that cheaply. It is not a
feature; it is a constraint applied consistently from the first migration.
Any verified-execution story should be built on this, because it is real
today.

## 3. What is not built (corrections to memo v1)

The original memo listed these as existing strengths. They are not.

| v1 claim | Reality | Correct register |
|---|---|---|
| Worksie has a worker capability / competency graph | No skill, certification, or competency entity exists. Eligibility is **paperwork only** — gating documents plus safety acks. Skill-based routing and quality scoring are explicitly deferred (`SUBCONTRACTOR_DISPATCH.md` lines 254, 286). | Proposed, Phase 5+ |
| Requirements vary dynamically by location, customer, funding source, risk | `ServiceDefinition` carries flat lists, frozen per work order. No conditional evaluation exists. | Proposed, depends on the above |
| AI can verify evidence sufficiency | Today's gate is a **presence** check (a required photo exists), not a sufficiency check. | Proposed, blocked — see §6 |

The distinction that matters operationally: Worksie today can answer *"is
this contractor's COI current?"* It cannot answer *"can this person perform
an 8-foot VPL install?"* Those are different questions, and the second one
is where the memo's thesis actually lives.

Nothing here invalidates the direction. It relocates it from "what we own"
to "what we would have to build, in this order."

## 4. The frontier

The relevant S-curve is not digital photography, and not ordinary field
service SaaS. Both are mature and crowded. The live progression is:

```
Digital job records
  → structured mobile field workflows
    → machine-verifiable evidence
      → AI interpretation of field evidence
        → dynamic workflow enforcement
          → automated compliance verification
            → outcome-based authorization
              → automated economic settlement
```

Worksie sits at **machine-verifiable evidence**, with the settlement layer
partially specced (`PAYOUT_RULES.md` shipped as rules; `PAYOUT_AND_MARGIN.md`
roadmapped). The steps above it — interpretation, dynamic enforcement,
outcome-based authorization — are unbuilt.

The path is from:

> Worker says: "I'm done."

to:

> System determines: required work appears complete, required evidence
> exists, the worker was authorized, safety requirements were satisfied,
> client sign-off exists, and this completion qualifies for payout.

Worksie currently delivers a strict subset of that: required evidence
exists, sign-off exists, compliance was green at dispatch. The words doing
the real work — *appears complete*, *was authorized* — are the unbuilt part.

## 5. Where CompanyCam stops

CompanyCam's center of gravity is capture → organize → communicate →
report. Even as it adds AI and workflow, its buyer expectation is
documentation.

The concrete, checkable difference is not "richer domain model" — it is
**gating**:

> Worksie's required checklist steps gate a server-validated state
> transition and, downstream, a payout. CompanyCam's checklists gate
> nothing.

That claim is verifiable from `competitor-companycam.md` §2 and Hard Rule
#4. Prefer it over any argument about what a competitor's architecture
could or could not eventually support — that version is unfalsifiable and
does not survive contact with a skeptical reader.

## 6. AI: where it could create a step change, and what blocks it

Not AI everywhere. AI where judgment is currently expensive and human.

**Before dispatch — "is this crew actually ready for this job?"**
Blocked on §3: there is no competency model to evaluate. Once one exists,
this is the highest-value and lowest-technical-risk application, because it
runs server-side on office time with no field latency constraint.

**During execution — evidence adequacy at capture time.**
"This image doesn't clearly establish the anchoring condition" is
materially different from "take photo." It is also the single hardest thing
in this memo to ship, for a reason the original memo never addressed:

> **The offline constraint.** Catching weak evidence *before the worker
> leaves the site* requires inference at capture time. Under
> `OFFLINE_FIRST_ARCHITECTURE.md`, an artifact may not upload until signal
> returns. Server-side vision therefore cannot gate the leave-site moment.
> It is on-device inference or it is not that feature.

Scope the on-device question before committing to this. A server-side
version still has value — it catches problems hours later instead of days
later — but it is a different, weaker product claim and should be described
as such.

**Before completion — evidence package review.** Compare required proof to
submitted proof; flag missing, weak, or contradictory items. Server-side is
acceptable here.

**Across jobs — which crew, job, and condition combinations produce
defects, delays, or disputes.** This is the compounding asset, and it
depends on a cross-job query surface that does not exist yet (see §8).

### 6a. Presence versus sufficiency is a new class of gate

Today's gate is mechanical: the row exists or it doesn't. A sufficiency
gate is a judgment, and its false negatives block completion and payout for
a worker who did the job correctly.

Any such gate needs a manual-override-with-audit-reason path, matching the
mitigation already specified for e-sign outages in `LGA_MODEL.md`
§"Architecture Risks". Do not ship a model's opinion as a hard gate on
someone's paycheck without one.

## 7. Verticalization without dilution

The test:

> Does this vertical require new configuration and ontology, or a
> fundamentally different product?

Configuration and ontology → healthy expansion. Fundamentally different
product → park it.

Healthy: accessibility as a domain pack exercising the same primitives
(capability, rules, eligibility, compliance, evidence, completion, payout);
then mobile-home setup; then commercial equipment installation. Each
reuses the core and deepens it. This is the shape `TILE_BATH_DOMAIN_PACK.md`
and `LGA_MODEL.md` Phase 8 already assume.

Dilutive: roofing CRM, HVAC dispatch, pest-control routing, home-builder
selections — unrelated workflows adopted because competitors have them.

**On accessibility specifically:** `WORKSIE_SPINE.md` already names the
Florida accessibility business as the canonical *reference domain*. That is
a design constraint, not a market selection. Naming a first pilot vertical
is a stop condition under `WORKSIE_POSITIONING_CONSOLIDATION_CHECKLIST.md`
§8 and requires Audio's decision. This memo does not make it.

The domain does have genuine evidence density — a photo can carry landing
condition, slope, clearance, anchoring, door swing, electrical condition,
equipment identity, serial number, guarding, final accessible path. Generic
photo tools have no ontology for any of that. That is an advantage worth
noting; it is not a commitment.

## 8. Near-term priority (reconciled)

Memo v1 demoted annotations and tags as "photo capabilities." That is
wrong on its own terms, and it conflicts with `competitor-companycam.md`
§4b, which ranks them #1 and #2. The earlier ranking stands:

| Priority | Item | Why it passes the verification test |
|---|---|---|
| 1 | Artifact annotations | States *where* on an artifact a requirement is satisfied. That is proof-of-work precision, not photo-log creep. |
| 2 | Tags / labels | The cross-job query surface. Without it, §6's learning loop has nothing to query. |
| 3 | Photo reports (PDF) | Back-office hand-off and customer leave-behind; ~80% derivable from existing data. |
| 4 | Audio proof kind | Add `audio` to `PROOF_OF_WORK_KINDS` plus enum migration. Small. |

Items 1 and 2 are prerequisites for the intelligence layer, not detours
from it.

## 9. What not to build

Crowded S-curves where Worksie would spend years recreating table stakes:
generic CRM, customer acquisition, generic accounting, website builder,
general project management, RFI/drawing systems, 3D reality capture (unless
it directly improves verification), broad scheduling optimization for its
own sake, payments merely because a competitor has them.

**One correction from v1.** The original memo listed "generalized
estimating" here. `LGA_MODEL.md` has `Estimate` as a committed Phase 4
slice, and it is not generic quoting: it is the frozen, versioned snapshot
that `MarginRecord` consumes (`LGA_MODEL.md` Hard Rule #5). It passes this
memo's own test — it feeds a frozen snapshot the economic layer depends on.

Keep Phase 4 `Estimate` as specced. The rejection narrows to standalone
estimating and CRM surfaces that do not feed the economic graph.

## 10. Feature test

Run proposals through this. A candidate should hit three or four of the
first six.

- Does it improve capability modeling?
- Does it improve authorization?
- Does it improve field execution?
- Does it strengthen proof-of-work?
- Does it improve verification?
- Does it connect a verified outcome to a downstream action or payout?
- Does usage create proprietary operational learning? *(raises priority)*
- Can a competitor ship it standalone in a quarter? *(treat as table stakes)*
- Does it require a new, unrelated business model? *(likely dilution)*
- Does it reinforce existing domain packs? *(natural expansion)*

## 11. The moat stack, with honest state

| Layer | What accumulates | State today |
|---|---|---|
| Capability | What each business can perform | **Partial** — `ServiceDefinition` as flat requirements; no conditional rules |
| Worker | Who is qualified and authorized for what | **Not built** — paperwork gating only |
| Evidence | What valid completion looks like | **Shipped** — required steps, gated server-side |
| Rules | Conditions controlling execution | **Partial** — compliance and sign-off gates only |
| Immutability | Frozen snapshots, append-only history | **Shipped** — Hard Rules #2, #5, #6 |
| Outcome | What happened after execution | **Not built** |
| Quality | Which evidence predicts defect and rework | **Not built** — depends on tags (§8) |
| Economics | How verified outcomes settle | **Partial** — payout rules shipped; margin roadmapped |
| Offline field UX | Real-world execution reliability | **Shipped** as architecture |
| Vertical packs | Accessibility, tile/bath, and beyond | **Roadmapped** — Phase 8 |

The compounding asset is the product of these, not any single one. Three of
ten are shipped. That is a real foundation and an honest starting point,
and it is a different statement from "Worksie already owns the graph."

## 12. Sequencing against the actual phase plan

The repo is at Phase 3 (tenant auth boundary). `LGA_MODEL.md` already maps
Phases 4–8: lead/opportunity/estimate → e-sign → assignment → margin →
domain packs. A verified-execution direction has to interleave with that,
not replace it.

| Step | Depends on | Gate |
|---|---|---|
| Annotations + tags (§8 items 1–2) | nothing | Schema PR; low doctrine risk |
| Worker competency ontology | — | **Ontology PR first.** No schema work before review |
| Conditional requirements evaluation | competency ontology | Ontology PR |
| AI evidence-package review (server-side) | tags for cross-job context | Needs override + audit path (§6a) |
| AI capture-time adequacy | on-device inference feasibility | **Blocked** until §6's offline question is scoped |
| Outcome and quality history | tags, competency | Phase 7+ |

No step is skippable and no step happens out of order —
`LGA_MODEL.md` §"Required Follow-ups" already sets this rule.

## 13. Positioning (candidate only)

The approved draft wording, which stands until Audio changes it
(`WORKSIE_POSITIONING_CONSOLIDATION_CHECKLIST.md` §4):

> Worksie turns field work into validated, approval-ready operational
> records: work orders, compliance checks, proof-of-work, customer
> sign-off, and payout-readiness evidence.

Memo v1 proposed a competing USP. The checklist §7 says explicitly: do not
create multiple competing definitions. So this memo proposes **no new USP**.

If a sharper line is wanted later, the candidate direction — for the
consolidation process to accept or reject, not for adoption here — is the
existing doctrine phrase, which is already canonical and already true:

> **Proof-of-work over status.**

It has the advantage of describing something shipped. Any expansion beyond
it should wait until §11's "not built" rows become "shipped" rows, because
positioning that outruns the schema is a claim the product cannot honor.

## 14. Questions worth answering next

More useful than another competitor matrix:

1. What share of field-service office labor exists to verify that work
   actually happened correctly?
2. What causes jobs to be disputed, returned, or delayed after crews leave?
3. Which completion criteria can a model reliably infer from field photos
   today, and which still need humans or instruments?
4. What evidence is contractually sufficient for payment across different
   contractor relationships?
5. Can worker capability and job requirements be represented generically
   enough to hold across trades?
6. Where does contractor payment already depend on documentation quality?
7. What accumulated data across 10,000 verified jobs would a new entrant be
   unable to reproduce quickly?

Question 7 is the moat question. Question 3 gates §6. Question 5 gates the
competency ontology.

## 15. Risk assessment (corrected)

| Direction | Risk | Assessment |
|---|---|---|
| CompanyCam feature parity | Very high dilution | Reject |
| Generic contractor OS | Very high dilution | Reject |
| Annotations + tags | Low | Build — prerequisites, not detours |
| Worker competency model | Medium — **new ontology, not an extension** | Core, but budget it honestly |
| Conditional requirements engine | Medium | Depends on competency model |
| AI evidence-package review (server-side) | Medium technical | High strategic value |
| AI capture-time adequacy | **High — offline constraint unresolved** | Scope feasibility before committing |
| Proof → payout linkage | Low–medium | Strong differentiator; partially shipped |
| Domain packs on existing primitives | Low | Natural expansion |
| Unrelated trade modules | High | Reject |
| Outcome / quality intelligence | Medium | Long-term moat; depends on tags |

Two rows changed materially from v1: worker competency moved from "low
risk" to "medium — new ontology," and capture-time AI moved from "medium"
to "high, blocked."

## 16. Bottom line

Do not expand Worksie horizontally. Deepen it around verified execution.

The five doctrine lines that already exist — model capability not catalog,
rules drive workflows, proof-of-work over status, compliance is
first-class, 1099 payout is a workflow — are more differentiated than
anything a feature-parity exercise would produce. The work is making those
primitives deep enough that a competitor would have to redesign around them.

What changed from v1: the memo now distinguishes the three of those that
are enforced in the schema today from the two that are still design intent,
and it sequences the gap accordingly.

## 17. Change Log

- v2.0 | 2026-08-13 | Corrected rewrite. Relocated competency modeling,
  conditional rules, and AI sufficiency from "owned" to "proposed";
  surfaced the offline constraint on capture-time verification; restored
  annotations and tags to prior priority; preserved Phase 4 `Estimate`;
  added the immutability substrate v1 omitted; withdrew the competing USP
  in favor of the approved draft wording; added honest-state moat table and
  sequencing against the actual phase plan.
