# AGENTS.md

## Purpose

Own canonical product, architecture, GTM, phase, and review documentation.

## Ownership

- `WORKSIE_SPINE.md` is the doctrine and canonical stack contract.
- `PRD.md`, `DOMAIN_MODEL.md`, and lifecycle docs own product and domain
  requirements.
- `reviews/` owns PR and readiness review checklists.
- Root owns repo-wide AGENTS/DOX behavior.

## Local Contracts

- If a product, scope, or stack decision changes and `WORKSIE_SPINE.md` does
  not reflect it, the change is not done.
- Keep docs Markdown-first and Git Spec ready.
- Do not silently change public positioning, phase gates, or stack decisions.
- Delete stale contradictions instead of adding historical explanations.

## Work Guidance

## Verification

- No automated doc-only verification is currently defined for this folder.
- Root closeout still requires `pnpm lint` and `pnpm build`.

## Child DOX Index

- `reviews/` is currently governed by this `docs/AGENTS.md`.
