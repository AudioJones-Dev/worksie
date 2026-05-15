# Worksie — Design Overview

> Status: **draft v0.1**. Reflects the system as currently scaffolded
> in `Worksie/`. Anything marked *planned* is intent, not built.

## 1. High-level architecture

```
        Browser (mobile-first)
        ┌────────────────────────────┐
        │ React 18 + Vite + Tailwind │
        │  ─ routes (react-router-v6)│
        │  ─ Remote Config theming   │
        │  ─ FCM token request       │
        └─────────────┬──────────────┘
                      │
                      ▼
        ┌────────────────────────────┐
        │      Firebase Project      │
        │  ─ Hosting (static dist/)  │
        │  ─ Cloud Messaging (FCM)   │
        │  ─ Remote Config           │
        │  ─ Firestore  (planned)    │
        │  ─ Auth       (planned)    │
        │  ─ Functions  (planned)    │
        └─────────────┬──────────────┘
                      │
                      ▼
        ┌────────────────────────────┐
        │   Stripe (planned for      │
        │   invoices & payments)     │
        └────────────────────────────┘
```

## 2. Frontend stack

- **React 18** with function components and hooks.
- **Vite 4** for dev server and production builds. Output: `Worksie/dist/`.
- **TailwindCSS 3** for styling. No second style system.
- **react-router-dom v6** with a `createBrowserRouter` config in
  `Worksie/src/routes.jsx`.
- **ESLint 8** with the React + React Hooks plugins. `--max-warnings 0`.

## 3. Source layout (current)

```
Worksie/src/
├── App.jsx              app shell, mounts router, initializes FCM + RC
├── main.jsx             React 18 entrypoint
├── routes.jsx           7 routes: /, /dashboard, /reports, /tasks,
│                        /crm, /settings, /support
├── index.css            Tailwind directives
├── components/          27 UI components, most are 1–5 line stubs
├── pages/               7 pages (Home, Dashboard, Reports, Tasks,
│                        CRM, Settings, Support) — all stubs
└── logic/               firebase.js, remoteConfig.js
```

There is no `src/hooks/` or `src/context/` despite older docs implying
otherwise. Add them when there is a real consumer, not before.

## 4. Firebase integration

- **App init** — `Worksie/src/logic/firebase.js` initializes the SDK
  from `import.meta.env.VITE_FIREBASE_*` values.
- **Messaging** — `requestForToken()` is called on app mount and asks
  for a VAPID-keyed FCM token. The VAPID public key is also read from
  the env (see `Worksie/.env.example`).
- **Service worker** — `Worksie/public/firebase-messaging-sw.js` runs
  in a worker context that cannot read Vite env vars. It loads its
  Firebase config from `firebase-messaging-sw-config.js`, which is
  **not committed**. See `docs/SECURITY.md`.
- **Remote Config** — `Worksie/src/logic/remoteConfig.js` fetches and
  activates Remote Config on app mount and exposes a `getRemoteConfigValue`
  helper. The defaults seed `promo_banner_enabled`, `promo_banner_text`,
  and `app_primary_color`. The live values live in
  `config/worksie-remote-config.json` (uploaded via Firebase API or CLI).

## 5. Data model (planned, not yet implemented)

Worksie does not yet persist any data. The intended Firestore shape is
informally captured in `Worksie/dataset/worksie_training_schema.jsonl`,
which seeds the Training Orchestrator agent. A formal Firestore schema
document will land in this file (or a sibling) once data writes begin.

## 6. Auth model (planned)

- Firebase Auth (email/password to start; OAuth providers later).
- Roles managed via a `roleManager` module (`AdminHome`, `RoleSelector`
  components are placeholders for this).
- Role check happens client-side for UX, server-side via Firestore
  security rules for correctness. Rules are not yet written.

## 7. Build & deploy flow

1. `npm run build` from `Worksie/` produces `Worksie/dist/`.
2. `firebase deploy --only hosting` (wrapped by
   `Worksie/scripts/deploy.sh`) uploads `dist/` according to
   `Worksie/firebase.json`.
3. Remote Config changes ship out-of-band via
   `config/worksie-remote-config.json` + the Firebase API (see
   `docs/DEPLOYMENT.md`).

## 8. Open design questions

- Where do report PDFs render — in-browser via a JS PDF lib, or via a
  Cloud Function?
- Does LiDAR scan processing happen client-side (LiDAR data is large)
  or off-loaded to a Function / external service?
- Do we need an "offline mode" for field crews with poor connectivity?
- Is the CRM its own data domain or shared with Tasks/Reports?

Track answers in `docs/DECISIONS.md`.
