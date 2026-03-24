# Games Repo — Claude Code Guidelines

## Starting a Session

At the start of every session:
1. Read this file (CLAUDE.md) fully before doing anything
3. Read UI.md before writing any CSS or designing any UI - otherwise, ignore it
4. Ask the user what they want to work on — do not assume or start anything unprompted

---

## Project Structure

```
freecodecamp-games/
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