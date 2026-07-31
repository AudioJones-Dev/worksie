# Competitor Review — CompanyCam Engineering Surface

**Source:** 18 public repos under `github.com/CompanyCam` + the published
`openapi.yaml` (Core API v2), scraped 2026-07-31 via Firecrawl.
**Companion doc:** [`competitor-companycam.md`](./competitor-companycam.md)
(marketing/feature surface, reviewed 2026-05-22).
**Worksie sources of truth:** `docs/WORKSIE_SPINE.md`, `docs/PRD.md`,
`docs/DOMAIN_MODEL.md`, `docs/WORK_ORDER_LIFECYCLE.md`,
`docs/ONBOARDING_FLOWS.md`, `docs/PAYOUT_RULES.md`,
`docs/roadmap/DOCUMENTS_AND_ESIGN.md`.

## 0. Why this review exists

The existing CompanyCam review reads their **marketing surface** — what
they say they do. This one reads their **engineering surface** — what
their code and public API prove they do.

The two disagree in useful ways. Marketing pages describe a rich product.
The API schema describes a thin one. Where a company chooses *not* to
expose an object is where they have chosen not to own a workflow, and
that is where the opening is.

## 1. Repo inventory

18 repos: **8 original**, **10 forks**. Forks are vendored dependencies,
not contributions — the divergence counts are small and one-directional.

### Original work (8)

| Repo | What it is | Last commit | Reads as |
|---|---|---|---|
| `openapi-spec` | Core API v2 OpenAPI 3.0 spec, 4.6k lines | May 2026 | **Live.** 21 watchers, 8 forks — partners consume it. |
| `tiptap-ruby` | Parse/generate/render TipTap docs in Ruby (HTML, JSON, Markdown, plain text) | Nov 2025 | Rich-text documents are a **server-side** concern. This is the engine behind Pages/notepad. |
| `graphql-searchkick` | Searchkick (Elasticsearch) adapter for GraphQL connections | Aug 2025 | Internal API is **GraphQL**; search is Elasticsearch with geo-proximity. |
| `companycam-vibe-check` | RN native module: battery, thermal state, memory, connectivity | Jan 2025 | They instrument **device hardware** because field performance bites them. |
| `dependaboat` | Ferries Dependabot alerts into GitHub Projects | Feb 2025 | Internal security/ops tooling. |
| `ghx` | OO wrapper over GitHub REST + GraphQL | — | Internal dev tooling. |
| `companycam-dotnet` | .NET SDK for Core API v2 | Sep 2024 | Partner/enterprise integration surface (Windows-shop estimating software). |
| `fancy-count` | Redis-backed counter caches for Rails | Mar 2022 | Rails `counter_cache` broke at their write volume. **Scale signal.** |

### Vendored forks (10)

| Repo | Upstream | Fork state | Reads as |
|---|---|---|---|
| `background-agents` | ColeMurray/open-inspect | Jul 2026, +4 / −228 | Building an **internal AI coding-agent platform**. R&D velocity play. |
| `react-native-image-cache-hoc` | billmalarky | May 2026, active | Image caching still an active problem. |
| `atlas` | expo/atlas | Jan 2026, +2 | **They are on / moving to Expo.** Bundle-size work underway. |
| `h3_ruby` | seanhandley | Mar 2026 | Uber H3 hexagonal geo-indexing. Upstream banner: *"LOOKING FOR A NEW MAINTAINER."* |
| `hellosign-ruby-sdk` | hellosign | May 2025, +1 | **E-signature in production**, on the legacy HelloSign (now Dropbox Sign) SDK. |
| `attr_encrypted` | attr-encrypted | Feb 2023, +6 | Field-level column encryption. Last touched for Ruby 3 support, 3 years ago. |
| `react-native-doc-viewer` | philipphecht | Sep 2024, +7 | Native doc/PDF viewing. Upstream dormant since 2022. |
| `react-native-calendar-datepicker` | vlad-doru | Sep 2024, +18 | Upstream dormant since **2020**. |
| `react-native-rate` | KjellConnelly | Sep 2024, −3 | App-store review prompts. Upstream 2022. |
| `react-native-orientation` | jim-lake | Sep 2024 | Orientation locking. |

Four RN forks all stamped **Sep 19, 2024** — a single bulk-vendoring
event, then frozen. Those are pinned dependencies, not maintained code.

## 2. Inferred stack

| Layer | Evidence | Conclusion |
|---|---|---|
| Backend | 6 Ruby gems | **Ruby on Rails** monolith |
| Internal API | `graphql-searchkick` | **GraphQL** |
| Public API | `openapi.yaml` | **REST v2**, `api.companycam.com/v2`, Bearer auth |
| Search | Searchkick | **Elasticsearch**, with `coordinates: {near, within}` geo queries |
| Geospatial | `h3_ruby` + `geofence` field | **H3 hexagonal indexing** |
| Rich text | `tiptap-ruby` | TipTap/ProseMirror, rendered server-side |
| E-sign | `hellosign-ruby-sdk` | HelloSign / Dropbox Sign |
| PII | `attr_encrypted` | Column-level encryption |
| Counters | `fancy-count` | Redis counter caches |
| Mobile | RN modules + `atlas` | React Native, **migrating toward Expo** |
| Telemetry | `vibe-check` | Custom hardware instrumentation |

`★ The interesting one:` H3 + Elasticsearch geo + a `geofence` array on
Project is serious spatial infrastructure. Almost none of it is exposed
in the public API — `geofence` is a bare coordinate list with no events,
no radius semantics, no enter/exit hooks. **They built the capability and
have not productized it.**

## 3. The public API surface, as published

> **Source caveat.** Everything in this section is derived from the published
> `openapi.yaml` alone. That spec is **not** reliable as a sole source:
> CompanyCam's own repository carries three open correctness issues against it
> — #33 "OpenAPI spec is incorrect for certain endpoints" (2026-01-13), #35
> (2026-03-03), and #28 (2025-06-05). Their live documentation at
> `docs.companycam.com` was not read for this review. Read the absences in §3
> and the conclusions in §4 as *"absent from the published spec,"* not
> *"absent from the platform."* Verifying against the live docs is the first
> thing to do before acting on any of it.

Twelve resource families appear in the spec:

```
Company     GET /company
Users       GET|POST /users · GET|PUT|DELETE /users/{id} · GET /users/current
Projects    GET|POST /projects · GET|PUT|DELETE /projects/{id}
            POST /projects/{id}/archive · /restore
            /photos · /videos · /documents · /comments · /labels
            /assigned_users · /collaborators · /invitations
            /notepad · /checklists
Photos      GET /photos · GET|PUT|DELETE /photos/{id}
            /tags · /comments · /descriptions
Videos      GET /videos · GET /videos/{id}          (read-only)
Tags        GET|POST /tags · GET|PUT|DELETE /tags/{id}
Checklists  GET /checklists · GET /templates/checklists
Groups      GET|POST /groups · GET|PUT|DELETE /groups/{id}
Webhooks    GET|POST /webhooks · GET|PUT|DELETE /webhooks/{id}
```

Schemas: `Company, User, Project, Photo, Video, Tag, Group, Checklist,
ChecklistSection, Task, SubTask, ChecklistTemplate, Document, Comment,
Webhook, ProjectCollaborator, ProjectInvitation, ProjectContact,
ProjectNotepad, ProjectIntegration, Address, Coordinate, ImageURI, Error`.

### What is conspicuously absent

No endpoint, and no schema, for any of:

- **Time entries / labor** — despite time tracking being a marketed feature
- **Reports** — despite Photo Reports being a marketed feature
- **Annotations** — despite markup being a marketed feature
- **Scheduling or dispatch** — no assignment beyond `assigned_users`
- **Money** — no cost, estimate, invoice, payout, line item
- **Compliance** — `Document` has no `type`, no `status`, no `expires_at`
- **Work state** — `Project.status` is `active | deleted`. Plus `archived: bool`.

## 4. The headline finding

**CompanyCam has architected itself as a peripheral, not a system of record.**

Three pieces of evidence, all from their own schema:

1. `ProjectIntegration { type: "JobNimbus", relation_id: "123" }` — a
   Project carries a foreign key **into someone else's job object**. The
   canonical job lives in JobNimbus/AccuLynx. CompanyCam hangs off it.
2. `Project.status` has exactly two values. There is no lifecycle, no
   transition validation, no audit trail. A project is a folder.
3. Checklists have `completed_at` but **gate nothing**. A task can be
   marked done without evidence; nothing blocks on it. Their own
   `requires photo` marketing feature has no enforcement object in the API.

This is a deliberate, coherent strategy — be the best evidence layer and
plug into every job system. It is also a permanent ceiling. They cannot
own dispatch, compliance, or payout without breaking their integration
partners, who *are* the job system.

**Worksie is designed for exactly the layer CompanyCam has ceded.**

## 5. Gaps Worksie can fill — ranked

### 5a. Own the workflow spine they cannot (strategic, already in flight)

| Gap in CompanyCam | Worksie has | Status |
|---|---|---|
| No work-order state machine | 10 states, server-validated, append-only `work_order_events` | ✅ shipped in schema |
| No gating on evidence | Required-photo/signature steps gate `in_progress → awaiting_signoff` | ✅ Hard Rule #4 |
| `Document` has no type/status/expiry | `document_types.gating`, `contractor_documents.{status, expires_on}` | ✅ shipped |
| No safety model | Versioned `safety_packs` + re-ack on bump | ✅ shipped |
| No money at all | `payout_periods`, `payout_lines`, 3 payout modes, 1099 reproduction | ✅ shipped |
| Two-state project | Frozen `service_snapshot_json` per work order | ✅ Hard Rule #2 |

**Nothing to build here.** This is already the differentiator; the API
evidence just confirms it is a structural gap in their product, not a
backlog item they will close next quarter.

### 5b. Real opportunities — build these

Ordered by (field value ÷ effort), with the CompanyCam-derived rationale:

1. **Geofence-driven auto check-in / dispatch radius.**
   They have H3 + Elasticsearch geo + a `geofence` field, and expose
   *none* of it as behavior. Worksie already stamps `gps` + `captured_at`
   on every `proof_of_work_artifact`. Adding "artifact captured outside
   the work-order geofence → flag" is a small server-side rule that
   turns proof-of-work into **verified** proof-of-work. This is the
   single highest-leverage steal on the list, and it is a capability
   they have built but not shipped.

2. **Webhooks on `work_order_events`.**
   Their `Webhook` object has `url`, `scopes[]`, `token` (HMAC body
   hash), `enabled`. That is the whole design, and it is enough. Worksie's
   `work_order_events` table is already append-only — it is a webhook
   feed that has not been plugged in. This is also the answer to the
   "50+ integrations" gap from the marketing review: one event stream
   beats fifty connectors.

3. **Annotations.**
   Confirmed absent from their API despite being marketed. Landing
   `proof_of_work_annotations` gives Worksie a capability that their
   *partners cannot access programmatically*. Already ranked #1 in the
   marketing review — this raises confidence.

4. **Tags.**
   `Tag` is a first-class company-scoped resource for them, applied to
   photos, and it is one of only two objects with full CRUD. That is
   evidence tags carry real back-office weight at volume. Confirms the
   marketing review's #2. Recommend polymorphic + `tenant_id`-scoped.

5. **Audio proof-of-work kind.**
   Still absent from their API too (no audio object anywhere), so this
   is parity-neutral — but it is cheap and field crews want it. Add
   `audio` to `PROOF_OF_WORK_KINDS`.

6. **PDF reports.**
   No report endpoint in their API — their Photo Reports are
   web-app-only and not automatable. A Worksie report that is
   **API-addressable** is a differentiator, not just parity.

### 5c. Things to deliberately not chase

`ProjectInvitation` / `ProjectCollaborator` / `public: bool` / `slug` /
`embedded_project_url` show external collaboration is more first-class in
their data model than the marketing suggests. It is still correctly out of
Worksie's v1 scope per `PRD.md` §Out of Scope — but note that if a
customer-portal decision ever gets revisited, this is a mature surface to
copy from, not invent.

## 6. Their maintenance debt

Fair-game competitive talking points, stated as facts:

| Item | Fact | Implication |
|---|---|---|
| 4 RN native modules | All frozen Sep 19 2024; upstreams dormant since 2020–2022 | Real mobile tech debt. Worksie on Expo + current libs carries none of it. |
| `h3_ruby` | Upstream README: *"LOOKING FOR A NEW MAINTAINER"* | They now carry maintenance burden on their geo layer. |
| `attr_encrypted` | Fork last touched Feb 2023 (Ruby 3 support); upstream carries its own deprecation notices for legacy IV/salt modes | A 3-year-stale crypto dependency. *Whether legacy modes are in use is unknown — do not assert a vulnerability.* |
| `hellosign-ruby-sdk` | HelloSign is now Dropbox Sign; this SDK targets the legacy v3 API | Their e-sign path is on a rebranded/legacy SDK. Relevant to `docs/roadmap/DOCUMENTS_AND_ESIGN.md` — pick a current provider. |
| `fancy-count` | Rails `counter_cache` replaced with Redis in 2022 | They hit write-contention at scale early. Worksie will too — worth knowing the shape of the fix before it bites. |

## 7. Patterns worth adopting

Independent of competition, these are good calls they made:

- **Publish an OpenAPI spec as a repo.** 21 watchers, 8 forks, versioned
  in git, topic-tagged `auditing-exempt`. Partners diff it. Worksie should
  do the same the moment there is an external API.
- **`vibe-check`-style hardware telemetry.** Battery / thermal / memory /
  connectivity at capture time. For an offline-first app with a resumable
  upload queue, this is *directly* useful: knowing a device was thermally
  throttled on cellular explains a stalled queue. Cheap to add to
  Expo, high diagnostic value.
- **MD5 `hash` on every photo.** Dedup + integrity. Worksie's upload queue
  is resumable; a content hash makes retry idempotent for free.
- **`processing_status` on media.** They model async processing as
  first-class state. Worksie's artifacts should too.
- **Server-side rich text (`tiptap-ruby`).** If Worksie ever renders notes
  to PDF, having one canonical document model that renders to HTML *and*
  Markdown *and* plain text (for search) is the right shape.

## 8. Recommendation

1. **No spine/PRD changes.** This review reinforces the existing
   positioning rather than challenging it. The API evidence is the
   strongest confirmation yet that "feature parity is not the goal" is
   the correct call — their ceiling is structural.
2. **Promote geofence verification** into the roadmap. It was not in the
   marketing review's gap list and it is the highest-leverage item found
   here.
3. **Promote `work_order_events` webhooks** above the generic
   "integrations" line item from the marketing review — it is the same
   need with a concrete, proven design to copy.
4. **Re-confirm the e-sign provider choice** in
   `docs/roadmap/DOCUMENTS_AND_ESIGN.md` against the finding that
   CompanyCam is on a legacy HelloSign SDK.
5. **Add media `hash` + `processing_status`** to `proof_of_work_artifacts`
   when the upload queue lands. Small now, painful to retrofit.
6. **Do not** treat their RN/crypto debt as a moat. It is a talking point
   for competitive deals, not a product strategy.

## 9. Sources

All scraped 2026-07-31 via Firecrawl CLI v1.19.21.

- `https://github.com/CompanyCam/{openapi-spec, tiptap-ruby, graphql-searchkick, companycam-vibe-check, dependaboat, ghx, companycam-dotnet, fancy-count}`
- `https://github.com/CompanyCam/{background-agents, react-native-image-cache-hoc, atlas, h3_ruby, hellosign-ruby-sdk, attr_encrypted, react-native-doc-viewer, react-native-calendar-datepicker, react-native-rate, react-native-orientation}`
- `https://raw.githubusercontent.com/CompanyCam/openapi-spec/main/openapi.yaml` (Core API v2, 4,608 lines)

## 10. Rerun inputs

```
workflow: firecrawl-competitive-intel
competitor: CompanyCam
focus: engineering surface (public repos + API spec)
cadence: quarterly
watch: openapi.yaml diff, atlas/Expo migration pace, background-agents activity
```
