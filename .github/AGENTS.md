# AGENTS.md

## Purpose

Own repository automation contracts for GitHub workflows.

## Ownership

- `.github/workflows/` owns CI definitions and repository automation.
- Root `AGENTS.md` owns branch, PR, remote iPhone, verification, and safety
  rules that CI changes must respect.

## Local Contracts

- Keep workflow changes aligned with root validation commands:
  `pnpm lint` and `pnpm build`.
- Do not weaken CI coverage without an explicit task spec and approval.
- Do not add secret values to workflow files.

## Work Guidance

## Verification

- Run `pnpm lint` and `pnpm build` from the repository root when workflow
  changes can affect validation behavior.

## Child DOX Index

- No child `AGENTS.md` files are currently required under `.github/`.
