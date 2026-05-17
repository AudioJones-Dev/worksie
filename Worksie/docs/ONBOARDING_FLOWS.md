# Onboarding Flows

Two onboarding flows in v1: **Tenant/Operator onboarding** and **Contractor
onboarding**. Both must produce a row-by-row compliant record. Both must be
resumable.

## Tenant / Operator Onboarding

Goal: a new operator stands up a working Worksie instance for their
business with at least one Service Definition, one Payout Rule, one
Document Type pack, and one Safety Pack.

Steps:

1. **Sign up.** Supabase Auth account creation. Email + password (v1).
2. **Create tenant.** Name, timezone, default payout period.
3. **Create business profile.** Legal name, DBA, jurisdictions.
4. **Pick a starter capability pack** (optional, accelerator).
   Pre-built bundles for common verticals — accessibility installs,
   skirting, tie-downs — populate Service Definitions, Document Types,
   and Safety Packs. Operator can then edit.
5. **Confirm payout rule.** Default = piece-rate or completion-flat,
   weekly Mon–Sun, payout target Monday.
6. **Invite back office and contractors.** Email invites.

Resumability: each step writes its result. The operator can leave and
return; the onboarding home shows next required step.

## Contractor Onboarding

Goal: a new 1099 contractor reaches **dispatchable** state — meaning the
compliance gate is green and the contractor's mobile app can show
assignable work.

Steps:

1. **Accept invite.** Email link → Supabase Auth signup or sign-in.
2. **Confirm identity.** Display name, phone.
3. **W-9.** Upload or in-app completion. Submits a `ContractorDocument`
   of type `w9`.
4. **Insurance / COI.** Upload Certificate of Insurance. `expires_on`
   required. Gating.
5. **License (if jurisdiction requires).** Upload state/county license.
   Conditional on `BusinessProfile.jurisdictions` and the service
   definitions the contractor will perform.
6. **Vehicle docs (if applicable).** Vehicle insurance, registration.
7. **Safety acknowledgements.** Sign one acknowledgement per required
   Safety Pack for the services the contractor will perform. Pack
   examples from the reference domain: `heavy_lifting`,
   `electrical_exposure`, `heat_hydration`, `hurricane_tie_down`.
8. **Mobile app install.** Contractor installs the Worksie app. First
   sign-in pulls assignments scoped to their dispatchable state.

Resumability: same as operator. The contractor's home screen lists
missing items. Until all gating documents and safety acknowledgements
are green, the contractor is `onboarding` and not dispatchable.

## Compliance Gate (Server-Evaluated)

A contractor is **dispatchable for a service** iff:

- Membership.role = `contractor` AND Membership.status = `active`.
- All `DocumentType` rows where `applies_to in (contractor, vehicle)`
  AND `gating = true` AND linked to this service have a
  `ContractorDocument` with `status = verified` and
  (`expirable = false` OR `expires_on > today`).
- All `SafetyPack` rows referenced by the service's
  `required_safety_steps` have a `SafetyAcknowledgement` for the
  contractor at the current pack version.

The gate runs server-side. The result is replicated to mobile so the
contractor's "available work" list is always honest.

## Customer Onboarding

In v1, customers do not have accounts. A customer is created when a work
order is created. The only customer-facing surface is the sign-off step
during work order completion.

## Edge Cases

- **Expiring COI.** When `ContractorDocument.expires_on` falls within
  the configurable warning window (default 14 days), the contractor sees
  a banner. When it expires, dispatch is blocked automatically.
- **New service added after onboarding.** If the operator adds a new
  Service Definition with new Safety Packs, contractors associated with
  that service receive pending acknowledgement items and are gated until
  signed.
- **Pack version bump.** Bumping a Safety Pack version requires
  contractors to re-acknowledge before dispatch on services that
  reference that pack.
