# shut-the-box
> Based on: Shut the Box

## Game Design

**Rules:** 9 tiles numbered 1-9, all open at start. On your turn, roll dice, then flip down (shut) any combination of open tiles whose values sum exactly to the dice total. Repeat until no valid combination exists — your score is the sum of remaining open tiles. Score 0 = "Shut the Box." Once tiles 7, 8, and 9 are all shut, the player may choose to roll one die or two on their next roll.

**Players:** 1

**Modes / variants:** Solo only — score tracked against personal best

**Win / draw conditions:** Game ends when no valid tile combination matches the dice total; score = sum of open tiles; 0 = perfect ("Shut the Box")

**Special rules / one-off mechanics:**
- One-die option: available only when tiles 7, 8, AND 9 are all shut; player chooses 1 or 2 dice before rolling that turn
- A player must shut tiles totaling EXACTLY the dice total in a single selection — partial sums not allowed mid-turn; they select tiles one-by-one and confirm when sum matches
- If no subset of open tiles sums to the dice total, the turn (and the player's game) ends immediately

**UI flow:**
1. Home screen — records, New Game / Resume
2. Play screen: roll phase -> select phase -> roll phase -> ... -> game-over overlay
3. From any screen: help modal, theme toggle

**Edge cases:**
- Roll total = 1: only tile 1 can match; if tile 1 is already shut, game over immediately
- All tiles shut after a selection: game over with score 0 ("Shut the Box!") — don't require another roll
- One-die roll lands on a total with no valid combo: same end-of-game logic applies
- Player selects tiles that sum to the total but one tile is already shut: validate each selected tile is open
- 2P P2 plays to beat P1's score: P1's score is visible but doesn't change P2's rules — P2 still plays until they can't move
- diceCount resets to 2 at the start of each new game

---

## Data Model

**Board / grid:** `tiles` — array of 9 booleans, index 0 = tile 1, index 8 = tile 9; `true` = open, `false` = shut

**Piece / token types:** Tiles are simple toggle elements; no pieces beyond that

**Game state shape:**
```js
{
  tiles: [true, true, true, true, true, true, true, true, true],
  dice: [],              // [] before first roll; [n] or [n, n] after roll
  diceTotal: 0,
  selectedTiles: [],     // indices of tiles selected for current move (not yet confirmed)
  phase: 'rolling' | 'selecting' | 'game-over',
  canRollOneDie: false,  // true when tiles[6], tiles[7], tiles[8] are all false
  diceCount: 2,          // 1 or 2; changeable only when canRollOneDie is true
}
```

**State flags:**
- `phase: 'rolling'` — waiting for player to roll
- `phase: 'selecting'` — dice rolled, player choosing tiles
- `phase: 'game-over'` — no valid moves or all tiles shut
- `canRollOneDie` — recalculated after every tile confirmation: `tiles[6] === false && tiles[7] === false && tiles[8] === false`

**Turn structure:**
1. Player clicks Roll (or chooses 1/2 dice first if `canRollOneDie`)
2. Dice animate and land on values; `diceTotal` computed
3. `getValidCombinations(openTiles, diceTotal)` called — if empty, transition to `phase: 'game-over'`
4. Player clicks open tiles to toggle `selectedTiles`; if `selectedSum === diceTotal`, Confirm button activates
5. Player confirms — selected tiles shut, `selectedTiles` cleared, `canRollOneDie` updated, check if all tiles shut (score 0 → game-over), else back to `phase: 'rolling'`

**Move validation approach:**
- `getValidCombinations(openTileIndices, target)` — recursive subset-sum returning all valid subsets; used to check if any move exists after a roll
- `isSelectionValid(selectedIndices, allTiles)` — all selected indices are open (`tiles[i] === true`) and `selectedSum <= diceTotal`
- `canConfirm(selectedIndices, diceTotal)` — `selectedSum === diceTotal`
- Clicking an already-shut tile does nothing
- Clicking a selected tile deselects it
- Clicking an open tile when `selectedSum + tileValue > diceTotal` is ignored (or gives a brief shake animation)

**Invalid move handling:**
- Clicking a shut tile: no-op
- Clicking a tile that would exceed diceTotal: tile shakes briefly, no state change
- Confirming with wrong sum: Confirm button is disabled — can't trigger

---

## Help & Strategy Guide

**Objective:** Roll dice and flip down numbered tiles (1-9) that sum to your roll. Shut all 9 tiles for a perfect score. Lowest score wins.

**Rules summary:**
- On your turn, roll two dice. Flip any open tiles that add up to the total.
- Once tiles 7, 8, and 9 are all shut, you may roll one die instead of two.
- If no open tiles can match your roll total, your turn ends. Your score = sum of remaining open tiles.
- Score 0 = "Shut the Box."

**Key strategies:**
- Target 7, 8, and 9 early — shutting them unlocks single-die rolling, which gives more control
- When multiple combinations match a roll, prefer the one that shuts higher tiles
- Example: roll total is 9, open tiles include [1,8] and [2,3,4] — shutting 1+8 is better because it removes tile 8
- Single-die rolling (once 7/8/9 are shut) gives totals 1-6, which are all achievable with the remaining tiles 1-6 if enough are open
- A roll of 12 (max) is only matchable by [3,9], [4,8], [5,7], [4,3,5], etc. — as high tiles get shut, high totals become unbeatable sooner

**Common mistakes:**
- Always flipping just the single matching tile (e.g., roll 6, flip only tile 6) when a higher-value combination like [2+4] or [1+5] would be equivalent but leaves lower tiles for later
- Ignoring the one-die option even when it becomes available — switching to one die significantly improves odds in the endgame
- Shutting tile 1 early — tile 1 is valuable as a "wildcard" adjustment for odd-total rolls later

**Tips for beginners:**
- There is no wrong move as long as tiles sum to the total, but higher = better for shutting first
- When you get a total that matches a single open tile exactly AND a multi-tile combination, consider which tiles you want available for future rolls
- Keep tile 1 open as long as possible — it adds flexibility to any roll

---

## Game Logic
- [x] `initGame()` — returns fresh game state: `tiles` all true, `phase: 'rolling'`, `dice: []`, `selectedTiles: []`, `canRollOneDie: false`, `diceCount: 2`
- [x] `rollDice(state)` — generates 1 or 2 random 1-6 values based on `state.diceCount`; sets `state.dice` and `state.diceTotal`; calls `checkNoMoves(state)` — if no valid moves, sets `phase: 'game-over'`; else sets `phase: 'selecting'`
- [x] `getValidCombinations(openTileIndices, target)` — recursive subset-sum over `openTileIndices` (values = index+1); returns array of arrays; used by `checkNoMoves` and for highlighting valid tile combos
- [x] `checkNoMoves(state)` — calls `getValidCombinations`; if result is empty, triggers end-of-player-game
- [x] `toggleTileSelection(state, tileIndex)` — if tile is shut: no-op; if already selected: remove from `selectedTiles`; if `selectedSum + tileValue > diceTotal`: no-op (+ shake flag); else add to `selectedTiles`
- [x] `confirmSelection(state)` — only callable when `selectedSum === diceTotal`; sets `tiles[i] = false` for each index in `selectedTiles`; clears `selectedTiles`; updates `canRollOneDie`; checks if all tiles shut (sets score 0, phase 'game-over'); else sets `phase: 'rolling'`
- [x] `updateCanRollOneDie(state)` — `state.canRollOneDie = !state.tiles[6] && !state.tiles[7] && !state.tiles[8]`; resets `state.diceCount` to 2 if no longer eligible
- [x] `setDiceCount(state, count)` — only sets if `state.canRollOneDie && state.phase === 'rolling'`; count is 1 or 2
- [x] `calcScore(tiles)` — returns sum of values where `tiles[i] === true` (i.e., `open tiles → value = i+1`)
- [x] `endGame(state)` — computes score via `calcScore`; sets `phase: 'game-over'`; calls `saveBestScore(score)`
- [x] `saveGame(state)` — serializes state to `localStorage['stb-saved-game']`
- [x] `loadGame()` — reads and parses `localStorage['stb-saved-game']`; returns null if absent or invalid
- [x] `clearSavedGame()` — removes `localStorage['stb-saved-game']`
- [x] `saveBestScore(score)` — saves to `localStorage['stb-best-score']` only if no existing record or `score < current best`

---

## UI & Rendering

- [x] **Home screen** — full viewport; game-themed background (dark wood or green felt texture via CSS, no images); centered container min-width 420px with `--shadow-lg` and inset border; top row: help, theme, donate icon buttons (SVGs from `.claude/icons/`); title "Shut the Box"; records section showing best score; New Game button always visible; Resume button visible only when `localStorage['stb-saved-game']` exists
- [x] **Play screen** — centered container min-width 420px; header with close (x), help, theme, donate icons + horizontal rule; tile row: 9 tile buttons numbered 1-9, open tiles clickable and highlighted when selected, shut tiles visually flipped/dimmed; dice area: shows 1 or 2 dice faces (SVG or CSS-drawn pips); dice count toggle (1 die / 2 dice) visible and enabled only when `canRollOneDie`; Roll button (active during `phase: 'rolling'`); Confirm button (active when `selectedSum === diceTotal`); status line: current dice total, selected sum; score display: live sum of open tiles using `--font-mono`
- [x] **Game over overlay** — fades in over play screen; shows final score in large `--font-mono`; "Shut the Box!" banner if score is 0 in `--color-success`; shows personal best; Play Again and Menu buttons
- [x] **HelpModal** — triggered by help icon on any screen; content from Help & Strategy Guide section; close button; accessible via keyboard (Escape closes)
- [x] **ConfirmModal** — triggered when closing play screen (x button) or starting new game while one is in progress; message: "Quit this game? Your progress will be lost."; Cancel and Quit buttons; min-width 420px

---

## Accessibility
- [x] All tile buttons have `aria-label="Tile [n], [open|shut]"` and `aria-pressed` reflecting selected state
- [x] Roll button: `aria-label="Roll dice"`; Confirm button: `aria-label="Confirm selection"`
- [x] Dice count toggle buttons: `aria-label="Roll one die"` / `aria-label="Roll two dice"` with `aria-pressed`
- [x] Game over overlay: `role="dialog"` with `aria-modal="true"` and `aria-labelledby` pointing to result heading; focus trapped inside while open
- [x] HelpModal and ConfirmModal: same `role="dialog"` / `aria-modal` / focus trap pattern; Escape key closes
- [x] Keyboard: Tab navigates all interactive elements; Enter/Space activates buttons and tiles
- [x] Header icon buttons: `aria-label` for each (Close, Help, Theme, Donate)
- [x] Status line: `aria-live="polite"` so screen readers announce dice total and selection sum updates

---

## Styling
- [x] All colors use semantic variables — no hardcoded values
- [x] All spacing uses `--space-*` variables
- [x] Numbers, scores, and dice pip counts use `--font-mono`
- [x] Main container: `--shadow-lg`, inset box-shadow border using `--color-border`, min-width 420px, centered
- [x] All interactive elements have hover, active, and disabled states with transitions — nothing snaps
- [x] Status text: win / score-0 = `--color-success`; turn-end / loss = `--color-danger`; neutral = `--color-accent`
- [x] Game over overlay animates in with fade + scale (opacity 0 -> 1, scale 0.95 -> 1, 200ms ease)
- [x] Responsive at 375px — tile row wraps or scales down so all 9 tiles fit
- [x] Light theme verified — surfaces have visible depth and contrast
- [x] Tile open state: full `--color-accent` background with dark text; shut state: dimmed (`--color-surface-raised`), number crossed out or hidden, no hover effect
- [x] Tile selected state: `--color-accent` with `--shadow-accent` glow outline
- [x] Dice faces: CSS-drawn with pips or Unicode die characters; animate with a brief roll keyframe (shake + scale) on each new roll
- [x] Roll button: primary accent style; disabled and visually muted during `phase: 'selecting'`
- [x] Confirm button: success color (`--color-success`); disabled until `selectedSum === diceTotal`
- [x] Dice count toggle (1/2 dice): visible only when `canRollOneDie`; selected die count highlighted; transitions in smoothly
- [x] Background: dark felt/wood texture using CSS radial or linear gradients with `--gray-90` base — no images
- [x] Home screen records section: subdued style, `--color-text-muted`, `--font-mono` for numbers

---

## Polish
- [x] Tile shut animation: flip transform (rotateX 0 -> 90deg, 200ms) then hide number, background dims
- [x] Dice roll animation: brief shake keyframe (translateX ±3px, 3 cycles, 300ms total) on `dice` state change
- [x] Tile shake animation: translateX ±4px, 2 cycles, 150ms — plays when a tile click is rejected (would exceed total)
- [x] "Shut the Box!" score-0 moment: brief celebration pulse on the container border (shadow-accent glow, 400ms)
- [x] Confirm button transitions from disabled to enabled smoothly as `selectedSum` reaches `diceTotal`
- [x] Home screen Resume button fades in on mount if saved game exists
- [x] All modal open/close transitions: fade + scale (same as game over overlay)
