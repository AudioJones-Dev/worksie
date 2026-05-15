# Changelog

All notable changes to this repository are recorded here. The format
loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versions are not yet assigned — the project is pre-1.0 scaffold.

## [Unreleased]

### Added
- `CLAUDE.md` — agent guardrails covering repo layout, allowed actions,
  build commands, and secrets policy.
- `AGENTS.md` — roster for the four prompt-defined agents shipped in
  `Worksie/prompts/`.
- Root `README.md` — explains the nested `Worksie/` layout, current
  scaffold-stage status, and points at `docs/`.
- `docs/PRD.md`, `docs/ROADMAP.md`, `docs/DESIGN.md`, `docs/SECURITY.md`,
  `docs/DEPLOYMENT.md`, `docs/DECISIONS.md`, `docs/CHANGELOG.md` —
  foundational documentation set.
- `Worksie/.env.example` — canonical list of `VITE_FIREBASE_*` and
  `VITE_STRIPE_PUBLISHABLE_KEY` environment variables.
- `Worksie/public/firebase-messaging-sw-config.example.js` — template
  for the new untracked service-worker config file.

### Changed
- `Worksie/public/firebase-messaging-sw.js` — replaced committed
  `YOUR_API_KEY`-style placeholders with an import of an untracked
  sibling config file. Eliminates the footgun that previously
  encouraged committing real Firebase config.
- `Worksie/README.md` — clarified nested layout, fixed the missing
  `.env.example` reference, pointed readers at root-level `docs/`,
  and called out scaffold/stub status.
- `Worksie/docs/worksie_folder_structure.txt` — replaced with an
  accurate snapshot of the current source tree.
- `.gitignore` — added `.env.local`, `*.local`,
  `.firebase-debug.log`, and the new untracked SW config file.

### Removed
- Nothing yet.

### Security
- Closed the Firebase service-worker placeholder footgun documented
  during the readiness audit. See `docs/SECURITY.md` §3.
