# Worksie — Product Requirements Document

> **Status:** Phase 0 (foundation). No application code has been written
> against this PRD yet. Source under `Worksie/src/` is a placeholder
> scaffold and should be considered non-binding until Phase 1.

---

## 1. Vision

Worksie is a **mobile-first, configurable operations platform for
blue-collar businesses**. It lets a business model exactly what it is
capable of performing, configure the rules that govern that work
(skills, safety, documentation, proof, payout), and run day-to-day field
operations from a phone.

Worksie is not a single-trade app. It is a platform that can be
configured into ramp installers, HVAC crews, mobile mechanics,
landscapers, fencing contractors, pressure washers, accessibility
installers, sign installers, pool techs, low-voltage installers,
appliance installers, and similar field-services businesses.

## 2. Core Principle

**Model what a business is *capable of performing*, not only what it
sells.**

A "service" is a sellable offering. A "capability" is an underlying
ability (e.g., *electrical exposure work*, *heavy lift*, *concrete
anchoring*, *outdoor work in heat*). Services are composed from
capabilities, and capabilities drive which contractors qualify, which
safety rules fire, which documents are required, and what proof of
completion looks like.

## 3. Personas

| Persona | Primary device | Top jobs-to-be-done |
|---|---|---|
| Business owner / ops admin | Phone first, desktop second | Configure capabilities, services, rules, payouts; approve work; pay contractors |
| Crew lead (W-2) | Phone | Receive work orders, run jobs, capture proof, mark complete |
| 1099 subcontractor | Phone | Onboard (W-9, COI, license, safety), pick up jobs, submit proof, see payout |
| Field worker / helper | Phone | Execute checklist items, upload photos, sign off |
| Customer | Phone (link) | Sign work order, sign completion, pay invoice |

## 4. Mobile-First Principles (non-negotiable)

Blue-collar businesses live on phones — in trucks, on roofs, under
porches, in driveways, often outdoors in sun, often with gloves, often
with one hand free. Every requirement below applies to v1:

1. **Phone UX is the canonical UX.** Desktop is a secondary surface used
   primarily by admins for configuration and review.
2. **Large tap targets** (minimum 44×44pt) and thumb-reachable primary
   actions on the bottom of the screen.
3. **Camera-first proof capture.** Opening the camera is at most one tap
   from the work order screen.
4. **GPS + photo metadata** captured automatically (lat/long, timestamp,
   heading, device) and attached to every proof photo/video.
5. **Offline-tolerant.** Field workers must be able to: open today's
   assigned work orders, run checklists, capture photos/videos, capture
   signatures, mark steps complete, and queue submission — all while
   offline. Sync resumes when connectivity returns.
6. **Minimal typing in the field.** Prefer tap-select, photo, voice
   memo, scan, and signature over text input.
7. **Fast checklist access.** Active work order opens to its checklist;
   no nav drilling.
8. **Status updates from the job site** are a single tap ("On site",
   "In progress", "Need help", "Complete").
9. **Safety acknowledgements** are mobile-native (tap to ack, signature,
   timestamp, GPS).
10. **Contractor onboarding** completes entirely on a phone — document
    capture via camera, signature on glass, no desktop required.
11. **Payout and invoice review** are mobile-first views; contractors
    see what they earned and why, on their phone.
12. **Battery- and data-aware.** Photo/video uploads can be deferred to
    Wi-Fi; background sync is opt-in per worker.

Desktop dashboards are explicitly *not* the place we design first.

## 5. Multi-Tenant Business Model

Worksie is multi-tenant by `Business`. A user can belong to multiple
businesses (e.g., a 1099 subcontractor may work for several). Every
resource (capability, service, job, work order, contractor profile,
invoice, payout) is scoped to a `businessId`. There are no global
catalogs in v1 — each business defines its own (or installs a Domain
Pack; see §9).

## 6. Domain Concepts (overview)

The full model is in `DOMAIN_MODEL.md`. Top-level abstraction:

```
Business
  → CapabilityCatalog
      → ServiceTemplates
          → JobConfigurations
              → WorkOrders
                  → satisfies → ContractorRequirements
                              → SafetyRules
                              → DocumentationRules
                              → ProofOfWorkRules
                  → produces → InvoiceLineItems
                              → PayoutLineItems
                              → AuditTrail entries
Contractor (multi-business)
  → ContractorProfile (skills, tools, certifications, insurance, W-9, license)
  → OnboardingRecord per Business
```

## 7. Workflow Surfaces (v1)

- **Business setup** (admin): create capabilities, services, job
  configurations, rules, payout rules, onboarding flow.
- **Contractor onboarding** (1099, mobile): identity, W-9, COI,
  license, skills attest, tool checklist, safety acknowledgements.
- **Schedule & dispatch** (admin → contractor): assign work orders.
- **Execute** (mobile): run job, satisfy rules, capture proof.
- **Submit & approve** (contractor → admin): rule satisfaction is the
  gate.
- **Invoice** (admin or auto): generate from approved work orders.
- **Payout** (admin): weekly cycle (default: Monday for prior-week
  completions); piece-rate and completion-based aggregation.
- **Audit** (admin): immutable trail of every rule satisfaction, photo
  upload, signature, status transition.

Details: `WORK_ORDER_LIFECYCLE.md`, `ONBOARDING_FLOWS.md`,
`PAYOUT_RULES.md`.

## 8. Offline-Tolerant Design Assumptions

- All "read" surfaces a field worker uses (today's jobs, the active
  work order, its checklist, its rule list, its prior media) must
  hydrate from a local cache before any network call.
- Writes (status change, checklist tick, photo, signature, safety ack)
  are written to a local queue first, then synced. Conflicts are
  resolved last-write-wins per field with full audit history.
- A work order can be marked "submitted" while offline; server
  validation of rule satisfaction happens on sync, and the contractor
  is notified if anything is rejected.
- Photo/video uploads chunk and resume; large media defers to Wi-Fi by
  default.
- The app must be usable for a full day with intermittent connectivity
  on a single 4G bar.

## 9. Domain Packs

A **Domain Pack** is a versioned bundle of pre-built capabilities,
service templates, job configurations, safety rules, documentation
rules, proof-of-work rules, and payout rule defaults for a specific
trade. A new business can install a pack to get a working configuration
in minutes, then customize.

**v1 ships with one pack: `florida-ramp-and-lift`** (see §10). Pack
authoring is internal-only in v1; a public marketplace is out of scope.

## 10. Reference Domain Pack: Florida Ramp & Lift

A real accessibility-installation business in Florida. Used as the
canonical example throughout the docs and the JSONL dataset.

**Capabilities** (examples):
- `ramp_install`, `ramp_recovery_removal`
- `vertical_lift_install` (Complete Access, Red Team)
- `stair_lift_install` (Bruno, Harmar)
- `vehicle_lift_install` (Bruno, Harmar)
- `mobile_home_work`, `trailer_work`
- `skirting_install`, `skirting_removal`
- `hurricane_tie_down`
- `electrical_exposure_work`
- `heavy_lift` (≥75 lb)
- `outdoor_heat_exposure`

**Service Templates** (examples):
- "EZ-ACCESS ADA Ramp — Install"
- "EZ-ACCESS Steps — Install"
- "Ramp Recovery / Removal"
- "Complete Access Vertical Lift — Install"
- "Red Team Vertical Lift — Install"
- "Bruno Stair Lift — Install"
- "Harmar Stair Lift — Install"
- "Bruno Vertical Lift — Install"
- "Harmar Vehicle Lift — Install"
- "Mobile Home Skirting — Install"
- "Skirt Removal"
- "Hurricane Tie-Down — Install"

**Contractor Requirements** (typical):
- Skills: matching the capabilities above
- Tools: cordless drill/driver, impact, level, tape, hammer drill, PPE,
  jack/dolly for heavy lift, multimeter for electrical
- Certifications: manufacturer cert (Bruno/Harmar) where required;
  electrical comfort attestation
- 1099 compliance: W-9, COI, business license (county), GL insurance

**Safety Rules** (typical):
- Acknowledge electrical exposure before any lift install with mains
  work
- Acknowledge heavy-lift protocol for items ≥75 lb (two-person required)
- Acknowledge outdoor heat protocol on jobs scheduled when forecast ≥
  90°F; **hydration plan ack** required
- Acknowledge fall risk on elevated ramp work
- Acknowledge confined-space protocol for under-trailer skirting work

**Documentation Rules** (typical):
- Signed work order before start
- Customer-facing scope sheet on file
- Permit (where required) attached
- Signed completion / customer satisfaction at end

**Proof-of-Work Rules** (typical):
- Before photo (GPS + timestamp) from at least 2 angles
- After photo (GPS + timestamp) from at least 2 angles, matching angles
- Serial-number photo for lifts (Bruno/Harmar/Complete Access/Red Team)
- Measurement photo for ramps (length, rise)
- Tie-down count for hurricane jobs (with count entered)
- Customer signature on completion

**Payout Rules** (typical):
- Pricing model: **piece-rate per service** (e.g., "$X per ramp foot",
  "$Y per stair lift install") or **flat per service**
- Cycle: **Monday payout for the prior calendar week** (Mon–Sun)
  completed work
- Eligibility: work order must be in `approved` state by Sunday 23:59
  local time
- Holdbacks / deductions: optional per business (e.g., chargeback for
  callbacks)

**Invoicing**:
- Line items roll up from completed work orders
- Piece-rate and completion-based units feed line item quantity/price

Full details and field-level shapes: `DOMAIN_MODEL.md`,
`WORK_ORDER_LIFECYCLE.md`, `PAYOUT_RULES.md`.

## 11. Audit Trail

Every state transition, rule satisfaction, photo/document upload,
signature, payout calculation, and admin override is recorded to an
append-only audit log keyed by `businessId`, `workOrderId`, and actor.
Audit entries are immutable and exportable. This is a compliance
requirement for 1099 payout justification.

## 12. Out of Scope for v1

- LiDAR scanning
- 3D preview / floorplan generation
- Public template marketplace
- Advanced AI-generated reports (basic templated PDFs only)
- Complex marketplace features (bidding, ratings, discovery)
- **Payout automation** — payouts are *computed* automatically but
  *released* manually until audit rules are battle-tested. No
  auto-transfer to bank accounts in v1.
- Customer-facing portal beyond signature/payment links

Components in `Worksie/src/components/` that imply scope above (e.g.,
`LiDARScanner.jsx`, `3DPreview.jsx`, `FloorplanAutoGen.jsx`,
`TemplateMarket.jsx`, `AutoReportBuilder.jsx`) are **deferred** and
should not be treated as spec.

## 13. Open Decisions

1. **Payout rails.** Stripe Connect Express vs. ACH vs. manual export
   for 1099 payouts. Decision blocks payout *release* (not
   computation).
2. **E-signature vendor.** Native canvas-on-glass vs. third-party
   (DocuSign, Dropbox Sign) for W-9 / COI / completion signoff.
3. **Document storage / retention.** Firebase Storage default; PII
   retention policy for W-9s TBD.
4. **Auth.** Firebase Auth (email/SMS/Apple) is the default; SSO
   deferred.
5. **Mobile shell.** v1 ships as a mobile-web PWA (already on Vite +
   Firebase Hosting). Native wrappers (Capacitor / React Native)
   deferred until usage justifies.
6. **Offline storage engine.** IndexedDB via a thin wrapper (Dexie or
   similar) vs. Firestore offline persistence. Leaning Firestore
   offline + a local outbox for media.
7. **Geofencing.** Whether on-site detection auto-transitions status —
   leaning no (manual tap) for v1.
8. **Customer-of-record vs. property-of-record.** Whether a work order
   anchors to a person or an address (or both).

## 14. Success Metrics (v1)

- Time to onboard a new business with the Florida Ramp & Lift pack:
  **< 30 minutes**.
- Time for a 1099 subcontractor to complete onboarding on a phone:
  **< 20 minutes**.
- Field worker can run and submit a typical work order without ever
  opening a desktop browser: **100% of v1 supported services**.
- Weekly payout calculation reproducible from audit trail with
  **zero manual reconciliation** for a clean week.

## 15. Document Map

- `PRD.md` (this file) — vision, principles, scope.
- `DOMAIN_MODEL.md` — entities, fields, relationships.
- `ONBOARDING_FLOWS.md` — business setup and contractor onboarding.
- `WORK_ORDER_LIFECYCLE.md` — state machine and rule gates.
- `PAYOUT_RULES.md` — pricing models, cycles, eligibility, line items.
- `worksie_folder_structure.txt` — target repo layout.
- `dataset/worksie_training_schema.jsonl` — domain exemplars used by
  agent prompts.
