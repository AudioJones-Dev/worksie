# Worksie — Architecture Decision Records

> Format: lightweight ADRs. One section per decision. Status is one
> of: **Proposed**, **Accepted**, **Superseded by ADR-NNN**, **Open**.
> Append new decisions to the bottom — never rewrite history.

---

## ADR-001 — Use Firebase as the backend

- **Status:** Accepted (implicit from the existing scaffold).
- **Context:** Worksie needs hosting, push, real-time data, auth, and
  light server compute without staffing a backend team.
- **Decision:** Use Firebase Hosting, Cloud Messaging, Remote Config,
  and (planned) Firestore + Auth + Functions.
- **Consequences:** Vendor lock-in. Pricing scales with usage. Security
  rules are the only authorization boundary for direct Firestore
  access. Cloud Functions become the only place to run trusted server
  logic.

## ADR-002 — Vite + React + JSX, not Next.js, not TypeScript (yet)

- **Status:** Accepted (implicit from `Worksie/package.json`).
- **Context:** Project started as a quick scaffold; the team wanted a
  static SPA shipped to Firebase Hosting, not SSR.
- **Decision:** Vite 4 + React 18 + plain JSX. No Next.js. No
  TypeScript in v1.
- **Consequences:** No SSR or RSC. No type-level guarantees. ESLint is
  the only static check. Phase 1 of the roadmap will revisit whether to
  migrate to TypeScript.

## ADR-003 — TailwindCSS as the only styling system

- **Status:** Accepted.
- **Context:** Multiple style systems compound complexity.
- **Decision:** Tailwind 3, with the design token `--primary-color`
  driven by Firebase Remote Config. No CSS-in-JS, no second utility
  library.
- **Consequences:** Designers and agents must work in Tailwind classes.
  The UI Designer prompt in `Worksie/prompts/` reflects this.

## ADR-004 — Nested `Worksie/` app layout

- **Status:** Accepted.
- **Context:** The repo root holds the application (`Worksie/`),
  configuration (`config/`), and docs (`docs/`). Restructuring to a
  flat layout would invalidate existing commits and the deploy script.
- **Decision:** Keep the nested layout. Document it prominently in
  `README.md` and `CLAUDE.md`.
- **Consequences:** All `npm` and `firebase` commands run from
  `Worksie/`. Agents must be told this explicitly.

## ADR-005 — Service-worker config via untracked sibling file

- **Status:** Accepted.
- **Context:** `Worksie/public/firebase-messaging-sw.js` runs in a
  context that cannot read Vite env vars. The previous pattern
  (placeholder strings to be hand-edited and committed) was a recipe
  for leaking Firebase config.
- **Decision:** The SW imports its config from
  `public/firebase-messaging-sw-config.js`, which is gitignored.
  Developers copy `firebase-messaging-sw-config.example.js` locally and
  fill in real values.
- **Consequences:** One extra setup step per environment. Reduced
  risk of accidentally committing config values. Documented in
  `docs/SECURITY.md` and `docs/DEPLOYMENT.md`.

## ADR-006 — Four named prompt agents instead of ad-hoc prompting

- **Status:** Accepted.
- **Context:** Worksie ships four narrowly-scoped prompts in
  `Worksie/prompts/`. Each owns a specific surface
  (blueprint-mapping, deploy gating, UI generation, training
  orchestration).
- **Decision:** Treat these four as the canonical agent roster. New
  agents require a new ADR.
- **Consequences:** `AGENTS.md` is the single source of truth for the
  roster. Tasks outside the roster are handled directly by humans or
  by a generic Claude Code session, not by silently extending one of
  the four prompts.

---

## Open decisions (not yet ADRs)

- **License.** No `LICENSE` file exists. Pick one or declare the repo
  proprietary.
- **TypeScript migration.** Decide in Phase 1 of the roadmap.
- **Test framework.** Vitest is the obvious match for Vite, but the
  decision hasn't been made.
- **Firestore as system of record vs. cache.** README implies
  Firestore is the primary store; no Firestore code exists yet.
- **PDF rendering location.** Client-side library vs. Cloud Function.
- **CI provider.** GitHub Actions is the default assumption but not
  yet configured.
- **Security disclosure inbox.** `docs/SECURITY.md` currently points
  to GitHub Security Advisories as a placeholder.
