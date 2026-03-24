---
name: create-known-game
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

**If yes:** proceed to Step 2.

**If no, if anything is unclear, or if no game name is provided:** stop and ask the user:
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

1. Run `npm create vite@latest <game-name> -- --template react-ts` from the repo root
2. Add to `devDependencies` in `<game-name>/package.json`:
   - `"vitest": "^3.0.0"`
   - `"jsdom": "^26.0.0"`
   - `"@testing-library/react": "^16.0.0"`
   - `"@testing-library/user-event": "^14.0.0"`
3. Add `"test": "vitest"` to the `scripts` block
4. Replace `vite.config.ts` with:
```ts
   import { defineConfig } from 'vitest/config'
   import react from '@vitejs/plugin-react'
   export default defineConfig({
     plugins: [react()],
     test: { environment: 'jsdom', globals: true },
   })
```
5. Copy `tic-tac-toe/src/global.css` into `<game-name>/src/global.css`
6. In `<game-name>/src/main.tsx` replace the default CSS import with `import './global.css'`
7. Run `npm install` inside `<game-name>/`
8. Clean up Vite boilerplate:
   - Remove `src/assets/`
   - Clear `App.css`
   - Remove counter/logo code from `App.tsx`
9. Copy `tic-tac-toe/public/favicon-32x32.png` to `<game-name>/public/favicon-32x32.png`
10. Update `index.html` to reference `favicon-32x32.png`
11. Delete the other two unused icons in `<game-name>/public/`

Stop and surface any errors before continuing. Ignore the TS type error in `vite.config.ts` about Plugin type incompatibility between vite@8 (rolldown) and vitest@3 (bundled rollup) — this is a known false positive, tests run fine.

---

## Step 3 — Create the plan file

1. Create `.claude/plans/<game-name>/` folder
2. Copy the plan template from `.claude/plans/PLAN_TEMPLATE.md` to `.claude/plans/<game-name>/PLAN.md`
3. Replace all `<game-name>` placeholders with the actual game name

---

## Step 4 — Launch planner

```
Task: "Read and follow `.claude/skills/planner/SKILL.md`.
Game name: <game-name>
Known game: <known-game> (if different from game name)"
```
