---
name: coder
description: Writes a section of the game code based on the approved plan. Called by create-known-game — or invoked directly.
---

# coder

## Purpose
Implement a section of the game based on the approved plan. Write the code for the section, have it reviewed, fix any issues, then check off completed items.

## Invocation
Called by `create-known-game` as part of the pipeline, or invoked directly
as `/coder <game-name>` or `/coder <game-name> (<known-game>)` when a plan already exists.

---

## Inputs
- `<game-name>` — passed in via Task call
- `<known-game>` — passed in via Task call (may be same as game name)

All file paths are derived from the game name:
- Plan file: `artifacts/<game-name>/PLAN.md`
- Coder log: `artifacts/<game-name>/CODER-LOG.md`

## Important
Use `<game-name>` for all variable names, file names, function names, and
references in code. Do not use `<known-game>` in code — it is only used
for rules and game knowledge. For example, if the game name is `five-dice`
and the known game is `yahtzee`, all code should reference `five-dice`,
never `yahtzee`.

Only read files that are explicitly listed in the plan, the coder log, or explicitely mentioned. Derive all paths from `<game-name>`. Do not explore the project structure or search for files.

Only implement the specific checklist items in the current section of the plan. Do not add anything that is not in the plan. Do not move on to items in the next section until all items in the current section are complete and checked off. The sections are:

- Setup
- Game Logic
- Components
- Interaction Model
- Styling
- Polish
- Testing

---

## Step 1 — Read the plan
Read `artifacts/<game-name>/PLAN.md` fully before writing any code. Understand the rules, logic, components, and every checklist item.

---

## Step 2 — Implement the next incomplete section
Identify the first section in the plan with unchecked items — this is the section you will implement. Skip any section where all items are already checked off.

Follow the conventions in `CLAUDE.md`:
- TypeScript always — no plain JS
- Functional React components only
- Plain CSS files — one per component
- Keep it simple — no extra abstractions, files, or dependencies not in the plan
- Do not add anything not in the plan

---

## Step 3 — Check off completed items
In `artifacts/<game-name>/PLAN.md`, check off every item that was implemented.

Items that were flagged and could not be fully resolved stay unchecked.

That is all you need to do. Do not launch any other skills or agents. Do not start the next section.
