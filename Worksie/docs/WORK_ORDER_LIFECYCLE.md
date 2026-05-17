# Work Order Lifecycle

States, legal transitions, and proof-of-work gates. The server is
authoritative — mobile clients may *propose* a transition, but the server
validates it.

## States

```
draft
  └── scheduled
        └── dispatched
              └── in_progress
                    └── awaiting_signoff
                          └── completed
                                └── invoiced
                                      └── paid_out

cancelled  (terminal; reachable from draft|scheduled|dispatched)
voided     (terminal; reachable from completed|invoiced before paid_out)
```

`paid_out` is the final positive terminal state.

## Transitions

| From               | To                  | Trigger / Required                                                                                       |
|--------------------|---------------------|----------------------------------------------------------------------------------------------------------|
| `draft`            | `scheduled`         | `scheduled_for` set; required fields present.                                                            |
| `scheduled`        | `dispatched`        | `assigned_contractor_membership_id` set; **compliance gate green** for assigned contractor for this service. |
| `dispatched`       | `in_progress`       | Contractor starts work in mobile app.                                                                    |
| `in_progress`      | `awaiting_signoff`  | All required checklist steps complete; all required proof-of-work artifacts present.                     |
| `awaiting_signoff` | `completed`         | Customer sign-off captured (if Service Definition requires one). Otherwise transitions directly.         |
| `completed`        | `invoiced`          | Back office reviews and confirms; payout lines computed.                                                 |
| `invoiced`         | `paid_out`          | Payout period containing this work order is `paid`.                                                      |
| `draft|scheduled|dispatched` | `cancelled` | Operator action with reason.                                                                             |
| `completed|invoiced` | `voided`          | Back office action with reason; payout lines reversed if any.                                            |

## Required at Each Step (server-validated)

### To leave `scheduled` (i.e. dispatch)
- Assigned contractor exists.
- Compliance gate green (see `ONBOARDING_FLOWS.md`).
- Work order's snapshot of required gear/docs/safety matches the service
  definition at creation time.

### To leave `in_progress` (i.e. mark ready for sign-off)
- Bound Checklist Instance: every step has `completed_at`.
- Every step flagged "photo required" has at least one linked
  `ProofOfWorkArtifact` of kind `photo`.
- Every step flagged "signature required" has at least one linked
  `signature` artifact.
- GPS captured at start and at finish.

### To leave `awaiting_signoff`
- If Service Definition requires customer sign-off:
  `CustomerSignoff` row exists for this work order.
- Otherwise: no additional requirement.

### To leave `completed` (i.e. invoice)
- All Work Order Line Items have `completed_at`.
- Payout rule references resolve to amounts on every line item.

### To enter `paid_out`
- All Payout Lines for this work order belong to a `PayoutPeriod` with
  status `paid`.

## What Mobile May Propose

Mobile can propose:
- `dispatched → in_progress`
- `in_progress → awaiting_signoff`
- `awaiting_signoff → completed` (only by capturing the sign-off row)
- Field updates on line items (`quantity`, `completed_at`).
- Inserts of `ProofOfWorkArtifact`, `CustomerSignoff`.

Mobile may **not** propose:
- Any state change to `invoiced`, `paid_out`, `cancelled`, `voided`.
- Reassignment.
- Edits to `service_snapshot_json`.

## Audit Trail

Every state change writes an immutable `WorkOrderEvent` row:
- `work_order_id`, `from_state`, `to_state`, `actor`, `at`,
  `reason` (nullable), `source` ∈ {`web_admin`, `mobile`, `system`}.

Audit rows are append-only and survive voids and cancellations.

## Field Reconciliation

When mobile syncs an `in_progress → awaiting_signoff` proposal but the
server detects the work order has been `cancelled`, the proposal is
rejected. The mobile client surfaces this to the contractor as
"This job was cancelled — please contact dispatch", without dropping the
captured proof-of-work. The artifacts remain in storage tagged to the
(now cancelled) work order for audit.
