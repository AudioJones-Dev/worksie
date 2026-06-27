# Phase 3 — Tenant / Auth Boundary

This document captures the minimal contract added in Phase 3: Supabase
Auth identity, the tenant-context resolver, RLS verification, and the
single protected route (`/me`).

Phase 3 is intentionally boundary-only. There is no product UI, no work
order workflow, no payout execution, no Stripe/Resend/Twilio, no
PowerSync. Those land in Phase 4+.

## Architecture

```
+----------------------------+      +-------------------------------+
|  apps/web (Next 15 App)    |      |  Supabase                     |
|  - middleware.ts           |<---->|  - Auth (auth.users)          |
|  - /me page                |      |  - Postgres + RLS             |
|  - lib/supabase/{browser,  |      |  - canonical 21-entity schema |
|     server}.ts             |      |    (PR #23 — unchanged)       |
|  - lib/tenant/context.ts   |      +-------------------------------+
+----------------------------+
              |
              v
    +---------------------+
    |  @worksie/auth      |  (transport-free)
    |  - env validation   |
    |  - tenant resolver  |
    +---------------------+
```

Identity: Supabase Auth issues `auth.users.id`. A local `public.users`
row links to it via `auth_user_id` (1:1 unique). Tenant access lives in
`public.memberships`. RLS uses `public.worksie_current_tenant_ids()`
(defined in `0001_phase_2_rls_and_audit.sql`) to scope reads/writes.

## Env contract

Copy `.env.example` to `.env.local` (at the repo root for the web app,
and again for scripts that need the service-role key — see below).

| Variable                          | Where it's read                       | Bundle |
|-----------------------------------|---------------------------------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL`        | browser + server runtime              | ✅ browser-safe |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | browser + server runtime              | ✅ browser-safe |
| `SUPABASE_URL`                    | server-only scripts                   | ❌ server-only |
| `SUPABASE_SERVICE_ROLE_KEY`       | server-only scripts                   | ❌ server-only |
| `WORKSIE_VERIFY_DATABASE_URL`     | `scripts/verify-rls` (optional)        | ❌ server-only |

`@worksie/auth` exposes two separate readers:
`readSupabasePublicEnv()` for the browser-safe pair and
`readSupabaseServiceRoleEnv()` for the server-only pair. The names are
deliberately long so a code-review pass can catch the service-role
helper being imported into a client component.

## Tenant context resolver

`@worksie/auth/tenant#resolveTenantContext` takes preloaded values
(`authUser`, `user`, `memberships`, plus a `loadTenant` callback) and
returns one of:

| Outcome             | When                                                     |
|---------------------|----------------------------------------------------------|
| `ok: true`          | Single active membership, or `preferredTenantId` matches |
| `unauthenticated`   | No Supabase session                                      |
| `no_user_row`       | Session present but no `public.users` row yet            |
| `no_membership`     | User exists but zero memberships                         |
| `no_active_membership` | All memberships are `invited` or `suspended`          |
| `multiple_memberships` | More than one `active` membership and no preference   |

`multiple_memberships` is deliberately an error rather than a silent
pick. Phase 4+ will add an explicit tenant switcher.

## Protected route

- `/me` (server component) renders the resolver's output verbatim.
  No mutations, no product surface.
- Unauthenticated visitors are redirected to `/?notice=signin_required`
  by `apps/web/src/middleware.ts`.

## Running locally

### 1. Boot Supabase

```bash
supabase start
supabase db reset    # applies supabase/migrations/0000_*.sql and 0001_*.sql
```

### 2. Create test auth users

In Supabase Studio (`http://127.0.0.1:54323`):

1. Auth → Users → Add user.
2. Create `operator-a@worksie.test` and `operator-b@worksie.test`.
3. Copy each user's id (the `auth.users.id` UUID).

### 3. Seed tenant + memberships

Edit `supabase/seed/phase3-auth-fixtures.sql`, paste the two auth UUIDs
into the `\set auth_a_id` / `\set auth_b_id` lines, then:

```bash
psql "postgres://postgres:postgres@127.0.0.1:54322/postgres" \
  -f supabase/seed/phase3-auth-fixtures.sql
```

### 4. Web app

```bash
cp .env.example apps/web/.env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
# from `supabase status` output.

pnpm --filter @worksie/web dev
# Visit http://127.0.0.1:3000/me — middleware will redirect you to /
# until you sign in (Phase 4 will add the sign-in surface; Phase 3
# expects the session to be established via the Supabase JS client or
# Studio's user impersonation flow).
```

### 5. RLS verification

The harness connects directly to Postgres (not via the Supabase REST
gateway). You have two options:

**A. Against a running Supabase local stack** — the canonical flow:

```bash
pnpm --filter @worksie/verify-rls verify
# Defaults WORKSIE_VERIFY_DATABASE_URL to
# postgres://postgres:postgres@127.0.0.1:54322/postgres (Supabase CLI).
```

**B. Against a bare Postgres 16** — useful in CI where booting the full
Supabase Docker stack is too heavy. The harness only needs `auth.uid()`,
the `authenticated` role, and the `service_role` role. Apply the stub
file before the canonical migrations:

```bash
createdb worksie_verify
psql -d worksie_verify -v ON_ERROR_STOP=1 \
  -f scripts/verify-rls/sql/00_supabase_auth_stubs.sql
psql -d worksie_verify -v ON_ERROR_STOP=1 \
  -f supabase/migrations/0000_phase_2_canonical_schema.sql
psql -d worksie_verify -v ON_ERROR_STOP=1 \
  -f supabase/migrations/0001_phase_2_rls_and_audit.sql

WORKSIE_VERIFY_DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/worksie_verify \
  pnpm --filter @worksie/verify-rls verify
```

The harness:

- Default-deny: an unauthenticated `authenticated` session reads zero
  rows from `work_orders`.
- Tenant isolation read: User A sees only Tenant A's rows; User B sees
  only Tenant B's.
- Tenant isolation write: User A cannot INSERT a customer carrying
  Tenant B's `tenant_id` (RLS `WITH CHECK` fails).
- Append-only via RLS: UPDATE/DELETE on `work_order_events` under a
  foreign tenant returns zero rows (the row is hidden).
- Append-only via trigger: with RLS bypassed (privileged role), the
  append-only trigger still raises on UPDATE/DELETE.

A successful run prints `verify-rls: 8/8 passed` and exits 0.

## Security risk analysis

| Risk                                 | Mitigation                                |
|--------------------------------------|-------------------------------------------|
| Service-role key in browser bundle   | Separate env reader; only `NEXT_PUBLIC_*` referenced in browser code; transpile boundary stops at `@worksie/auth`. |
| Cross-tenant read                    | RLS policies (`0001_phase_2_rls_and_audit.sql`) + verified by `scripts/verify-rls`. |
| Cross-tenant write                   | `WITH CHECK (tenant_id IN ...)` on every policy + verified by harness. |
| Silent tenant pick across memberships| `resolveTenantContext` errors with `multiple_memberships` until the caller passes an explicit `preferredTenantId`. |
| `work_order_events` tamper           | RLS hides foreign rows; trigger raises even when RLS is bypassed. |
| Stale session                        | `middleware.ts` calls `supabase.auth.getUser()` on every request, which rotates an expiring access token via `@supabase/ssr`'s cookie bridge. |
| First-login bootstrap                | The `no_user_row` branch in the resolver communicates the missing `public.users` row explicitly instead of silently passing as unauthenticated. |

## Issue #25 follow-ups

Phase 3 does not close any of the five hardening items in
`docs/reviews/PR-23-phase-2-schema.md` §7 / issue #25. Those remain a
focused hardening pass on a separate branch.
