# Worksie — Domain Model

Field-level reference for the entities introduced in the PRD. This is
the system-of-record shape. Shapes are illustrative JSON; the
authoritative validators live in `src/logic/schema/` (Phase 1).

All entities are scoped to a `businessId` unless noted. All entities
have `createdAt`, `updatedAt`, `createdBy`, `updatedBy`. All
state-changing writes append to `auditTrail`.

---

## 1. Business (tenant root)

```
businesses/{businessId}
{
  id, name, legalName,
  timezone,                         // e.g., "America/New_York"
  weekStartsOn: "monday",           // payout cycle anchor
  payoutCycle: "weekly_mon_for_prior_week",
  address, contact, taxId,
  domainPacksInstalled: [           // versioned references
    { packId: "florida-ramp-and-lift", version: "1.0.0", installedAt }
  ],
  settings: {
    offlineMode: { enabled: true, mediaDefersToWifi: true },
    audit: { retentionDays: 2555 }  // 7y default
  }
}
```

A user joins via `businessMemberships/{userId}_{businessId}` with a
role and capability scopes.

## 2. Capability

An atomic ability a crew can perform. Not sold directly.

```
businesses/{businessId}/capabilities/{capabilityId}
{
  id, key,                          // stable slug, e.g., "electrical_exposure_work"
  name, description,
  hazardTags: ["electrical","heavy_lift","heat","fall","confined_space"],
  requiresCertification: bool,
  requiresTools: ["multimeter", ...],
  active: bool
}
```

## 3. ServiceTemplate

A sellable offering composed of capabilities.

```
businesses/{businessId}/serviceTemplates/{serviceId}
{
  id, key, name, description,
  capabilities: [capabilityId, ...],
  defaultJobConfigurationId,        // recipe to execute by default
  pricingModel: "piece_rate" | "flat" | "hourly" | "completion",
  unitLabel: "ramp_foot" | "install" | "hour" | "unit",
  defaultUnitPrice: { amount: 12500, currency: "USD" }, // cents
  customerFacingScopeTemplateId,    // doc template id (optional)
  active: bool
}
```

## 4. JobConfiguration

The *recipe* for executing a service: which requirements, rules, and
proofs apply. A service may have multiple variants (e.g., "standard"
vs. "expedited").

```
businesses/{businessId}/jobConfigurations/{jobConfigId}
{
  id, key, name, serviceTemplateId,
  contractorRequirementIds: [reqId, ...],
  safetyRuleIds:           [ruleId, ...],
  documentationRuleIds:    [ruleId, ...],
  proofOfWorkRuleIds:      [ruleId, ...],
  payoutRuleId,
  estimatedDurationMinutes,
  checklist: [
    { id, label, required: bool, kind: "task" | "photo" | "measure" | "signature" }
  ],
  active: bool
}
```

## 5. ContractorRequirement

What the *contractor* must satisfy to be assigned a job using this
configuration.

```
businesses/{businessId}/contractorRequirements/{reqId}
{
  id, key, name,
  requiredSkills:        [capabilityKey, ...],
  requiredTools:         [toolKey, ...],
  requiredCertifications:[certKey, ...],
  requiredInsurance:     ["general_liability","workers_comp"],
  requiresW9: bool,
  requiresCOI: bool,
  requiresLicense: { type: "county_business", state: "FL", ... } | null,
  active: bool
}
```

## 6. SafetyRule

Pre-job / on-job acknowledgement, often hazard-driven.

```
businesses/{businessId}/safetyRules/{ruleId}
{
  id, key, name, hazard,            // "electrical" | "heat" | "heavy_lift" | ...
  triggerWhen: {
    capabilityKeys?: [],
    weatherForecastTempF?: { gte: 90 },
    workOrderTags?:  []
  },
  acknowledgementType: "tap_ack" | "signature" | "two_person_attest",
  requiresHydrationPlan?: bool,
  active: bool
}
```

## 7. DocumentationRule

Documents that must exist on the work order at given lifecycle gates.

```
businesses/{businessId}/documentationRules/{ruleId}
{
  id, key, name,
  documentType: "signed_work_order" | "permit" | "scope_sheet"
              | "customer_completion_signoff" | "manufacturer_warranty" | ...,
  gate: "before_start" | "before_submit" | "before_invoice",
  template?: { templateId, fields: [...] },
  required: bool,
  active: bool
}
```

## 8. ProofOfWorkRule

Evidence required to mark the work order complete.

```
businesses/{businessId}/proofOfWorkRules/{ruleId}
{
  id, key, name,
  proofType: "photo_before" | "photo_after" | "photo_serial"
           | "photo_measurement" | "count_input" | "customer_signature"
           | "video" | "voice_note",
  minCount: 1,
  matchPairs: bool,                 // e.g., before/after must match angle
  requireGps: true,
  requireTimestamp: true,
  countSchema?: { unitLabel: "tie_down", min: 0 },
  active: bool
}
```

## 9. PayoutRule

How contractor pay is computed. Bound to JobConfiguration.

```
businesses/{businessId}/payoutRules/{payoutRuleId}
{
  id, key, name,
  pricingModel: "piece_rate" | "flat" | "hourly" | "completion",
  unitLabel: "ramp_foot" | "install" | "hour" | "unit",
  rate: { amount: 4500, currency: "USD" },     // cents per unit
  cycle: "weekly_mon_for_prior_week",          // default; per-business override
  eligibility: {
    requireWorkOrderStatus: "approved",
    cutoffDayOfWeek: "sunday",
    cutoffLocalTime: "23:59"
  },
  holdbacks: [ { key, amount, reason } ],      // optional deductions
  active: bool
}
```

## 10. Contractor & ContractorProfile

Contractors are global identities; profiles are per-business.

```
contractors/{contractorId}
{
  id, userId,                                  // links to auth user
  legalName, phone, email,
  type: "1099" | "w2",
  globalIdentityVerified: bool
}

businesses/{businessId}/contractorProfiles/{contractorId}
{
  contractorId,
  skills:        [capabilityKey, ...],
  tools:         [toolKey, ...],
  certifications:[{ key, issuer, expiresAt, evidenceDocId }],
  insurance: {
    coi: { docId, carrier, policyNumber, expiresAt },
    workersComp?: { docId, expiresAt }
  },
  w9: { docId, signedAt, version },
  license?: { type, state, number, expiresAt, docId },
  safetyAcknowledgements: [
    { ruleId, version, ackAt, signatureDocId? }
  ],
  toolChecklistCompletedAt,
  onboardingStatus: "not_started" | "in_progress" | "ready" | "blocked",
  blockedReasons: []
}
```

## 11. WorkOrder

A concrete instance of a job.

```
workOrders/{workOrderId}
{
  id, businessId,
  serviceTemplateId, jobConfigurationId,
  customer: {
    name, phone, email,
    address: { line1, line2, city, state, postal, lat, lng }
  },
  schedule: { startAt, endAt, timezone },
  assigned: {
    contractorIds: [],
    leadContractorId
  },
  status: "draft" | "scheduled" | "en_route" | "on_site"
        | "in_progress" | "submitted" | "approved" | "invoiced" | "paid"
        | "rejected" | "cancelled",
  checklistState: [
    { itemId, status: "pending" | "done" | "skipped", at, by }
  ],
  proofs: [
    { ruleId, proofType, mediaId, gps, capturedAt, by, count? }
  ],
  documents: [
    { ruleId, documentType, docId, attachedAt, by }
  ],
  safetyAcks: [
    { ruleId, ackAt, by, signatureDocId?, hydrationPlan? }
  ],
  completionMetrics: {
    unitsCompleted: 18,             // e.g., 18 ramp_feet
    unit: "ramp_foot",
    hoursLogged?: number,
    finishedAt
  },
  invoiceId?, payoutLineItemIds?: [],
  offlineDraft?: bool,
  lastSyncedAt?
}
```

## 12. Invoice & InvoiceLineItem

```
invoices/{invoiceId}
{
  id, businessId, customerRef, status: "draft" | "sent" | "paid" | "void",
  issuedAt, dueAt,
  total: { amount, currency },
  lineItems: [invoiceLineItemId, ...]
}

invoiceLineItems/{lineItemId}
{
  id, invoiceId, workOrderId, serviceTemplateId,
  description, quantity, unitLabel,
  unitPrice: { amount, currency },
  total:     { amount, currency }
}
```

## 13. Payout, PayoutCycle, PayoutLineItem

```
payoutCycles/{cycleId}
{
  id, businessId,
  periodStart, periodEnd,            // e.g., Mon..Sun
  payoutDate,                        // following Monday
  status: "open" | "computed" | "released" | "closed"
}

payouts/{payoutId}
{
  id, businessId, cycleId, contractorId,
  status: "pending" | "computed" | "released" | "failed",
  gross: { amount, currency },
  deductions: [ { key, amount, reason } ],
  net:   { amount, currency },
  releasedAt?, releasedBy?, externalTransferRef?
}

payoutLineItems/{plId}
{
  id, payoutId, workOrderId, payoutRuleId,
  unitsCompleted, unitLabel,
  unitRate:  { amount, currency },
  total:     { amount, currency }
}
```

## 14. AuditTrail

```
auditTrail/{eventId}
{
  id, businessId,
  actorUserId, actorRole,
  subjectType: "workOrder" | "contractorProfile" | "payout" | ...,
  subjectId,
  action,                           // "status.changed", "proof.captured", ...
  before, after,
  at, deviceMeta, gps?,
  immutable: true
}
```

Append-only. Never updated. Never deleted within retention window.

## 15. DomainPack

```
domainPacks/{packId}
{
  id, name, version, trade,
  capabilities:           [...],
  serviceTemplates:       [...],
  jobConfigurations:      [...],
  contractorRequirements: [...],
  safetyRules:            [...],
  documentationRules:     [...],
  proofOfWorkRules:       [...],
  payoutRules:            [...]
}
```

Installing a pack copies entries into the business's collections with
a `sourcePack: { packId, version, key }` reference so customizations
diverge cleanly.

## 16. Identifier & Versioning Conventions

- All ids are server-generated except `key` slugs which are
  human-readable and stable across pack versions.
- Rules and templates are **versioned by content hash** when changed,
  and references on a work order pin the version at creation time so
  late edits don't retroactively change satisfied gates.
- Currency stored as integer cents with explicit currency code.

## 17. Index Hints (Phase 1)

- `workOrders` by `(businessId, status, schedule.startAt)`
- `workOrders` by `(businessId, assigned.contractorIds, status)`
- `payoutLineItems` by `(businessId, cycleId, contractorId)`
- `auditTrail` by `(businessId, subjectId, at desc)`
- `contractorProfiles` by `(businessId, onboardingStatus)`
