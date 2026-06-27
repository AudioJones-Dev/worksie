// Phase 3 protected status page. No product UI — just renders the
// current auth/tenant resolution so an operator can verify the boundary
// is wired up correctly end-to-end:
//
//   1. Supabase session present?
//   2. public.users row joined to auth.users via auth_user_id?
//   3. Active membership(s) visible under RLS?
//   4. Tenant resolved (single vs. multiple)?
//
// Middleware (see ../middleware.ts) already redirects unauthenticated
// visitors away from /me. The "unauthenticated" branch below is a
// belt-and-suspenders fallback in case middleware is bypassed.

import {
  describeTenantContextError,
  loadCurrentTenantContext
} from "@/lib/tenant/context";

export const dynamic = "force-dynamic";

export default async function MePage() {
  const result = await loadCurrentTenantContext();

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Auth / tenant status</h1>
        <p className="text-sm opacity-70 mt-1">
          Phase 3 boundary check. This page intentionally has no product
          functionality.
        </p>
      </header>

      {result.ok ? <ContextOk result={result} /> : <ContextError result={result} />}
    </main>
  );
}

type OkResult = Extract<
  Awaited<ReturnType<typeof loadCurrentTenantContext>>,
  { ok: true }
>;
type ErrResult = Extract<
  Awaited<ReturnType<typeof loadCurrentTenantContext>>,
  { ok: false }
>;

function ContextOk({ result }: { result: OkResult }) {
  return (
    <section className="space-y-4">
      <StatusRow label="Auth user" value={result.authUser.email} />
      <StatusRow label="Worksie user id" value={result.user.id} />
      <StatusRow
        label="Display name"
        value={result.user.displayName ?? "(not set)"}
      />
      <StatusRow label="Tenant" value={result.tenant.name} />
      <StatusRow label="Tenant id" value={result.tenant.id} />
      <StatusRow label="Tenant timezone" value={result.tenant.timezone} />
      <StatusRow label="Membership role" value={result.membership.role} />
      <StatusRow label="Membership status" value={result.membership.status} />
    </section>
  );
}

function ContextError({ result }: { result: ErrResult }) {
  return (
    <section className="space-y-4">
      <div className="rounded border border-amber-400 bg-amber-50 p-4 text-sm">
        <strong className="block">Tenant context unresolved</strong>
        <span>{describeTenantContextError(result.reason)}</span>
        <span className="block mt-1 text-xs opacity-70">
          reason: <code>{result.reason}</code>
        </span>
      </div>
      <StatusRow
        label="Auth user"
        value={result.authUser?.email ?? "(none)"}
      />
      <StatusRow
        label="Worksie user id"
        value={result.user?.id ?? "(none)"}
      />
      <StatusRow
        label="Memberships visible under RLS"
        value={String(result.memberships.length)}
      />
    </section>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between border-b border-black/10 pb-2">
      <span className="text-xs uppercase tracking-wide opacity-60">
        {label}
      </span>
      <span className="font-mono text-sm break-all">{value}</span>
    </div>
  );
}
