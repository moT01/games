---
name: planner
description: Fills out a game plan template based on Claude's knowledge of the game. Called by create-known-game — do not invoke directly.
---

# planner

## Purpose

Fill out the game plan template for a known game using Claude's own knowledge.

## Invocation

This skill is called by `create-known-game` — do not invoke directly.

---

## Inputs

- `<game-name>` — passed in via Task call
- `<known-game>` — passed in via Task call (may be same as game name)

All file paths are derived from the game name:
- Plan file: `.claude/plans/<game-name>/PLAN.md`
- Review file: `.claude/plans/<game-name>/PLAN-REVIEW.md`

---

## Step 1 — Determine mode

**If no review file exists:** this is the first pass. Proceed to Step 2.

**If a review file exists:** this is a revision pass. Skip to Step 3.

---

## Step 2 — Fill out the plan

Read `.claude/plans/<game-name>/PLAN.md`.

Fill out every section completely using your own knowledge of the game:
- Write a concrete **What we're building** description
- Fill in real rules, players, modes, win/draw conditions
- List actual edge cases for this specific game
- Fill in real **Game Logic** checklist items with specific function names
- Fill in real **Components** checklist items with specific names and responsibilities
- Fill in real **Styling**, **Polish**, and **Testing** checklist items
- Work out the full **Data Model** — state shape, piece types, turn structure
- Fill in **Special rules / one-off mechanics** if any exist
- Fill in **AI / Computer Player** if a computer opponent is needed
- Fill in **Interaction Model** with specific input and feedback details

Do not leave any section as `...` or blank. If you are uncertain about
something, make your best attempt — the plan-checker will catch gaps.

Write the completed plan back to `.claude/plans/<game-name>/PLAN.md`.

---

## Step 3 — Revise the plan

Read both files:
- Current plan: `.claude/plans/<game-name>/PLAN.md`
- Review notes: `.claude/plans/<game-name>/PLAN-REVIEW.md`

Address every item flagged in the review. Do not change sections that
were not flagged. Write the revised plan back to `.claude/plans/<game-name>/PLAN.md`.

## Step 4 — Done

Write the completed plan to `.claude/plans/<game-name>/PLAN.md` and stop.
Do not launch any other skills or agents.
