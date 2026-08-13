---
title: Worksie - Verified Execution Strategy Memo (Corrected)
status: draft
version: v2.1
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

The repo is at Phase 3. Most of the doctrine exists as **schema plus
specification**; a much smaller set is **enforced by the database**. The
distinction is the whole point of this memo, so it is drawn strictly here.

### 2a. Enforced today

Verified against `supabase/migrations/` and `packages/`.

| Asset | Enforcement | Anchor |
|---|---|---|
| Row-level tenancy | `tenant_id` NOT NULL everywhere; composite `(tenant_id, id)` foreign keys make a cross-tenant reference unrepresentable; RLS policies per table | Hard Rule #1; `0001_phase_2_rls_and_audit.sql`, `0002_phase_2_schema_rls_hardening.sql` |
| Append-only audit | `work_order_events` UPDATE and DELETE raise; FK cascades pass through via `pg_trigger_depth()` | Hard Rule #5; `0001…sql:210-226`, hardened at `0002…sql:586` |
| Snapshot presence | `work_orders.service_snapshot_json` is NOT NULL, so a work order cannot exist without a frozen rule set | Hard Rule #2 (presence only — see 2b) |
| Cancellation reasons | `work_order_events.reason` required when `to_state ∈ {cancelled, voided}` | check constraint, `tables.ts` |
| Tenant context resolution | `resolveTenantContext` + web middleware | Phase 3; `packages/auth/src/tenant.ts`, `apps/web/src/middleware.ts` |

### 2b. Modeled in schema, enforcement not built

These are real entities with real columns. Nothing yet stops the behavior
they describe. `tables.ts:16-19` says so explicitly: compliance gating,
lifecycle transitions, and payout append-only are listed as "Rules enforced
in code (Phase 3+)", and that code does not exist yet — there is no
transition service anywhere in `apps/` or `packages/`.

| Asset | What exists | What is missing |
|---|---|---|
| Compliance gate | `document_types.gating`, `contractor_documents.{status, expires_on}` | Nothing blocks dispatch on an expired or unverified document (Hard Rule #3) |
| Versioned safety acks | `safety_packs.version`, `safety_acknowledgements` | No re-ack enforcement before dispatch |
| Service Definition | `service_definitions` with required gear, docs, safety, checklist, payout rule | No evaluation at work-order creation |
| Proof-of-work gating | Checklist steps with `requires_photo` / `requires_signature`; 10 lifecycle states | No server-side transition guard. Nothing prevents `in_progress → awaiting_signoff` with zero evidence (Hard Rule #4) |
| Customer sign-off gate | `customer_signoffs` | Same — no transition guard (Hard Rule #4) |
| Snapshot immutability | `service_snapshot_json` NOT NULL | No UPDATE trigger. The snapshot can be rewritten after creation (Hard Rule #2) |
| Reversal-not-edit payout | `payout_lines`, `payout_periods` | No append-only trigger; `admin_write` is `FOR ALL`, so an admin can UPDATE or DELETE a payout line in an approved period (Hard Rule #6; `0002…sql:558-567`) |
| Offline field execution | `OFFLINE_FIRST_ARCHITECTURE.md` design; four sync classes | `apps/mobile` is the Phase 1 scaffold — three files, no PowerSync, SQLite, storage, or upload queue |

### 2c. The under-recognized asset — and its actual state

The three immutability rules — frozen snapshot (#2), append-only events
(#5), reversal-not-edit payout (#6) — are the most defensible *design* in
the repo, and the original memo did not mention them at all. That remains
the right thing to build the verified-execution story on.

But only **one of the three is enforced**. `work_order_events` genuinely
cannot be rewritten. The snapshot can be updated after creation, and payout
lines can be edited or deleted by an admin.

So the dispute trail today answers *who transitioned this work order, when,
and in what order* — and nothing more. It does not yet answer *what the
rules were at the time* or *what was paid against it*, because both of
those records are still mutable.

Closing that gap is small, well-understood work: two triggers in the same
shape as the one that already exists. It is also the highest-leverage
verified-execution work available, because every later claim in this memo
depends on the record being tamper-evident. **Do this before any AI layer.**

A documentation-first competitor cannot retrofit tamper-evidence cheaply —
it is a constraint applied from the first migration, not a feature. Worksie
has applied it once. It should apply it twice more.

## 3. What is not built (corrections to memo v1)

The original memo listed these as existing strengths. They are not.

| v1 claim | Reality | Correct register |
|---|---|---|
| Worksie has a worker capability / competency graph | No skill, certification, or competency entity exists. Eligibility is **paperwork only** — gating documents plus safety acks. Skill-based routing and quality scoring are explicitly deferred (`SUBCONTRACTOR_DISPATCH.md` lines 254, 286). | Proposed, Phase 5+ |
| Requirements vary dynamically by location, customer, funding source, risk | `ServiceDefinition` carries flat lists, frozen per work order. No conditional evaluation exists. | Proposed, depends on the above |
| AI can verify evidence sufficiency | There is no completion gate at all yet. The specified gate is a **presence** check (a required photo exists); a sufficiency check is two steps beyond it. | Proposed, blocked — see §6 |

The distinction that matters operationally: Worksie today can *record*
whether a contractor's COI is current. It cannot stop a dispatch when it
isn't, and it cannot answer *"can this person perform an 8-foot VPL
install?"* at all. Three different capabilities — record, enforce, evaluate
— and only the first exists.

Nothing here invalidates the direction. It relocates it from "what we own"
to "what we would have to build, in this order."

## 4. The frontier

The relevant S-curve is not digital photography, and not ordinary field
service SaaS. Both are mature and crowded. The live progression is:

```text
Digital job records
  → structured mobile field workflows
    → machine-verifiable evidence
      → AI interpretation of field evidence
        → dynamic workflow enforcement
          → automated compliance verification
            → outcome-based authorization
              → automated economic settlement
```

Worksie has the **schema** for machine-verifiable evidence and the
enforcement for one part of it (the audit log). Structured mobile field
workflows are specified but not implemented. Everything above —
interpretation, dynamic enforcement, outcome-based authorization — is
unbuilt. The settlement layer exists as rules (`PAYOUT_RULES.md`) with
margin roadmapped (`PAYOUT_AND_MARGIN.md`).

The path is from:

> Worker says: "I'm done."

to:

> System determines: required work appears complete, required evidence
> exists, the worker was authorized, safety requirements were satisfied,
> client sign-off exists, and this completion qualifies for payout.

Worksie currently delivers none of that sentence automatically. It models
every clause and enforces none of them: the schema knows what evidence is
required, and nothing checks that it arrived. The nearest term is the
frozen snapshot, which records what *should* have been required.

## 5. Where CompanyCam stops

CompanyCam's center of gravity is capture → organize → communicate →
report. Even as it adds AI and workflow, its buyer expectation is
documentation.

The intended difference is not "richer domain model" — it is **gating**:

> Worksie's required checklist steps are designed to gate a server-validated
> state transition and, downstream, a payout. CompanyCam's checklists gate
> nothing by design.

Note the tense. CompanyCam's non-gating is a product decision; Worksie's
gating is a specification with no implementation behind it yet (§2b). The
difference is real at the design level and worth building toward, but it is
not currently a shipped differentiator and must not be sold as one. Prefer
this framing over any argument about what a competitor's architecture
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

Three states: **enforced** (the database or shipped code prevents the wrong
thing), **modeled** (entities and columns exist; nothing enforces them),
**not built** (no representation at all).

| Layer | What accumulates | State today |
|---|---|---|
| Tenancy | Isolation between businesses | **Enforced** — NOT NULL + composite FKs + RLS |
| Audit | Ordered, tamper-evident transition history | **Enforced** — `work_order_events` blocks UPDATE/DELETE |
| Capability | What each business can perform | **Modeled** — flat requirements, no evaluation, no conditional rules |
| Evidence | What valid completion looks like | **Modeled** — required-step flags exist; no transition guard reads them |
| Rules | Conditions controlling execution | **Modeled** — compliance and sign-off columns; no gate |
| Immutability of snapshot and payout | Frozen rules, reversal-not-edit money | **Modeled** — NOT NULL only; both records still mutable |
| Economics | How verified outcomes settle | **Modeled** — payout rules and periods; margin roadmapped |
| Offline field UX | Real-world execution reliability | **Not built** — mobile is the Phase 1 scaffold |
| Worker | Who is qualified and authorized for what | **Not built** — no competency representation |
| Outcome | What happened after execution | **Not built** |
| Quality | Which evidence predicts defect and rework | **Not built** — depends on tags (§8) |
| Vertical packs | Accessibility, tile/bath, and beyond | **Roadmapped** — Phase 8 |

The compounding asset is the product of these, not any single one. **Two of
twelve are enforced; five more are modeled and awaiting enforcement.**

That is a narrower claim than the one this memo made in its first corrected
draft, which counted modeled layers as shipped. It is still a real
foundation — a correct ontology with tenancy and audit already locked down
is a good place to be at Phase 3. It is simply not a moat yet, because
nothing but the audit log currently resists being overwritten.

## 12. Sequencing against the actual phase plan

The repo is at Phase 3 (tenant auth boundary). `LGA_MODEL.md` already maps
Phases 4–8: lead/opportunity/estimate → e-sign → assignment → margin →
domain packs. A verified-execution direction has to interleave with that,
not replace it.

The first two rows are new to this draft. They were invisible while the
memo mistook specification for enforcement, and they precede everything
else: an AI verification layer over a record that can be silently edited
verifies nothing.

| Step | Depends on | Gate |
|---|---|---|
| Snapshot + payout-line immutability triggers | nothing | Migration PR. Two triggers shaped like the existing `work_order_events` one. **Do first** |
| Work-order transition service (Hard Rules #3, #4) | above | The compliance gate and proof-of-work gate the docs already claim. Backend PR |
| Offline field execution | transition service | The mobile app past scaffold. Largest single piece of unbuilt work |
| Annotations + tags (§8 items 1–2) | nothing | Schema PR; low doctrine risk, can run in parallel |
| Worker competency ontology | — | **Ontology PR first.** No schema work before review |
| Conditional requirements evaluation | competency ontology | Ontology PR |
| AI evidence-package review (server-side) | transition service, tags | Needs override + audit path (§6a) |
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

Even that describes an intent rather than a shipped behavior right now
(§2b). Any positioning work should wait until §11's modeled rows become
enforced rows. Positioning that outruns the schema is a claim the product
cannot honor, and this memo has already made that mistake once.

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
| Immutability triggers (snapshot, payout lines) | Low — same shape as an existing trigger | **Do first.** Everything downstream assumes them |
| Work-order transition service | Medium | Core. The docs already describe it as done; it is not |
| Offline field execution | High — largest unbuilt piece | Core doctrine, currently a scaffold |
| Annotations + tags | Low | Build — prerequisites, not detours |
| Worker competency model | Medium — **new ontology, not an extension** | Core, but budget it honestly |
| Conditional requirements engine | Medium | Depends on competency model |
| AI evidence-package review (server-side) | Medium technical | High value — but worthless over a mutable record |
| AI capture-time adequacy | **High — offline constraint unresolved** | Scope feasibility before committing |
| Proof → payout linkage | Medium | Differentiator; **not** partially shipped — neither end is enforced |
| Domain packs on existing primitives | Low | Natural expansion |
| Unrelated trade modules | High | Reject |
| Outcome / quality intelligence | Medium | Long-term moat; depends on tags |

Changed from the first corrected draft: three enforcement rows added at the
top, and "proof → payout linkage" no longer described as partially shipped.

## 16. Bottom line

Do not expand Worksie horizontally. Deepen it around verified execution.

The five doctrine lines that already exist — model capability not catalog,
rules drive workflows, proof-of-work over status, compliance is
first-class, 1099 payout is a workflow — are more differentiated than
anything a feature-parity exercise would produce. The work is making those
primitives deep enough that a competitor would have to redesign around them.

But the sequencing point now sits earlier than either the original memo or
the first corrected draft placed it. Four of those five doctrine lines are
currently specification: the compliance gate, the proof-of-work gate, the
capability evaluation, and the payout workflow all exist as schema with no
enforcement behind them. Deepening them starts with making them true, not
with adding a layer above them.

The immediate work is three triggers and a transition service — unglamorous,
small, and load-bearing for every claim in this memo.

## 17. Change Log

- v2.1 | 2026-08-13 | Enforcement audit against `supabase/migrations/` and
  `apps/mobile` after PR review. Split §2 into enforced vs. modeled;
  corrected the immutability claim (only `work_order_events` is enforced —
  snapshot and payout lines remain mutable); reclassified offline field UX
  as not built; revised the moat count from "three of ten shipped" to "two
  of twelve enforced"; added immutability triggers and the transition
  service as the first sequencing steps; qualified the gating claim in §5 as
  design-level.
- v2.0 | 2026-08-13 | Corrected rewrite. Relocated competency modeling,
  conditional rules, and AI sufficiency from "owned" to "proposed";
  surfaced the offline constraint on capture-time verification; restored
  annotations and tags to prior priority; preserved Phase 4 `Estimate`;
  added the immutability substrate v1 omitted; withdrew the competing USP
  in favor of the approved draft wording; added honest-state moat table and
  sequencing against the actual phase plan.
