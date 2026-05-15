# Worksie — Deployment

> Status: **draft v0.1**. Covers the deploy path that exists today:
> Firebase Hosting for the static bundle, plus an out-of-band Remote
> Config push.

---

## 1. Prerequisites

- A Firebase project with **Hosting**, **Cloud Messaging**, and
  **Remote Config** enabled.
- Firebase CLI installed locally (`npm install -g firebase-tools`).
- Authenticated CLI session (`firebase login`).
- Optional: `gcloud` CLI if you intend to push Remote Config via the
  REST API path described below.

## 2. Environment setup (one-time)

1. From `Worksie/`:
   ```bash
   cp .env.example .env
   ```
2. Fill in the Firebase web config values for the target project.
3. Create the un-tracked service-worker config:
   ```bash
   cp public/firebase-messaging-sw-config.example.js \
      public/firebase-messaging-sw-config.js
   ```
   Then fill in the same values inside the new file. Both files use
   the same six Firebase web config keys; they must match.

   `firebase-messaging-sw-config.js` is gitignored on purpose. Do not
   commit it. See `docs/SECURITY.md`.

## 3. Build & deploy

From `Worksie/`:

```bash
npm install
npm run build
firebase deploy --only hosting
```

`Worksie/scripts/deploy.sh` is a convenience wrapper for the above and
runs from the same directory.

`Worksie/firebase.json` declares:

- `public`: `dist`
- Single-page-app rewrite: every path → `/index.html`
- Ignores `firebase.json`, dotfiles, `**/node_modules/**`

## 4. Remote Config

Live configuration lives in `config/worksie-remote-config.json` at the
repo root (a sibling of `Worksie/`, not inside it).

### 4.1 Push via Firebase REST API

```bash
ACCESS_TOKEN=$(gcloud auth print-access-token)
curl -X PUT \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json; UTF-8" \
  -d @config/worksie-remote-config.json \
  "https://firebaseremoteconfig.googleapis.com/v1/projects/<PROJECT_ID>/remoteConfig"
```

### 4.2 What the app reads

Frontend code reads three keys today
(`Worksie/src/logic/remoteConfig.js` + `App.jsx`):

| Key | Effect |
|---|---|
| `promo_banner_enabled` | Toggles the `<PromoBanner />` component. |
| `promo_banner_text` | Body text shown inside the banner. |
| `app_primary_color` | Sets the `--primary-color` CSS variable. |

Defaults are seeded in `remoteConfig.js`. The minimum fetch interval is
**1 hour**. Changes to Remote Config may take that long to appear in
already-open clients.

## 5. Rollback

There is no automated rollback yet. To revert:

1. **App bundle** — `firebase hosting:clone` or redeploy from a
   previous commit.
2. **Remote Config** — Firebase Console → Remote Config → version
   history → roll back to a previous version.

## 6. CI/CD

Not configured. There is no GitHub Actions workflow today. Phase 1 of
`docs/ROADMAP.md` plans to add one that runs `npm run lint` and
`npm run build` on every PR.

## 7. Environments

Only **production** is configured today. Use a separate Firebase
project (and a separate `.env`) for staging — do not introduce env
suffixes in code until the second environment exists.

## 8. Things that will bite you

- Forgetting to also create `firebase-messaging-sw-config.js` — the
  service worker silently fails to deliver push notifications.
- Editing `Worksie/firebase.json` to add `"functions"` or `"firestore"`
  blocks before those products are configured — `firebase deploy` will
  refuse.
- Deploying without first running `npm run build` — `dist/` may be
  stale and Hosting will serve an old bundle.
- Running deploy commands from the repo root instead of `Worksie/`.
