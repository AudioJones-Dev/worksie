# PR #23 — Phase 2 Canonical Drizzle Schema — Completion Review

**Verdict: `APPROVE_SQUASH_MERGE`**
**Ready for review: yes — PR #23 can be marked ready and squash-merged.**

Branch: `claude/phase-2-domain-schema-tJ146` → `main` · Head: `b164136` · Base: `93e8687` · 9 files · +4,371 / −17

## 1. Verification commands

| Command | Result |
| --- | --- |
| `pnpm lint` | green |
| `pnpm typecheck` | green |
| `pnpm build` | green (web Next.js build emits 3 routes) |
| `psql -f 0000_phase_2_canonical_schema.sql` (fresh PG 16) | green |
| `psql -f 0001_phase_2_rls_and_audit.sql` (fresh PG 16, after auth stubs) | green |

Migrations were applied to a fresh PostgreSQL 16 database with `auth.uid()` and
the `authenticated` / `service_role` roles stubbed (the Supabase-specific
surface the migration depends on).

## 2. Ontology parity — PASS

- `information_schema.tables` returned exactly **21** public base tables.
- Names match `docs/DOMAIN_MODEL.md` and `@worksie/domain` `ENTITY_NAMES`
  one-for-one.
- No `invoices`, `payout_cycles`, generic `audit_events`, or `capabilities`
  table was created. Zero ontology drift.
- `packages/db/src/schema/index.ts` exports a frozen `schema` object whose
  key order is identical to `ENTITY_NAMES`.

## 3. Drizzle schema correctness — PASS

- 8 `pgEnum` types sourced from domain literal arrays (`enums.ts`). A
  domain-level addition will surface as a Drizzle diff.
- `tenant_id` is `NOT NULL` on every non-tenant row.
- `service_definitions.customer_signoff_required boolean NOT NULL DEFAULT false`
  is present (gates the `awaiting_signoff → completed` transition, frozen
  into `service_snapshot_json` at WorkOrder creation per Hard Rule #2).
- `work_orders.service_snapshot_json` is `NOT NULL` with no default —
  callers must provide the frozen snapshot.
- `work_order_events.reason` is enforced by check constraint
  `to_state NOT IN ('cancelled','voided') OR length(btrim(reason)) > 0`.
  Whitespace-only reasons are correctly rejected.
- `document_types.applies_to` is enforced by check constraint to
  `{contractor, business, vehicle}`.
- Tenant-scoped uniques present: `document_types(tenant_id, name)`,
  `service_definitions(tenant_id, name)`, `memberships(tenant_id, user_id)`,
  `safety_packs(tenant_id, name, version)`,
  `payout_periods(tenant_id, period_start, period_end)`,
  `safety_acknowledgements(contractor_membership_id, safety_pack_id)`,
  `checklist_instances(work_order_id)`, `customer_signoffs(work_order_id)`.
- FK delete semantics are sensible: `cascade` from tenant, `restrict` on
  `service_definitions ← work_orders` / `payout_rules ← payout_lines` /
  `work_orders ← payout_lines` (history preserved), `set null` for soft
  references (`assigned_contractor_membership_id`, `created_by`, `actor`,
  `verified_by`, `default_safety_pack_id`, `default_payout_rule_id`,
  `checklist_template_id`, `computed_from`).
- `createDbClient` passes `schema` to `drizzle()` so query builders get
  inferred row/insert types.

## 4. RLS and security — PASS

Verified empirically by setting `ROLE authenticated` and using
`request.jwt.claim.sub` to drive `auth.uid()`:

| Scenario | Expected | Actual |
| --- | --- | --- |
| User A reads `work_orders` | sees only Tenant A | 1 row, Tenant A |
| User B reads `work_orders` | sees only Tenant B | 1 row, Tenant B |
| User A inserts customer with Tenant B `tenant_id` | denied | `new row violates row-level security policy` |
| Empty `sub` (no auth) | zero rows | `count = 0` (default-deny works) |
| User A inserts `work_order_event` in own tenant | accepted | inserted |
| User A UPDATEs an event | zero rows affected | `UPDATE 0` (RLS hides the row) |
| User A DELETEs an event | zero rows affected | `DELETE 0` (RLS hides the row) |
| Superuser UPDATEs an event (RLS bypassed) | trigger raises | `work_order_events is append-only` |
| Superuser DELETEs an event (RLS bypassed) | trigger raises | `work_order_events is append-only` |
| `users` self-visibility | sees self | 1 row |
| `users` shared-tenant visibility | sees co-tenants | 2 rows once shared membership added |

Helper function audit:

- `public.worksie_current_tenant_ids()` is `SECURITY DEFINER`,
  `STABLE`, with `search_path = public` locked. `REVOKE ALL ... FROM PUBLIC;
  GRANT EXECUTE TO authenticated` is in place.
- No recursive RLS issue: the helper reads `memberships`/`users` directly
  under definer privileges, so policies on those tables don't fire.
- Append-only triggers fire `BEFORE UPDATE` and `BEFORE DELETE` on
  `work_order_events`. Defense-in-depth: even if a future policy mistake
  allowed an `authenticated` UPDATE, the trigger would still raise.

## 5. Migration mechanics — PASS

- Drizzle-emitted `0000` uses `CREATE TABLE IF NOT EXISTS`, idempotent FK
  blocks (`DO $$ BEGIN ... EXCEPTION WHEN duplicate_object`), and
  `CREATE INDEX IF NOT EXISTS`. Re-application is safe.
- `0001` orders RLS enable → policies → trigger correctly; depends only on
  the tables created in `0000`.
- Both files apply cleanly to a fresh PG 16 with `auth.uid()` and
  `authenticated` stubbed.

## 6. Scope discipline — PASS

The 9-file delta touches only `packages/db/src/{client.ts,index.ts,schema/*}`
and `supabase/migrations/**`. No UI, API routes, auth flows, Stripe,
PowerSync wiring, product workflows, or non-canonical ontology introduced.

## 7. Non-blocking flags (file in a follow-up, do NOT hold this PR)

1. **0001 is not re-runnable**. `CREATE POLICY` and `CREATE TRIGGER`
   fail on second apply (verified). Supabase CLI's `schema_migrations`
   tracking prevents real re-runs, so this is fine for the normal flow,
   but `DROP POLICY IF EXISTS …` / `CREATE OR REPLACE TRIGGER` would
   harden `supabase db reset` and ad-hoc replays.
2. **Drizzle journal records only 0000**. `0001_phase_2_rls_and_audit.sql`
   is hand-written and sits outside `meta/_journal.json`. Acceptable
   because the project uses Supabase CLI (not `drizzle-kit migrate`) as
   the runner, but worth documenting in `packages/db/README` so nobody
   reaches for `drizzle-kit migrate` and skips the security layer.
3. **`worksie_block_work_order_event_mutation()`** is not `SECURITY
   DEFINER` and has no locked `search_path`. Safe today because the body
   is a single `RAISE EXCEPTION` with no schema lookups, but
   `SET search_path = pg_catalog, public` is free hardening.
4. **Hard Rule #6 not yet enforced at DB level**. The append-only rule
   for `PayoutLine` inside an `approved` `PayoutPeriod` is not yet a
   trigger. Acceptable Phase 3 follow-up — payout computation logic
   doesn't exist yet so this is not exploitable.
5. **`proof_of_work_artifacts.local_file_uri`** is an additive column not
   in `DOMAIN_MODEL.md`. It is consistent with
   `OFFLINE_FIRST_ARCHITECTURE.md`, but if it stays it should be noted in
   `DOMAIN_MODEL.md` so the canonical doc stays the source of truth.
6. **JSONB id arrays** in
   `service_definitions.required_documents` / `required_safety_steps`
   match the spec but will trade off reportability ("find all jobs
   requiring SafetyPack X"). Accept; revisit only if reporting demands
   it.

## 8. Recommendation

Mark PR #23 ready for review, run a final maintainer pass, then
squash-merge. After merge, open follow-up issues for items 1–4 in §7
(non-blocking) and proceed to Phase 3 (tenant/auth boundary foundation)
from clean `main`.
