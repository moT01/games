# Game Standards

Every game in this repo must implement all of the following. These are not
optional. The planner must include them in the plan checklist. The coder
must implement them even if somehow missing from the plan.

---

## Layout — Two-Screen Structure

Every game has two screens: a **Home screen** and a **Play screen**.
These are not separate routes — they are separate components rendered
conditionally in `App`.

**Home screen must include:**
- Game title
- Mode select (if more than one mode exists)
- New Game / Play button
- Access to Help modal
- Donate button
- Theme toggle

**Play screen must include:**
- The game board / play area
- Score, timer, or status display (whatever is relevant)
- Access to Help modal
- Donate button
- Theme toggle
- A way to return to the Home screen (triggers "Are you sure?" if game is active)

---

## Theme — Light and Dark

Every game supports a light theme and a dark theme with a toggle in the
top bar on every screen.

**Implementation:**
- Toggle button in the top bar, visible on both Home and Play screens
- Theme stored in `localStorage` under `{game-name}:theme`
- Applied via a `data-theme="light"` or `data-theme="dark"` attribute on
  `<html>` or the root app element
- All colors use CSS variables — swapping the theme means swapping variable
  values, nothing else

**CSS pattern:**
```css
:root[data-theme="dark"] {
  --color-bg: var(--gray-90);
  --color-surface: var(--gray-85);
  --color-text-primary: var(--gray-00);
  /* etc. */
}

:root[data-theme="light"] {
  --color-bg: var(--gray-05);
  --color-surface: var(--gray-00);
  --color-text-primary: var(--gray-90);
  /* etc. */
}
```

Define both themes fully. Do not assume dark is the default and light is
an afterthought — both must look intentional and polished.

---

## Donate Button

Every screen has a donate button in the top-right corner.

- Link: `https://your-donate-link.com` ← replace with real link
- Opens in a new tab (`target="_blank" rel="noopener noreferrer"`)
- Styled as a small secondary button — present but not distracting
- Label: "Support" or a heart icon + "Donate" — keep it understated

---

## Local Storage

Every game persists the following. Use `{game-name}:` as the key prefix
to avoid collisions between games.

| What | Key pattern | Notes |
|---|---|---|
| Theme preference | `{game-name}:theme` | `"light"` or `"dark"` |
| Best score / time | `{game-name}:best-score` | Format depends on game |
| Game state | `{game-name}:game-state` | Full state snapshot for resume |
| Last mode played | `{game-name}:last-mode` | Pre-select on next visit |

**Game state resume:**
- On load, check for a saved game state
- If found, offer the player a "Resume" option on the Home screen
- If the player starts a new game, clear the saved state
- Save state after every meaningful action (move made, turn ended, etc.) —
  not on a timer

**Do not store:**
- Anything sensitive
- Anything that requires a backend to validate

---

## Help Modal

Every game has a help modal explaining the rules and strategy.

- Triggered by a "?" button in the top bar, visible on all screens
- Covers: objective, rules, how to play, key strategies, common mistakes,
  tips for beginners
- Content must be specific to this game — no generic filler
- Dismissible by clicking outside or a close button
- Does not pause or reset the game when opened

The planner fills in the help content in the `## Help & Strategy Guide`
section of the plan. The coder implements it as a `HelpModal` component.

---

## "Are You Sure?" Modal

Triggered whenever a player might accidentally lose progress:

- Clicking "Home" or "New Game" during an active game
- Any action that resets or exits mid-game

**Implementation:**
- A simple modal: message + "Yes, leave" (danger style) + "Cancel" (secondary style)
- If confirmed, proceed with the action and clear saved game state
- If cancelled, dismiss and return to the game
- Do not trigger if the game is already over

---

## No Backends

No servers, no APIs, no databases, no authentication. Every game runs
entirely in the browser. All persistence is via `localStorage` only.

---

## No Routing

Do not use React Router or any routing library. Home and Play screens are
components rendered conditionally based on state in `App`. Navigation is
just state changes.
