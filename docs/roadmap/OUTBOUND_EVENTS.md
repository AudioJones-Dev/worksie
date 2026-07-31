# Outbound Events (Roadmap / Spec)

> **Status: Roadmap only.** This document is a future-domain
> specification. It does **not** alter the canonical ontology
> (`docs/DOMAIN_MODEL.md`), the Drizzle schema (`packages/db`),
> RLS, or the work order lifecycle. New entities listed here
> require an ontology-review PR before any schema work begins.
>
> Target phase mapping: **unsequenced.** Priority depends on the pilot
> scenario decision (`WORKSIE_GTM_PROJECT_PLAN.md` backlog #5, a Hold
> Gate).

## Purpose

Let a tenant subscribe to their own work-order events over HTTP.

Every webhook currently on the Worksie roadmap is **inbound** — a provider
telling Worksie something happened:

| Doc | Inbound webhook |
|---|---|
| `DOCUMENTS_AND_ESIGN.md` | e-sign provider → envelope executed |
| `PAYOUT_AND_MARGIN.md` §7.1 | Stripe Connect → `approved` → `paid` |
| `LGA_MODEL.md` | Angi / Thumbtack / HomeAdvisor → lead intake |

Nothing goes the other way. This spec covers the outbound direction only.

## Core Principle

**One event stream beats fifty connectors.**

`WorkOrderEvent` is already append-only by database trigger (Hard Rule #5,
enforced by `work_order_events_block_update` / `_block_delete` in migration
`0001`). It is an event log with nothing subscribed to it.

That is the cheapest possible integration surface: the hard part — a durable,
ordered, immutable record of everything that happened to a work order — is
built and enforced. What is missing is delivery.

## Competitive note

CompanyCam ships exactly four fields on their `Webhook` object: `url`,
`scopes[]`, `token`, `enabled`. That is the entire design, and it is enough to
support their integration ecosystem. Their `ProjectIntegration` object
(`{type: "JobNimbus", relation_id: "123"}`) shows the strategic position it
buys them — and its limit: their Project carries a foreign key *into someone
else's job object*, because the canonical job lives in the other system.

Worksie owns the work order. Emitting events from a system of record is a
different and stronger position than syncing into one.

See `docs/reviews/competitor-companycam-engineering.md` §4 and §5b.

## Proposed entities

### `WebhookSubscription`

- `id`, `tenant_id`
- `url`
- `scopes` — array of event selectors, e.g. `work_order.dispatched`,
  `work_order.*`
- `signing_secret` — HMAC key for the request-body signature
- `enabled`
- `created_at`, `updated_at`

Tenant-scoped like every other row (Hard Rule #1). RLS applies unchanged.

### `WebhookDelivery`

- `id`, `tenant_id`, `subscription_id`
- `work_order_event_id` — the source row
- `attempt`, `status`, `response_code`, `delivered_at`, `next_retry_at`

Separate from the subscription so retry state never mutates configuration, and
so delivery history is queryable when a tenant asks "did you send it?"

## Delivery semantics

- **At-least-once, not exactly-once.** Consumers must be idempotent. State the
  guarantee explicitly rather than implying stronger delivery than a retry
  queue can provide.
- **Signed bodies.** HMAC-SHA256 over the raw request body, secret per
  subscription. `DOCUMENTS_AND_ESIGN.md` Architecture Risk #4 already names the
  inbound version of this danger: *"A spoofed `executed` event would flip a
  downstream gate falsely."* The outbound direction owes subscribers the same
  protection in reverse.
- **Ordered per work order, not globally.** Global ordering across tenants is
  not worth the coordination cost.
- **Replay.** Because `work_order_events` is append-only and permanent, a
  subscriber that was down can be replayed from any point. This is a property
  the existing schema already provides for free.

## Open questions

- Does emission run in-transaction with the state change, or from an outbox
  poller? In-transaction risks the HTTP call blocking a state transition;
  an outbox is more moving parts. Recommend **outbox** — a work order
  transition must never fail because a tenant's endpoint is slow.
- Do artifact inserts emit events, or only state transitions?
  `work_order_events` only records transitions today, and it has no
  `event_type` or payload column — so artifact events would need either a
  schema change or a second source. Worth deciding before, not after.
- Per-tenant rate limits and endpoint failure suspension.

## Dependencies

- No new capability needed from Phase 3.5; this rides on `work_order_events`
  as it already exists.
- Needs a server runtime to deliver from. There are currently no API routes
  beyond `/healthz` and no Supabase edge functions, so this is blocked on that
  regardless of priority.

## Explicitly not in this spec

- Inbound webhooks — owned by `DOCUMENTS_AND_ESIGN.md`,
  `PAYOUT_AND_MARGIN.md`, and `LGA_MODEL.md`.
- Direct per-vendor connectors (QuickBooks, Xero). Those remain a separate
  document per `PAYOUT_AND_MARGIN.md`.
- A public read REST API. Emitting events and exposing a query surface are
  separate decisions.
