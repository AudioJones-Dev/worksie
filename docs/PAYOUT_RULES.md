# Payout Rules

How completed work becomes a payout. Pairs with `DOMAIN_MODEL.md` (entities)
and `WORK_ORDER_LIFECYCLE.md` (when a work order is eligible).

## Default Payout Cadence

- Period: weekly, Monday 00:00 → Sunday 23:59 local tenant time.
- Cutoff: Sunday 23:59 local.
- Paid on: following Monday.
- Status flow: `open` → `draft` → `approved` → `paid`.

Tenants may override cadence in v1 (e.g. biweekly), but Mon–Sun → Mon
payout is the default and the reference domain assumes it.

## Payout Modes

A Payout Rule selects one mode:

### `piece_rate`
- Pay is `sum(line_item.quantity * line_item.piece_rate_amount)` for
  every Work Order Line Item completed in the period for that
  contractor.
- Rate table lives on the Payout Rule. Rates can vary by service
  definition, by line item type, by region.

### `completion_flat`
- Pay is a flat amount per completed Work Order, regardless of line
  items.
- Rate table on the Payout Rule resolves the flat amount per service
  definition.

### `hourly_capped`
- Pay is `hours_logged * hourly_rate`, capped by a per-work-order
  ceiling.
- Hours come from start/finish timestamps on the Work Order, not from
  free-form time entries.
- Reserved for cases the reference domain does not lean on; included for
  completeness.

A Service Definition declares its `default_payout_rule_id`. A Work Order
freezes the rule into `service_snapshot_json` at creation, so retroactive
rate changes do not rewrite earlier payouts.

## Period Build

When the cutoff fires:

1. Open a fresh Payout Period in `open`.
2. For every Work Order where:
   - state ∈ {`completed`, `invoiced`} (configurable; default
     `invoiced` to require back-office review first),
   - completion timestamp falls within `[period_start, period_end]`,
   - no existing Payout Line points at it,
   resolve the snapshot rule and emit `PayoutLine` rows.
3. Move the Payout Period to `draft`.
4. Notify operator / back office to review.

## Approval

`draft → approved` is an explicit operator action. Approval is a
two-step in v1: a reviewer marks the draft as reviewed, an approver
approves. (Tenants with one person can collapse these by having the same
account hold both roles, but the system records both actions.)

`approved → paid` happens when the payment mechanism reports settled.
In v1 without Stripe Connect, this is a manual mark by the operator
after running their payment process (ACH, Zelle, paper check, etc.).
When Stripe Connect lands, the transition is driven by Stripe webhooks.

## Corrections

Payout history is append-only:

- A line that should not have been paid: emit a reversing
  `PayoutLine` in the next period referencing the original line.
- A line that was undercounted: emit a positive adjustment line
  referencing the work order and the original line.
- The original line is never edited or deleted.

This keeps the audit trail honest and 1099 totals reproducible.

## 1099 Reporting

For each contractor in each tax year, total payouts = sum of all
`amount` on `PayoutLine` rows whose `PayoutPeriod.paid_on` falls in
that calendar year. Reversals carry negative `amount` and reduce the
year-end total naturally.

Worksie does not file 1099s in v1. It produces the totals and a
per-contractor export the operator hands to their accountant.

## Edge Cases

- **Work order completed but document expires retroactively.** Payout
  is still emitted; gating happens at *dispatch*, not at payout.
- **Work order voided after `invoiced`.** A reversing line is emitted
  on the next period.
- **Contractor leaves before payout.** Pay still owed. The Payout Line
  is emitted normally. Membership status going to `suspended` does
  not erase pay history.
- **Tenant changes payout rule.** Old work orders pay at the snapshot
  rate. New work orders pay at the new rate. No retroactive rewrite.
