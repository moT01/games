---
name: plan-game
description: Scaffolds and plans a well-known game from scratch. Only invoked explicitly as /create-known-game <game-name> — do not trigger from natural language.
---

# create-known-game

## Purpose

Scaffold and plan a new game from scratch. Handles folder creation, project
bootstrapping, and plan file generation, then hands off to the planner.

## Invocation

```
/create-known-game checkers
/create-known-game five-dice (yahtzee)
```

The first argument is the game name we want to use. If there's another in parenthesis, it's the well known name for the game that we want to clone.

Do not run this skill unless explicitly invoked with the `/create-known-game` command.

---

## Step 1 — Confidence check

Parse the invocation:
- `<game-name>` — the folder name and project name to use
- `<known-game>` — the well-known game to base it on (if provided in parentheses,
  use this name; otherwise use `<game-name>`)

Use `<known-game>` for all rules and game knowledge decisions.
Use `<game-name>` for all file and folder naming.

Before touching any files, ask yourself: is this a well-known game with
established, unambiguous rules?

**If anything is unclear, or if no game name is provided:** stop and ask the user:
- Confirm the game name and any variants (e.g. "standard checkers or
  international draughts?")
- Ask about any rules that have common variations
- Ask about computer player requirements if not obvious
- Wait for answers before proceeding

Do not create any files until you have enough information to fill out the
plan completely without guessing.

---

## Step 2 — Bootstrap the project

Follow these steps exactly. Do not perform any actions not listed here.
Replace `<game-name>` with the actual game name throughout.

1. Run `cp -R boilerplate <game-name>` from the repo root to copy the boilerplate project into a new folder with the game name for the new game.
2. In the `<game-name>/public/index.html` file, replace the placeholder title with the game name. Use a Capitalized, human-friendly version of the game name (e.g. "Five Dice" instead of "five-dice").
3. Run `npm install` inside `<game-name>/`

Stop and surface any errors before continuing. Ignore the TS type error in `vite.config.ts` about Plugin type incompatibility between vite@8 (rolldown) and vitest@3 (bundled rollup) — this is a known false positive, tests run fine.

---

## Step 3 — Create the plan files

1. Create `artifacts/<game-name>/` folder
2. Copy the plan template from `.claude/templates/PLAN_TEMPLATE.md` to `artifacts/<game-name>/PLAN.md`
3. Replace all `<game-name>` placeholders with the actual game name
4. Replace all `<known-name>` placeholders with the known game name - or use the game name if no known name was provided

---

## Step 4 — Planning loop

Create `artifacts/<game-name>/PLAN-REVISION-COUNT.txt` containing `0`.

### 4a — Launch planner

```
Task: "Read and follow `.claude/skills/planner/SKILL.md`.
Game name: <game-name>
Known game: <known-game>"
```

### 4b — Launch plan-reviewer

```
Task: "Read and follow `.claude/skills/plan-reviewer/SKILL.md`.
Game name: <game-name>
Known game: <known-game>"
```

### 4c — Check result

Read the first line of `artifacts/<game-name>/PLAN-REVIEW.md`:

**If `STATUS: APPROVED`:** proceed to Step 5.

**If `STATUS: REVISE`:**
- Read `artifacts/<game-name>/PLAN-REVISION-COUNT.txt`
- If count < 2 → increment count, return to Step 4a
- If count >= 2 → proceed to Step 5

---

## Step 5 — Done

Tell the user:
"Plan complete. The plan checklist is at `artifacts/<game-name>/PLAN.md`."
