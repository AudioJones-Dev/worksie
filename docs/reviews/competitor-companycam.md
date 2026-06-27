# Competitor Review — CompanyCam vs. Worksie

**Source:** https://companycam.com/features (+ `/advanced-features`)
**Review date:** 2026-05-22
**Worksie sources of truth:** `docs/WORKSIE_SPINE.md`, `docs/PRD.md`,
`docs/DOMAIN_MODEL.md`, `docs/WORK_ORDER_LIFECYCLE.md`,
`docs/ONBOARDING_FLOWS.md`, `docs/PAYOUT_RULES.md`,
`docs/OFFLINE_FIRST_ARCHITECTURE.md`, `packages/db/src/schema/tables.ts`,
`packages/domain/src/index.ts`.

## 0. Framing

CompanyCam is a photo-documentation + project-feed app for trades.
Worksie is a configurable operations platform: capability model →
compliance gate → dispatch → field execution with proof-of-work →
1099 payout.

The Worksie spine explicitly retires the "outpace CompanyCam" framing
(`WORKSIE_SPINE.md` §"What Worksie Is"). **Feature parity is not the
goal.** The point of this review is to (a) confirm Worksie covers the
proof-of-work + project-feed surface area enough that the operator
doesn't need to bolt CompanyCam on top, (b) name the gaps that are
deliberate v1 omissions, and (c) flag the gaps that are real and
should land on the roadmap.

## 1. CompanyCam feature taxonomy

Pulled from `companycam.com/features` and `companycam.com/advanced-features`.

| Bucket | Feature | One-line |
|---|---|---|
| Capture | Photo & Video Capture | Unlimited cloud capture; auto time + location stamp; per-user attribution. |
| Capture | Voice notes | Audio attached to a photo. |
| Capture | Before / After comparisons | Side-by-side same-spot photos. |
| Organize | Project Feed | Chronological per-project stream of photos / notes / events. |
| Organize | Tags & Labels | Custom tags on photos, projects. |
| Organize | Pages | Free-form per-project document space. |
| Markup | Annotations | Draw, text, arrows, measurement labels on photos. |
| Share | Galleries | Curated photo collection shared via link. |
| Share | Timelines | Real-time updating client/sub-facing link. |
| Share | Guest access | External users see scoped projects. |
| Workflow | Checklists | Task lists; optional "photo required" steps. |
| Workflow | Time tracking | Worker time entries. |
| Reports | Photo Reports | Selected photos + notes → branded PDF. |
| Reports | AI reports / summaries | Generated overview docs from project content. |
| Reports | Templates (checklist / report / project) | Reusable starting points. |
| Comms | Comments, @mentions | In-photo / in-project threaded chatter. |
| Platform | Mobile + web apps | iOS / Android / web. |
| Platform | Offline | Capture without signal; sync later. |
| Platform | Integrations | 50+ direct; Zapier; Chrome Extension. |

## 2. Feature-by-feature mapping to Worksie

Legend: ✅ covered · ⚠️ partial · ❌ missing · 🚫 explicitly out of scope (PRD) · ➕ Worksie covers more than CompanyCam here.

| CompanyCam feature | Worksie state | Where it lives / why |
|---|---|---|
| Photo & Video Capture (timestamp, GPS, user) | ✅ | `proof_of_work_artifacts` row carries `kind`, `gps`, `captured_at`, `captured_by`. Tied to a Work Order (and optionally a checklist step), never standalone. |
| Voice notes (audio) | ❌ | `PROOF_OF_WORK_KINDS` is `photo, video, signature, pdf, note`. No `audio` kind. **Real gap** if field crews want to dictate. |
| Before / After comparisons | ⚠️ | Possible to model with a step tag (e.g. `requires_photo` step labeled "Before" then "After"), but there's no first-class pair. No tagging exists yet. |
| Project Feed | ⚠️ | Work-order-level chronology exists via `work_order_events` + `proof_of_work_artifacts.captured_at`, but no curated UI-facing "feed" object. Easy to compose. |
| Tags & Labels | ❌ | No tag entity on artifacts or work orders. **Real gap** for cross-job filtering. |
| Pages (free-form per-project doc) | 🚫 | Worksie's doctrine is "model capability, not catalog." Free-form pages aren't on v1. Notes attach as a proof-of-work `kind = note`. |
| Annotations (draw / text / arrows) | ❌ | Not modeled. Photo files are stored as-is; no overlay layer. **Real gap** for proof-of-work clarity (e.g. "ramp must mount here"). |
| Galleries (shareable photo collection) | 🚫 | No external share-link surface. PRD §"Out of Scope" excludes customer self-service portal beyond sign-off. |
| Timelines (live external link) | 🚫 | Same as Galleries. Customer surface area is sign-off only. |
| Guest access | 🚫 | Same. v1 has no external/guest role; `MEMBERSHIP_ROLES = operator, back_office, contractor, customer` and customer has no portal. |
| Checklists (with required-photo steps) | ✅ ➕ | `checklist_templates` → `checklist_instances` → `checklist_steps` with `requires_photo` and `requires_signature`. Required steps **gate** `in_progress → awaiting_signoff` server-side (`WORK_ORDER_LIFECYCLE.md`). CompanyCam checklists don't gate anything. |
| Time tracking | ⚠️ | No `time_entry` row. Worksie derives hours from work-order start/finish on the `hourly_capped` payout path (`PAYOUT_RULES.md`). Anything more granular (clock-in/out per task) is not modeled. |
| Photo Reports (PDF) | ❌ | No report builder. Could compose from artifacts + line items + sign-off; would need a renderer. **Real gap** for back-office hand-off / customer leave-behind. |
| AI reports / summaries | 🚫 | PRD §"Out of Scope" v1: "AI-generated narrative reports. Reserved for later." |
| Templates (checklist / report / project) | ⚠️ | ChecklistTemplate ✅. ServiceDefinition acts as a project/job template (gear, docs, safety, payout rule) ➕ — strictly richer than CompanyCam's "Project Template." No Report template. |
| Comments, @mentions | 🚫 | PRD §"Out of Scope": "Real-time chat. Notifications only." |
| Mobile + web apps | ✅ | `apps/mobile` (Expo) + `apps/web` (Next.js). Both scaffolded. |
| Offline | ✅ ➕ | First-class doctrine (`OFFLINE_FIRST_ARCHITECTURE.md`): PowerSync + SQLite, four sync classes, server-validated transitions, resumable upload queue. CompanyCam offline is best-effort capture; Worksie reconciles a relational mobile mirror. |
| Integrations | ❌ | No integration surface yet. Stack lists future Stripe Connect, Resend, Twilio — none wired. **Real gap** vs. CompanyCam's 50+ + Zapier. Lower priority for v1. |
| Unlimited cloud storage | ✅ | Supabase Storage. |
| Multi-user / team access | ✅ ➕ | `memberships` + roles + row-level RLS by `tenant_id`. Tenant isolation is a doctrine, not a feature flag. |

## 3. Worksie features CompanyCam does not have

These are the differentiated capabilities the PRD/spine bet on. They
are why "outpace CompanyCam" is the wrong framing — Worksie is a
different product, not a fancier photo app.

| Worksie feature | What it does | Doc / schema anchor |
|---|---|---|
| Compliance gate | W-9, COI, license, insurance, vehicle docs are first-class, expirable, gating. Expired COI auto-blocks dispatch. | `ONBOARDING_FLOWS.md` §"Compliance Gate"; `document_types.gating`; `contractor_documents.{status, expires_on}`. |
| Safety packs + versioned acknowledgements | Per-service safety acks (heavy lifting, electrical, heat, hurricane tie-down). Pack version bump forces re-ack before dispatch. | `safety_packs.version`, `safety_acknowledgements`. |
| Service Definition (capability model) | "What the business can perform" — required gear, docs, safety, checklist template, payout rule. Drives work-order shape at creation. | `service_definitions`; spine doctrine #2. |
| Frozen service snapshot | `work_orders.service_snapshot_json` freezes the rule set at creation, so later config changes don't rewrite past jobs. | Hard Rule #2 (`DOMAIN_MODEL.md`). |
| Work-order state machine | 10 states, server-validated transitions, append-only audit. Mobile *proposes*; server decides. | `WORK_ORDER_LIFECYCLE.md`; `work_order_events` append-only trigger. |
| Server-gated proof-of-work | A work order cannot leave `in_progress` until every required-photo step has a photo and every required-signature step has a signature. | Hard Rule #4. |
| Customer sign-off as a gate | If the snapshot says sign-off required, no `awaiting_signoff → completed` without a `customer_signoffs` row. | `customer_signoffs`; Hard Rule #4. |
| 1099 payout workflow | Weekly Mon–Sun → Mon payout. Modes: `piece_rate`, `completion_flat`, `hourly_capped`. Append-only `payout_lines` with reversal-not-edit semantics. Reproduces year-end 1099 totals. | `PAYOUT_RULES.md`; `payout_periods`, `payout_lines`. |
| Tenant boundary at the row level | Every row carries `tenant_id`. RLS enforced. Tenants cannot read each other's data even on a shared Postgres. | Hard Rule #1; PR #23 RLS layer. |
| Offline-first as architecture, not feature | Four sync classes (`A_reference`, `B_assigned`, `C_append_only`, `D_server_only`). Server validates state changes against the lifecycle; illegal transitions from stale clients are rejected with a user-readable error. | `OFFLINE_FIRST_ARCHITECTURE.md`. |

## 4. Gap classification — what to do about each

### 4a. Deliberate (do not change PRD)

The PRD already names these out of scope for v1. Leave as-is.

- Comments / @mentions / chat → "Real-time chat" (PRD §Out of Scope).
- Guest access / shareable galleries / timelines → "Customer
  self-service portal beyond sign-off" (PRD §Out of Scope).
- AI summaries / narrative reports → "AI-generated narrative reports.
  Reserved for later." (PRD §Out of Scope).
- Free-form Pages → out of step with "model capability, not catalog."
  Notes already exist as a proof-of-work kind.

### 4b. Real gaps worth landing post-Phase-3 (in priority order)

1. **Photo / artifact annotations.** Markup is proof-of-work
   clarity. A `proof_of_work_annotations` table or an annotation JSON
   blob on the artifact would close it. *Lower-effort, high field
   value.*
2. **Tags / labels.** Cross-job filtering ("show me every job that
   had a load-bearing exposure photo") is a back-office workflow
   Worksie will hit fast. Recommend a polymorphic `tags` table scoped
   by `tenant_id`.
3. **Photo Reports (PDF).** Compose work-order + artifacts + sign-off
   + line items into a branded PDF. Already 80% derivable from
   existing data; needs a renderer. Pair with a `report_templates`
   table when it lands.
4. **Audio / voice notes.** Add `audio` to `PROOF_OF_WORK_KINDS` (and
   the matching enum migration). Mobile capture + Supabase Storage
   already cover the file path. Small.
5. **Time entries.** Granular clock-in/out per work order step.
   `hourly_capped` payout currently relies on work-order start/finish
   timestamps, which is coarse. Defer unless an operator demands it.
6. **Before / After pairs.** Could fall out of (1) + (2) (tag two
   artifacts "before"/"after" with a shared pair id). No new entity
   needed.
7. **Integrations.** Zapier-class outbound webhooks on `work_order_events`
   + a small inbound API would cover most of CompanyCam's 50+
   integrations. Stripe Connect is already on the stack roadmap for
   payout.

### 4c. Not gaps — Worksie wins

- Compliance-gated dispatch, payout workflow, multi-tenant by row,
  offline-first as architecture, frozen rule snapshots, append-only
  audit. CompanyCam does not occupy this surface.

## 5. PRD / Spine consistency check

The PRD and spine are **internally consistent** with this competitive
positioning. No edits required by this review.

Specifically:

- `WORKSIE_SPINE.md` §"What Worksie Is" says explicitly: *"Worksie is
  not another CRM or another photo log. The previous framing
  ('outpace CompanyCam') is retired."* That is consistent with
  treating photo galleries, public timelines, free-form Pages, and
  AI reports as out of v1.
- `PRD.md` §"Explicitly Out of Scope (v1)" already enumerates: chat,
  AI narrative reports, template marketplace, customer self-service
  portal beyond sign-off. Every CompanyCam feature marked 🚫 above
  maps cleanly to one of those bullets.
- `PRD.md` §"Non-Negotiables" — "Field UI must work offline. Required
  documents must be expirable and must gate dispatch. Proof-of-work
  artifacts are bound to a work order and never standalone." — is
  what produces the differentiated capabilities in §3. The schema in
  `packages/db/src/schema/tables.ts` enforces them at the DB level
  (Hard Rules #1–#6).
- `DOMAIN_MODEL.md` §"Hard Rules" matches schema and matches PRD.

**One PRD addition worth considering** (not required to ship this
review): when (4b) items land, the PRD §"Out of Scope" list should be
trimmed for the ones that are now in scope, and `WORKSIE_SPINE.md`
should pick up annotations / tags / reports under doctrine #4
("proof-of-work over status") since they're proof-of-work surface
enhancements, not photo-log creep.

## 6. Recommendation

1. **No PRD/spine changes today.** The documents are consistent with
   Worksie's actual scope and with the CompanyCam delta.
2. **Open follow-up tickets** for §4b items 1–4 (annotations, tags,
   PDF reports, audio kind) — they are real, low-doctrine-risk
   proof-of-work improvements.
3. **Do not pursue** §4a items (chat, galleries, AI summaries, free-
   form Pages). They are CompanyCam's product, not Worksie's.
4. **When integrations matter**, prefer an outbound webhook on
   `work_order_events` (already append-only) plus a narrow inbound
   REST surface. That covers most Zapier-style use cases without
   building 50+ direct connectors.

## 7. Sources

- [CompanyCam — Features](https://companycam.com/features)
- [CompanyCam — Advanced Features](https://companycam.com/advanced-features)
- [CompanyCam — Checklists](https://companycam.com/advanced-features/checklists)
- [CompanyCam — Templates](https://companycam.com/advanced-features/templates)
- [GetApp — CompanyCam 2026](https://www.getapp.com/operations-management-software/a/companycam/)
- [Software Advice — CompanyCam](https://www.softwareadvice.com/field-service/companycam-profile/)
- Worksie repo: `docs/WORKSIE_SPINE.md`, `docs/PRD.md`,
  `docs/DOMAIN_MODEL.md`, `docs/WORK_ORDER_LIFECYCLE.md`,
  `docs/ONBOARDING_FLOWS.md`, `docs/PAYOUT_RULES.md`,
  `docs/OFFLINE_FIRST_ARCHITECTURE.md`,
  `packages/db/src/schema/tables.ts`,
  `packages/domain/src/index.ts`.
