// Edge middleware: refresh the Supabase session cookie on every request
// before the route handler runs. @supabase/ssr expects this so that a
// silently-expired access token gets rotated and downstream server
// components see a valid session.
//
// Protected routes (/me) are also gated here: if the user has no
// session, redirect to / with a notice. We intentionally don't expose
// any product routes yet — Phase 3 is auth/tenant boundary only.

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { readSupabasePublicEnv } from "@worksie/auth";

type CookieToSet = { name: string; value: string; options: CookieOptions };

const PROTECTED_PREFIXES = ["/me"];

export async function middleware(request: NextRequest) {
  const env = readSupabasePublicEnv();

  // We rebuild the response each pass so cookie mutations from the
  // Supabase client (refresh-rotation) make it back to the browser.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(toSet: CookieToSet[]) {
        for (const { name, value } of toSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of toSet) {
          response.cookies.set(name, value, options);
        }
      }
    }
  });

  // Touching getUser() forces token refresh if needed and ensures
  // cookies are rotated via the setAll callback above.
  const { data } = await supabase.auth.getUser();

  if (
    !data.user &&
    PROTECTED_PREFIXES.some((p) => request.nextUrl.pathname.startsWith(p))
  ) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/";
    redirect.searchParams.set("notice", "signin_required");
    return NextResponse.redirect(redirect);
  }

  return response;
}

export const config = {
  // Match everything except Next internals + static assets. We need this
  // to run on /me (protected) and on / (so anonymous sessions still get
  // their cookies refreshed if a future flow needs them).
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
