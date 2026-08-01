# Competitor Review — CompanyCam Engineering Surface

**Companion to:** [`competitor-companycam.md`](./competitor-companycam.md) (which
reviews the *marketed product* surface). This doc reviews the *engineering*
surface: CompanyCam's public repos and live API, and what they reveal about
build priorities, technical debt, and unoccupied ground.

**Review date:** 2026-07-31
**Method:** direct fetch of all 18 public repos in `github.com/CompanyCam`,
the org repo index, the published `openapi.yaml`, and `docs.companycam.com`.

**Worksie sources of truth:** `docs/WORKSIE_SPINE.md`, `docs/PRD.md`,
`docs/DOMAIN_MODEL.md`, `docs/WORK_ORDER_LIFECYCLE.md`,
`docs/OFFLINE_FIRST_ARCHITECTURE.md`, `packages/db/src/schema/tables.ts`,
`packages/domain/src/index.ts`.

## 0. Why repos are a different signal than the marketing site

The features page tells you what CompanyCam *sells*. The repos tell you what
they *fight*. A company open-sources three things: infrastructure it wants
maintained for free, forks of dependencies it was forced to patch, and tools
built to diagnose a problem it could not otherwise see. All three are
diagnostic. The forks and the instrumentation libraries are the honest ones.

## 1. The complete public footprint

The 18 repos under review are CompanyCam's **entire** public org — confirmed
against the org repo index sorted by last update. There is no larger public
codebase behind them.

| Repo | Lang | Origin | State | Last update |
|---|---|---|---|---|
| `background-agents` | TypeScript | fork of `ColeMurray/background-agents` | active | Jul 2026 |
| `react-native-image-cache-hoc` | JavaScript | fork of `billmalarky/…` | active | May 2026 |
| `openapi-spec` | YAML | original | active | May 2026 |
| `companycam-vibe-check` | TS / Kotlin / Swift | original | active | Mar 2026 |
| `h3_ruby` | Ruby | fork of `seanhandley/h3_ruby` | orphaned upstream | Mar 2026 |
| `atlas` | TypeScript | fork of `expo/atlas` | active | Jan 2026 |
| `tiptap-ruby` | Ruby | original | active | Nov 2025 |
| `graphql-searchkick` | Ruby | original | active | Aug 2025 |
| `hellosign-ruby-sdk` | Ruby | fork of `hellosign/…` | **deprecated upstream** | May 2025 |
| `dependaboat` | Ruby | original | active | Feb 2025 |
| `ghx` | Ruby | original | active | Feb 2025 |
| `attr_encrypted` | Ruby | fork of `attr-encrypted/…` | **archived**, upstream seeking maintainer | Feb 2023 |
| `react-native-doc-viewer` | Java / JS | fork of `philipphecht/…` | **archived** | Dec 2022 |
| `react-native-orientation` | Obj-C / JS | fork of `jim-lake/…` | **archived** | Dec 2022 |
| `react-native-rate` | Obj-C / JS | fork of `KjellConnelly/…` | **archived** | Dec 2022 |
| `companycam-dotnet` | C# | original | **archived** | Dec 2022 |
| `fancy-count` | Ruby | original | **archived** | Oct 2021 |
| `react-native-calendar-datepicker` | JavaScript | fork of `vlad-doru/…` | **archived** | Nov 2020 |

**7 of 18 are archived. 10 of 18 are forks.** Only six are original and
maintained: `openapi-spec`, `companycam-vibe-check`, `tiptap-ruby`,
`graphql-searchkick`, `ghx`, `dependaboat` — and three of those six are
internal GitHub-workflow plumbing, not product.

## 2. Inferred stack

Nothing here is guesswork beyond what the dependency graphs state outright.

**Backend — Ruby on Rails monolith.** `attr_encrypted` (ActiveRecord),
`fancy-count` (counter-caches with a Redis adapter), `graphql-searchkick`,
`tiptap-ruby`, `ghx`, `dependaboat`, `hellosign-ruby-sdk`, `h3_ruby`. Eight
Ruby repos and no Go, Elixir, or Java service code.

**API layer — GraphQL internally, REST externally.** `graphql-searchkick`
adapts Searchkick into `GraphQL::Pagination::Connections`, so the internal
app is GraphQL. The public `api.companycam.com/v2` surface is REST. Two
different contracts, which is where spec drift comes from (§4).

**Search — Elasticsearch via Searchkick.** The repo ships a Docker Compose
with Elasticsearch.

**Geospatial — Uber H3 hexagonal indexing.** They bind the H3 C library
through FFI. H3 is for bucketing points into hex cells at scale: territory
rollups, density heatmaps, clustering "how many projects in this area."
Combined with the `geofence` polygon field on Project, geography is a real
part of their model.

**Rich text — TipTap**, with a Ruby library to parse and render TipTap JSON
server-side to HTML, Markdown, and plain text. This is the engine behind
project Notepad and Pages.

**E-sign — HelloSign**, via a fork whose upstream is now deprecated and
which redirects to `dropbox-sign`.

**Mobile — React Native**, not Expo-managed. Every RN fork patches a
*native* module (orientation, doc viewer, rating, image cache).

## 3. The tells — what they built to diagnose their own pain

This is the most useful section. Three active repos exist only to measure
problems.

### 3a. `companycam-vibe-check` — the mobile app is resource-hungry

A first-party native library that reports **battery level, charging state,
low-power mode, network type, cellular generation, metered/expensive
connection, RAM usage percentage, and thermal state**, normalized across iOS
and Android. Their own README says it exists to find performance bottlenecks
and compensate for hardware limits.

You do not build thermal-state telemetry unless devices are thermally
throttling. Read alongside `atlas` (bundle-size analysis, forked from Expo)
and `react-native-image-cache-hoc` (still being patched in 2026), the picture
is consistent and specific: **continuous camera capture plus large-image
upload is burning battery, heating phones, and blowing memory on the
mid-range Android hardware trades actually carry.** They are instrumenting it
rather than having solved it.

### 3b. `atlas` — bundle size is a live problem

Forking Expo's bundle visualizer means someone is on a cold-start or
app-size reduction effort.

### 3c. `dependaboat` + `ghx` — org-scale dependency debt

A purpose-built gem to ferry Dependabot alerts into GitHub Projects, plus a
GitHub API wrapper explicitly described as incomplete and built only to
internal need. This is the tooling of a large, aging codebase with a security
backlog to triage. Corroborated by their own `openapi-spec` issue #19,
"Dependabot Findings," open since March 2024.

### 3d. `background-agents` — the 2026 bet is engineering velocity, not product AI

Their most recently updated repo (Jul 2026), a fork of an open-source
background coding-agent system: Cloudflare Workers + Durable Objects, Modal /
Daytona / Vercel sandboxes, multi-provider models, GitHub and Slack and Linear
entry points, cron and webhook triggers, auto-review on PR open.

The strategic read: **CompanyCam is spending its 2026 innovation budget on
shipping faster, not on new product surface.** Notably, *zero* AI appears in
any product-facing repo. Their AI is inward-facing.

## 4. The real API surface — and a correction

The published `openapi.yaml` is **incomplete and known to be wrong**. Their
own open issue #33 (Jan 2026) says "OpenAPI spec is incorrect for certain
endpoints," and the spec omits the entire webhooks subsystem that the live
docs document. Anything inferred from the YAML alone is unreliable; the
findings below are reconciled against `docs.companycam.com`.

**Endpoints (v2):** `/company`, `/users` (+ `/users/current`), `/projects`
(+ `/archive`, `/restore`, `/notepad`, `/assigned_users`, `/collaborators`,
`/invitations`, `/labels`, `/documents`, `/comments`, `/checklists`,
`/photos`, `/videos`), `/photos` (+ `/tags`, `/comments`), `/checklists`,
`/webhooks`.

**Webhook events:** `project.{created,updated,label_added,contact_created,
contact_updated,merged,archived,deleted}`, `photo.{created,updated,tag_added,
description_updated}`, `comment.created`, `document.{created,updated}`,
`video.{created,updated}`, `todo_list.{created,completed,deleted}`,
`task.completed`, plus `resource.*` and `*` wildcards.

**Delivery semantics:** POST with `{event_type, created_at, payload,
webhook_id}`; HMAC-SHA1 of the body, base64-encoded, in `X-CompanyCam-
Signature`; exponential backoff to 10 attempts; auto-disable after 25
cumulative errors.

**Pagination:** offset (`page`/`per_page`) and cursor (`after`/`before` with
`X-Next-Cursor`, `X-Prev-Cursor`, `X-Has-Next`, `X-Has-Prev`), not mixable.
`modified_since` on list endpoints for incremental sync.

### What is absent from the entire platform

Verified against both the spec and the live docs — no endpoint, schema, or
webhook event exists for any of:

**time tracking · timesheets · payroll · invoices · estimates · payments ·
scheduling · dispatch · work orders · compliance documents · insurance ·
licensing · e-signature.**

The internal naming `todo_list` for checklists is a further tell: checklists
were retrofitted onto a photo model, not designed as a work primitive.

### Two structural weaknesses worth naming

- **The permission model is two-valued.** `user_role` is `standard` or
  `restricted`. There is no role for a subcontractor, a back-office user, or
  a customer. Everything sharper is bolted on through project-level
  `assigned_users`, `collaborators`, and `invitations`.
- **Document upload is base64 with a 30 MB ceiling** — no resumable or
  multipart path. On the flaky rural LTE their users work under, a 25 MB
  document upload that fails at 90% starts over.

## 5. What this means for Worksie

Worksie's schema already occupies most of the vacant ground. This scrape
raises confidence in the existing bets and changes the priority order of two
roadmap items.

### 5a. Confirmed — Worksie's differentiators sit on empty ground

CompanyCam has no platform primitive for compliance-gated dispatch, payout,
or server-validated work-order state. This is not a roadmap they are quietly
executing; there is no substrate for it. `service_definitions`,
`contractor_documents.{status,expires_on}`, `safety_acknowledgements`,
`payout_periods` / `payout_lines`, and the ten-state lifecycle in
`WORK_ORDER_LIFECYCLE.md` have no counterpart anywhere in their surface.

Their checklists fire `task.completed` as a notification. Worksie's checklist
steps **gate** `in_progress → awaiting_signoff` server-side. Same word,
different category of object.

### 5b. Enhancement — copy the webhook contract, it is a finished design

The prior review recommended outbound webhooks on `work_order_events` as the
cheap answer to integrations. That is right, and CompanyCam has now published
a battle-tested contract to copy outright: signed payloads, exponential
backoff to 10 attempts, auto-disable at 25 errors, `{event_type, created_at,
payload, webhook_id}` envelope, cursor pagination with `modified_since` for
replay.

Two improvements to make while copying it:

1. **Use HMAC-SHA256, not SHA1.** Theirs is a legacy choice.
2. **`work_order_events` is already append-only**, so Worksie can offer
   *replayable* event delivery from the audit log — redeliver from a cursor
   after an outage. CompanyCam cannot; their events are fire-and-forget and a
   disabled webhook loses the window permanently.

That is a genuine platform advantage that falls out of a schema decision
already made, at close to zero additional cost.

### 5c. Enhancement — raise upload resilience from "planned" to "marketed"

`OFFLINE_FIRST_ARCHITECTURE.md` already specifies a resumable upload queue.
Against a competitor capped at 30 MB base64 with no resume, that stops being
an implementation detail and becomes a demo: kill the network mid-upload,
walk out of range, come back, watch it finish.

### 5d. Enhancement — device-cost as a competitive axis

`companycam-vibe-check` is CompanyCam admitting, in public, that the field
device pays a heavy price. A phone that dies at 2pm is a real complaint from
real crews, and it is the kind of thing an operator switches over.

Worksie's mobile app is still a scaffold — which means the cheap wins are
still available: capture-time compression before queueing, deferring uploads
to unmetered networks (their own library reads `isConnectionExpensive`, so
the signal is standard), and batching writes. Worth writing into
`OFFLINE_FIRST_ARCHITECTURE.md` as an explicit budget when the mobile slice
lands, rather than discovering it later and having to build telemetry to
chase it.

### 5e. Re-prioritized — tags move up

The prior review ranked tags fourth among real gaps. CompanyCam ships **two**
taxonomy systems — `tags` on photos and `labels` on projects — with dedicated
endpoints and webhook events for both. Two systems means it earned its own
model, twice. For Worksie the back-office query ("every job that had a
load-bearing exposure photo") is the same shape, and a polymorphic
`tags` table scoped by `tenant_id` remains the right answer.

### 5f. Re-prioritized — e-sign moves up, and the vendor choice is now obvious

`customer_signoffs` is a signature capture, not a legally-executed document.
`docs/roadmap/DOCUMENTS_AND_ESIGN.md` covers the wider intent. CompanyCam's
only e-sign path is a fork of a **deprecated** HelloSign SDK whose upstream
redirects to `dropbox-sign` — an unmaintained integration, not a product
capability. Real e-sign on subcontractor agreements and change orders is
open ground, and their abandoned fork tells you which vendor path not to
repeat.

### 5g. Watch, do not copy — H3

Their H3 dependency is orphaned upstream ("LOOKING FOR A NEW MAINTAINER").
Hex indexing solves territory density and clustering at scale. Worksie's
dispatch problem is nearer-term and smaller — *which qualified, compliant
contractor is closest to this work order* — which PostGIS answers directly on
Supabase. Note H3 as a Phase-N+ concern if territory analytics ever matter;
do not take on an orphaned native binding now.

## 6. What not to do

- **Do not read the archived RN forks as a stack recommendation.** They are
  2020–2022 artifacts of unmanaged React Native. Worksie is on Expo, which
  is why most of those forks would never have been needed.
- **Do not chase `background-agents`.** It is internal developer
  infrastructure. Forking it would be adopting a competitor's engineering
  process as product scope.
- **Do not treat the published `openapi.yaml` as authoritative** in any
  future comparison. It is stale by their own admission.
- **Do not let any of this pull work forward of Phase 3.** Everything in §5
  is roadmap input. The auth, RLS, and tenancy boundary lands first.

## 7. Confidence

| Finding | Confidence | Basis |
|---|---|---|
| Full public repo list, archive/fork state, languages | High | Org index + each repo page |
| Rails / GraphQL / Elasticsearch / TipTap / H3 stack | High | Stated dependencies |
| Live endpoint and webhook-event inventory | High | `docs.companycam.com` |
| Absence of payout/dispatch/compliance/time/e-sign | High | Spec + live docs, both checked |
| Mobile resource pressure | Medium-High | Inferred from three repos, consistent; not confirmed by first-party statement |
| Per-repo last-commit dates | Medium | Org "Updated" timestamps, not commit SHAs |
| Full checklist/task schema properties | Low — not obtained | `components/schemas` truncated on fetch |

### 7a. Provenance for the four contested claims

A parallel review ([PR #40](https://github.com/AudioJones-Dev/worksie/pull/40))
could not reproduce four claims below and carried them as *Unconfirmed*. Each
came from a specific primary source in this review's extraction pass; recorded
here so they can be promoted or refuted without re-deriving them.

| Claim | Source | Verbatim basis |
|---|---|---|
| `todo_list.*` / `task.*` / `*` wildcard events | [Webhooks](https://docs.companycam.com/docs/webhooks-1) | Subscribable list includes `todo_list.{created,completed,deleted}`, `task.completed`, per-resource `resource.*`, and a bare `*` |
| `user_role` is two-valued | `openapi.yaml`, User schema | "User role assignment: `standard` or `restricted`" |
| Document upload 30 MB, base64 | `openapi.yaml`, Document schema | `attachment` documented as base64 with a 30 MB limit |
| Dual pagination, not mixable | `openapi.yaml`, list params | Offset (`page`/`per_page`) and cursor (`after`/`before`) with `X-Next-Cursor`, `X-Prev-Cursor`, `X-Has-Next`, `X-Has-Prev`; photo listing supports both but they cannot be combined |

Caveat that applies to three of the four: they were read from `openapi.yaml`,
which §4 establishes is stale and known-wrong. They are accurate reports *of
the spec*; whether the live API still matches is a separate question, and the
`user_role` and upload-ceiling claims in particular are worth re-checking
against `docs.companycam.com` before either is used in positioning. The
webhook-event claim is the strongest of the four — it came from the live docs,
not the spec.

## 8. Sources

**Repos (all 18):** [`background-agents`](https://github.com/CompanyCam/background-agents) ·
[`react-native-image-cache-hoc`](https://github.com/CompanyCam/react-native-image-cache-hoc) ·
[`openapi-spec`](https://github.com/CompanyCam/openapi-spec) ·
[`companycam-vibe-check`](https://github.com/CompanyCam/companycam-vibe-check) ·
[`h3_ruby`](https://github.com/CompanyCam/h3_ruby) ·
[`atlas`](https://github.com/CompanyCam/atlas) ·
[`tiptap-ruby`](https://github.com/CompanyCam/tiptap-ruby) ·
[`graphql-searchkick`](https://github.com/CompanyCam/graphql-searchkick) ·
[`hellosign-ruby-sdk`](https://github.com/CompanyCam/hellosign-ruby-sdk) ·
[`dependaboat`](https://github.com/CompanyCam/dependaboat) ·
[`ghx`](https://github.com/CompanyCam/ghx) ·
[`attr_encrypted`](https://github.com/CompanyCam/attr_encrypted) ·
[`react-native-doc-viewer`](https://github.com/CompanyCam/react-native-doc-viewer) ·
[`react-native-orientation`](https://github.com/CompanyCam/react-native-orientation) ·
[`react-native-rate`](https://github.com/CompanyCam/react-native-rate) ·
[`companycam-dotnet`](https://github.com/CompanyCam/companycam-dotnet) ·
[`fancy-count`](https://github.com/CompanyCam/fancy-count) ·
[`react-native-calendar-datepicker`](https://github.com/CompanyCam/react-native-calendar-datepicker)

**Org + API:**
[CompanyCam org repositories](https://github.com/orgs/CompanyCam/repositories?type=all&sort=updated) ·
[`openapi.yaml`](https://raw.githubusercontent.com/CompanyCam/openapi-spec/main/openapi.yaml) ·
[openapi-spec issues](https://github.com/CompanyCam/openapi-spec/issues) ·
[Core API overview](https://docs.companycam.com/docs/overview-1) ·
[Webhooks](https://docs.companycam.com/docs/webhooks-1)

**Worksie:** `docs/WORKSIE_SPINE.md`, `docs/PRD.md`, `docs/DOMAIN_MODEL.md`,
`docs/WORK_ORDER_LIFECYCLE.md`, `docs/OFFLINE_FIRST_ARCHITECTURE.md`,
`docs/roadmap/DOCUMENTS_AND_ESIGN.md`, `packages/db/src/schema/tables.ts`,
`packages/domain/src/index.ts`.
