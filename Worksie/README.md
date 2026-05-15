# Worksie App

Worksie is a field-operations platform combining project documentation,
CRM, scheduling, payments, and AI-generated reports into one product.

> **This `Worksie/` directory is the actual application.** The
> repository root above it holds `docs/`, `config/`, and the agent
> guardrails (`CLAUDE.md`, `AGENTS.md`). All `npm` and `firebase`
> commands run from inside this directory.

> **Status: scaffold-stage.** The build pipeline, Firebase wiring, and
> Remote Config are in place. Most components and pages in `src/` are
> 1–5 line placeholders. See `../docs/ROADMAP.md` for what's planned
> vs. what's real.

---

## Intended features (most still stubs — see PRD/ROADMAP)

- GPS-tagged photo & video capture
- 3D LiDAR scan + floorplan generation
- AI-generated job reports (PDF)
- CRM pipeline with task management
- Real-time chat, notifications, and permissions
- Stripe-integrated payments + invoices
- Template marketplace for checklists & forms

## Folder layout (this directory)

```
Worksie/
├── src/
│   ├── components/    (mostly stubs)
│   ├── pages/         (mostly stubs)
│   ├── logic/         firebase.js, remoteConfig.js
│   ├── App.jsx
│   ├── main.jsx
│   └── routes.jsx
├── public/            firebase-messaging-sw.js + (untracked) config
├── prompts/           four prompt-defined agents (see ../AGENTS.md)
├── dataset/           worksie_training_schema.jsonl
├── scripts/           deploy.sh
├── docs/              legacy app-level notes (prefer root /docs)
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── firebase.json
└── .env.example
```

## Tech stack

- React 18 + Vite 4
- TailwindCSS 3
- Firebase Hosting + Cloud Messaging + Remote Config
- Stripe SDK (frontend only; flow not implemented)
- react-router-dom v6

## Local setup

```bash
# from this Worksie/ directory:
cp .env.example .env
# fill in your Firebase web config values in .env

# the Firebase messaging service worker uses an untracked sibling
# config because it cannot read Vite env vars at runtime:
cp public/firebase-messaging-sw-config.example.js \
   public/firebase-messaging-sw-config.js
# fill in the same Firebase values inside that new file

npm install
npm run dev
```

Validation:

```bash
npm run lint    # ESLint, --max-warnings 0
npm run build   # production bundle to dist/
```

There are no tests yet.

## Deploy

```bash
npm run build
firebase deploy --only hosting
# or:
./scripts/deploy.sh
```

See `../docs/DEPLOYMENT.md` for the full deploy and Remote Config
flow.

## Firebase configuration

Firebase web config values are read from environment variables. See
`.env.example` for the canonical list, and `../docs/SECURITY.md` for
the policy (no real keys in source, no `.env` in git, no real config
pasted into the service worker).

The service worker (`public/firebase-messaging-sw.js`) loads its
Firebase config from `public/firebase-messaging-sw-config.js`, which
is **gitignored**. Use the `.example.js` template to create it
locally.

## Firebase Remote Config

Live values live in the repo root at `../config/worksie-remote-config.json`
and are pushed out-of-band (see `../docs/DEPLOYMENT.md`). The frontend
reads three keys today: `promo_banner_enabled`, `promo_banner_text`,
and `app_primary_color`.

## Claude / agent prompts

The four agents shipped with Worksie are documented in `../AGENTS.md`.
Their prompts live in `prompts/`. Their shared training schema lives
in `dataset/worksie_training_schema.jsonl`.

## Where to read next

- `../CLAUDE.md` — agent guardrails (read before automating changes).
- `../AGENTS.md` — agent roster.
- `../docs/PRD.md` — product scope.
- `../docs/ROADMAP.md` — phase plan.
- `../docs/DESIGN.md` — architecture.
- `../docs/SECURITY.md` — secrets policy.
- `../docs/DEPLOYMENT.md` — deploy + Remote Config.
- `../docs/DECISIONS.md` — ADRs and open questions.
- `../docs/CHANGELOG.md` — release notes.
