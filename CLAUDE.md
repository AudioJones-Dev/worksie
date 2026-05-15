# CLAUDE.md — Agent Guardrails for Worksie

This file tells Claude Code (and other AI coding agents) what they need to
know before touching this repository. Read it in full before making any
change. If something here conflicts with a user instruction, surface the
conflict — do not silently override these rules.

---

## 1. Repo layout (read this first)

This repository has a **nested layout**:

```
worksie/                  <- git repo root
├── CLAUDE.md             <- this file
├── AGENTS.md
├── README.md             <- root pointer
├── docs/                 <- product, design, security, deployment, ADRs
├── config/               <- Firebase Remote Config JSON
└── Worksie/              <- THE ACTUAL APPLICATION
    ├── package.json
    ├── src/
    ├── public/
    ├── scripts/
    ├── prompts/
    ├── dataset/
    └── docs/             <- legacy app-level doc(s); prefer root /docs
```

The app does **not** live at the repo root. All `npm`, `vite`, and
`firebase` commands must run from `Worksie/`, not from the repo root.

---

## 2. Current status of the codebase

As of this writing the project is **scaffold-stage**:

- React 18 + Vite + TailwindCSS frontend
- Firebase Hosting + Firebase Cloud Messaging + Firebase Remote Config wired
- Stripe dependencies installed but no payment flow implemented
- Most components and pages in `Worksie/src/` are **1–5-line stubs**
  (e.g. `<div>Login Form</div>`). They are placeholders, not features.
- No tests exist. No CI exists. No typecheck (project is plain JS/JSX).
- `npm run lint` is the only automated check available.

Do not assume a stubbed component is implemented just because it is
imported or routed. Read the file before extending it.

---

## 3. What agents may do without asking

- Read any file in the repo.
- Run `npm run lint` and `npm run build` inside `Worksie/`.
- Create new files under `docs/` for product/design notes.
- Edit `docs/CHANGELOG.md` to record completed work.

## 4. What agents must NOT do without explicit user approval

- Commit, push, or force-push.
- Add, remove, or upgrade dependencies in `Worksie/package.json`.
- Introduce a new framework, language, or build tool.
- Implement product features unless the user has named the feature.
- Rewire Firebase configuration, Stripe, or auth.
- Add CI workflows, pre-commit hooks, or test runners.
- Create `.env`, `.env.local`, or any file containing real API keys,
  tokens, VAPID keys, service-account JSON, or Stripe secrets.
- Hand-edit `Worksie/public/firebase-messaging-sw.js` to embed real
  Firebase config values. See `docs/SECURITY.md` for the approved
  pattern.
- Delete or overwrite `Worksie/dataset/` or `Worksie/prompts/` files.
- Restructure the nested `Worksie/` layout.

## 5. Build & validation commands

From `Worksie/`:

```bash
npm install           # if node_modules missing
npm run lint          # ESLint, --max-warnings 0
npm run build         # Vite production build
npm run dev           # local dev server (not for agents)
npm run preview       # preview a built bundle
```

There are no tests. Do not invent a test command.

## 6. Secrets policy (short version)

- Never commit a real API key, VAPID key, Stripe key, Firebase
  service-account JSON, or `.env*` file.
- The Firebase web config values (`apiKey`, `authDomain`, etc.) are
  technically public, but they still must be supplied via env vars so
  that different environments can use different Firebase projects.
- See `docs/SECURITY.md` for the service-worker config pattern and the
  full rules.

## 7. When in doubt

- Prefer reading `docs/PRD.md` and `docs/ROADMAP.md` to infer scope.
- Prefer asking the user one short clarifying question over guessing.
- Prefer editing existing files over creating new ones.
- Prefer the smallest correct change.
