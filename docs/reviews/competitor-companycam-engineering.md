# Competitor Review — CompanyCam Engineering Surface

**Companion to:** [`competitor-companycam.md`](./competitor-companycam.md), which
reviews the *marketed product* surface. This document reviews the *engineering*
surface: CompanyCam's public repositories and live API, and what they reveal
about build priorities, technical debt, and unoccupied ground.

**Review date:** 2026-07-31
**Method:** all 18 public repos in `github.com/CompanyCam` via the GitHub API,
the published `openapi.yaml`, the `openapi-spec` issue tracker, and
`docs.companycam.com`.

**Provenance:** reconciled from two independently produced reviews (PR #39 and
PR #40) that reached the same strategic conclusion by different routes and
disagreed on several points of fact. The disagreements were then settled
against primary sources rather than by preferring either author:

- Quantitative claims in §1 were re-verified against `GET /orgs/CompanyCam/repos`.
- The four claims PR #40 could not initially reproduce were resolved by a
  live-docs pass on 2026-08-01. **All four are now confirmed** against
  `companycam.readme.io` — including `todo_list.*` and the wildcard events,
  which two earlier scrapes of the rendered page had missed. The `.md` raw
  endpoints on `companycam.readme.io` return content the JavaScript-rendered
  `docs.companycam.com` pages do not, which is the methodological lesson.
- One inference carried by both drafts was **wrong** and is corrected in §4:
  granular collaborator permissions were not "bolted on," they were built and
  then *removed*.

Where the sources conflicted, the resolution and its basis are stated inline
rather than silently applied.

**Worksie sources of truth:** `docs/WORKSIE_SPINE.md`, `docs/PRD.md`,
`docs/DOMAIN_MODEL.md`, `docs/WORK_ORDER_LIFECYCLE.md`,
`docs/OFFLINE_FIRST_ARCHITECTURE.md`, `docs/roadmap/DOCUMENTS_AND_ESIGN.md`,
`packages/db/src/schema/tables.ts`, `packages/domain/src/index.ts`.

## 0. Why repos are a different signal than the marketing site

The features page tells you what CompanyCam *sells*. The repos tell you what
they *fight*.

A company open-sources three things: infrastructure it wants maintained for
free, forks of dependencies it was forced to patch, and tools built to
diagnose a problem it could not otherwise see. All three are diagnostic, and
the forks and instrumentation libraries are the honest ones. Marketing pages
describe a rich product; the API schema describes a thin one. **Where a
company chooses not to expose an object is where it has chosen not to own a
workflow, and that is where the opening is.**

## 1. The complete public footprint

Verified 2026-07-31 via `GET /orgs/CompanyCam/repos`. This is their entire
public org: **18 repos, 7 archived, 10 forks.**

| Repo | Lang | Origin | Archived | Last push |
|---|---|---|---|---|
| `background-agents` | TypeScript | fork of `ColeMurray/background-agents` | no | 2026-07-20 |
| `react-native-image-cache-hoc` | JavaScript | fork of `billmalarky/…` | no | 2026-05-28 |
| `openapi-spec` | YAML | original | no | 2026-05-05 |
| `h3_ruby` | Ruby | fork of `seanhandley/h3_ruby` | no | 2026-03-04 |
| `companycam-vibe-check` | Java / TS / Kotlin / Swift | original | no | 2026-03-24 |
| `atlas` | TypeScript | fork of `expo/atlas` | no | 2026-01-23 |
| `tiptap-ruby` | Ruby | original | no | 2025-11-21 |
| `graphql-searchkick` | Ruby | original | no | 2025-08-19 |
| `hellosign-ruby-sdk` | Ruby | fork of `hellosign/…` (upstream deprecated) | no | 2025-05-20 |
| `dependaboat` | Ruby | original | no | 2025-02-19 |
| `ghx` | Ruby | original | no | 2025-02-19 |
| `attr_encrypted` | Ruby | fork of `attr-encrypted/…` | **yes** | 2023-02-08 |
| `react-native-doc-viewer` | Java | fork of `philipphecht/…` | **yes** | 2022-12-19 |
| `react-native-orientation` | Objective-C | fork of `jim-lake/…` | **yes** | 2022-12-08 |
| `react-native-rate` | — | fork of `KjellConnelly/…` | **yes** | 2022-12-07 |
| `companycam-dotnet` | C# | original | **yes** | 2022-12-07 |
| `fancy-count` | Ruby | original | **yes** | 2021-10-13 |
| `react-native-calendar-datepicker` | JavaScript | fork of `vlad-doru/…` | **yes** | 2020-11-12 |

**Only six repos are both original and unarchived:** `openapi-spec`,
`companycam-vibe-check`, `tiptap-ruby`, `graphql-searchkick`, `ghx`,
`dependaboat`. Three of those six (`ghx`, `dependaboat`, and arguably
`openapi-spec`) are internal plumbing rather than product.

> **Reconciliation note — fork count.** PR #39's prose reported 9 forks; the
> API reports **10**, and PR #40's count of 10 was correct. The cause was not
> a missing repo: `atlas` was present in PR #39's own table as a fork of
> `expo/atlas`, and its table listed all 10. Only the sentence summarising the
> table was miscounted. Recorded precisely because the two failures have
> different implications — a missing repo would mean the census needed
> re-verifying, an arithmetic slip means only the sentence did.
>
> **Reconciliation note — dates.** PR #40 quoted last-commit dates from each
> repo's default branch; the table above uses `pushed_at`, which reflects a
> push to *any* branch and is the more defensible figure. They differ
> materially in one case: `companycam-vibe-check` last committed to its
> default branch in Jan 2025 but was pushed to in Mar 2026.

Three of the archived React Native forks cluster in Dec 2022 and one in Nov
2020 — a bulk-vendoring event followed by abandonment, not maintained code.
(`companycam-dotnet` was archived the same week but is neither React Native nor
a fork.)

## 2. Inferred stack

Nothing here is guesswork beyond what the dependency graphs state outright.

| Layer | Evidence | Conclusion |
|---|---|---|
| Backend | 8 Ruby repos; `attr_encrypted` + `fancy-count` target ActiveRecord, `hellosign-ruby-sdk` handles `ActionDispatch::Http::UploadedFile` | **Ruby on Rails.** Service topology is *not* evidenced — see note |
| Internal API | `graphql-searchkick` adapts Searchkick into `GraphQL::Pagination::Connections` | **GraphQL** |
| Public API | `openapi.yaml` + live docs | **REST v2** at `api.companycam.com/v2` |
| Search | Searchkick, ships a Compose file with Elasticsearch | **Elasticsearch**, with `coordinates: {near, within}` geo queries |
| Geospatial | `h3_ruby` FFI binding + `geofence` on Project | **Uber H3** hexagonal indexing |
| Rich text | `tiptap-ruby` → HTML, Markdown, plain text | TipTap/ProseMirror, rendered **server-side** |
| E-sign | `hellosign-ruby-sdk` | HelloSign, upstream now redirects to Dropbox Sign |
| PII | `attr_encrypted` | Column-level encryption (archived fork) |
| Counters | `fancy-count` with a Redis adapter | Rails `counter_cache` replaced at scale |
| Mobile | RN forks + `atlas` | **React Native**, bare rather than Expo-managed. See the note below |
| Telemetry | `companycam-vibe-check` | First-party hardware instrumentation |

> **Reconciliation note — Expo.** PR #40 read the `expo/atlas` fork as
> evidence they are "on / moving to Expo." That was an overreach and is
> **withdrawn.** Atlas is a Metro bundle visualiser and works with bare React
> Native; forking it evidences a bundle-size effort, not a managed-workflow
> migration. PR #39's reading is the defensible one, with its evidence
> narrowed: **three** of the forks patch a *native* module —
> `react-native-orientation` (Obj-C / Java), `react-native-doc-viewer`
> (QuickLook / Android intents), and `react-native-rate`
> (`SKStoreReviewController` / PlayCore). Those are the signature of bare RN,
> because they are the patches Expo's managed workflow removes the need for.
>
> The claim does **not** extend to every fork. `react-native-calendar-datepicker`
> is pure JavaScript, `react-native-image-cache-hoc` is a JS higher-order
> component (its native dependency is `rn-fetch-blob`, not the fork itself),
> and `atlas` is build tooling. None of those three evidence bare RN either
> way.

**The interesting one:** H3 + Elasticsearch geo + a `geofence` field on Project
is serious spatial infrastructure, and almost none of it surfaces in the public
API — `geofence` is a bare coordinate list with no radius semantics, no
enter/exit events, no hooks. **They built the capability and did not
productize it.**

## 3. The tells — what they built to diagnose their own pain

Three active repos exist only to measure problems. This is the most useful
section in the review.

### 3a. `companycam-vibe-check` — the mobile app is resource-hungry

A first-party native library reporting **battery level, charging state,
low-power mode, network type, cellular generation, metered/expensive
connection, RAM usage, and thermal state**, normalised across iOS and Android.
Their README says it exists to find performance bottlenecks and compensate for
hardware limits.

**The following is inference, not observation** — rated Medium-High in §9, and
stated that way here so the two agree. CompanyCam has made no first-party
statement about device cost.

Building thermal-state telemetry is a strong signal that thermal behaviour is
worth measuring. Read alongside `atlas` (bundle size) and
`react-native-image-cache-hoc` (still patched in 2026), the most economical
explanation is that **continuous camera capture plus large-image upload
pressures battery, heat, and memory on the mid-range Android hardware trades
actually carry.** What is directly observable is narrower: they built the
instrumentation and have not reported the problem solved. Competing
explanations — routine performance hygiene, a support-diagnostics need — are
not excluded by the evidence available.

### 3b. `atlas` — bundle size is a live problem

Forking Expo's bundle visualiser means someone is on a cold-start or app-size
reduction effort.

### 3c. `dependaboat` + `ghx` — org-scale dependency debt

A purpose-built gem to ferry Dependabot alerts into GitHub Projects, plus a
GitHub API wrapper its own README calls incomplete and built only to internal
need. This is the tooling of a large, aging codebase with a security backlog
to triage — corroborated by their `openapi-spec` issue #19, "Dependabot
Findings," open since March 2024.

### 3d. `background-agents` — the 2026 bet is velocity, not product AI

Their most recently pushed repo (2026-07-20), a fork of an open-source
background coding-agent system: Cloudflare Workers + Durable Objects, Modal /
Daytona / Vercel sandboxes, multi-provider models, GitHub and Slack and Linear
entry points, cron and webhook triggers.

**CompanyCam is spending its 2026 innovation budget on shipping faster, not on
new product surface.** Notably, *zero* AI appears in any product-facing repo.
Their AI is inward-facing.

## 4. The real API surface

> **Source discipline.** The published `openapi.yaml` is **incomplete and
> known-wrong by their own admission**: three open correctness issues stand
> against it — #33 "OpenAPI spec is incorrect for certain endpoints"
> (2026-01-13), #35 (2026-03-03), #28 (open since 2025-06-05). Most
> significantly it exposes `/webhooks` CRUD but types `Webhook.scopes` as a
> bare `array of string`, hiding the entire event catalogue. Findings below
> are reconciled against `docs.companycam.com`.

**Endpoints (v2):** `/company`, `/users` (+ `/users/current`), `/projects`
(+ `/archive`, `/restore`, `/notepad`, `/assigned_users`, `/collaborators`,
`/invitations`, `/labels`, `/documents`, `/comments`, `/checklists`,
`/photos`, `/videos`), `/photos` (+ `/tags`, `/comments`, `/descriptions`),
`/videos`, `/tags`, `/checklists` (+ `/templates/checklists`), `/groups`,
`/webhooks`.

**Webhook events** — read from `companycam.readme.io/docs/webhooks-1.md`
(the raw endpoint; see the resolution note below):

- Wildcards: `*`, `project.*`, `photo.*`, `comment.*`, `document.*`,
  `video.*`, `todo_list.*`, `task.*`
- `project.{created, updated, label_added, contact_created, contact_updated,
  merged, archived, deleted}`
- `photo.{created, updated, tag_added, description_updated}`
- `comment.created` · `document.{created, updated}` · `video.{created, updated}`
- `todo_list.{created, completed, deleted}` · `task.completed`

> **Resolved — the `todo_list` discrepancy.** This was previously recorded as
> unresolved: PR #39 reported `todo_list` events and a bare `*` wildcard,
> while two independent scrapes of the rendered `docs.companycam.com` page
> returned **zero** occurrences of either. Settled on 2026-08-01 by reading
> the raw `.md` endpoint, which lists `todo_list.*`, all three `todo_list`
> events, the bare `*`, and six per-resource wildcards. **PR #39 was right and
> the scrapes were wrong** — `docs.companycam.com` renders client-side, so a
> fetch of it under-reports. This is the same methodological trap noted in the
> header, now confirmed twice.
>
> One correction in the other direction: **`resource.*` was never a real
> event.** It was PR #39's shorthand for "a wildcard per resource type," which
> a later pass carried literally. The actual wildcards are the six named
> above; no scope literally called `resource.*` exists.
>
> `todo_list` being real is a further tell — internal naming that betrays
> checklists retrofitted onto a photo model rather than designed as a work
> primitive.

**Delivery semantics** — verified: any non-200 response retries with
exponential backoff to a maximum of **10 attempts**; a webhook whose
cumulative error count exceeds **25** is disabled, resetting on success;
bodies are signed with a base64-encoded **HMAC-SHA1** of the raw request body
in an `X-CompanyCam-Signature` header keyed on the subscription token.

**Pagination** — verified in `openapi.yaml`. Two schemes that cannot be
combined: offset (`page` / `per_page`) and cursor (`after` / `before`, sourced
from `X-Next-Cursor` and `X-Prev-Cursor` headers). The spec is explicit —
`page` is *"Cannot be used with cursor pagination (after/before params)"* and
`after` is *"Cannot be used with 'before' or 'page'"*. List endpoints also
accept `modified_since` (ISO 8601) for incremental sync, and photo listings
additionally filter on capture time.

That combination — cursor pagination plus `modified_since` — is what makes
their API usable for incremental sync rather than full re-fetch. Worth copying
if Worksie ever exposes a read API.

### What is absent

Scope note: this is an inventory of the **public Core API v2 surface** —
the published spec plus the live documentation, both checked. It is evidence
about what CompanyCam exposes to integrators, not proof about their internal
data model, and not a prediction about what they may add later.

No endpoint, schema, or webhook event was found for any of:

**time tracking · timesheets · payroll · invoices · estimates · payments ·
scheduling · dispatch · work orders · compliance documents · insurance ·
licensing · e-signature · annotations · reports**

Time tracking, Photo Reports, and markup are all *marketed* features with no
API surface at all — they are web-app-only and not automatable.

### Two structural weaknesses worth naming

Both were reported by PR #39 from the spec, and both have since been
**verified against the live docs** (2026-08-01). Neither depends on the stale
`openapi.yaml`.

**1. The permission model is two-valued — and write-once, and unreadable.**

[`POST /users`](https://companycam.readme.io/reference/createuser.md) documents
`user_role` verbatim as: *"Role for the user. Allowed values: standard
(default), restricted."* No role exists for a subcontractor, back-office user,
or customer. Three further limits sharpen this:

- `user_role` is **absent from [`PUT /users/{id}`](https://companycam.readme.io/reference/updateuser.md)**.
  Updatable fields are `first_name`, `last_name`, `email_address`,
  `phone_number`, `password` only. **A user's role cannot be changed via the
  API after creation.**
- `user_role` is **absent from the User response object**. `GET /users/{id}`
  returns `id`, `company_id`, `email_address`, `status` (`active` / `deleted`),
  names, `profile_image`, `phone_number`, timestamps, and `user_url` — no role
  field. **An integrator cannot read back or audit who is restricted.**

**2. Document upload is base64 with a 30 MB ceiling.**

[`POST /projects/{project_id}/documents`](https://companycam.readme.io/reference/createprojectdocument.md)
documents `document.attachment` as *"Base64 encoded file contents with 30 MB
limit."* No multipart or resumable path exists. Base64 inflates payload by
roughly a third, so the effective source-file ceiling is nearer 22 MB. On
flaky rural LTE, an upload failing at 90% starts over.

### The permission model did not stay thin — it was thinned deliberately

The obvious reading — that granularity is bolted on through project-level
`assigned_users`, `collaborators`, and `invitations` — is **the opposite of
what is documented.**

CompanyCam's [changelog](https://companycam.readme.io/changelog/removing-permissions-for-project-collaborators.md)
records that `POST /v2/projects/:id/invitations` **formerly accepted four
granular permissions** — `can_comment`, `can_use_todos`, `can_add_content`,
`can_view_content` — and that the capability was **removed**. All collaborators
now receive identical permissions, and the endpoint no longer accepts a
permissions body.

This is first-party evidence rather than inference, and it is a stronger claim
than "their permission model is thin." A vendor that *builds* per-collaborator
permissions and then *deletes* them is reporting that the granularity was not
worth its support burden at their altitude — a photo-documentation peripheral
where every collaborator is, functionally, a viewer with a camera.

That is precisely the altitude at which Worksie's model diverges. Four
membership roles (`operator`, `back_office`, `contractor`, `customer`) plus
row-level RLS by `tenant_id` are not a richer version of the same idea; they
exist because compliance gating, dispatch, and payout each require knowing
*which* actor did *what*, and cannot function on a uniform-collaborator model.
CompanyCam's retreat is evidence the surface is unoccupied, not merely
underbuilt.

## 5. The headline finding

**CompanyCam has architected itself as a peripheral, not a system of record.**

Four pieces of evidence. Points 1, 2 and 4 were **verified against the live
docs on 2026-08-01**, so the thesis does not rest on the stale `openapi.yaml`:

1. **`ProjectIntegration { type, relation_id }`** — both required, documented
   with the example values `"JobNimbus"` and `"123"`. A Project carries a
   foreign key **into someone else's job object**. The canonical job lives in
   JobNimbus or AccuLynx; CompanyCam hangs off it. The direction of that
   pointer is the whole thesis: they reference the system of record, they are
   not it.
2. **`Project.status` is `active | deleted`** — and note *what kind* of field
   that is. It is a soft-delete flag, not a workflow state. Archival is a
   separate endpoint pair (`/archive`, `/restore`), not a status value. There
   is **no job-progress state on a Project at all** — no scheduled, no in
   progress, no complete. No lifecycle, no transition validation, no audit
   trail. A project is a folder with a soft-delete bit.
3. Checklists have `completed_at` but **gate nothing**. Their marketed
   "photo required" feature has no enforcement object in the API. Their
   checklists fire `task.completed` as a *notification*; Worksie's checklist
   steps **gate** `in_progress → awaiting_signoff` server-side. Same word,
   different category of object.
4. **`Document` is a file blob with no lifecycle.** The full property set is
   `id`, `creator_id`, `creator_type`, `creator_name`, `project_id`, `name`,
   `url`, `content_type`, `byte_size`, `created_at`, `updated_at`. There is
   **no type or category, no status, no approval state, no expiry, and no
   signature field.**

Point 4 is the one that matters most for Worksie, and it deserves stating
plainly: **the compliance gate is not a feature CompanyCam lacks — it is a
shape their schema cannot express.** Worksie's gate needs
`document_types.gating`, `contractor_documents.status`, and
`contractor_documents.expires_on` to say "this COI expired, so dispatch is
blocked." Against a Document object with no type, no status and no expiry,
there is nowhere to put any of the three. Adding them is not a feature ticket
for them; it is a re-founding of the object.

This is a coherent strategy — be the best evidence layer, integrate with every
job system. It also carries a structural cost that is not a prediction about
their roadmap but a statement about their current position: owning dispatch,
compliance, or payout would put them in direct competition with the partners
who *are* the job system, and would require re-founding objects those partners
already read. Nothing here says they cannot do it. It says the move is
expensive for them in a way it is not for a system of record built that way
from the start.

## 6. What this means for Worksie

> **Status of everything in §6 and §7: recommendations, not doctrine.** None of
> it is a stack or scope decision, and none of it binds. `WORKSIE_SPINE.md` is
> the canonical stack contract; per `docs/AGENTS.md` a review document must not
> change public positioning, phase gates, or stack decisions on its own. Where
> a recommendation below names a specific mechanism — HMAC-SHA256 signing,
> outbound webhooks, PostGIS over H3, e-sign sequencing — treat it as a
> proposal that requires a spine update before it is a commitment. Roadmap
> specs referenced here (`OUTBOUND_EVENTS.md`, `CAPTURE_INTEGRITY.md`,
> `TAGS_AND_REPORTS.md`, `DOCUMENTS_AND_ESIGN.md`) carry their own
> roadmap-only banners and target phases. Nothing here moves an item out of
> `PRD.md` §"Explicitly Out of Scope (v1)".

### 6a. Confirmed — the differentiators sit on empty ground

There is no platform primitive for compliance-gated dispatch, payout, or
server-validated work-order state. This is not a roadmap they are quietly
executing; there is no substrate for it. `service_definitions`,
`contractor_documents.{status, expires_on}`, `safety_acknowledgements`,
`payout_periods` / `payout_lines`, and the ten-state lifecycle have no
counterpart anywhere in their surface.

§5 point 4 makes the sharpest version of this concrete. The compliance gate
reduces to three fields — a document's *type*, its *status*, and its
*expiry* — and CompanyCam's `Document` object carries none of them. That is
the difference between a competitor who could ship this next quarter and one
who would have to re-found an object that every existing integration reads.

The §4 permission finding upgrades this from *absence* to *retreat*. Empty
ground is ambiguous — it can mean a competitor hasn't got there yet. But a
vendor that shipped per-collaborator permissions and then **removed** them has
tested the ground and withdrawn from it. Worksie's four membership roles plus
row-level RLS are not a bet that CompanyCam is slow; they are a bet that
compliance gating, dispatch, and payout require actor-level distinctions a
photo-documentation peripheral has already decided it does not want to carry.

### 6b. Outbound webhooks — copy the contract, and beat it on replay

**Do not plan against "they haven't built this."** They have, and it is
battle-tested: signed payloads, backoff to 10 attempts, auto-disable at 25
errors, cursor pagination with `modified_since`.

Two improvements available while copying it:

1. **HMAC-SHA256, not SHA-1.** Theirs is a legacy choice.
2. **Replayable delivery.** `work_order_events` is already append-only by
   trigger, so Worksie can redeliver from a cursor after an outage. Theirs is
   fire-and-forget — a disabled webhook loses the window permanently. This is
   a genuine platform advantage falling out of a schema decision already made,
   at close to zero additional cost.

And the framing that survives their maturity: every one of their events is CRUD
on a photo, project, document, or comment. **Theirs is a media feed; Worksie's
is a work-state feed.**

See `docs/roadmap/OUTBOUND_EVENTS.md`.

### 6c. Upload resilience moves from implementation detail to demo

`OFFLINE_FIRST_ARCHITECTURE.md` already specifies a resumable upload queue.
Against a competitor capped at 30 MB base64 with no resume, that becomes a
demo: kill the network mid-upload, walk out of range, come back, watch it
finish.

### 6d. Device cost is a competitive axis

`companycam-vibe-check` is CompanyCam admitting in public that the field device
pays a heavy price. A phone that dies at 2pm is a real complaint from real
crews and a real reason to switch.

Worksie's mobile app is still a scaffold, so the cheap wins are still
available: capture-time compression before queueing, deferring uploads to
unmetered networks (their own library reads `isConnectionExpensive`, so the
signal is standard), batching writes. Worth writing into
`OFFLINE_FIRST_ARCHITECTURE.md` as an explicit budget when the mobile slice
lands, rather than discovering it later and having to build telemetry to chase
it.

### 6e. Tags move up

CompanyCam ships **two** taxonomy systems — `tags` on photos and `labels` on
projects — each with dedicated endpoints and webhook events. Two systems means
it earned its own model twice. The back-office query ("every job that had a
load-bearing exposure photo") is the same shape for Worksie, and a polymorphic
`tags` table scoped by `tenant_id` remains the right answer.

See `docs/roadmap/TAGS_AND_REPORTS.md`.

### 6f. E-sign moves up, and the vendor choice is now obvious

`customer_signoffs` is a signature capture, not a legally executed document.
CompanyCam's only e-sign path is a fork of a **deprecated** HelloSign SDK whose
upstream redirects to `dropbox-sign` — an unmaintained integration, not a
product capability. Real e-sign on subcontractor agreements and change orders
is open ground, and their abandoned fork tells you which vendor path not to
repeat.

See `docs/roadmap/DOCUMENTS_AND_ESIGN.md`.

### 6g. Annotations and reports remain open

Both are marketed by CompanyCam and absent from their API, so their own
integration partners cannot reach them programmatically. An API-addressable
report is a differentiator, not parity.

### 6h. Watch, do not copy — H3

Their H3 binding is orphaned upstream ("LOOKING FOR A NEW MAINTAINER"). Hex
indexing solves territory density and clustering at scale. Worksie's dispatch
problem is nearer-term and smaller — *which qualified, compliant contractor is
closest to this work order* — which PostGIS answers directly on Supabase. Note
H3 as a Phase-N+ concern if territory analytics ever matter; do not take on an
orphaned native binding now.

## 7. Patterns worth adopting

Independent of competition, these are good calls they made:

- **Publish an OpenAPI spec as a repo.** 21 watchers, 8 forks, versioned in
  git. Partners diff it. Worth doing the moment there is an external API —
  *and worth keeping accurate*, which is the lesson their three open issues
  teach.
- **`vibe-check`-style hardware telemetry.** For an offline-first app with a
  resumable queue, knowing a device was thermally throttled on cellular
  explains a stalled queue. Cheap on Expo, high diagnostic value.
- **A content hash on every media row.** Theirs is MD5; Phase 3.5 landed
  SHA-256 on `proof_of_work_artifacts` for dedup and idempotent retry.
- **`processing_status` as first-class async state.** Also landed in Phase 3.5.
- **Server-side rich text.** One canonical document model rendering to HTML,
  Markdown, and plain text beats three renderers if reports ever ship.

## 8. What not to do

- **Do not read the archived RN forks as a stack recommendation.** They are
  2020–2022 artifacts of unmanaged React Native. Worksie is on Expo, which is
  why most of those forks would never have been needed.
- **Do not chase `background-agents`.** It is internal developer
  infrastructure. Forking it would be adopting a competitor's engineering
  process as product scope.
- **Do not treat the published `openapi.yaml` as authoritative** in any future
  comparison. It is stale by their own admission.
- **Do not treat their maintenance debt as a moat.** Stale forks are a talking
  point in a competitive deal, not a product strategy.
- **Do not let any of this pull work forward of Phase 3.** Everything in §6 is
  roadmap input. The auth, RLS, and tenancy boundary lands first.

## 9. Confidence

| Finding | Confidence | Basis |
|---|---|---|
| Repo list, archive/fork state, languages, push dates | **High** | `GET /orgs/CompanyCam/repos`, re-verified 2026-07-31 |
| Rails / GraphQL / Elasticsearch / TipTap / H3 stack | **High** | Stated dependencies |
| Bare React Native, not Expo-managed | **High** | Every fork patches a native module |
| Webhook events, retry, auto-disable, signing | **High** | `docs.companycam.com/docs/webhooks-1`, read directly |
| Endpoint inventory | **High** | Spec + live docs, both checked |
| Absence of payout / dispatch / compliance / time / e-sign | **High** | Spec + live docs, both checked |
| Peripheral-not-system-of-record thesis | **High** | [`ProjectIntegration{type,relation_id}`](https://companycam.readme.io/reference/getproject.md), [`Project.status = active\|deleted`](https://companycam.readme.io/reference/project.md), [`Document` with no type/status/expiry](https://companycam.readme.io/reference/listprojectdocuments.md) — all read from live docs 2026-08-01 |
| `Document` has no type, status, approval, expiry or signature | **High** | [listprojectdocuments](https://companycam.readme.io/reference/listprojectdocuments.md), full property set enumerated 2026-08-01 |
| Mobile resource pressure | **Medium-High** | Inferred from three repos, consistent; no first-party statement |
| Collaborator permissions existed and were removed | **High** | [Changelog](https://companycam.readme.io/changelog/removing-permissions-for-project-collaborators.md), read directly 2026-08-01 |
| Two-valued `user_role`, write-once, absent from read | **High** | [`createuser`](https://companycam.readme.io/reference/createuser.md) + [`updateuser`](https://companycam.readme.io/reference/updateuser.md) + [User object](https://docs.companycam.com/reference/user), all read 2026-08-01 |
| 30 MB base64 upload cap | **High** | [`createprojectdocument`](https://companycam.readme.io/reference/createprojectdocument.md), quoted verbatim 2026-08-01 |
| `todo_list.*`, three `todo_list` events, bare `*` and six per-resource wildcards | **High** | [Raw webhooks doc](https://companycam.readme.io/docs/webhooks-1.md), read 2026-08-01. Supersedes two scrapes of the JS-rendered page that returned zero hits. `resource.*` was shorthand, not a real scope |
| Pagination and `modified_since` semantics | **Spec-derived** | From `openapi.yaml` only; low stakes, not re-verified |
| Full checklist/task schema properties | **Not obtained** | `components/schemas` truncated on fetch |

## 10. Sources

**Org + API:**
[CompanyCam org repositories](https://github.com/orgs/CompanyCam/repositories?type=all&sort=updated) ·
[`openapi.yaml`](https://raw.githubusercontent.com/CompanyCam/openapi-spec/main/openapi.yaml) ·
[openapi-spec issues](https://github.com/CompanyCam/openapi-spec/issues) ·
[Core API overview](https://docs.companycam.com/docs/overview-1) ·
[Webhooks](https://docs.companycam.com/docs/webhooks-1)

**Live-docs verification pass (2026-08-01):**
[Create User](https://companycam.readme.io/reference/createuser.md) ·
[Update User](https://companycam.readme.io/reference/updateuser.md) ·
[User object](https://docs.companycam.com/reference/user) ·
[Create Project Document](https://companycam.readme.io/reference/createprojectdocument.md) ·
[List Project Documents (Document schema)](https://companycam.readme.io/reference/listprojectdocuments.md) ·
[Project object](https://companycam.readme.io/reference/project.md) ·
[Get Project (ProjectIntegration schema)](https://companycam.readme.io/reference/getproject.md) ·
[Changelog — removing permissions for project collaborators](https://companycam.readme.io/changelog/removing-permissions-for-project-collaborators.md) ·
[Page index](https://companycam.readme.io/llms.txt)

**Repos (all 18):** `background-agents` · `react-native-image-cache-hoc` ·
`openapi-spec` · `companycam-vibe-check` · `h3_ruby` · `atlas` · `tiptap-ruby` ·
`graphql-searchkick` · `hellosign-ruby-sdk` · `dependaboat` · `ghx` ·
`attr_encrypted` · `react-native-doc-viewer` · `react-native-orientation` ·
`react-native-rate` · `companycam-dotnet` · `fancy-count` ·
`react-native-calendar-datepicker` — all under `https://github.com/CompanyCam/`

**Worksie:** `docs/WORKSIE_SPINE.md`, `docs/PRD.md`, `docs/DOMAIN_MODEL.md`,
`docs/WORK_ORDER_LIFECYCLE.md`, `docs/OFFLINE_FIRST_ARCHITECTURE.md`,
`docs/roadmap/DOCUMENTS_AND_ESIGN.md`, `docs/roadmap/OUTBOUND_EVENTS.md`,
`docs/roadmap/TAGS_AND_REPORTS.md`, `docs/roadmap/CAPTURE_INTEGRITY.md`,
`packages/db/src/schema/tables.ts`, `packages/domain/src/index.ts`.

## 11. Rerun inputs

```yaml
workflow: firecrawl-competitive-intel
competitor: CompanyCam
focus: engineering surface (public repos + API spec + live docs)
cadence: quarterly
watch: openapi.yaml diff, openapi-spec issue tracker, docs.companycam.com
       webhook event catalogue, atlas/bundle activity, background-agents pace,
       changelog (permission-model direction — see §4)
verified-2026-08-01: todo_list.* events, user_role cardinality + mutability,
       document upload ceiling, collaborator-permission removal,
       ProjectIntegration{type,relation_id}, Project.status = active|deleted,
       Document has no type/status/approval/expiry/signature
unverified-carry-forward: pagination semantics (spec-only, low stakes),
       checklist/task schema properties (components/schemas truncated)
```
