---
title: Worksie - Verified Execution Strategy Memo Review
status: draft
version: v0.1
owner: AJ Digital LLC / Audio Jones
created: 2026-08-13
updated: 2026-08-13
---

# Verified Execution Strategy Memo — Review

Review of an externally produced strategy memo that proposes repositioning
Worksie around "verified execution" / "proof-of-capability" in response to
CompanyCam competitor research.

This document is a **review**, not doctrine. It does not change
`WORKSIE_SPINE.md`, `PRD.md`, `DOMAIN_MODEL.md`, or any public positioning.
It records which memo claims are true against the repo today, which are
build-from-zero work presented as existing assets, and which governance
gates the memo crosses.

**Sources of truth used:** `docs/WORKSIE_SPINE.md`, `docs/PRD.md`,
`docs/DOMAIN_MODEL.md`, `docs/WORK_ORDER_LIFECYCLE.md`,
`docs/OFFLINE_FIRST_ARCHITECTURE.md`, `docs/roadmap/LGA_MODEL.md`,
`docs/roadmap/SUBCONTRACTOR_DISPATCH.md`,
`docs/reviews/competitor-companycam.md`,
`docs/reviews/WORKSIE_POSITIONING_CONSOLIDATION_CHECKLIST.md`,
`packages/db/src/schema/tables.ts`, `packages/domain/src/index.ts`.

## 1. Verdict

Directionally right, and the underlying discipline is sound: do not pursue
CompanyCam feature parity, and treat the competitor surface as a
negative-space map.

Two qualifications:

1. The memo describes a product roughly **two to three phases ahead** of
   what exists. The repo is at Phase 3 (tenant auth boundary); the memo's
   moat stack assumes capabilities that are not modeled.
2. It presents **three build-from-zero capabilities as existing assets**
   (worker competency, conditional rule evaluation, AI evidence
   sufficiency). Each requires an ontology-review PR under the process in
   `LGA_MODEL.md` §"Required Follow-ups Before Implementation".

Accept the framing. Reject the implied readiness. Correct the factual
claims before any of this reaches canonical docs.

## 2. What holds up

### 2a. The core decision is correct — and already made

`competitor-companycam.md` §5–6 already concluded: no PRD/spine changes,
and do not pursue chat, galleries, or AI narrative summaries. The spine
already retires the "outpace CompanyCam" framing
(`WORKSIE_SPINE.md` §"What Worksie Is").

The memo's contribution is the framing — verified execution as the product
object, competitor features as negative space — not the decision itself.
Treat it as a sharper articulation of settled doctrine, not a new finding.

### 2b. "Proof-of-work over status" is the right kernel

This is the memo's strongest call. It is doctrine #4 in the spine, it is
enforced at the database level by Hard Rule #4 (`DOMAIN_MODEL.md`), and it
is the one structural behavior CompanyCam does not have: Worksie's
required checklist steps **gate** a server-validated state transition and,
downstream, a payout. CompanyCam checklists gate nothing
(`competitor-companycam.md` §2).

That gating claim is the concrete, defensible version of the memo's
argument, and it should replace the memo's unfalsifiable "CompanyCam's
architecture cannot reach here" reasoning.

### 2c. The verticalization test is usable as-is

> Does this vertical require new configuration and ontology, or a
> fundamentally different product?

This maps cleanly onto the existing domain-pack direction
(`TILE_BATH_DOMAIN_PACK.md`, `LGA_MODEL.md` Phase 8) and is a reasonable
standing filter for vertical requests.

## 3. Claims that are wrong against the repo

### 3a. The worker capability graph does not exist

This is the most consequential error, because the memo's proposed USP
("assign the right worker") depends on it.

| Memo claim | Repo reality |
|---|---|
| Worksie has a "worker graph" of who is qualified for what | No skill, certification, or competency entity exists in `DOMAIN_MODEL.md` or `packages/db/src/schema/tables.ts` |
| Worker eligibility is modeled | Eligibility is **paperwork only**: `document_types.gating` + `safety_acknowledgements` |
| "Build worker capability model — low risk — core moat" | Skill-based routing is explicitly deferred (`SUBCONTRACTOR_DISPATCH.md` line 254); subcontractor quality scoring is explicitly out of scope (line 286) |

What exists today answers *"is this contractor's COI current?"* It does not
answer *"can this person perform an 8-foot VPL install?"* Those are
different questions and only the first is modeled.

**Correction:** worker competency is a proposed Phase 5+ ontology addition,
not a present strength.

### 3b. Service Definition is a requirements template, not a capability graph

`ServiceDefinition` carries flat lists — `required_gear`,
`required_documents`, `required_safety_steps`, one `checklist_template_id`,
one `default_payout_rule_id` — frozen into `service_snapshot_json` at work
order creation.

There is no conditional rule evaluation. The memo's claim that requirements
"change dynamically based on service type, location, equipment, funding
source, customer, installer, or risk" is aspirational. Today requirements
are static per service definition.

Spine doctrine #3 ("rules drive workflows; a new rule is a config change,
not a code change") is a design commitment, not shipped machinery. There is
also no equipment/asset entity.

**Correction:** a conditional requirements engine is unbuilt.

### 3c. AI evidence verification collides with offline doctrine

The memo's headline AI capability — catch missing or weak evidence **before
the worker leaves the site** — requires inference at capture time.

Under `OFFLINE_FIRST_ARCHITECTURE.md`, a proof-of-work artifact may not
upload until signal returns. Server-side vision therefore cannot gate the
leave-site moment. That capability is on-device inference or nothing. The
memo does not address this, and it is the largest unexamined technical risk
in the document.

A second, related gap: today's completion gate is a **presence** check —
Hard Rule #4 requires that a required photo *exists*. Moving to a
**sufficiency** check (does this photo actually establish the anchoring
condition?) is a new class of gate whose false negatives block completion
and payout. It requires a manual-override-with-audit-reason path, matching
the mitigation already specified for e-sign outages in `LGA_MODEL.md`
§"Architecture Risks".

### 3d. The estimating rejection is too coarse

The memo lists "generalized estimating" among things not to chase.
`LGA_MODEL.md` has `Estimate` as a committed Phase 4 slice.

These are not the same thing. The roadmap's `Estimate` is not a generic
quoting tool — it is the frozen, versioned snapshot that `MarginRecord`
consumes (`LGA_MODEL.md` Hard Rule #5). It passes the memo's own test:
it feeds a frozen snapshot the verification and economic layers depend on.

**Resolution:** keep Phase 4 `Estimate` as specced. Narrow the memo's
rejection to standalone estimating/CRM surfaces that do not feed the
economic graph.

### 3e. It silently contradicts the prior review on near-term priority

`competitor-companycam.md` §4b ranks annotations #1 and tags #2 among real
gaps. The memo demotes both as "photo capabilities — only if required for
verification."

Both pass the memo's own criteria:

- **Annotations** state *where* on the artifact a requirement is
  satisfied. That is proof-of-work precision, not photo-log creep.
- **Tags** are the substrate for the cross-job learning loop the memo
  proposes in its own moat stack. Without them there is no cross-job
  query surface.

**Resolution:** the earlier review's ranking stands. The memo underrates
these by grouping them with photo-app features.

## 4. What the memo misses

The strongest *shipped* version of its own argument is already in the repo
and goes unmentioned:

- `service_snapshot_json` freezes the rule set at work order creation
  (Hard Rule #2)
- `work_order_events` is append-only and survives `cancelled` / `voided`
  (Hard Rule #5)
- `payout_lines` use reversal-not-edit semantics inside an approved period
  (Hard Rule #6)

That immutability substrate is exactly what makes the memo's "defensible
dispute trail" possible. It is real, it is enforced, and it is materially
harder for a documentation-first competitor to retrofit than any AI
feature the memo proposes.

## 5. Governance gates crossed

`WORKSIE_POSITIONING_CONSOLIDATION_CHECKLIST.md` sets constraints the memo
does not observe. None of the memo's positioning language may land in the
spine, PRD, or README until these are cleared with Audio.

| Gate | Checklist ref | How the memo crosses it |
|---|---|---|
| Recommended canonical wording already exists | §4 | Memo proposes a competing USP without referencing the approved draft wording |
| "Do not create multiple competing definitions of the USP" | §7 | Memo's USP would be the third definition in circulation |
| Naming the first pilot vertical is a stop condition | §8 | Memo effectively selects accessibility as the wedge |
| "Worksie is an internal prototype" must be preserved | §3 | Memo's register reads as market-ready positioning |

The existing approved draft wording is:

> Worksie turns field work into validated, approval-ready operational
> records: work orders, compliance checks, proof-of-work, customer
> sign-off, and payout-readiness evidence.

Any USP change routes through the consolidation checklist, not around it.

## 6. Recommendation

1. **Keep the memo as a strategy input.** Do not promote it to doctrine.
2. **Correct §3a–3c claims** into a proposed-roadmap register before reuse.
   "Worksie owns this" → "Worksie could own this, at Phase N."
3. **Resolve the two conflicts** with existing docs: keep Phase 4
   `Estimate`; keep annotations and tags at their prior priority.
4. **Route the USP question** through
   `WORKSIE_POSITIONING_CONSOLIDATION_CHECKLIST.md` §5 options A/B/C. Do
   not add a fourth competing definition.
5. **If verified execution is adopted as direction**, the honest sequencing
   against the existing phase plan is:
   - worker competency ontology — ontology PR first, no schema work before
     review
   - conditional requirements evaluation — depends on the above
   - AI sufficiency checking — blocked on the offline constraint in §3c;
     scope the on-device question before committing
6. **No spine or PRD edits from this review.** Same conclusion as
   `competitor-companycam.md` §6.1.

## 7. Change Log

- v0.1 | 2026-08-13 | Initial review of the verified-execution strategy
  memo against repo canon.
