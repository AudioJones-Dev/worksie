// Phase 3 marketing/landing surface. Intentionally minimal — no product
// UI lives here. The /me route is the protected boundary; this page
// just acknowledges the redirect notice when middleware sent the user
// back because they weren't signed in.

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function Home({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const notice = typeof params.notice === "string" ? params.notice : null;

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-xl text-center">
        <h1 className="text-3xl font-semibold">Worksie</h1>
        <p className="mt-2 text-sm opacity-70">
          Phase 3 scaffold. See <code>/healthz</code> for liveness and
          <code> /me</code> for the protected auth/tenant boundary.
        </p>
        {notice === "signin_required" ? (
          <p className="mt-4 rounded border border-amber-400 bg-amber-50 px-3 py-2 text-sm">
            Sign-in required to view <code>/me</code>.
          </p>
        ) : null}
      </div>
    </main>
  );
}
