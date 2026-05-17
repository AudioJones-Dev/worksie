# Worksie — Payout Rules

How contractor compensation is computed, accrued into cycles, and
released. Built for piece-rate and completion-based field work.

---

## 1. Pricing Models

Every `PayoutRule` selects one:

| Model | Unit | Total formula |
|---|---|---|
| `piece_rate` | unit-of-work (e.g., `ramp_foot`) | `unitsCompleted * unitRate` |
| `flat` | per work order | `unitRate` (qty 1) |
| `hourly` | hour | `hoursLogged * unitRate` |
| `completion` | per completed milestone in the job configuration | sum of milestone rates |

`PayoutRule` is bound to a `JobConfiguration`. A service template
can have different payout rules across its job configurations (e.g.,
"standard" vs. "expedited" variant).

## 2. Cycles

Default cycle: **`weekly_mon_for_prior_week`**.

- Period: Monday 00:00 → Sunday 23:59 in the **business timezone**.
- Payout date: the following **Monday**.
- Eligibility cutoff: work order must be in `approved` state by
  Sunday 23:59 business-local time.
- Computation timing: cycle is **computed** at cutoff
  (status: `computed`).
- Release timing: cycle is **released** by an admin action
  (status: `released`). v1 does not auto-release; payout *release*
  is a manual gate until audit rules are stable.

Per-business overrides allowed:
- `weekly_fri_for_prior_week`
- `biweekly_mon`
- `semimonthly_15_and_last`
- `monthly_first`

## 3. Eligibility

A work order contributes to a contractor's payout for the cycle if:

1. The work order's `assigned.contractorIds` includes the contractor
   (split rules per §5 apply when more than one).
2. Status reached `approved` on or before the cutoff.
3. The work order's pinned `PayoutRule` has not been superseded by
   admin override after `submitted`.
4. The contractor's `ContractorProfile` was `ready` at `submitted`
   time (this is recorded on the audit trail; later expirations do
   not retroactively disqualify).

## 4. Holdbacks & Deductions

Configurable per `PayoutRule`:

- Callback chargeback (a returned-defect work order can debit a prior
  cycle's payout — generates a negative payout line item in the
  current cycle with a reason and a link to the originating work
  order).
- Tool/material advance recoupment.
- Custom deductions added by admin (every deduction appears in the
  audit trail with a reason).

## 5. Splits (multiple contractors on one work order)

A work order with multiple `assigned.contractorIds` splits the payout
per the `JobConfiguration.payoutSplit` policy (default: equal split
among the assigned, with the lead contractor's share configurable).
The split is recorded as separate `payoutLineItems` per contractor.

## 6. Invoicing vs. Payout

These are **independent ledgers**:

- The **invoice** is what the customer owes the business. It pulls
  line items from approved work orders using `ServiceTemplate`
  pricing.
- The **payout** is what the business owes the contractor. It pulls
  line items from approved work orders using `PayoutRule` pricing.

A single work order produces (typically) one invoice line item and
one (or more, when split) payout line items. They are independently
auditable and can diverge (e.g., a discount on the invoice does not
reduce the payout unless a deduction rule says so).

## 7. Audit Justification

Every payout line item is traceable to:
- the work order,
- the pinned `PayoutRule` version,
- the `completionMetrics` recorded at submit,
- the approval event,
- the cycle in which it accrued.

A weekly payout report is reproducible from the audit trail with zero
manual reconciliation for a clean week. Any admin override or
deduction adjustment appears as its own audit entry referencing the
original.

## 8. Out of Scope (v1)

- Automatic bank transfer (Stripe Connect / ACH integration is a
  Phase 4+ decision; see PRD §13).
- Tax withholding for 1099s (out of scope; flagged in audit only).
- Multi-currency payouts (single currency per business in v1).
- Marketplace-style bidding / dynamic pricing.

## 9. Reference (Florida Ramp & Lift)

| Service | Pricing Model | Unit | Example Rate |
|---|---|---|---|
| EZ-ACCESS Ramp Install | `piece_rate` | `ramp_foot` | $45.00 |
| EZ-ACCESS Steps Install | `flat` | install | $150.00 |
| Ramp Recovery / Removal | `flat` | install | $200.00 |
| Bruno Stair Lift Install | `flat` | install | $450.00 |
| Harmar Stair Lift Install | `flat` | install | $450.00 |
| Complete Access Vertical Lift Install | `flat` | install | $900.00 |
| Red Team Vertical Lift Install | `flat` | install | $900.00 |
| Harmar Vehicle Lift Install | `flat` | install | $350.00 |
| Mobile Home Skirting Install | `piece_rate` | `linear_foot` | $9.50 |
| Skirt Removal | `flat` | install | $175.00 |
| Hurricane Tie-Down | `piece_rate` | `tie_down` | $35.00 |

Rates above are placeholders for documentation. Real rates are
configured per business in `PayoutRule.rate`.
