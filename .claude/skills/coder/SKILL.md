---
name: coder
description: Implements the game code based on the approved plan. Called by create-game — or invoked directly.
---

# coder

## Purpose

Implement the game based on the approved plan, one section at a time.

## Invocation

Called by `create-game` as part of the pipeline, or invoked directly
as `/coder <game-name>` or `/coder <game-name> (<known-game>)` when a plan already exists.

---

## Inputs

- `<game-name>` — passed in via Task call
- `<known-game>` — passed in via Task call (may be same as game name)

Plan files are in: `artifacts/<game-name>/`
Game code is in: `<game-name>/`
Other misc advice files are in: `.claude/misc/`

## Important

Use `<game-name>` for all variable names, file names, and code references — never `<known-game>`. The known game is only used for rules and game knowledge.

Only read files explicitly listed in the plan or mentioned in inputs. Do not explore the project structure or search for files.

---

## Step 1 — Read the plan

Read `artifacts/<game-name>/PLAN.md` fully before writing any code.

---

## Step 2 — Implement the next incomplete section

Identify the first section with unchecked items and implement all of them. Before writing any CSS or UI, read `.claude/misc/UI.md` first.

Only implement what is in the plan. Do not add abstractions, files, or dependencies not listed. Follow all conventions in `CLAUDE.md`.

---

## Step 3 — Check off completed items

Mark every implemented item as done in `artifacts/<game-name>/PLAN.md`.

---

## Step 4 — Update user on progress and continue or stop

If all items in the plan are completed and checked off, stop and inform the user with the text:

> "The <game> game has been completed and checked off."

If more sections remain incomplete and unchecked, inform the user with the text:

> "The <section> has been completed and checked off. Shall I continue to the <next-section> section?"

If user says "yes", return to Step 2 and do the next section.

If user says "no", stop and wait for further instructions.
