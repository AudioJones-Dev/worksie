# AGENTS.md

Operating instructions for AI coding agents working on this repository. These
apply to Codex, Claude Code, and any other agent that picks up this file.

## Remote iPhone workflow

The repo owner often reviews work from an iPhone via GitHub mobile. They
**cannot** open files written to `/tmp`, the sandbox filesystem, or any local
path. Surface visual progress in places that render on mobile.

### Rules

1. **Never report a local screenshot as "evidence."** Saving a PNG to `/tmp`
   does not count as a verifiable result.
2. **For every UI change, post screenshots to the PR** so they render inline
   on GitHub mobile:
   - Capture with Playwright at desktop (`1440x1200`) **and** iPhone
     (`390x844`) viewports.
   - Commit the PNGs to `docs/screenshots/<pr-or-branch>/` on the
     branch and reference them in the PR body / comment using raw GitHub URLs
     or relative markdown links (`![desktop](docs/screenshots/.../desktop.png)`).
   - Include hover, error, and empty states when relevant to the change.
3. **Prefer the Vercel preview URL when possible.** Vercel auto-deploys a
   preview for every PR. Grab the preview URL from the PR's checks (the
   "Visit Preview" link on the Vercel check) and paste it into the PR
   description with the exact route to verify
   (e.g. `https://<branch>-worksie.vercel.app/dashboard`). Confirm the
   Vercel check is green before declaring the task done. If the preview
   build failed, fix it — do not ship.
4. **Non-UI progress goes in the PR description, not chat-only output.**
   Update the PR body with: what changed, what was tested, trimmed
   command output (pass/fail + key lines), and links to screenshots or the
   preview URL.
5. **Maintain a checked test-plan checklist in the PR body** so the user can
   track progress from the PR view on mobile.
6. **If something blocks posting to the PR** (auth, missing tool, network),
   say so explicitly. Do not fall back to local-only artifacts and call the
   task done.

### Required commands before declaring done

Run from the repository root:

```bash
pnpm lint
pnpm build
```

If the local `pnpm` shim is unavailable or broken, `npm run lint` and
`npm run build` are acceptable validation fallbacks because they delegate to
the same root Turbo scripts. Do not use npm to install dependencies.

If you changed UI, also run a Playwright screenshot pass at both viewports
and follow rule 2 above.

## Branch and PR conventions

- Develop on the branch the user specifies; never push to a different branch
  without explicit permission.
- Open PRs as **draft** unless told otherwise.
- Keep PR titles under 70 characters; put detail in the body.
- Use a HEREDOC for multi-line commit messages and PR bodies to preserve
  formatting.

## Project layout

- `apps/web/` — Next.js web admin app.
- `apps/mobile/` — Expo mobile field app.
- `packages/` — Shared config, domain, database, types, and UI packages.
- `docs/` — Project documentation, including screenshots for PRs.
- `prompts/` — Reusable prompt templates.
- `supabase/` — Supabase config and migrations.

## Safety

- Never commit `.env`, credentials, or service-account JSON.
- Never run `git push --force`, `git reset --hard`, or other destructive ops
  without explicit confirmation.
- Never skip hooks (`--no-verify`) unless the user explicitly asks.
