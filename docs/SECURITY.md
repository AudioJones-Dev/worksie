# Worksie — Security & Secrets Policy

> Status: **draft v0.1**. These rules apply to humans and to AI coding
> agents. Read `CLAUDE.md` for the agent-specific short version.

---

## 1. What must never enter the repo

The following must never be committed in any form (source file,
fixture, dataset entry, screenshot, log, doc, or commit message):

- Real Firebase web config values that correspond to a non-public /
  non-throwaway project.
- Firebase **service-account JSON** files. These are admin credentials.
- Stripe **secret** keys (`sk_live_…`, `sk_test_…`) or webhook signing
  secrets.
- Any `.env`, `.env.local`, or `.env.*.local` file.
- VAPID **private** keys (the public key may live in env, never the
  private one).
- Personal access tokens (GitHub, Firebase CLI tokens, etc.).
- Customer data of any kind.

`.gitignore` enforces some of this. It is not a substitute for
attention.

## 2. The Firebase web-config caveat

Firebase's web config values (`apiKey`, `authDomain`, `projectId`,
`storageBucket`, `messagingSenderId`, `appId`) are **technically public**
— a determined user can extract them from a deployed app. They are
not authentication credentials.

That does **not** mean we hard-code them. They still vary by
environment, and pasting them into the source tree makes it hard to
switch projects, easy to leak the wrong project's values into the
wrong build, and easy to confuse them with real secrets later.

**Rule:** Firebase web config values always come from environment
variables. See `Worksie/.env.example` for the canonical list.

## 3. The service-worker pattern

`Worksie/public/firebase-messaging-sw.js` runs in a service-worker
context that **cannot read Vite's `import.meta.env`**. Earlier
versions of this file shipped placeholder strings (`"YOUR_API_KEY"`,
…) with instructions to hand-edit the file with real values. That is
the wrong pattern: it actively encourages committing real Firebase
config to git the moment someone follows the README.

**The current approved pattern is:**

1. `firebase-messaging-sw.js` is committed and imports its config from
   a sibling file: `public/firebase-messaging-sw-config.js`.
2. `firebase-messaging-sw-config.js` is **not committed** (it is in
   `.gitignore`). Developers create it locally from
   `firebase-messaging-sw-config.example.js`.
3. The example file ships placeholder values that are obviously fake
   (`__FIREBASE_API_KEY__`) so accidental commits stand out in code
   review.

Do not revert this pattern. Do not paste real config into the SW file
"just for testing" — service-worker files are aggressively cached and
will outlive the test.

## 4. Stripe

- Only the **publishable** key may appear in the frontend bundle, and
  even then it comes from an env var.
- All Stripe secret keys live server-side (planned: Firebase Cloud
  Functions). No client code should ever reference a Stripe secret
  key.
- Webhook signing secrets live in Cloud Functions env, never in repo.

## 5. Push notification keys

- The VAPID **public** key is supplied via `VITE_FIREBASE_VAPID_KEY`.
- The VAPID **private** key lives in the Firebase project's Cloud
  Messaging settings. It must never appear in this repository.

## 6. If a secret leaks

1. **Rotate immediately** in the providing console (Firebase, Stripe,
   Google Cloud).
2. Remove the value from any future commit.
3. Treat git history as compromised — `git filter-repo` or a rewrite
   may be required depending on disclosure.
4. Document the incident and the rotation in `docs/CHANGELOG.md` under
   a `### Security` heading for that date.

## 7. Agent-specific rules

(Mirrors `CLAUDE.md` for visibility.)

- Agents must not create `.env`, `.env.local`, or any file containing
  real keys.
- Agents must not paste real Firebase config into
  `firebase-messaging-sw.js`. Use the
  `firebase-messaging-sw-config.js` pattern documented above.
- Agents must not run `firebase login` or any command that produces a
  long-lived CLI token in the repo's working directory.
- If an agent encounters what looks like a real secret in a file
  during a task, it must stop and surface the finding to the user
  rather than silently moving it.

## 8. Reporting a vulnerability

There is no public disclosure inbox yet. Until one exists, file a
private GitHub Security Advisory on the repository. **Do not** open a
regular Issue or PR with reproduction details.

Decision tracked in `docs/DECISIONS.md`.
