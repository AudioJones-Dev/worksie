# Worksie

Worksie is a field-operations platform for service businesses — combining
project documentation, CRM, scheduling, payments, and AI-generated reports
into one product.

> **Status: scaffold-stage.** The application skeleton, build pipeline,
> Firebase wiring, and Remote Config are in place. Most UI components and
> pages are stubs awaiting implementation. See `docs/ROADMAP.md` for the
> current plan.

---

## Where things live

This repository uses a **nested layout**:

| Path | Contents |
|---|---|
| `Worksie/` | The actual React + Vite application. All `npm` commands run here. |
| `config/` | Firebase Remote Config JSON used by the deploy flow. |
| `docs/` | Product, design, security, deployment, and decision docs. |
| `CLAUDE.md` | Guardrails for AI coding agents. Read before automating changes. |
| `AGENTS.md` | The four prompt-defined agents that ship with Worksie. |

For a current snapshot of the application tree, see
`Worksie/docs/worksie_folder_structure.txt`.

---

## Getting started

```bash
git clone <this repo>
cd worksie/Worksie         # note the nested directory
cp .env.example .env       # fill in your Firebase project values
npm install
npm run dev
```

Validation commands (run from `Worksie/`):

```bash
npm run lint
npm run build
```

There are no automated tests yet.

---

## Read next

- `docs/PRD.md` — product scope and target user.
- `docs/ROADMAP.md` — what's stub vs. real, and what ships next.
- `docs/DESIGN.md` — architecture and data-flow overview.
- `docs/SECURITY.md` — env-var policy and the Firebase service-worker pattern.
- `docs/DEPLOYMENT.md` — how releases reach Firebase Hosting.
- `docs/DECISIONS.md` — architecture decision records (ADRs).
- `docs/CHANGELOG.md` — release history.

---

## License

Not yet declared. See `docs/DECISIONS.md` for the open question.
