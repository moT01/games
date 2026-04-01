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

- Plan file: `artifacts/<game-name>/PLAN.md`
- Review file: `artifacts/<game-name>/PLAN-REVIEW.md`

---

## Step 1 — Determine mode

Check if `artifacts/<game-name>/PLAN-REVIEW.md` exists:

**If it does not exist:** this is the first pass. Proceed to Step 2.
**If it exists:** this is a revision pass. Skip to Step 3.

---

## Step 2 — Fill out the plan

Read `artifacts/<game-name>/PLAN.md`.

The template is a starting point, not a ceiling. Use it as the minimum
structure, but add sections, fields, or checklist items whenever the game
warrants it. For example: a game with complex scoring might need a
`## Scoring` section; a game with multiple distinct phases might need a
`## Game Phases` breakdown. If something important about this specific game
doesn't fit neatly into the template, add a section for it. The goal is a
plan that fully captures this game — not one that merely fills in the blanks.

Before writing anything, mentally enumerate the non-obvious rules and mechanics
of this specific game. Ask yourself:

- What behaviors surprise first-time implementers of this game?
- What state changes are easy to forget or get wrong?
- What happens at edge transitions — deck exhausted, board full, turn wrap-around?
- Are there any "resets" or "reshuffles" that don't preserve order?
- Does any piece, card, or token have dual state (e.g. face-up vs face-down)?
- Are there cascading effects when something changes?
- What interactions feel simple but have hidden complexity?

Write these down mentally, then make sure every one of them appears somewhere
in the plan — either in Special Rules, Edge Cases, Data Model state flags,
or Game Logic functions. If a non-obvious mechanic has no corresponding test
case, add one.

Fill out every section completely using your own knowledge of the game:
- Write a concrete **What we're building** description
- Fill in real rules, players, modes, win/draw conditions:
  - Determine appropriate player modes based on the nature of the game:
    - Turn-based competitive games (checkers, chess, connect 4) → local multiplayer + vs computer
    - Score/roll-based games (yahtzee, etc.) → single player + local multiplayer + vs computer
    - Puzzle games → single player only
    - Always include a mode select screen if more than one mode is supported
    - Use your judgment — pick what makes sense for this specific game. Lean towards more modes if you're unsure.
- List actual edge cases for this specific game
- Fill in real **Game Logic** checklist items with specific function names
- Fill in real **Components** checklist items with specific names and responsibilities
- Fill in real **Styling**, **Polish**, and **Testing** checklist items
- Work out the full **Data Model** — state shape, piece types, turn structure
- Fill in **Special rules / one-off mechanics** if any exist
- Fill in **AI / Computer Player** if a computer opponent is needed
- Fill in **Interaction Model** with specific input and feedback details
- Fill in the **Help & Strategy Guide** with content specific to this game —
  real strategies, actual common mistakes, and beginner tips that reflect how
  this game is actually played. No generic filler.

Do not leave any section as `...` or blank. If you are uncertain about
something, make your best attempt — the plan-checker will catch gaps.

Write the completed plan back to `artifacts/<game-name>/PLAN.md`.

---

## Step 3 — Revise the plan

Read both files:
- Current plan: `artifacts/<game-name>/PLAN.md`
- Review notes: `artifacts/<game-name>/PLAN-REVIEW.md`

Address every item flagged in the review. Apply the same quality standard as Step 2 — specific, no placeholders,
no generic content. Do not change sections that were not flagged. Write the revised plan back to `artifacts/<game-name>/PLAN.md`.
