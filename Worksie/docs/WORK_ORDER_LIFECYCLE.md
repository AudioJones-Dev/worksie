# Worksie — Work Order Lifecycle

The work order is the operational atom. It moves through a state
machine whose transitions are gated by rule satisfaction. Every
transition writes to `auditTrail`.

---

## 1. States

```
draft
  → scheduled
      → en_route
          → on_site
              → in_progress
                  → submitted
                      → approved
                          → invoiced
                              → paid
                      → rejected → in_progress
              → cancelled (from any pre-submit state)
```

`rejected` returns to `in_progress` with admin notes; the contractor
can resubmit after addressing rule failures.

## 2. Transition Gates

| From → To | Gate(s) |
|---|---|
| draft → scheduled | Customer, service template, schedule, assigned contractor(s) present |
| scheduled → en_route | Contractor tap; assigned contractor's `onboardingStatus = ready` for required scope |
| en_route → on_site | Contractor tap; GPS within configurable radius (soft, not blocking offline) |
| on_site → in_progress | All `DocumentationRule` entries with `gate: before_start` satisfied; all applicable `SafetyRule` acks captured |
| in_progress → submitted | Required checklist items done; all `ProofOfWorkRule` entries satisfied; `completionMetrics.unitsCompleted` recorded if pricing model demands it; customer signature if rule requires |
| submitted → approved | Admin review or auto-approve (config); all `DocumentationRule` entries with `gate: before_invoice` satisfied |
| approved → invoiced | Invoice generated (manual or auto per business) |
| invoiced → paid | Payment recorded |
| any pre-submit → cancelled | Admin or contractor with reason |
| submitted → rejected | Admin with reason; surfaces failing rule list to contractor |

## 3. Offline Behavior

A work order is fully runnable offline through `submitted`. The local
client:

1. Hydrates from cache: work order, job configuration (pinned version),
   rules, prior media.
2. Records writes to a local outbox: status transitions, checklist
   ticks, proofs, signatures, safety acks, completion metrics.
3. On reconnect: replays outbox, uploads media (resumable), validates
   rule satisfaction server-side.
4. If server rejects (e.g., stale rule version, missing proof),
   surfaces a fix-up sheet without losing local work.

Status transitions past `submitted` (i.e., `approved`, `invoiced`,
`paid`) require connectivity because they are admin actions made from
the back-office surface.

## 4. Rule Satisfaction Model

For each `JobConfiguration`, the server computes a satisfaction
report on every read of the work order:

```
{
  contractorRequirements: { satisfied: [...], missing: [...] },
  safetyRules:            { satisfied: [...], missing: [...] },
  documentationRules:     { satisfied: [...], missing: [...] },
  proofOfWorkRules:       { satisfied: [...], missing: [...] },
  canTransitionTo:        ["in_progress" | "submitted" | ...]
}
```

The mobile UI binds directly to `canTransitionTo` for primary
actions.

## 5. Versioning

When a work order is created, the `JobConfiguration` version (and
each referenced rule's version) is **pinned** on the work order.
Subsequent edits to the configuration do not retroactively invalidate
satisfied gates. A re-pin requires an explicit admin action and
appears in `auditTrail`.

## 6. Mobile-First UX Notes

- The active work order opens directly to its checklist; the primary
  action ("Mark step done", "Take photo", "Sign", "Submit") is bottom
  thumb-zone, full-width.
- Hazard-driven safety rules show a hazard icon and one-line
  plain-language summary; ack is a single large tap (or signature).
- Camera proofs auto-tag GPS + timestamp + device; the user does not
  enter metadata.
- "Submit" shows a satisfaction summary first ("3 of 3 proofs
  captured ✓") and only then commits.
- A rejected work order opens to a fix-up sheet listing exactly what
  the admin flagged.

## 7. Audit Trail Coverage

Every transition, every proof, every signature, every safety ack,
every admin override is an audit entry. Audit entries include actor,
timestamp, device meta, GPS (when available), and a `before`/`after`
diff for state changes. Audit is append-only and is the source of
truth for payout justification (see `PAYOUT_RULES.md`).
