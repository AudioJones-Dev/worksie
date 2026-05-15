# AGENTS.md — Worksie Agent Roster

Worksie ships with a set of prompt-defined agents that automate specific
parts of the product workflow. The prompt files live in
`Worksie/prompts/`. The training schema they share lives in
`Worksie/dataset/worksie_training_schema.jsonl`.

This document describes what each agent owns. It is intended for both
humans and AI coding tools — when a task matches an agent's stated
scope, prefer using or extending that agent rather than inventing a new
one.

---

## Roster

### 1. Blueprint Mapper
- Prompt: `Worksie/prompts/prompt_blueprint_mapper.md`
- Role: Translates a Worksie product blueprint (PRD-like spec or
  uploaded design) into a concrete component / page / data-model plan
  the rest of the system can scaffold.
- Inputs: PRD text, design references, or a partial component tree.
- Outputs: A structured plan of files to create or update under
  `Worksie/src/`, plus suggested data shapes.

### 2. Deployment Trigger
- Prompt: `Worksie/prompts/prompt_deployment_trigger.md`
- Role: Owns the deploy path. Reads `Worksie/scripts/deploy.sh`,
  `Worksie/firebase.json`, and the Firebase Remote Config in
  `config/worksie-remote-config.json` to validate a release candidate
  before deploying to Firebase Hosting.
- Inputs: Current branch state, build output, Firebase project ID.
- Outputs: Deploy decision (go/no-go) with reasoning, and the exact
  commands to run.
- See `docs/DEPLOYMENT.md`.

### 3. UI Designer (Vibe Designer)
- Prompt: `Worksie/prompts/prompt_ui_designer.md`
- Role: Generates and refines UI for Worksie surfaces — color, layout,
  Tailwind classes, component composition. Operates within the scaffold
  produced by the Blueprint Mapper.
- Inputs: Component name, target page, brand cues, Remote Config keys.
- Outputs: JSX + Tailwind for the target component, respecting the
  `--primary-color` CSS variable driven by Firebase Remote Config.

### 4. Training Orchestrator
- Prompt: `Worksie/prompts/prompt_training_orchestrator.md`
- Role: Maintains and extends `Worksie/dataset/worksie_training_schema.jsonl`.
  Coordinates dataset additions so the schema stays consistent across
  releases.
- Inputs: New training examples, schema diffs.
- Outputs: Validated JSONL entries appended in-place; never rewrites
  existing entries without an explicit user instruction.

---

## How to use these agents

1. Identify which agent owns the task (UI? scaffolding? deploy? data?).
2. Open the matching prompt file in `Worksie/prompts/`.
3. Run the agent with the task description and any relevant repo
   context (PRD section, current component file, etc.).
4. Treat the agent's output as a proposal — review before applying.

## Out-of-scope for these agents

These four prompts do not cover:

- Authentication flow design (see `docs/DESIGN.md` once written).
- Stripe payment flow (no agent owns this yet).
- CRM data model (no agent owns this yet).
- Security review (handled by humans + `docs/SECURITY.md`).

If a task falls outside the roster above, do not silently extend a
prompt to cover it. Either propose a new agent in `docs/DECISIONS.md`
or handle the task directly with the user.
