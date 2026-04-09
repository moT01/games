---
name: planner
description: Fills out a game plan template based on Claude's knowledge of the game. Called by create-known-game — do not invoke directly.
---

# planner

## Purpose

Fill out and self-review the game plan for a known game in a single pass.

## Invocation

Called by `create-known-game` — do not invoke directly.

---

## Inputs

- `<game-name>` — passed in via Task call
- `<known-game>` — passed in via Task call (may be same as game name)


All file paths are derived from the game name:
- Overview: `artifacts/<game-name>/OVERVIEW.md`
- Plan: `artifacts/<game-name>/PLAN.md`

---

## Step 1 — Read

Read both files fully before writing anything:
- `artifacts/<game-name>/OVERVIEW.md` — user decisions and required standards
- `artifacts/<game-name>/PLAN.md` — template to fill out

---

