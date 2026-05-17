# Tile / Bath Domain Pack (Roadmap / Spec)

> **Status: Roadmap only.** This document is a future-domain
> specification. It does **not** alter the canonical ontology
> (`docs/DOMAIN_MODEL.md`), the Drizzle schema (`packages/db`),
> RLS, or seed any data. The pack described here is a *capability
> bundle* the operator can install during onboarding — it does not
> introduce new entities.
>
> Target phase mapping: **Phase 8** (after Phases 4–7 land the
> commercial, e-sign, dispatch, and payout layers).

## Purpose

Define the first non-reference domain pack: tub-to-shower conversions,
tile installation, vanity and fixture installs, and the surrounding
demo / waterproofing / plumbing work. Pairs with `WORKSIE_SPINE.md`
(reference domain — accessibility installs is the *current* pack;
tile/bath is the *first added*), `ONBOARDING_FLOWS.md` (capability
packs install during tenant onboarding), and `LGA_MODEL.md` (this pack
exercises the full commercial pipeline, not just execution).

## What A Domain Pack Is (definitional)

A **capability pack** is a curated bundle of:

- `ServiceDefinition` rows (what the business can perform)
- `DocumentType` rows (compliance specific to the trade)
- `SafetyPack` rows (safety acknowledgements specific to the trade)
- `PayoutRule` rows (pay rates appropriate for the trade)
- `ChecklistTemplate` rows (field workflows for proof-of-work)
- `DocumentTemplate` rows (contracts, change orders, completion
  forms specific to the trade) — Phase 5+
- A taxonomy of `trade_categories` (used by the Dispatch layer) —
  Phase 6+
- Optional starter `LeadSource` rows for typical channels in the
  trade (Angi, HomeAdvisor, neighborhood referrals)

A pack is **installed**, not "imported." Installation copies the rows
into the tenant's namespace at a frozen version. Tenants can then edit
their copies freely without affecting the source pack.

A pack uses **only** existing canonical entities. A pack cannot
introduce new ontology — that requires a docs PR, not a pack PR.

## Pack Contents (proposed)

### Service Definitions

| Name                          | Category               | Notes                          |
|-------------------------------|------------------------|--------------------------------|
| Tub-to-Shower Conversion      | `bath_remodel`         | flagship                       |
| Walk-In Shower Install        | `bath_remodel`         | new construction or remodel    |
| Tile Floor Install            | `tile_install`         | per square foot piece-rate     |
| Tile Wall / Backsplash        | `tile_install`         | per square foot piece-rate     |
| Shower Pan Install            | `bath_remodel`         | waterproofing required         |
| Vanity Install                | `bath_remodel`         | includes plumbing finish       |
| Toilet Install / Replace      | `bath_remodel`         | flat-rate completion           |
| Grout Restoration             | `tile_repair`          | recurring revenue              |
| Tile Demo / Removal           | `tile_demo`            | enables most of the above      |
| Plumbing Rough-In (bath)      | `plumbing_rough`       | licensed trade — see below     |
| Plumbing Finish (bath)        | `plumbing_finish`      | licensed trade                 |
| Waterproofing Membrane        | `bath_remodel`         | required pre-tile in wet areas |

Each `ServiceDefinition` declares its `required_gear`,
`required_documents`, `required_safety_steps`,
`default_payout_rule_id`, `checklist_template_id`, and
`customer_signoff_required = true` (every install in this pack ends
with a customer walkthrough and sign-off).

### Required Gear (per service, illustrative)

- **Tile Install** — tile saw (wet), notched trowel set, level (4ft +
  6ft), spacers, knee pads, vacuum, mortar, grout, sealer.
- **Tub-to-Shower** — reciprocating saw, pry bars, drop cloths, dust
  containment, shop vac, plumbing wrenches.
- **Plumbing rough/finish** — torch kit (if copper), PEX tools (if
  PEX), pressure gauge, basin wrench, pipe wrench set.
- **Waterproofing** — membrane roll, primer, roller, seam tape, mixing
  paddle, drill.

Gear lists are configuration; operators edit them after install.

### Required Documents (per contractor, per trade category)

| Document            | Applies to                | Gating  |
|---------------------|---------------------------|---------|
| W-9                 | every subcontractor       | yes     |
| COI (general)       | every subcontractor       | yes     |
| State license       | plumbing rough/finish     | yes     |
| Lead-safe (RRP)     | demo in pre-1978 homes    | yes (conditional) |
| Tile manufacturer   | high-warranty install     | no      |
| training cert       | services (Schluter, etc.) |         |

The lead-safe (RRP) certification is a real gate — federal rule for
renovation/repair/painting in pre-1978 homes that disturb >6 sq ft.
The pack models it as a conditional gate: required when the work order
notes the home's build year is pre-1978.

### Safety Packs

| Pack name                | Required for                              |
|--------------------------|-------------------------------------------|
| `silica_dust_awareness`  | every tile demo, every tile cut           |
| `wet_saw_operation`      | every tile install                        |
| `slip_trip_fall_bath`    | bath remodel (wet floors)                 |
| `electrical_proximity`   | bath remodel (GFCI / vanity electrical)   |
| `chemical_handling`      | waterproofing, grout sealing              |
| `heavy_lifting`          | tub/shower pan handling                   |
| `lead_safe_rrp`          | demo in pre-1978 homes                    |
| `plumbing_torch_safety`  | services using soldering torches          |

These match the existing `SafetyPack` pattern from the reference
domain. Versioning rules apply: a bump in `version` forces re-
acknowledgement by all contractors performing services that reference
the pack.

### Payout Rules

| Rule name                   | Mode               | Applies to                    |
|-----------------------------|--------------------|-------------------------------|
| `tile_sqft_install`         | `piece_rate`       | tile floor / wall services    |
| `tub_to_shower_flat`        | `completion_flat`  | tub-to-shower conversion      |
| `walk_in_shower_flat`       | `completion_flat`  | walk-in shower install        |
| `bath_remodel_flat`         | `completion_flat`  | catch-all bath services       |
| `plumbing_hourly_capped`    | `hourly_capped`    | rough / finish plumbing       |
| `grout_restoration_flat`    | `completion_flat`  | grout restoration             |

Rate tables live on the `PayoutRule.rate_table_json`. The pack ships
**placeholder rates** the operator must replace during install — the
pack should not look like Worksie is dictating market rates.

### Checklist Templates

Each service definition references a checklist template. Required-photo
flags drive the proof-of-work gate already enforced by
`WORK_ORDER_LIFECYCLE.md`. Examples:

**Tile floor install** (representative steps):
1. Pre-existing condition photos (required: 4+ photos, GPS at start)
2. Subfloor inspection + level check (required: 2+ photos)
3. Underlayment / waterproofing installed (required: 1+ photo per
   section)
4. Layout marked (required: 1+ photo)
5. Tile set, joints uniform (required: photo per row or per N sq ft)
6. Grout applied + cleaned (required: 2+ photos)
7. Final walk-through with customer (required: customer sign-off)
8. Cleanup verified (required: 2+ photos)

**Tub-to-shower conversion**:
1. Pre-existing tub photos (required: 4+ photos)
2. Demo complete, debris removed (required: 2+ photos)
3. Plumbing inspection / rough-in passed (required: 1+ photo;
   notes field for inspector ticket)
4. Pan installed + waterproofed (required: 2+ photos including flood
   test if performed)
5. Tile / surround installed (required: photos)
6. Glass / door installed (required: 2+ photos)
7. Fixtures live, leak-tested (required: 1+ video clip recommended)
8. Customer walkthrough + sign-off (required)

Checklist content is config; operators edit freely after install.

### Document Templates (Phase 5+)

The pack proposes default templates the operator can adopt:

- `customer_contract` — tile/bath specific scope language, dust /
  noise / parking expectations, change-order clause referencing
  hidden conditions (rot, plumbing surprises) as common amendments.
- `change_order` — short-form for the typical "rotten subfloor" /
  "plumbing reroute" amendments.
- `subcontractor_per_job` — short-form scope of work for the
  per-trade sub.
- `customer_completion` — punchlist + sign-off acknowledgement.

These are sample bodies. They are not legal advice; the operator's
attorney must review before they are used in production. The pack
flags this in the install UI.

### Trade Category Taxonomy (Phase 6+ dispatch)

Seeded `trade_categories` for dispatch matching:

- `tile_install`
- `tile_demo`
- `tile_repair`
- `bath_remodel_general`
- `plumbing_rough`
- `plumbing_finish`
- `waterproofing`
- `electrical_general` (for vanity light circuits and GFCI)

### Lead Source Seeds (Phase 7+ attribution)

Common channels for bath remodel:

- `angi`
- `home_advisor`
- `thumbtack`
- `google_lsa`
- `google_organic`
- `meta_paid`
- `referral_customer`
- `referral_partner` (designer, real-estate agent)
- `truck_signage`
- `yard_sign`
- `walk_in`

Each is configured with a `cost_model` placeholder the operator
overrides.

## Why Tile / Bath First

This pack is chosen as the first non-reference pack because:

1. It exercises the full commercial pipeline: leads come from multiple
   channels, opportunities require estimates, scope changes mid-job
   (hidden rot, plumbing surprises) are routine and exercise change
   orders.
2. It exercises subcontractor dispatch with a real trade taxonomy
   (a tile installer is not a plumber).
3. It exercises licensed-trade gating (plumbing licensure) and
   conditional regulatory gating (lead-safe RRP).
4. It exercises proof-of-work with high evidentiary stakes
   (waterproofing, leak testing — failures are expensive).
5. It is operationally simple per job (single property, single
   customer, days-to-weeks duration) compared to commercial work or
   long ground-up projects, so it does not require deferred features.

The reference domain (accessibility / mobile-home services) stays in
`WORKSIE_SPINE.md` as the canonical reasoning anchor; tile/bath is the
first proof that the platform generalizes.

## What Must Be True Before This Pack Ships

This pack is **installable** only after the underlying capabilities
exist:

| Pack feature                                | Requires phase             |
|---------------------------------------------|----------------------------|
| Service definitions, gear, safety packs,    | Phase 2 schema (DONE)      |
| payout rules, checklists                    |                            |
| Document templates (contracts, completion)  | Phase 5 e-sign             |
| Conditional documents (lead-safe RRP gate)  | Phase 2 + a `condition`    |
|                                             | schema on `DocumentType`   |
|                                             | (proposed extension —      |
|                                             | future ontology PR)        |
| Trade category dispatch matching            | Phase 6 dispatch           |
| LeadSource attribution                      | Phase 7 attribution        |
| Margin reporting on bath jobs               | Phase 7 margin             |

The pack **cannot** ship before Phase 5 if it advertises e-sign
contracts. Without e-sign, the install drops the document templates
and ships only services / safety / payout / checklists — a degraded
but usable mode.

## Conditional Document Gating (proposed extension)

The lead-safe RRP requirement is conditional on the *work order*, not
on the *contractor* universally. Today's `DocumentType.gating` is a
boolean. To express "required if the property is pre-1978," the
ontology needs a `condition_json` extension on `DocumentType` (or a
separate `DocumentTypeCondition` table). This is **proposed** for
ontology review when this pack ships — it is not a tile/bath-specific
hack; future packs (asbestos, mold) will want the same pattern.

Phase-0 (this roadmap doc) deliberately does **not** model the
condition schema; it just flags the requirement.

## Pack Install Mechanics (proposed)

Pack install is part of onboarding (`ONBOARDING_FLOWS.md` step 4:
"Pick a starter capability pack"). The mechanics:

1. Operator selects "Tile / Bath" pack during tenant onboarding.
2. A `pack install` server action runs in a single transaction:
   - Insert curated `ServiceDefinition`, `DocumentType`, `SafetyPack`,
     `PayoutRule`, `ChecklistTemplate` rows with `tenant_id` =
     this tenant.
   - Record a `pack_installation` row (proposed lightweight audit
     entity — defer to ontology review) with the source pack id +
     version + installed_at, so re-installation or upgrades are
     tractable.
3. Operator lands on a "Review installed services" screen with edit
   affordances for rates and gear.
4. Document templates (if Phase 5 is live) install in a second
   transactional step the operator confirms separately, because
   templates need legal sign-off.

## Hard Rules (proposed)

1. Pack install is **idempotent per tenant per pack version**. Re-
   running install does not duplicate rows.
2. Pack content is **frozen at the source-pack version**. Tenants edit
   their installed copies; the source pack is not the live row.
3. Pack must not introduce new ontology. A pack that "needs" a new
   entity blocks on an ontology PR first.
4. Pack rate tables ship with placeholder rates the operator must
   replace before going live. The UI flags unreplaced placeholders.
5. Pack document templates ship with a "needs attorney review" banner
   the operator must dismiss with an audit trail entry.

## Architecture Risks

1. **Pack rot.** Source packs drift from installed copies. Mitigation:
   the `pack_installation` row tracks source version; an "upgrade
   available" surface shows the diff and lets the operator selectively
   accept changes.
2. **Service definition explosion.** This pack adds 12 service
   definitions; future packs add more. Mitigation: the operator UI
   needs filtering / categorization built in before adding the third
   pack, not after.
3. **Trade-licensure variation by jurisdiction.** Plumbing licensure
   rules differ state-by-state. The pack ships a sensible US-default;
   the operator's `BusinessProfile.jurisdictions` drives finer-grained
   conditional requirements — see "Conditional document gating" above.
4. **Customer expectations on photo coverage.** Bath remodels accumulate
   100+ photos. Mitigation: PowerSync upload queue, batch-thumbnail
   strategy, and a UI that does not try to display them all at once.
5. **Subcontractor scarcity by trade.** A tile installer pool and a
   plumber pool rarely overlap. The dispatch layer must surface
   "no eligible subs" clearly — not silently delay the work order.

## Open Questions

- Should plumbing services be a **separate pack** (`Plumbing`) that
  Tile/Bath depends on, or bundled into Tile/Bath directly?
  Default: **bundled** for v1 to keep install simple; refactor when
  a Plumbing-only pack lands.
- Do we ship **estimating templates** (per-sq-ft line items, demo
  charges, plumbing rough/finish line items)? Default: **yes, when
  Phase 4 estimating ships**, behind a "use template" affordance in
  the Estimate composer.
- Do we ship **regional rate guides**? Default: **no**. Rates are a
  business decision the LGA owns. The pack ships clearly-labeled
  placeholders.
- How do we handle **manufacturer-specific certifications** (Schluter,
  Wedi, Mapei)? Default: optional `DocumentType` rows with
  `gating = false`; operators turn them on if they want them gated.

## Phase Mapping (recommended)

| Phase | Slice                                                          |
|-------|----------------------------------------------------------------|
| 8.0   | Pack install mechanism (data-only; no templates)               |
| 8.1   | Tile / Bath services, safety packs, payout rules, checklists   |
| 8.2   | Document templates (after Phase 5 lands)                       |
| 8.3   | Trade-category taxonomy seeding (after Phase 6 lands)          |
| 8.4   | LeadSource seeds + attribution defaults (after Phase 7 lands)  |
| 8.5   | Conditional document gating (lead-safe RRP) — requires the     |
|       | ontology extension above                                       |

## Out of Scope (for this roadmap doc)

- New construction (rough framing, drywall) — separate pack.
- Kitchen remodels — separate pack (significant overlap, but enough
  unique workflow to deserve its own pack).
- Estimating math automation (per-sqft × dimension calc helpers).
- 3D bathroom design / visualization.
- Material ordering integration (Home Depot Pro / supplier APIs).
- Permit pulling / inspection scheduling integration.
- Photo-AI auto-tagging or auto-narration of completion reports.
