---
name: create-known-game
description: Scaffolds and builds a well-known game from scratch. Only invoked explicitly as /create-known-game <game-name> — do not trigger from natural language.
---

# create-known-game

## Purpose

Scaffold, plan, and fully build a new game from scratch.

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
- `<known-game>` — the well-known game to base it on (parentheses value if provided, otherwise same as game name)

Use `<known-game>` for all rules and game knowledge.
Use `<game-name>` for all file and folder naming.

---

## Step 2 — Ask upfront questions

Before touching any files, introduce what you're about to build and ask focused questions. Keep it conversational — only ask what you genuinely need answered.

**Always ask:**
1. Any rules variants? _(name the most common version you'll use as the default so the user knows what to expect)_
2. Any mode overrides? _(state the default modes you're planning based on the game type, ask if they want anything different)_

**Ask only if genuinely unclear:**
- Anything about the game's rules that has common variations you can't resolve yourself
- Computer player requirements if the game type is ambiguous

Format it like:

> "I'm going to build **[known-game]** as **[game-name]**. 
> 
> 1. ...
> 2. ...
> ...
> Any additional features or custom behaviour?
>
> Defaults: [list what you're planning]. Just say go if that works."

Wait for the user's response before doing anything else.

---

## Step 3 — Write the overview

1. Create `artifacts/<game-name>/` folder
2. Copy `.claude/templates/STANDARD_FEATURES.md` to `artifacts/<game-name>/OVERVIEW.md`
3. Append a concise summary of the user's answers to the "Game Decisions" section at the bottom

### 3a — Review loop

Tell the user that you've written `artifacts/<game-name>/OVERVIEW.md` and ask them to review it:
> "Does this look right? Anything to add or to remove?"

If the user requests changes, update `OVERVIEW.md` and ask again.
If the user approves, proceed to Step 4.

---

## Step 4 — Bootstrap the project

Follow these steps exactly. Replace `<game-name>` with the actual game name throughout.

1. Run `cp -R boilerplate <game-name>` from the repo root
2. In `<game-name>/index.html`, replace the placeholder title with a capitalized human-friendly version of the game name (e.g. "Five Dice" not "five-dice")
3. Run `npm install` inside `<game-name>/`

Stop and surface any errors before continuing. Ignore the TS type error in `vite.config.ts` about Plugin type incompatibility — known false positive.

---

## Step 5 — Create the plan file

1. Copy `.claude/templates/PLAN_TEMPLATE.md` to `artifacts/<game-name>/PLAN.md`
2. Replace all `<game-name>` placeholders with the actual game name
3. Replace all `<known-game>` placeholders with the known game name

---

## Step 6 — Launch planner

Create `artifacts/<game-name>/PLAN-REVISION-COUNT.txt` containing `0`.

```
Task: "Read and follow `.claude/skills/planner/SKILL.md`.
Game name: <game-name>
Known game: <known-game>
```

---

## Step 7 — Launch coder

```
Task: "Read and follow `.claude/skills/coder/SKILL.md`.
Game name: <game-name>
Known game: <known-game>"
```

---

## Step 8 — Done

Tell the user:
> "<game-name> complete."

If the coding loop hit the iteration cap, note which checklist items remain unchecked.
