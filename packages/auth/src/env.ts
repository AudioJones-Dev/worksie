// Supabase environment validation. The web bundle only ever sees the
// public anon key + URL; the service-role key is intentionally NOT
// readable from this module so it can never accidentally cross into a
// client component. A separate `readServiceRoleEnv()` helper is provided
// for explicit, server-only consumers (RLS verification scripts, future
// admin tasks).

export type SupabasePublicEnv = {
  readonly url: string;
  readonly anonKey: string;
};

export type SupabaseServiceRoleEnv = {
  readonly url: string;
  readonly serviceRoleKey: string;
};

const URL_PATTERN = /^https?:\/\/[^\s]+$/;
const JWT_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

function requireString(
  source: Record<string, string | undefined>,
  key: string
): string {
  const raw = source[key];
  if (typeof raw !== "string" || raw.trim().length === 0) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
        "See docs/PHASE_3_AUTH.md for the Supabase env contract."
    );
  }
  return raw.trim();
}

function assertUrl(value: string, key: string): void {
  if (!URL_PATTERN.test(value)) {
    throw new Error(
      `Environment variable ${key} is not a valid http(s) URL: "${value}".`
    );
  }
}

function assertJwtShape(value: string, key: string): void {
  if (!JWT_PATTERN.test(value)) {
    throw new Error(
      `Environment variable ${key} does not look like a Supabase JWT key. ` +
        "Expected three base64url segments separated by '.'."
    );
  }
}

// Public env. Safe for the browser bundle. NEXT_PUBLIC_* names are
// preserved so Next.js's build-time inlining works.
export function readSupabasePublicEnv(
  source: Record<string, string | undefined> = readEnvSource()
): SupabasePublicEnv {
  const url = requireString(source, "NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = requireString(source, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  assertUrl(url, "NEXT_PUBLIC_SUPABASE_URL");
  assertJwtShape(anonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return { url, anonKey };
}

// Service-role env. NEVER call this from code that ships to the browser.
// The function name is verbose on purpose so a code review can flag it.
export function readSupabaseServiceRoleEnv(
  source: Record<string, string | undefined> = readEnvSource()
): SupabaseServiceRoleEnv {
  const url = requireString(source, "SUPABASE_URL");
  const serviceRoleKey = requireString(source, "SUPABASE_SERVICE_ROLE_KEY");
  assertUrl(url, "SUPABASE_URL");
  assertJwtShape(serviceRoleKey, "SUPABASE_SERVICE_ROLE_KEY");
  return { url, serviceRoleKey };
}

function readEnvSource(): Record<string, string | undefined> {
  // `process` is available under Node and Next.js server runtimes. The
  // browser bundler replaces direct `process.env.NEXT_PUBLIC_*` references
  // with literals, so callers in browser code should pass a literal
  // record instead of relying on this default.
  if (typeof process !== "undefined" && process.env) {
    return process.env as Record<string, string | undefined>;
  }
  return {};
}
