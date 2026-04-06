---
name: create-known-game
description: Scaffolds and builds a well-known game from scratch. Only invoked explicitly as /create-known-game <game-name> — do not trigger from natural language.
---

# create-known-game

## Purpose

Scaffold, plan, and fully build a new game from scratch. Asks a few quick questions upfront, then runs the entire pipeline autonomously.

## Invocation

```
/create-known-game checkers
/create-known-game five-dice (yahtzee)
```

The first argument is the game name to use for folders and files. If a name is provided in parentheses, that is the well-known game to base it on. Otherwise use the game name as the known game.

Do not run this skill unless explicitly invoked with the `/create-known-game` command.

---

## Step 1 — Parse invocation

- `<game-name>` — folder name and project name
- `<known-game>` — the well-known game to base it on (parentheses value if
  provided, otherwise same as game name)

Use `<known-game>` for all rules and game knowledge.
Use `<game-name>` for all file and folder naming.

---

## Step 2 — Ask upfront questions

Before touching any files, introduce what you're about to build and ask
focused questions. Keep it conversational — only ask what you genuinely
need answered.

**Always ask:**
1. Any rules variants? _(name the most common version you'll use as the
   default so the user knows what to expect)_
2. Any mode overrides? _(state the default modes you're planning based on
   the game type, ask if they want anything different)_

**Ask only if genuinely unclear:**
- Anything about the game's rules that has common variations you can't
  resolve yourself
- Computer player requirements if the game type is ambiguous

**Never ask about:**
- Local storage, theme, donate button, help modal — these are always
  included per STANDARDS.md
- Anything you can reasonably decide yourself

Format it like:

> "I'm going to build **[known-game]** as **[game-name]**. A couple of
> quick questions before I start:
>
> 1. ...
> 2. ...
>
> If the defaults look fine, just say go."

Wait for the user's response before doing anything else.

---

## Step 3 — Write OVERVIEW.md

Once the user responds, create `artifacts/<game-name>/` folder and write
`artifacts/<game-name>/OVERVIEW.md` capturing all decisions:
```markdown
# <game-name>
> Based on: <known-game>

## Decisions

**Rules variant:** ...
**Modes:** ...
**Anything else noted by user:** ...

## Defaults applied
- Light/dark theme toggle
- Donate button
- Local storage (theme, best score/time, game state, last mode)
- Help modal
- "Are you sure?" modal
- Home screen + Play screen (no routing)
```

This file is the source of truth for why decisions were made. The planner
will read it before filling out the plan.

---

## Step 4 — Bootstrap the project

Follow these steps exactly. Do not perform any actions not listed here.
Replace `<game-name>` with the actual game name throughout.

1. Run `cp -R boilerplate <game-name>` from the repo root to copy the boilerplate project into a new folder with the game name for the new game.
2. In the `<game-name>/public/index.html` file, replace the placeholder title with the game name. Use a Capitalized, human-friendly version of the game name (e.g. "Five Dice" instead of "five-dice").
3. Run `npm install` inside `<game-name>/`

Stop and surface any errors before continuing. Ignore the TS type error in `vite.config.ts` about Plugin type incompatibility between vite@8 (rolldown) and vitest@3 (bundled rollup) — this is a known false positive, tests run fine.

---

## Step 5 — Create the plan file

1. Create `artifacts/<game-name>/` folder
2. Copy the plan template from `.claude/templates/PLAN_TEMPLATE.md` to `artifacts/<game-name>/PLAN.md`
3. Replace all `<game-name>` placeholders with the actual game name
4. Replace all `<known-name>` placeholders with the known game name - or use the game name if no known name was provided

---

## Step 6 — Planning loop

Create `artifacts/<game-name>/PLAN-REVISION-COUNT.txt` containing `0`.

### 6a — Launch planner

```
Task: "Read and follow `.claude/skills/planner/SKILL.md`.
Game name: <game-name>
Known game: <known-game>"
```

### 6b — Launch plan-reviewer

```
Task: "Read and follow `.claude/skills/plan-reviewer/SKILL.md`.
Game name: <game-name>
Known game: <known-game>"
```

### 6c — Check result

Read the first line of `artifacts/<game-name>/PLAN-REVIEW.md`:

**If `STATUS: APPROVED`:** proceed to Step 7.

**If `STATUS: REVISE`:**
- Read `artifacts/<game-name>/PLAN-REVISION-COUNT.txt`
- If count < 2 → increment count, return to Step 6a
- If count >= 2 → proceed to Step 7

---

## Step 7 — Finalize plan

Check off the Setup checklist item in `artifacts/<game-name>/PLAN.md` — bootstrapping is already done.

## Step 8 — Prepare for coding

- Create an empty `artifacts/<game-name>/CODER-LOG.md` file. This is where the coder will log their work in the next phase.

## Step 9 — Coding loop

### 9a — Launch coder

```
Task: "Read and follow `.claude/skills/coder/SKILL.md`.
Game name: <game-name>
Known game: <known-game>"
```

### 9b — Check progress

Read `artifacts/<game-name>/PLAN.md`. Are there any unchecked items remaining?

**If yes:** return to Step 9a.
**If no:** proceed to Step 10.

---

## Step 10 — Done

Tell the user:
"Game complete. The finished code is in `<game-name>/` and the updated
plan checklist is at `artifacts/<game-name>/PLAN.md`."
