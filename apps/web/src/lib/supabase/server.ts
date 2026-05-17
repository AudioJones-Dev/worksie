// Server Supabase client for the Next.js App Router. Uses
// @supabase/ssr's cookie bridge so server components and route handlers
// see the same session the browser does.
//
// IMPORTANT: this module is server-only. It uses next/headers, which is
// not callable from a "use client" boundary, so importing it from a
// client component will be a build-time error. We still validate the
// public env here (not the service-role key) — the service-role key is
// available only via `@worksie/auth`'s explicit, separate entry point.

import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { readSupabasePublicEnv } from "@worksie/auth";

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function getServerSupabaseClient(): Promise<SupabaseClient> {
  const env = readSupabasePublicEnv();
  const cookieStore = await cookies();

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSet: CookieToSet[]) {
        // Server components can't write cookies; @supabase/ssr handles
        // that path via middleware. We swallow the write here so a
        // refresh during render doesn't throw. The middleware in
        // apps/web/src/middleware.ts performs the actual rotation.
        try {
          for (const { name, value, options } of toSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Not in a mutable context (e.g. server component render).
        }
      }
    }
  });
}
