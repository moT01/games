---
name: planner
description: Fills out a game plan template based on Claude's knowledge of the game. Called by create-known-game — do not invoke directly.
---

# planner

## Purpose

Fill out the game plan for a known game using Claude's own knowledge.

## Invocation

Called by `create-known-game` — do not invoke directly.

---

## Inputs

- `<game-name>` — passed in via Task call
- `<known-game>` — passed in via Task call (may be same as game name)

File paths:
- Plan: `artifacts/<game-name>/PLAN.md`
- Review: `artifacts/<game-name>/PLAN-REVIEW.md`
- Overview: `artifacts/<game-name>/OVERVIEW.md`

---

## Step 1 — Determine mode

Check if `artifacts/<game-name>/PLAN-REVIEW.md` exists:

**If it does not exist:** first pass — proceed to Step 2.
**If it exists:** revision pass — skip to Step 3.

---

## Step 2 — Fill out the plan

Read before writing anything:

- `artifacts/<game-name>/PLAN.md` — template to fill out
- `artifacts/<game-name>/OVERVIEW.md` — user decisions and standards

Respect everything in OVERVIEW.md. Mode choices, rules variants, and any other user decisions are not suggestions — do not override them.

The template is a minimum structure, not a ceiling. Add sections, fields, or checklist items whenever the game warrants it. The goal is a plan that fully captures this game.

Before writing, think through the non-obvious mechanics of this specific game:

- What surprises first-time implementers?
- What state changes are easy to forget or get wrong?
- What happens at edge transitions — deck exhausted, board full, turn wrap-around?
- Does any piece or card have dual state (e.g. face-up/face-down)?
- Are there cascading effects or resets that don't preserve order?

Every non-obvious mechanic must appear somewhere in the plan — in Special Rules, Edge Cases, Data Model, or Game Logic. If a mechanic has no test case, add one.

Fill out every section completely — no placeholders, no `...`, no generic content. If uncertain, make your best attempt — the reviewer will catch gaps.

- Only include the AI / Computer Player section if the game has a computer opponent
- Fill in the Help & Strategy Guide with real strategies, actual common mistakes, and beginner tips specific to this game

Write the completed plan to `artifacts/<game-name>/PLAN.md`.

---

## Step 3 — Revise the plan

Read:

- `artifacts/<game-name>/PLAN.md`
- `artifacts/<game-name>/PLAN-REVIEW.md`
- `artifacts/<game-name>/OVERVIEW.md`

Address every flagged item. Do not change sections that were not flagged. If a flagged item conflicts with OVERVIEW.md, OVERVIEW.md wins.

If the Help & Strategy Guide was flagged as generic, rewrite it from scratch — do not patch generic text.

Write the revised plan to `artifacts/<game-name>/PLAN.md`.
