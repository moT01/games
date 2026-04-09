---
name: plan-reviewer
description: Reviews a completed game plan for completeness and quality. Called by create-known-game — do not invoke directly.
---

# plan-reviewer

## Purpose

Review the completed game plan and provide specific, constructive feedback. The goal is a plan strong enough to build a production ready game.

## Invocation

Called by `create-known-game` — do not invoke directly.

---

## Inputs

- `<game-name>` — passed in via Task call
- `<known-game>` — passed in via Task call (may be same as game name)

All file paths are derived from the game name:

- Plan: `artifacts/<game-name>/PLAN.md`
- Overview: `artifacts/<game-name>/OVERVIEW.md`
- Review: `artifacts/<game-name>/PLAN-REVIEW.md`

---

## Step 1 — Read the plan

Read `artifacts/<game-name>/PLAN.md` and `artifacts/<game-name>/OVERVIEW.md` fully before evaluating anything.

---

## Step 2 — Evaluate the plan

Ask yourself: could a developer pick this plan up and code this to production ready without any questions?

### Flag for REVISE if any of these are true:

**Critical:**
- Any `...` placeholders remain
- Any section is blank without a justified N/A
- Win / draw conditions are vague or incomplete
- Data model is missing state shape, piece types, or turn structure
- Move validation approach is not specified
- Game Logic items are generic rather than specific function names
- Components are listed without specific responsibilities
- Testing has no specific test cases
- Edge cases section is empty
- Any user decision from OVERVIEW.md was ignored or overridden

**Meaningful improvement:**
- Special rules exist but state flags are missing from the data model
- Computer player mentioned but AI strategy is vague
- Testing has a start but obvious cases for this game are missing
- Edge cases feel thin given the complexity of the game
- Help & Strategy Guide content feels generic rather than game-specific

---

## Step 3 — Write the review file and stop

Do not fix the plan yourself. Do not launch any other skills or agents.

Write `artifacts/<game-name>/PLAN-REVIEW.md`:

### If approved:
```markdown
STATUS: APPROVED

## Summary
One or two sentences on why the plan is ready.
```

### If revise:
```markdown
STATUS: REVISE

## Feedback
- (numbered list of specific improvements — be precise about what is missing and which section it is in)
```