# Worksie Design Tokens

Status: project-operational context

## Purpose

Record the Worksie brand design tokens as a durable specification, independent of
any package that happens to hold them in code. These values were defined during
Phase 1 and have never been wired into a rendering surface; this doc exists so the
decisions survive the retirement of the code that stored them.

## Project Context

The tokens below originated in `packages/ui/src/tokens.ts`, introduced in the
Worksie scaffold commit and unchanged for its whole life. No module ever imported
them, and `apps/web/tailwind.config.ts` carries an empty `theme.extend`. That
package has since been removed, which is why this doc exists: it is now the only
record of these values. They are recorded decisions, not live configuration —
nothing in the running product reads them.

## Token Values

### Color

| Token | Value | Recorded role |
| --- | --- | --- |
| `primary` | `#007BFF` | Primary brand and action color |
| `surface` | `#F4F4F4` | Background and surface fill |
| `ink` | `#1C1C1E` | Primary text and foreground |

### Typography

| Token | Value | Recorded role |
| --- | --- | --- |
| `body` | Inter | Body and interface text |
| `heading` | Poppins | Headings and display text |

### Tone

| Token | Value |
| --- | --- |
| `tone` | `professional_clear_trustworthy` |

The tone token is recorded verbatim as it was defined. It is a brand-voice
descriptor and is owned by the repository owner; it is reproduced here without
interpretation.

## Canonical Inputs

- `../WORKSIE_SPINE.md`
- `../PRD.md`
- `./02-ARCHITECTURE.md`
- `../../apps/web/tailwind.config.ts`

## Current Token Notes

These values carry no implementation status. Any future design-system work should
treat this doc as the record of prior intent and re-decide deliberately rather
than assume the values are still correct. In particular:

- The color set has never been contrast-tested against WCAG targets. `#007BFF` on
  `#F4F4F4` and `#1C1C1E` on `#F4F4F4` both need checking before use, which
  matters given the accessibility-ramp product surface.
- Inter and Poppins are named without weights, fallback stacks, or a licensing or
  self-hosting decision.
- No spacing, radius, elevation, motion, or dark-mode tokens were ever defined.

## Next Fill-In

- Confirm or revise the color and typography choices with the repository owner.
- Add contrast ratios and WCAG conformance targets for each foreground and
  background pairing.
- Add font weights, fallback stacks, and a hosting decision.
- Decide whether tokens live in `apps/web/tailwind.config.ts`, a shared package,
  or both, once a second consuming surface exists.

## Implementation Relevance

Use this doc as the reference when a Worksie surface first needs brand-consistent
styling. Until then no code should be expected to import these values, and the
absence of a shared UI package does not indicate the tokens were discarded.

## Next Owner / Action

The repository owner holds brand and voice decisions and should confirm or revise
the values above. Engineering should update this file when tokens become an
active implementation surface. Keep changes linked from
`docs/06-REFERENCE/DOCUMENTATION_INDEX.md`.
