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

## Step 2 — Fill out the plan

Respect everything in `OVERVIEW.md`. User decisions are not suggestions — do not override them.

The template is a minimum structure, not a ceiling. Add sections, fields, or checklist items whenever the game warrants it.

Before writing, think through the non-obvious mechanics of this specific game:
- What surprises first-time implementers?
- What state changes are easy to forget or get wrong?
- What happens at edge transitions — deck exhausted, board full, turn wrap-around?
- Does any piece or card have dual state (e.g. face-up/face-down)?
- Are there cascading effects or resets that don't preserve order?

For well-known games, use canonical rules and systems — don't invent your own. Name them explicitly. Include tests that verify correct behavior against known examples.

Every non-obvious mechanic must appear somewhere in the plan — Special Rules, Edge Cases, Data Model, or Game Logic. If a mechanic has no test case, add one.

Fill out every section completely — no placeholders, no `...`, no generic content. Only include the AI / Computer Player section if the game has a computer opponent.

Fill in the Help & Strategy Guide with real strategies, actual common mistakes, and beginner tips specific to this game.

Write the completed plan to `artifacts/<game-name>/PLAN.md`.

---

## Step 3 — Self-review

Read the completed plan and check:
- Any `...` placeholders remaining?
- All standards from `OVERVIEW.md` included?
- All checklist items specific enough to code from — no vague items like `- [ ] handle moves`?
- Non-obvious mechanics covered with corresponding test cases?
- Canonical systems named explicitly?
- User decisions from `OVERVIEW.md` all reflected?

Fix any gaps, then write the final plan to `artifacts/<game-name>/PLAN.md`.