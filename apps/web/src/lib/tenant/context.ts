// Server-only tenant-context loader. Wires the Supabase server client
// into @worksie/auth's `resolveTenantContext`. All reads go through the
// authenticated Supabase client so RLS is the boundary — this code does
// NOT use the service-role key.
//
// We only read three canonical tables: `users`, `memberships`, and
// `tenants`. No product tables. No mutations.

import "server-only";

import {
  describeTenantContextError,
  resolveTenantContext,
  type AppUser,
  type AuthUser,
  type Membership,
  type Tenant,
  type TenantContextResult
} from "@worksie/auth";
import type {
  MembershipRole,
  MembershipStatus
} from "@worksie/domain";

import { getServerSupabaseClient } from "@/lib/supabase/server";

type MembershipRow = {
  id: string;
  tenant_id: string;
  user_id: string;
  role: string;
  status: string;
};

type UserRow = {
  id: string;
  auth_user_id: string;
  email: string;
  display_name: string | null;
  phone: string | null;
};

type TenantRow = {
  id: string;
  name: string;
  timezone: string;
};

export async function loadCurrentTenantContext(options: {
  preferredTenantId?: string;
} = {}): Promise<TenantContextResult> {
  const supabase = await getServerSupabaseClient();

  const {
    data: { user: sessionUser }
  } = await supabase.auth.getUser();

  const authUser: AuthUser | null = sessionUser
    ? {
        authUserId: sessionUser.id,
        email: sessionUser.email ?? ""
      }
    : null;

  // Pre-load via the same authenticated session. RLS will hide rows the
  // caller cannot see — exactly the behaviour the resolver expects.
  const user = authUser ? await fetchAppUser(supabase, authUser.authUserId) : null;
  const memberships = user ? await fetchMemberships(supabase, user.id) : [];

  return resolveTenantContext({
    authUser,
    user,
    memberships,
    preferredTenantId: options.preferredTenantId,
    loadTenant: (tenantId) => fetchTenant(supabase, tenantId)
  });
}

async function fetchAppUser(
  supabase: Awaited<ReturnType<typeof getServerSupabaseClient>>,
  authUserId: string
): Promise<AppUser | null> {
  const { data } = await supabase
    .from("users")
    .select("id, auth_user_id, email, display_name, phone")
    .eq("auth_user_id", authUserId)
    .maybeSingle<UserRow>();

  if (!data) return null;
  return {
    id: data.id,
    authUserId: data.auth_user_id,
    email: data.email,
    displayName: data.display_name,
    phone: data.phone
  };
}

async function fetchMemberships(
  supabase: Awaited<ReturnType<typeof getServerSupabaseClient>>,
  userId: string
): Promise<Membership[]> {
  const { data } = await supabase
    .from("memberships")
    .select("id, tenant_id, user_id, role, status")
    .eq("user_id", userId)
    .returns<MembershipRow[]>();

  if (!data) return [];
  return data.map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    userId: row.user_id,
    role: row.role as MembershipRole,
    status: row.status as MembershipStatus
  }));
}

async function fetchTenant(
  supabase: Awaited<ReturnType<typeof getServerSupabaseClient>>,
  tenantId: string
): Promise<Tenant | null> {
  const { data } = await supabase
    .from("tenants")
    .select("id, name, timezone")
    .eq("id", tenantId)
    .maybeSingle<TenantRow>();

  if (!data) return null;
  return { id: data.id, name: data.name, timezone: data.timezone };
}

export { describeTenantContextError };
