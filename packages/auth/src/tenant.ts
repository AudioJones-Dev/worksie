// Tenant context primitives. Pure functions over the canonical
// `users` + `memberships` rows; transport (Supabase client, DB client,
// HTTP request) is the caller's concern. This keeps the resolver
// reusable from the web app, the RLS verification script, and future
// server actions.
//
// Error semantics are explicit:
//   - `unauthenticated`     → no Supabase session
//   - `no_user_row`         → session exists but no public.users row yet
//                             (first-login bootstrap or stale token)
//   - `no_membership`       → user exists but has zero memberships
//   - `no_active_membership`→ memberships exist but none are `active`
//   - `multiple_memberships`→ more than one active membership and the
//                             caller did not specify a tenant
//
// The "multiple_memberships" case is intentionally surfaced as an error
// rather than picking one. The product needs a deliberate tenant switcher
// before we silently default someone into the wrong tenant.

import type {
  MembershipRole,
  MembershipStatus
} from "@worksie/domain";

export type AuthUser = {
  readonly authUserId: string;
  readonly email: string;
};

export type AppUser = {
  readonly id: string;
  readonly authUserId: string;
  readonly email: string;
  readonly displayName: string | null;
  readonly phone: string | null;
};

export type Membership = {
  readonly id: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly role: MembershipRole;
  readonly status: MembershipStatus;
};

export type Tenant = {
  readonly id: string;
  readonly name: string;
  readonly timezone: string;
};

export type TenantContextErrorReason =
  | "unauthenticated"
  | "no_user_row"
  | "no_membership"
  | "no_active_membership"
  | "multiple_memberships";

export type TenantContextResult =
  | {
      readonly ok: true;
      readonly authUser: AuthUser;
      readonly user: AppUser;
      readonly membership: Membership;
      readonly tenant: Tenant;
    }
  | {
      readonly ok: false;
      readonly reason: TenantContextErrorReason;
      readonly authUser: AuthUser | null;
      readonly user: AppUser | null;
      readonly memberships: readonly Membership[];
    };

export type TenantContextInputs = {
  readonly authUser: AuthUser | null;
  readonly user: AppUser | null;
  readonly memberships: readonly Membership[];
  // Lookup is supplied by the caller so we don't bind to a particular
  // DB driver here. May be sync (preloaded cache) or async (live query).
  readonly loadTenant: (
    tenantId: string
  ) => Tenant | null | Promise<Tenant | null>;
  // Optional caller-supplied tenant pick. When the user has multiple
  // active memberships the caller may pass the chosen tenant id; if it
  // matches an active membership we resolve to that one instead of
  // erroring with `multiple_memberships`.
  readonly preferredTenantId?: string;
};

export async function resolveTenantContext(
  input: TenantContextInputs
): Promise<TenantContextResult> {
  const { authUser, user, memberships, loadTenant, preferredTenantId } = input;

  if (!authUser) {
    return failure("unauthenticated", null, null, []);
  }
  if (!user) {
    return failure("no_user_row", authUser, null, []);
  }
  if (memberships.length === 0) {
    return failure("no_membership", authUser, user, []);
  }

  const active = memberships.filter((m) => m.status === "active");
  if (active.length === 0) {
    return failure("no_active_membership", authUser, user, memberships);
  }

  let chosen: Membership;
  if (active.length === 1) {
    chosen = active[0]!;
  } else if (preferredTenantId) {
    const match = active.find((m) => m.tenantId === preferredTenantId);
    if (!match) {
      return failure("multiple_memberships", authUser, user, memberships);
    }
    chosen = match;
  } else {
    return failure("multiple_memberships", authUser, user, memberships);
  }

  const tenant = await loadTenant(chosen.tenantId);
  if (!tenant) {
    // RLS hid the row, or it was deleted between checks. Surface this as
    // "no_active_membership" — the caller doesn't have access.
    return failure("no_active_membership", authUser, user, memberships);
  }

  return {
    ok: true,
    authUser,
    user,
    membership: chosen,
    tenant
  };
}

function failure(
  reason: TenantContextErrorReason,
  authUser: AuthUser | null,
  user: AppUser | null,
  memberships: readonly Membership[]
): TenantContextResult {
  return { ok: false, reason, authUser, user, memberships };
}

// Operator-facing summary for the protected status page. Keep this in
// one place so the wording stays consistent.
export function describeTenantContextError(
  reason: TenantContextErrorReason
): string {
  switch (reason) {
    case "unauthenticated":
      return "Not signed in.";
    case "no_user_row":
      return "Signed in, but no Worksie user record exists yet for this account.";
    case "no_membership":
      return "Signed in, but this account has no tenant memberships.";
    case "no_active_membership":
      return "Signed in, but no active tenant membership.";
    case "multiple_memberships":
      return "Signed in with multiple active memberships — tenant must be selected explicitly.";
  }
}
