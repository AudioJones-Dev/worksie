# Worksie Spine

Canonical reference for what Worksie is, who it serves, and what the product is
allowed to assume about its own shape. Treat this document as the source of
truth that every other doc, prompt, dataset, and code path must align to.

## What Worksie Is

Worksie is a **mobile-first configurable operations platform for blue-collar
businesses**. It models what a business is *capable of performing*, not only
what it sells, and it produces field-ready execution from that model:
onboarding, dispatch, work orders, safety, documentation, proof-of-work, and
1099 payout.

Worksie is **not** another CRM, scheduling platform, accounting tool, generic
form builder, or photo documentation app. The previous framing ("outpace
CompanyCam") is retired. Worksie owns the operational readiness layer between
field execution and downstream business systems: the answer to whether a field
job is complete, documented, approved, and ready to bill.

## Who Worksie Serves

Primary operator profile:
- Owner/operator of a service-installation business (ramps, lifts, skirting,
  tie-downs, accessibility, small construction, mobile-home services).
- Small back office (1–5 people) doing scheduling, compliance, and payouts.
- 5–50 field workers — mostly 1099 subcontractors, some W-2.

Primary field user profile:
- Mobile-first. Often offline or on weak signal.
- Works from trucks, trailers, mobile homes, warehouses, job sites.
- Has a phone. May not have a laptop.
- Reads checklists, captures photos, signs forms, marks completions.

## Product Doctrine

These are non-negotiable design rules. Every feature decision must respect
them.

1. **Mobile field workflow is primary.** Desktop admin is secondary.
2. **Model capability, not catalog.** A business has services it *can*
   perform, with rules, required gear, required docs, required safety steps.
   Workflows fall out of capability + rules, not from hardcoded screens.
3. **Rules drive workflows.** A new service type, a new safety requirement,
   or a new payout rule should be a config change, not a code change.
4. **Proof-of-work over status.** "Marked complete" is not complete. Photos,
   signatures, timestamps, GPS, and signed checklists are.
5. **Offline-tolerant by default.** Field execution must work without
   connectivity and reconcile cleanly when signal returns.
6. **Compliance is a first-class object.** W-9, COI, license, insurance,
   safety acknowledgements are modeled, expirable, and gating.
7. **1099 payout is a workflow, not a spreadsheet.** Piece-rate and
   completion-based invoicing must be derivable from work orders.
8. **Readiness is the product boundary.** Worksie integrates with CRMs,
   accounting, scheduling, and dispatch systems rather than replacing them; it
   owns proof capture, completeness validation, approval routing, billing
   readiness, operational memory, and downstream automation triggers.

## Canonical Stack

See `TECH_STACK_DECISION.md` for the full rationale.

| Layer            | Choice                          |
|------------------|---------------------------------|
| Web admin        | Next.js + TypeScript            |
| Mobile field app | Expo (React Native)             |
| Database         | Supabase Postgres               |
| Auth             | Supabase Auth                   |
| Storage          | Supabase Storage                |
| Offline sync     | PowerSync + SQLite              |
| Schema/ORM       | Drizzle (preferred) or Prisma   |
| Web hosting      | Vercel                          |
| Mobile builds    | EAS                             |
| Payments (later) | Stripe Connect                  |
| Email (later)    | Resend                          |
| SMS (later)      | Twilio                          |

Firebase, Firestore, Firebase Auth, Firebase Hosting, Firebase Remote Config,
and Firebase Storage are **deprecated** as forward architecture. They remain
in the current scaffold only as legacy artifacts pending removal — see
`FIREBASE_MIGRATION_PLAN.md`.

## Reference Domain Pack

Worksie is being designed against a real operating business in Florida that
performs accessibility installs. Use this as the canonical reference domain
when reasoning about features, schemas, or workflows:

- EZ-ACCESS ADA ramps and steps
- Ramp recovery and removal
- Complete Access and Red Team vertical lifts
- Bruno and Harmar stair, vertical, and vehicle lifts
- Mobile homes and trailers
- Skirting and skirt removal
- Hurricane tie-downs
- Electrical exposure
- Heavy lifting and load handling
- Heat and hydration safety
- 1099 subcontractor onboarding
- W-9, COI, license, insurance, safety acknowledgements
- Monday payout after prior-week completed work
- Piece-rate and completion-based invoicing

Worksie must generalize beyond this pack, but it must work cleanly for it.

## What Lives Where

- `docs/WORKSIE_SPINE.md` — this file. Product identity, doctrine, stack.
- `docs/PRD.md` — product requirements at the user-flow level.
- `docs/DOMAIN_MODEL.md` — entities, relationships, lifecycle.
- `docs/COMPETITIVE_POSITIONING.md` — market gap, buyer-facing language,
  MVP wedge, product boundaries, and moat strategy.
- `docs/TECH_STACK_DECISION.md` — stack rationale and trade-offs.
- `docs/OFFLINE_FIRST_ARCHITECTURE.md` — sync model, conflict rules.
- `docs/ONBOARDING_FLOWS.md` — contractor and tenant onboarding.
- `docs/WORK_ORDER_LIFECYCLE.md` — states, transitions, proof-of-work gates.
- `docs/PAYOUT_RULES.md` — piece-rate, completion, weekly payout.
- `docs/FIREBASE_MIGRATION_PLAN.md` — how the legacy scaffold gets removed.
- `prompts/*.md` — agent prompts. Must reference this spine.
- `dataset/worksie_training_schema.jsonl` — training schema. Must reflect
  the domain model in `DOMAIN_MODEL.md`, not the legacy UI manifest.

## Change Rule

If a change to product direction, scope, or stack does not appear in this
spine after the change lands, the change is not done. The spine is the
contract.
