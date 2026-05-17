# Worksie Domain Model

Entities, relationships, and lifecycle rules. This is the relational
contract — every schema, every prompt, every dataset record must match the
shape described here. Pairs with `WORK_ORDER_LIFECYCLE.md`,
`ONBOARDING_FLOWS.md`, and `PAYOUT_RULES.md`.

## Core Principle

Worksie models **capability**, not **catalog**. A business has services it
*can perform*, each of which carries required gear, required documents,
required safety steps, and a payout rule. Work orders are concrete
instances of a service with rules attached at creation time so a later
config change does not retroactively rewrite history.

## Entities

### Tenant
The top-level container. Every row in Worksie belongs to exactly one tenant.
- `id`
- `name`
- `timezone`
- `default_payout_period` (e.g. `weekly_mon_sun`)
- `created_at`

### User
A human with login credentials. May hold multiple roles across tenants
(typically one).
- `id`
- `auth_user_id` (Supabase Auth)
- `email`
- `display_name`
- `phone`

### Membership
The join between User and Tenant with a role.
- `id`
- `tenant_id`
- `user_id`
- `role` ∈ {`operator`, `back_office`, `contractor`, `customer`}
- `status` ∈ {`invited`, `active`, `suspended`}

### Business Profile
The operating business inside a tenant.
- `id`
- `tenant_id`
- `legal_name`
- `dba`
- `jurisdictions` (states/counties served)
- `default_safety_pack_id`

### Service Definition
What the business is capable of performing.
- `id`
- `tenant_id`
- `name` (e.g. "EZ-ACCESS ADA Ramp Install")
- `category` (e.g. `ramp_install`, `lift_install`, `skirting`, `tie_down`,
  `ramp_recovery`)
- `default_payout_rule_id`
- `required_gear` (list)
- `required_documents` (list — see Document Type)
- `required_safety_steps` (list — see Safety Step)
- `checklist_template_id`

### Document Type
A required compliance artifact.
- `id`
- `tenant_id`
- `name` (e.g. `w9`, `coi`, `state_license`, `general_liability_ins`)
- `applies_to` ∈ {`contractor`, `business`, `vehicle`}
- `expirable` (bool)
- `gating` (bool — does absence block dispatch?)

### Contractor Document
A submitted instance of a Document Type for a contractor.
- `id`
- `tenant_id`
- `contractor_membership_id`
- `document_type_id`
- `file_id` (Supabase Storage)
- `issued_on`
- `expires_on`
- `verified_by` (back-office user id, nullable)
- `verified_at`
- `status` ∈ {`pending`, `verified`, `rejected`, `expired`}

### Safety Acknowledgement
A signed safety acknowledgement by a contractor.
- `id`
- `tenant_id`
- `contractor_membership_id`
- `safety_pack_id`
- `signed_at`
- `signature_file_id`

### Safety Pack
A bundle of safety acknowledgements required by service or business.
- `id`
- `tenant_id`
- `name` (e.g. `heavy_lifting`, `electrical_exposure`, `heat_hydration`,
  `hurricane_tie_down`)
- `version`
- `content_ref`

### Work Order
A concrete instance of a service for a customer.
- `id`
- `tenant_id`
- `service_definition_id`
- `service_snapshot_json` (frozen at creation — rules, gear, docs, payout)
- `customer_id`
- `address`
- `gps` (lat/lng — populated from site)
- `scheduled_for`
- `assigned_contractor_membership_id` (nullable until dispatched)
- `status` (see `WORK_ORDER_LIFECYCLE.md`)
- `created_at`
- `created_by`

### Work Order Line Item
A discrete unit of work inside a work order. Drives piece-rate payout.
- `id`
- `tenant_id`
- `work_order_id`
- `description` (e.g. "8ft ramp section installed")
- `quantity`
- `unit` (e.g. `each`, `linear_foot`)
- `piece_rate_amount` (nullable; from payout rule)
- `completed_at`

### Checklist Template / Checklist Instance
- Template: ordered list of steps with required-photo flags.
- Instance: bound to a Work Order; each step has `completed_at`,
  `completed_by`, and zero-or-more linked Proof-of-Work artifacts.

### Proof-of-Work Artifact
- `id`
- `tenant_id`
- `work_order_id`
- `checklist_step_id` (nullable)
- `kind` ∈ {`photo`, `video`, `signature`, `pdf`, `note`}
- `file_id` (Supabase Storage)
- `gps`
- `captured_at`
- `captured_by`

### Customer
Light-touch in v1.
- `id`
- `tenant_id`
- `name`
- `phone`
- `email`
- `address`

### Customer Sign-off
- `id`
- `tenant_id`
- `work_order_id`
- `signed_at`
- `signature_file_id`
- `signed_name`

### Payout Rule
- `id`
- `tenant_id`
- `name`
- `mode` ∈ {`piece_rate`, `completion_flat`, `hourly_capped`}
- `rate_table_json`

### Payout Period
- `id`
- `tenant_id`
- `period_start`
- `period_end`
- `cutoff_at` (e.g. Sunday 23:59 local)
- `paid_on` (target Monday)
- `status` ∈ {`open`, `draft`, `approved`, `paid`}

### Payout Line
- `id`
- `tenant_id`
- `payout_period_id`
- `contractor_membership_id`
- `work_order_id`
- `work_order_line_item_id` (nullable)
- `amount`
- `computed_from` (rule id)

## Relationship Summary

```
Tenant 1—* Membership *—1 User
Tenant 1—* BusinessProfile
Tenant 1—* ServiceDefinition 1—* (Required Docs, Safety Steps, Gear)
Tenant 1—* WorkOrder *—1 ServiceDefinition
WorkOrder 1—* WorkOrderLineItem
WorkOrder 1—* ChecklistInstance —* ChecklistStep —* ProofOfWorkArtifact
WorkOrder 1—1 CustomerSignoff
Contractor (Membership) 1—* ContractorDocument *—1 DocumentType
Contractor (Membership) 1—* SafetyAcknowledgement *—1 SafetyPack
PayoutPeriod 1—* PayoutLine *—1 WorkOrder
```

## Hard Rules

1. Every row carries `tenant_id`. RLS enforces tenant boundary.
2. `service_snapshot_json` is frozen at work-order creation. Editing the
   parent Service Definition does not rewrite past work orders.
3. Required Document rows where `gating = true` and `status != verified`
   (or `expires_on < today`) block dispatch.
4. A Work Order cannot transition to `completed` without:
   - All checklist steps in the bound Checklist Instance complete.
   - All required Proof-of-Work artifacts present.
   - A Customer Sign-off, if the Service Definition requires one.
5. Payout Lines are append-only inside an `approved` Payout Period.
   Corrections happen via a new period or an explicit adjustment row, not
   by editing history.
