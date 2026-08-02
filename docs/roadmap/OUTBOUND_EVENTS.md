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

Tenant RLS grants tenant *members* read access. A member who can read the HMAC
key can forge a signed delivery — to their own endpoint, and to any other
endpoint that trusts the same key. The signature would then prove nothing.

- The key lives in a **server-only secret store**, or encrypted with a key the
  tenant role cannot reach. The table holds a reference, never the material.
- **No RLS policy grants any tenant role read access to the key.** Only the
  delivery worker resolves it.
- The key is shown to the operator **once, at creation**. Rotation issues a new
  one rather than revealing the old.

#### Rotation needs two live keys, so model both

An overlap window means two keys are valid at once, which a single reference
cannot express. Rotation state belongs in its own rows:

`WebhookSigningKey` — `id`, `tenant_id`, `subscription_id`, `secret_ref`,
`status` ∈ {`active`, `retiring`, `revoked`}, `activated_at`, `retires_at`.

- Exactly one `active` key per subscription; at most one `retiring`.
- During overlap the delivery carries **two signature headers**, one per key,
  rather than one ambiguous header. A subscriber that has adopted the new key
  validates against it; one that has not still validates against the old. A
  single header would force the subscriber to guess which key signed it.
- `retires_at` is enforced by the worker, not by convention — a `retiring` key
  stops signing at that timestamp whether or not the subscriber acted.
- Revocation is immediate and skips the overlap: it is for compromise, not
  scheduled rotation.

#### Destination URLs must be constrained

`url` is tenant-controlled and the delivery worker makes server-side HTTP
requests from inside our network. Unconstrained, that is a straightforward
SSRF path into internal services and the cloud metadata endpoint.

Requirements, all enforced at delivery time and not only at registration:

- **HTTPS only.** No `http:`, no non-HTTP schemes.
- **Every resolved address must pass, and the connection must go to a
  validated address.** Resolve the hostname, check *all* A and AAAA results
  against the deny policy, then connect to one of the addresses that passed —
  via a pinned-address dial or a resolver the HTTP client cannot bypass.
  Validating the name and then letting the client resolve again on connect is
  the rebinding hole: the second resolution can return a different address.
- **Deny list, applied to resolved addresses:** RFC 1918, loopback,
  link-local including `169.254.169.254`, unique-local IPv6 (`fc00::/7`),
  carrier-grade NAT (`100.64.0.0/10`), reserved, unspecified, multicast, and
  IPv4-mapped IPv6 (`::ffff:0:0/96`) — the last because it otherwise smuggles
  a private v4 address past a v6 check.
- **Redirects get the same treatment or are disabled.** A redirect is a new
  request to a new host; validating only the original defeats the whole check.
- Connect and total-request timeouts, and a response-size cap. The worker reads
  only the status code.

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

> **Neither ordering nor replay is free.** `work_order_events` being
> append-only makes them *achievable*, not true. Two gaps:
>
> - **`at` is a timestamp, and timestamps tie.** Two events in the same
>   transaction or clock tick have no defined order. Append-only guarantees
>   rows are never destroyed; it guarantees nothing about sequence.
> - **Retries reorder delivery.** Attempt 3 of event *N* lands after attempt 1
>   of *N+1*. Ordered *storage* is not ordered *delivery*.
>
> What they require:
>
> - **A monotonic per-work-order sequence** on `work_order_events`, allocated
>   **inside the same transaction as the state change** and enforced by a
>   `unique (tenant_id, work_order_id, sequence)` constraint. Assigning it
>   outside the transaction reintroduces the tie under concurrent transitions.
>   A schema addition, **not** in the Phase 3.5 columns.
> - **Gaps are possible and consumers must tolerate them.** A transaction that
>   allocates a sequence and then rolls back burns the number. A consumer must
>   treat a gap as "nothing to fetch," not as data loss — otherwise every
>   rollback looks like an outage.
> - **A stable event ID in the signed payload**, so a consumer deduplicates
>   under at-least-once delivery without trusting order.
> - **A per-work-order acknowledgement watermark**, not one cursor on the
>   subscription. Each work order has its own sequence, so a single
>   "last acknowledged" number cannot represent progress across many of them.
>   Store `(subscription_id, work_order_id) → contiguous watermark`; replay
>   resumes per work order from its own watermark.
> - **A dispatch barrier per work order** — do not deliver *N+1* until *N*
>   succeeds or exhausts retries — **or** accept out-of-order delivery and say
>   so in the contract. Both are defensible; documenting the first while doing
>   the second is not.
>
> Until that lands the honest claim is durable, replayable **storage**, with
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
