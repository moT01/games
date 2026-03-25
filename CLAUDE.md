# Games Repo — Claude Code Guidelines

## Project Structure

```
freecodecamp-games/
├── <game-name>/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── App.tsx
│   ├── package.json
│   └── index.html
└── (future games follow the same pattern)
```

- Each game lives in its own self-contained folder with its own `package.json`
- Games do not share code with each other — keep them independent

## Paths
All relative paths are relative to the repo root — the directory containing
this file (`CLAUDE.md`). This applies to all skills, tasks, and sub-agents.

## Off Limits
Never read, search, or traverse the `node_modules/` directory under any circumstances.

---

## Stack

- **Language**: TypeScript (always — never plain JS)
- **Framework**: React (functional components only, no class components)
- **Runtime**: Node.js
- **Styling**: Plain CSS files (`.css`) — one per component, plus a `global.css` at the
  app level for fonts, CSS variables, and resets

---

## Keep It Simple

The overriding philosophy for this project is: **prefer the simplest thing that works.**
Only add complexity when there is a clear, immediate reason.

- **Code structure** — don't create extra files, folders, abstractions, or wrapper
  components unless they're genuinely needed right now
- **TypeScript** — use simple, obvious types. Avoid complex generics, excessive interfaces,
  or over-typed code
- **Error handling** — a `console.error` is fine for a game
- **Abstractions** — don't extract a helper function or utility until the same logic
  appears at least twice
- **Comments** — only comment things that aren't obvious
- **Terminal commands** — always use the simplest form. No shell redirects, pipes,
  or flags unless genuinely needed

---

## Git
- The user handles all git commits — do not run `git add`, `git commit`, or `git push`

---

## Code Style
- Functional React components with hooks
- TypeScript strict mode — no `any` unless absolutely necessary and explained
- Plain CSS files — one `.css` file per component, no inline styles
- `global.css` at the app root for shared styles, CSS variables, and resets
- Co-locate component styles: `Button.tsx` and `Button.css` in the same folder
- Prefer named exports over default exports for components

---

## Definition of Done
Before declaring any code task complete:
- Does it match the agreed plan exactly?
- Are there any files or abstractions created that weren't discussed?
- Is it as simple as it could be?
- Does it actually work end to end?
