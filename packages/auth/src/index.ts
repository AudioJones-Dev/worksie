// @worksie/auth — Phase 3 tenant/auth boundary primitives.
//
// This package is intentionally transport-free. It exposes:
//   - typed Supabase env validators (public + service-role kept separate)
//   - the tenant-context resolver and its error model
//
// Web/server callers wire a Supabase client + DB lookups on top of these.

export {
  readSupabasePublicEnv,
  readSupabaseServiceRoleEnv,
  type SupabasePublicEnv,
  type SupabaseServiceRoleEnv
} from "./env";

export {
  resolveTenantContext,
  describeTenantContextError,
  type AppUser,
  type AuthUser,
  type Membership,
  type Tenant,
  type TenantContextErrorReason,
  type TenantContextInputs,
  type TenantContextResult
} from "./tenant";
