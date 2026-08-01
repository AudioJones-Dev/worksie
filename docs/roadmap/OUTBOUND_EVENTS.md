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

**CompanyCam already has a mature outbound webhook system.** Do not plan
against the assumption that this is unclaimed ground.

Their published `openapi.yaml` shows only a four-field `Webhook` object and
`/webhooks` CRUD, which badly understates it — `Webhook.scopes` is typed as a
bare `array of string` with no enumerated events. The spec is also demonstrably
unreliable: their repository carries three open correctness issues against it
(#33, 2026-01-13; #35, 2026-03-03; #28, open since 2025-06-05).

Read from their live documentation at `docs.companycam.com/docs/webhooks-1`
on 2026-07-31:

- **17 events**: `project.{created, updated, archived, deleted, merged,
  label_*, contact_*}`, `photo.{created, updated, description_*, tag_*}`,
  `comment.created`, `document.{created, updated}`, `video.{created, updated}`,
  `task.completed`
- **Retries**: any non-200 response retries with exponential backoff to a
  maximum of 10 attempts
- **Auto-disable**: a webhook whose cumulative error count exceeds 25 is
  disabled; the counter resets on each success
- **Signing**: base64-encoded HMAC of the raw request body in an
  `X-CompanyCam-Signature` header, keyed on the subscription's `token`

Two things follow, and neither is "they have not done this."

**First, the real differentiator is what the events carry, not that they
exist.** Every one of their 17 events is CRUD on a photo, a project, a
document, or a comment. There is no state-transition event because there is
no state machine — `Project.status` is `active | deleted`. A subscriber can
learn that a photo was uploaded; it cannot learn that a job was dispatched,
that a compliance document expired, or that a payout period closed, because
those objects do not exist. Worksie's `WorkOrderEvent` stream is a
work-state feed. Theirs is a media feed. That distinction is the argument,
and it survives their maturity.

**Second, their signing algorithm is SHA-1.** This spec proposes HMAC-SHA256
below; that is a deliberate improvement, not an oversight, and it is worth
saying so when the comparison comes up.

Their `ProjectIntegration` object (`{type: "JobNimbus", relation_id: "123"}`)
still shows the strategic limit: their Project carries a foreign key *into
someone else's job object*, because the canonical job lives in the other
system. Worksie owns the work order. Emitting events from a system of record
is a different and stronger position than emitting them from a satellite.

See `docs/reviews/competitor-companycam-engineering.md` §4 (verified event catalogue and delivery semantics), §5 (the peripheral thesis), and §6b.

## Proposed entities

### `WebhookSubscription`

- `id`, `tenant_id`
- `url` — **constrained; see below**
- `scopes` — array of event selectors, e.g. `work_order.dispatched`,
  `work_order.*`
- `signing_secret_ref` — **a reference, never the key itself**
- `enabled`
- `created_at`, `updated_at`

Tenant-scoped like every other row (Hard Rule #1), but **RLS alone is not
sufficient here** — see both constraints below.

#### The signing key must not be tenant-readable

An earlier draft of this document put a `signing_secret` column on this table
and said "RLS applies unchanged." That was wrong and would have defeated the
signature it exists to provide.

Tenant RLS grants tenant *members* read access. A member who can read the HMAC
key can forge a signed delivery — to their own endpoint, and to any other
endpoint that trusts the same key. The signature would then prove nothing.

Requirements:

- The key lives in a **server-only secret store**, or encrypted with a key the
  tenant role cannot reach. The table holds a reference, not the material.
- **No RLS policy grants any tenant role read access to the key.** Only the
  delivery worker resolves it.
- The key is shown to the operator **once, at creation**, and is not readable
  afterwards — rotation issues a new one rather than revealing the old.
- Rotation and revocation are defined operations, with an overlap window so a
  subscriber can adopt the new key before the old stops signing.

#### Destination URLs must be constrained

`url` is tenant-controlled and the delivery worker makes server-side HTTP
requests from inside our network. Unconstrained, that is a straightforward
SSRF path into internal services and the cloud metadata endpoint.

Requirements, all enforced at delivery time and not only at registration:

- **HTTPS only.** No `http:`, no non-HTTP schemes.
- **Resolve then check.** Reject RFC 1918 ranges, loopback, link-local
  (including `169.254.169.254`), unique-local IPv6, and `.internal`-style
  names. Checking the hostname before resolution is not enough.
- **Re-check after DNS resolution and on every redirect**, or disable
  redirects entirely. A name that resolved publicly at registration can
  resolve privately later — that is DNS rebinding, and it is the reason
  registration-time validation alone fails.
- Connect and total-request timeouts, and a response-size cap. The worker
  reads only the status code.

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
- **Replay** from an explicit cursor, for a subscriber that was down.

> **Neither ordering nor replay is free today, and an earlier draft claimed
> both were.** `work_order_events` being append-only makes them *achievable*;
> it does not make them true. Two gaps:
>
> - **`at` is a timestamp, and timestamps tie.** Two events written in the same
>   transaction or the same clock tick have no defined order. Append-only
>   guarantees rows are never destroyed; it guarantees nothing about sequence.
> - **Retries reorder delivery.** Attempt 3 of event *N* can easily land after
>   attempt 1 of event *N+1*. Ordered *storage* is not ordered *delivery*.
>
> What ordering and replay actually require:
>
> - A **monotonic per-work-order sequence number** on `work_order_events`,
>   assigned server-side, that a consumer can use to detect a gap. This is a
>   schema addition and is **not** in the Phase 3.5 columns.
> - A **stable event ID inside the signed payload**, so a consumer can
>   deduplicate under at-least-once delivery without trusting delivery order.
> - An explicit **replay cursor** on the subscription — last sequence
>   acknowledged — rather than "replay from any point," which is not a
>   defined operation.
> - A **dispatch barrier per work order**: do not deliver *N+1* until *N* has
>   succeeded or exhausted retries, or accept out-of-order delivery and say so
>   plainly in the contract. Both are defensible; silently doing the second
>   while documenting the first is not.
>
> Until that lands, the honest claim is: durable, replayable **storage**, with
> delivery ordering undefined.

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
