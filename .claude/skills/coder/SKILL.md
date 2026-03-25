---
name: coder
description: Writes game code section by section based on the approved plan. Called by create-known-game — do not invoke directly.
---

# coder

## Purpose

Implement the game section by section based on the approved plan. For each
section, write the code, have it reviewed, fix any issues, then check off
completed items before moving to the next section.

## Invocation

Called by `create-known-game` as part of the pipeline, or invoked directly
as `/code-game <game-name>` or `/code-game <game-name> (<known-game>)` when a plan already exists.

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

You have everything you need from the Task call. Do not explore the project
structure, search for files, or run any commands to orient yourself.
Derive all paths from `<game-name>` and start immediately.

Only read files that are explicitly listed in the plan, the coder log, or explicitely mentioned.
Do not explore the project structure or search for files.

---

## Step 1 — Read the plan

Read `artifacts/<game-name>/PLAN.md` fully before writing any code.
Identify all sections with unchecked items — these are the sections to implement.
Work through them in order:

1. Setup
2. Game Logic
3. Components
4. Styling
5. Polish
6. Testing

Skip any section where all items are already checked off.

---

## Step 2 — Implement the next incomplete section

Find the first section in the plan with unchecked items. Implement every
unchecked item in that section completely.

Follow the conventions in `CLAUDE.md`:
- TypeScript always — no plain JS
- Functional React components only
- Plain CSS files — one per component
- Keep it simple — no extra abstractions, files, or dependencies not in the plan
- Do not add anything not in the plan

---

## Step 3 — Write the coder log

The coder log is for the code-reviewer — write it clearly and include
anything that would help the reviewer understand what was built and why.
This includes decisions made, tradeoffs, anything uncertain, and anything
that deviated from the plan even slightly.

Overwrite `artifacts/<game-name>/CODER-LOG.md` with:
```markdown
## Section: <section-name-from-PLAN.md>

### Files created / modified
- `path/to/file.ts` — what it does

### Decisions made
- ...

### Uncertainties / flags
- ...

### Anything the reviewer should pay extra attention to
- ...

### Items ready for review
- [ ] specific checklist item from PLAN.md
- [ ] another item
```

---

## Step 4 — Launch code-reviewer
```
Task: "Read and follow `.claude/skills/code-reviewer/SKILL.md`.
Game name: <game-name>
Known game: <known-name>"
```

When the Task completes, continue to Step 5.

---

## Step 5 — Read reviewer feedback

Read `artifacts/<game-name>/CODE-REVIEW.md`.

**If `STATUS: APPROVED`:** proceed to Step 6.

**If `STATUS: REVISE`:** fix every item flagged in the feedback following
the same conventions from Step 2. Fix only what was flagged — do not
rewrite things that were not flagged.

Then proceed to Step 6.

---

## Step 6 — Check off completed items

Read `artifacts/<game-name>/CODER-LOG.md` to remind yourself which items
were implemented in this section. In `artifacts/<game-name>/PLAN.md`,
check off every item that was implemented and not flagged as still broken
by the reviewer.

Items that were flagged and could not be fully resolved stay unchecked.

---

## Step 7 — Next section

If there are more sections with unchecked items, return to Step 2.

If all sections are complete, stop and report:
"Coding complete. All sections implemented. Plan checklist updated."
