# Game Standards

All of the items below must be included in the `PLAN.md` file

---

## Layout

Every game has a **Home screen** and a **Play screen**. They are separate components rendered conditionally in `App`.

Both screens have a fixed nav at the top with a transparent background.

**The nav must include (from right-to-left):**
- A "Donate" button that links to `https://freecodecamp.org/donate` that opens in a new tab.
- A theme selector icon button to change between light and dark modes. Use the `.dark-palette` and `.light-palette` in `src/global.css` to style the themes.

**Home screen must include:**
- Game title
- All game options (modes, difficulties, etc.)
- Play / Start button
- Access to Help modal

**Play screen must include:**
- The game board / play area
- Score, timer, or status display (whatever is relevant)
- Access to Help modal
- A way to return to the Home screen (triggers "Are you sure?" modal if game is active)

**General layout:**
- Layout should fit the game — compact and centered for simple interfaces, full-window for more complex ones.

---

## Local Storage

Use `{game-name}:` as the key prefix.

Store: theme preference, best score/time, last mode played, game state (save after every meaningful action, offer resume on Home screen).
Use `{game-name}:` as the key prefix to store items to avoid collisions between games.

---

## Help Modal

Every game has a help modal explaining the rules and strategy. Triggered by a "?" button in the nav, visible on all screens. Covers: objective, rules, how to play, strategies, tips.

Content must be specific to this game — no generic filler.
