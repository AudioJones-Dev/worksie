# Worksie — Onboarding Flows

Two distinct flows, both mobile-first.

---

## 1. Business Onboarding (admin)

Goal: a new business is fully configured and can dispatch its first
work order in under 30 minutes.

**Surface:** mobile-first (phone-capable end to end), but tablet /
desktop is supported for power-config sessions.

### Steps

1. **Sign up** — phone or email auth (Firebase Auth).
2. **Create Business** — name, legal name, timezone, week start,
   address, taxId.
3. **Install a Domain Pack (optional but recommended)** — v1 ships
   `florida-ramp-and-lift`. Installing copies capabilities, services,
   job configurations, safety/doc/proof rules, and default payout
   rules into the business.
4. **Review & customize**:
   - Capability Catalog
   - Service Templates (price, unit label)
   - Job Configurations (checklist, applied rules)
   - Contractor Requirements
   - Safety Rules
   - Documentation Rules
   - Proof-of-Work Rules
   - Payout Rules (cycle defaults to `weekly_mon_for_prior_week`)
5. **Invite team** — owners, admins, crew leads, 1099s.
6. **First work order** — create from a service template, assign,
   dispatch.

### Mobile-first considerations

- Each config screen is a single scrollable card with a primary
  action at the bottom.
- Lists (capabilities, services) use swipe-to-edit and large tap rows.
- "Install Domain Pack" is a single button followed by a review
  diff screen.
- Long-form text (descriptions, scope sheets) accepts dictation.

---

## 2. Contractor Onboarding (1099, mobile-only path)

Goal: a 1099 subcontractor can be cleared to take a job in under 20
minutes from their phone, with no desktop step required.

**Surface:** phone. Desktop is supported but not the design target.

### Required artifacts

| Artifact | Capture method | Stored as |
|---|---|---|
| Identity | phone auth + photo ID capture (camera) | `contractors/{id}.globalIdentityVerified` |
| W-9 | in-app form + signature on glass | doc upload + signed PDF |
| COI (Certificate of Insurance) | photo / PDF upload from phone | doc upload |
| Business license (county) | photo / PDF upload | doc upload |
| GL insurance details | form (carrier, policy #, expires) | structured + doc |
| Skills attestation | tap-select capabilities + optional cert evidence photo | `contractorProfile.skills`, `certifications[]` |
| Tools attestation | tap-select tool checklist | `contractorProfile.tools`, `toolChecklistCompletedAt` |
| Safety acknowledgements | per safety rule: tap ack or signature, GPS + timestamp captured | `contractorProfile.safetyAcknowledgements[]` |

### Steps (mobile flow)

1. **Accept invite** — deep link or SMS code.
2. **Verify phone** — Firebase Auth SMS.
3. **Capture ID** — camera capture, auto-crop, on-device review.
4. **W-9** — fill (prefilled from profile where possible), sign on
   glass, confirm. PDF generated server-side.
5. **COI** — camera capture or PDF pick; enter carrier, policy
   number, expiration.
6. **License** — capture front (and back if applicable).
7. **Skills** — tap chips for capabilities matching the business's
   `ContractorRequirement.requiredSkills`. For each cert-required
   skill, capture a photo of the cert.
8. **Tools** — tap chips for tool checklist; "I have this" /
   "I don't have this." Missing-tool gate is configurable per
   business.
9. **Safety acknowledgements** — one card per rule with hazard icon,
   plain-language summary, tap-ack (or signature for two-person
   attest rules). Hydration plan ack required for outdoor heat rule.
10. **Review & submit** — single screen lists every blocker remaining;
    submit transitions `onboardingStatus` to `ready` if clean.

### Mobile-first considerations

- Every capture step uses the camera by default; gallery import is
  secondary.
- Documents are scanned in-app (auto-edge-detect, brightness) before
  upload.
- Signature is full-width on glass with undo.
- Progress is saved continuously; the user can drop off and resume.
- Works fully offline up to submit (submit requires connectivity for
  the audit-trail write).

### Gates

A 1099 cannot be assigned a work order whose `JobConfiguration` cites
a `ContractorRequirement` they do not satisfy. The assignment screen
filters and explains *why* a given contractor is ineligible
("Missing: hurricane-tie-down cert", "COI expired 2026-04-01").

---

## 3. Re-Onboarding & Renewals

- Expiring documents (COI, license, certifications) trigger a
  push/SMS reminder 30 / 14 / 7 days before expiration.
- An expired artifact downgrades `onboardingStatus` to `blocked` for
  the affected scope, not the whole contractor — the contractor can
  still take jobs that don't require that artifact.
- Re-acknowledgement of a safety rule is required when the rule
  version changes.

---

## 4. W-2 Crew Lead Onboarding

Simplified: identity + phone verification + safety acknowledgements +
tools attestation. No W-9 / COI / license unless the business
configures them as required.
