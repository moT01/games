# Games Repo — Claude Code Guidelines

## Starting a Session

At the start of every session:
1. Read this file (CLAUDE.md) fully before doing anything
2. Read PLAN.md if it exists in the repo root
3. Read UI.md before writing any CSS or designing any UI - otherwise, ignore it
4. Ask the user what they want to work on — do not assume or start anything unprompted

---

## Plan a New Game

When Tom asks you to plan a new game:

1. Think through the full design before writing anything:
   - What are the core mechanics and win/lose conditions?
   - What UI states and screens are needed?
   - What game logic functions will be required?
   - What components make sense?
   - What edge cases exist?
   - What needs unit vs. component tests?
2. Create `.claude/<GAME_NAME>_PLAN.md` using `.claude/NEW_GAME_TEMPLATE.md` as the structure
3. Fill in **every section** — do not leave placeholder `...` text:
   - Write a concrete **What we're building** description
   - List actual modes/variants or remove that field
   - Write out the real **UI flow** steps
   - List specific **edge cases** for this game
   - Fill in real **Game Logic** checklist items (specific functions/modules)
   - Fill in real **Components** checklist items (specific component names + responsibilities)
   - Fill in real **Styling** checklist items
   - Fill in real **Polish** checklist items
   - Write specific **unit test** cases for the game logic
   - Write specific **component test** cases
4. Add anything else to the plan that might be missing in order to create a functional game.
5. Present the plan to Tom and ask for feedback before doing anything else

## Bootstrapping a New Game

When starting a new game:

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
   Note: VS Code may show a TS type error in `vite.config.ts` about Plugin type incompatibility between vite@8 (rolldown) and vitest@3 (bundled rollup). This is a known false positive — ignore it, tests run fine.
5. Copy `tic-tac-toe/src/global.css` into `<game-name>/src/global.css`
6. In `<game-name>/src/main.tsx`, replace the default CSS import with `import './global.css'`
7. Run `npm install` inside `<game-name>/`
8. Clean up Vite boilerplate: remove `src/assets/`, clear `App.css`, remove counter/logo code from `App.tsx`
9. Copy the `tic-tac-toe/public/favicon-32x32.png` icon file to `<game-name>/public/favicon-32x32.png` and update the icon filename in `index.html` to use `favicon-32x32.png`
10. Delete the other two unused icons in `<game-name>/public/`

---

## Project Structure

```
games/
├── CLAUDE.md
├── PLAN.md
├── tic-tac-toe/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── App.tsx
│   ├── package.json
│   └── index.html
└── (future games follow the same pattern)
```

- Each game lives in its own self-contained folder with its own `package.json`
- Games do not share code with each other for now — keep them independent
- A `/common` folder for shared UI components is a future consideration; do not create it
  unless explicitly asked

---

## Stack

- **Language**: TypeScript (always — never plain JS)
- **Framework**: React (functional components only, no class components)
- **Runtime**: Node.js
- **Styling**: Plain CSS files (`.css`) — one per component, plus a `global.css` at the
  app level for fonts, CSS variables, and resets

---

## Behavior Rules

### Plan before coding
- Before writing any code, present a clear plan: what files will be created, what each
  does, and any decisions being made
- Wait for explicit approval before proceeding
- If scope is unclear, ask questions first — do not make assumptions and start building

### Ask before creating files
- Do not create new files without stating what you're about to create and why
- If a new file wasn't part of the agreed plan, flag it before creating it

### When stuck or uncertain
- Do not guess and proceed — stop and ask
- State what the ambiguity is and offer options if possible
- When choosing between two approaches and unsure, always pick the simpler one and flag it

### Stick to the plan
- Do not add anything that isn't in PLAN.md — no extra features, files, tests, tooling,
  or dependencies
- If something seems like it's missing from the plan, flag it and ask rather than
  filling it in yourself

### No unsolicited dependencies
- Do not add npm packages without asking first
- If a library would genuinely help, suggest it and explain why, then wait for approval

---

## Keep It Simple

The overriding philosophy for this project is: **prefer the simplest thing that works.**
Only add complexity when there is a clear, immediate reason. Do not build for hypothetical
future needs. When in doubt, do less and ask.

- **Code structure** — don't create extra files, folders, abstractions, or wrapper
  components unless they're genuinely needed right now
- **TypeScript** — use simple, obvious types. Avoid complex generics, excessive interfaces,
  or over-typed code. `string`, `number`, `boolean` over elaborate type gymnastics
- **Error handling** — a `console.error` is fine for a game. Don't add elaborate try/catch
  blocks, error boundaries, or fallback UI unless asked
- **Abstractions** — don't extract a helper function or utility until the same logic
  appears at least twice. Duplication is fine early on
- **Comments** — only comment things that aren't obvious. Don't narrate code that reads
  clearly on its own
- **Terminal commands** — always use the simplest form a human would naturally type. No
  shell redirects (`2>&1`), pipes, or flags unless genuinely needed and explained

---

## Git

- The user handles all git commits — do not run `git add`, `git commit`, or `git push`
- You may suggest a commit message if it seems helpful, but never execute it
- Branch management is handled by the user

---

## Code Style

- Functional React components with hooks
- TypeScript strict mode — no `any` unless absolutely necessary and explained
- Plain CSS files — one `.css` file per component, no inline styles
- A `global.css` at the app root for shared styles, CSS variables, and resets
- Co-locate component styles: `Button.tsx` and `Button.css` in the same folder
- Prefer named exports over default exports for components

---

## Definition of Done

Before declaring any task complete, run through these questions. Do not say "done" until
this checklist passes — fix or flag anything that fails.

**For any planning document or spec:**
- Does it cover the user experience — what the player sees, feels, and does?
- Does it describe more than just technical implementation?
- Are edge cases accounted for? (e.g. draw conditions, invalid moves, empty states)
- Would someone with no context understand what we're building and why?
- Is there anything missing that would cause a question on the first day of building?
- When coding items from a checklist, always check off the items you completed after writing code

**For code:**
- Does it match the agreed plan exactly?
- Are there any files or abstractions created that weren't discussed?
- Is it as simple as it could be?
- Does it actually work for the described use case end to end?

**For any response:**
- Did I do what was asked, or something adjacent to it?
- Did I make decisions that should have been flagged to the user first?
- Is there anything I'm not confident about that I should surface rather than guess?