// Shared cross-package utility types. Phase 2 grows this as needed; for
// now it carries only the universal primitives so workspaces can depend
// on it without churn.

export type Brand<T, B extends string> = T & { readonly __brand: B };

export type Iso8601 = Brand<string, "Iso8601">;
export type Uuid = Brand<string, "Uuid">;
export type TenantId = Brand<string, "TenantId">;
