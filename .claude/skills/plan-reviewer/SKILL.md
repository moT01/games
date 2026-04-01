---
name: plan-reviewer
description: Reviews a completed game plan for completeness and quality. Called by create-known-game — do not invoke directly.
---

# plan-reviewer

## Purpose

Review the completed game plan and provide specific, constructive feedback
to improve it. The goal is to make the plan strong enough that a developer
could start coding without any questions.

## Invocation

This skill is called by `create-known-game` or `plan-game` — do not invoke directly.

---

## Inputs

- `<game-name>` — passed in via Task call
- `<known-game>` — passed in via Task call (may be same as game name)

All file paths are derived from the game name:

- Plan file: `artifacts/<game-name>/PLAN.md`
- Review file: `artifacts/<game-name>/PLAN-REVIEW.md`

---

## Step 1 — Read the plan

Read `artifacts/<game-name>/PLAN.md` fully before evaluating anything.

---

## Step 2 — Evaluate the plan

Ask yourself: could a developer pick this plan up and start coding without
any questions? Then ask: is there anything specific that would meaningfully
reduce problems during coding if it were improved?

Be a collaborator, not a gatekeeper. The goal is a stronger plan, not
finding reasons to reject it.

### Flag for REVISE if any of these are true:

**Critical — a developer could not start without this:**
- Any `...` placeholders remain anywhere in the document
- Any section is blank without a justified N/A
- Win condition is vague or incomplete
- Data model is missing state shape, piece types, or turn structure
- Move validation approach is not specified
- Game Logic items are generic rather than specific function names
  (e.g. `- [ ] handle moves` is not acceptable —
  `- [ ] validateMove(board, from, to)` is)
- Components are listed without specific responsibilities
- Testing has no specific test cases
- Edge cases section is empty

**Meaningful improvement — addressing this would reduce coding problems:**
- Game has special rules but state flags are missing from the data model
- Computer player mentioned but AI strategy approach is vague
- Game can draw but stalemate conditions are underspecified
- Interaction model covers basics but leaving it vague would cause
  UI decisions to be made ad-hoc during coding
- Testing has a start but obvious cases for this specific game are missing
- Edge cases feel thin given the complexity of the game
- Polish section is empty

**Approve if:**
- Everything is substantive and specific
- No placeholders remain
- A developer has enough information to make good decisions without guessing

---

## Step 3 — Write the review file

Write `artifacts/<game-name>/PLAN-REVIEW.md` using this format:

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
- (numbered list of specific, constructive improvements — be precise
  about what is missing or thin and which section it is in)
  Example: "Game Logic: validateMove() is listed but there is no mention
  of how path clearance is handled for sliding pieces — add a
  isPathClear(board, from, to) function or note it is handled inside
  validateMove()"
```

---

## Step 4 — Done

Write the review file and stop. Do not attempt to fix the plan yourself.
Do not launch any other skills or agents.
