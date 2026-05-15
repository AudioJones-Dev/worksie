# Worksie — Roadmap

> Status: **draft v0.1**. Phases are ordered, but dates are deliberately
> omitted until the team commits to them. Update this file whenever a
> phase advances.

## Where we are

The repository is **scaffold-stage**. The build pipeline works, lint
passes, Firebase Hosting is configured, Cloud Messaging requests a
token on app load, and Remote Config drives a primary color and a
promo banner. Almost every UI surface is a one-line placeholder.

## Phase 0 — Readiness bootstrap (in progress)

Goal: make the repo safe for long-running agent work and human
contributors.

- [x] Add `CLAUDE.md` agent guardrails.
- [x] Add `AGENTS.md` describing the four prompt agents.
- [x] Add root `README.md` pointing at the nested `Worksie/` app.
- [x] Add `docs/PRD.md`, `docs/ROADMAP.md`, `docs/DESIGN.md`,
      `docs/SECURITY.md`, `docs/DEPLOYMENT.md`, `docs/DECISIONS.md`,
      `docs/CHANGELOG.md`.
- [x] Add `Worksie/.env.example`.
- [x] Remove the Firebase service-worker placeholder footgun.
- [x] Update `.gitignore` for `.env.local`, `*.local`,
      `.firebase-debug.log`.
- [x] Refresh `Worksie/docs/worksie_folder_structure.txt` to match
      reality.

## Phase 1 — Foundations (not started)

Goal: make the scaffold testable and verifiable end-to-end.

- [ ] Pick and install a test runner (Vitest is the obvious fit).
- [ ] Add a GitHub Actions workflow that runs `npm run lint` and
      `npm run build` on PRs.
- [ ] Decide TypeScript: stay on JSX or migrate. Record in
      `docs/DECISIONS.md`.
- [ ] Add Firestore wiring (or document explicitly that it is out of
      scope for v1).
- [ ] Wire real authentication via Firebase Auth.

## Phase 2 — First vertical slice (not started)

Goal: one feature path actually works end-to-end.

Proposed slice: **Capture → AutoReport**. A logged-in user can take a
GPS-tagged photo on a job, attach a note, and produce a one-page PDF
report.

- [ ] Implement `LoginForm.jsx` + `SignupForm.jsx` against Firebase Auth.
- [ ] Implement `MediaCapture.jsx` with browser camera + geolocation.
- [ ] Implement `GalleryViewer.jsx`.
- [ ] Implement `AutoReportBuilder.jsx` + `PDFExporter.jsx`.

## Phase 3 — CRM + tasks (not started)

- [ ] `CRMLeadForm`, `PipelineView`, `ProjectOverview`.
- [ ] `CalendarView`, `TaskBoard`.

## Phase 4 — Payments (not started)

- [ ] `InvoiceBuilder` with Stripe.
- [ ] Webhook + Cloud Function for invoice status.

## Phase 5 — Communication + templates (not started)

- [ ] `ChatWindow`, push delivery server.
- [ ] `TemplateMarket`, `ChecklistBuilder`.

## Known risks

- The four prompt agents in `Worksie/prompts/` are powerful but lack
  guardrails of their own. Until each phase has guardrails written
  down, agent output should be human-reviewed.
- The scaffold contains imports for many features that don't exist
  yet. Build-time tree-shaking masks this; runtime navigation does
  not.
