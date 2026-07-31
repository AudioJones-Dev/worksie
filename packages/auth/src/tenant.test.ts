import { describe, expect, it, vi } from "vitest";

import {
  describeTenantContextError,
  resolveTenantContext,
  type AppUser,
  type AuthUser,
  type Membership,
  type Tenant,
  type TenantContextErrorReason
} from "./tenant";

const AUTH_USER: AuthUser = {
  authUserId: "auth-1",
  email: "operator@example.com"
};

const APP_USER: AppUser = {
  id: "user-1",
  authUserId: "auth-1",
  email: "operator@example.com",
  displayName: "Operator",
  phone: null
};

const TENANT_A: Tenant = { id: "tenant-a", name: "Tenant A", timezone: "UTC" };
const TENANT_B: Tenant = { id: "tenant-b", name: "Tenant B", timezone: "UTC" };

const TENANTS: Record<string, Tenant> = {
  "tenant-a": TENANT_A,
  "tenant-b": TENANT_B
};

function membership(overrides: Partial<Membership> = {}): Membership {
  return {
    id: "membership-1",
    tenantId: "tenant-a",
    userId: "user-1",
    role: "operator",
    status: "active",
    ...overrides
  };
}

const loadTenant = (tenantId: string): Tenant | null =>
  TENANTS[tenantId] ?? null;

describe("resolveTenantContext", () => {
  it("fails unauthenticated when there is no auth user", async () => {
    const result = await resolveTenantContext({
      authUser: null,
      user: APP_USER,
      memberships: [membership()],
      loadTenant
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("unauthenticated");
    // A failure must not leak identity it could not establish.
    expect(result.authUser).toBeNull();
    expect(result.user).toBeNull();
    expect(result.memberships).toEqual([]);
  });

  it("fails no_user_row when authenticated but no public.users row exists", async () => {
    const result = await resolveTenantContext({
      authUser: AUTH_USER,
      user: null,
      memberships: [membership()],
      loadTenant
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("no_user_row");
    expect(result.authUser).toEqual(AUTH_USER);
    expect(result.user).toBeNull();
  });

  it("fails no_membership when the user has none", async () => {
    const result = await resolveTenantContext({
      authUser: AUTH_USER,
      user: APP_USER,
      memberships: [],
      loadTenant
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("no_membership");
  });

  it("fails no_active_membership when every membership is inactive", async () => {
    const memberships = [
      membership({ id: "m-invited", status: "invited" }),
      membership({ id: "m-suspended", status: "suspended" })
    ];

    const result = await resolveTenantContext({
      authUser: AUTH_USER,
      user: APP_USER,
      memberships,
      loadTenant
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("no_active_membership");
    // The caller needs the memberships back to render a useful message.
    expect(result.memberships).toEqual(memberships);
  });

  it("resolves when exactly one membership is active", async () => {
    const result = await resolveTenantContext({
      authUser: AUTH_USER,
      user: APP_USER,
      memberships: [
        membership({ id: "m-suspended", status: "suspended" }),
        membership({ id: "m-active" })
      ],
      loadTenant
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.membership.id).toBe("m-active");
    expect(result.tenant).toEqual(TENANT_A);
  });

  it("refuses to guess between multiple active memberships", async () => {
    const result = await resolveTenantContext({
      authUser: AUTH_USER,
      user: APP_USER,
      memberships: [
        membership({ id: "m-a", tenantId: "tenant-a" }),
        membership({ id: "m-b", tenantId: "tenant-b" })
      ],
      loadTenant
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("multiple_memberships");
  });

  it("honours preferredTenantId when it matches an active membership", async () => {
    const result = await resolveTenantContext({
      authUser: AUTH_USER,
      user: APP_USER,
      memberships: [
        membership({ id: "m-a", tenantId: "tenant-a" }),
        membership({ id: "m-b", tenantId: "tenant-b" })
      ],
      loadTenant,
      preferredTenantId: "tenant-b"
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.membership.id).toBe("m-b");
    expect(result.tenant).toEqual(TENANT_B);
  });

  it("does not fall back to another tenant when preferredTenantId matches nothing", async () => {
    const result = await resolveTenantContext({
      authUser: AUTH_USER,
      user: APP_USER,
      memberships: [
        membership({ id: "m-a", tenantId: "tenant-a" }),
        membership({ id: "m-b", tenantId: "tenant-b" })
      ],
      loadTenant,
      preferredTenantId: "tenant-zzz"
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("preferred_tenant_unavailable");
  });

  it("honours preferredTenantId when it matches the single active membership", async () => {
    const result = await resolveTenantContext({
      authUser: AUTH_USER,
      user: APP_USER,
      memberships: [membership({ id: "m-a", tenantId: "tenant-a" })],
      loadTenant,
      preferredTenantId: "tenant-a"
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.membership.id).toBe("m-a");
    expect(result.tenant).toEqual(TENANT_A);
  });

  it("fails rather than substituting the sole active membership for a mismatched preferredTenantId", async () => {
    // The guarantee is "you get the tenant you asked for, or an error",
    // and it must not depend on how many memberships the user happens to
    // have. A stale tenant pin (URL segment, cookie) after a membership
    // move would otherwise land the caller in tenant-a while their pin
    // still says tenant-b — the silent wrong-tenant default that Hard
    // Rule #1 exists to prevent.
    const result = await resolveTenantContext({
      authUser: AUTH_USER,
      user: APP_USER,
      memberships: [membership({ id: "m-a", tenantId: "tenant-a" })],
      loadTenant,
      preferredTenantId: "tenant-b"
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("preferred_tenant_unavailable");
  });

  it("reports the same reason for a mismatched pick regardless of membership count", async () => {
    // Guards the ordering fix directly: one cause, one reason. Before the
    // fix these two shapes diverged (error vs. silent success).
    const one = await resolveTenantContext({
      authUser: AUTH_USER,
      user: APP_USER,
      memberships: [membership({ id: "m-a", tenantId: "tenant-a" })],
      loadTenant,
      preferredTenantId: "tenant-zzz"
    });
    const many = await resolveTenantContext({
      authUser: AUTH_USER,
      user: APP_USER,
      memberships: [
        membership({ id: "m-a", tenantId: "tenant-a" }),
        membership({ id: "m-b", tenantId: "tenant-b" })
      ],
      loadTenant,
      preferredTenantId: "tenant-zzz"
    });

    expect(one.ok).toBe(false);
    expect(many.ok).toBe(false);
    if (one.ok || many.ok) return;
    expect(one.reason).toBe("preferred_tenant_unavailable");
    expect(many.reason).toBe(one.reason);
  });

  it("does not resolve a preferred tenant the user is only inactively a member of", async () => {
    const result = await resolveTenantContext({
      authUser: AUTH_USER,
      user: APP_USER,
      memberships: [
        membership({ id: "m-a", tenantId: "tenant-a" }),
        membership({ id: "m-b", tenantId: "tenant-b", status: "suspended" })
      ],
      loadTenant,
      preferredTenantId: "tenant-b"
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("preferred_tenant_unavailable");
  });

  it("collapses an unreadable tenant row into no_active_membership", async () => {
    // RLS hid the row or it was deleted between checks. The resolver
    // deliberately does not distinguish this from "no access" so callers
    // cannot probe for tenant existence.
    const result = await resolveTenantContext({
      authUser: AUTH_USER,
      user: APP_USER,
      memberships: [membership({ tenantId: "tenant-gone" })],
      loadTenant
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("no_active_membership");
  });

  it("accepts an async loadTenant", async () => {
    const asyncLoad = vi.fn(async (id: string) => TENANTS[id] ?? null);

    const result = await resolveTenantContext({
      authUser: AUTH_USER,
      user: APP_USER,
      memberships: [membership()],
      loadTenant: asyncLoad
    });

    expect(result.ok).toBe(true);
    expect(asyncLoad).toHaveBeenCalledWith("tenant-a");
  });

  it("does not load a tenant when resolution fails earlier", async () => {
    const spy = vi.fn(loadTenant);

    await resolveTenantContext({
      authUser: AUTH_USER,
      user: APP_USER,
      memberships: [],
      loadTenant: spy
    });

    expect(spy).not.toHaveBeenCalled();
  });
});

describe("describeTenantContextError", () => {
  const reasons: readonly TenantContextErrorReason[] = [
    "unauthenticated",
    "no_user_row",
    "no_membership",
    "no_active_membership",
    "multiple_memberships",
    "preferred_tenant_unavailable"
  ];

  it.each(reasons)("returns operator-facing copy for %s", (reason) => {
    const message = describeTenantContextError(reason);
    expect(message.length).toBeGreaterThan(0);
    // Operator-facing copy, so it must not echo the internal enum name.
    expect(message).not.toContain(reason);
  });

  it("gives every reason a distinct message", () => {
    const messages = reasons.map(describeTenantContextError);
    expect(new Set(messages).size).toBe(reasons.length);
  });
});
