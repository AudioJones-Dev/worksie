"use client";

// Browser Supabase client. Wraps @supabase/ssr's createBrowserClient so
// the session is read from cookies set by the server runtime. Only the
// NEXT_PUBLIC_* env vars are referenced here — Next.js inlines those at
// build time, so this file is safe to ship to the browser bundle.
//
// The service-role key MUST NOT be imported into any module that this
// one transitively pulls in. @worksie/auth's `readSupabaseServiceRoleEnv`
// is the only entry point for the service-role key and it is documented
// as server-only.

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function getBrowserSupabaseClient(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase browser client is missing NEXT_PUBLIC_SUPABASE_URL / " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY. See docs/PHASE_3_AUTH.md."
    );
  }
  cached = createBrowserClient(url, anonKey);
  return cached;
}
