---
title: Worksie - Phase 3 Review Checklist
status: draft
version: v0.1
owner: AJ Digital LLC / Audio Jones
related_safe_gate_review: docs/reviews/WORKSIE_GTM_SAFE_GATE_REVIEW.md
created: 2026-06-02
updated: 2026-06-02
---

# Worksie - Phase 3 Review Checklist

This checklist controls review of Phase 3 database, auth, RLS, and tenant
boundary work. It is written for PR #31 first, then PR #26 after PR #31 is
resolved.

It does not approve, merge, close, or replace either PR.

## 1. Review Order

Recommended order:

1. Review PR #31: `fix(db): harden Phase 2 schema - RLS roles, tenant FKs,
   append-only cascades`.
2. Decide whether PR #31 should be refreshed, split, merged, or replaced.
3. Only after PR #31 disposition is known, re-review PR #26:
   `feat(auth): Phase 3 tenant/auth boundary foundation`.
4. Decide whether PR #26 should be rebased on PR #31, split, or replaced by a
   smaller auth-boundary PR.

Reason: PR #31 changes the schema/RLS/migration base that PR #26 depends on.
Reviewing auth before the database boundary is settled risks validating the
wrong foundation.

## 2. PR #31 Scope To Verify

PR #31 should be treated as a database-boundary hardening PR. Confirm that it
does only the following:

- Hardens tenant-scoped foreign keys.
- Fixes append-only work-order event behavior without breaking referential
  actions.
- Tightens RLS policy write access.
- Adds indexes required by the new FK/policy shape.
- Updates CI to include relevant test execution.
- Updates migrations and Drizzle metadata consistently.

Anything outside those boundaries should be called out before merge.

## 3. PR #31 File Targets

Review these files first:

| File | What to verify |
|---|---|
| `.github/workflows/ci.yml` | CI adds tests without removing lint/typecheck/build coverage. |
| `.npmrc` | Hoist pattern is specific and justified; it does not mask unrelated package issues. |
| `packages/db/src/schema/tables.ts` | Composite tenant FKs, unique constraints, indexes, and delete actions match the domain rules. |
| `supabase/migrations/0000_phase_2_canonical_schema.sql` | Regenerated migration matches Drizzle schema and does not drift from canonical entities. |
| `supabase/migrations/0001_phase_2_rls_and_audit.sql` | RLS roles, helper functions, search path, grants, and append-only trigger behavior are safe. |
| `supabase/migrations/0002_phase_2_tenant_scoped_fks.sql` | Hand-written FK migration is ordered safely and preserves nullable tenant-scoped references. |
| `supabase/migrations/meta/0000_snapshot.json` | Snapshot reflects schema changes; no unrelated churn. |
| `supabase/migrations/meta/_journal.json` | Journal state is consistent with the migration runner strategy. |

## 4. Required Validation

Minimum commands before a merge recommendation:

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm test
```

Database validation must also run against a fresh local PostgreSQL/Supabase
compatible target. It should prove:

- Cross-tenant FK references fail.
- Same-tenant FK references pass.
- RLS denies unauthenticated access by default.
- Active tenant members can read appropriate tenant data.
- Non-admin members cannot write financial, compliance, or configuration
  tables unless the domain rule explicitly allows it.
- Append-only `work_order_events` blocks direct update/delete.
- Referential cascades or `SET NULL` actions still work where intended.
- Tenant delete behavior is explicit and tested.
- Re-running local reset/migration paths does not silently skip security
  policy setup.

## 5. Pass Criteria

PR #31 can receive a positive review only if:

- No canonical entity drift is introduced.
- Firebase, Prisma, OpenAPI, Stripe, payouts execution, and product UI remain
  out of scope.
- Tenant isolation is enforced at DB level, not only in application code.
- Admin/write policies are narrower than member/read policies.
- Migration ordering is compatible with a fresh local database.
- The append-only audit log remains directly immutable.
- CI is equal or stronger than current `main`.
- The PR body lists exact validation commands and results.

## 6. Stop Conditions

Stop and ask Audio before:

- Merging PR #31.
- Rewriting or deleting migrations on `main`.
- Accepting a schema shape that changes the canonical entity model.
- Making a production Supabase/Vercel change.
- Handling secrets, service-role keys, client data, or live tenant data.
- Treating PR #31 as approval to begin product feature implementation.

## 7. PR #26 Re-Review After PR #31

After PR #31 disposition is known, review PR #26 against the settled database
boundary.

Key questions:

- Does PR #26 still apply cleanly after PR #31?
- Does the tenant resolver rely on policies or helper functions changed by
  PR #31?
- Are service-role helpers server-only and impossible to import from client
  components?
- Does middleware rotate Supabase auth cookies without leaking server-only
  values?
- Does `/me` stay a diagnostic/auth-boundary surface rather than product UI?
- Does the RLS verification harness still pass against the final migrations?
- Should PR #26 be split into auth package, web wiring, RLS verifier, and docs?

## 8. Recommended Outcome Sequence

1. Complete a code-review pass on PR #31.
2. If clean, ask Audio for merge approval.
3. If approved and merged, update `main`.
4. Rebase or refresh PR #26 on the new `main`.
5. Run the full validation set again.
6. Only then ask Audio whether Phase 3 auth-boundary work can merge.

## 9. Change Log

- v0.1 | 2026-06-02 | Added Phase 3 review order, PR #31 file targets,
  validation criteria, stop conditions, and PR #26 follow-up review questions.
