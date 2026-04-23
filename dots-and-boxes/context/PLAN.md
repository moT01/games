# dots-and-boxes
> Based on: dots-and-boxes

## Game Design

**Rules:** Players alternate claiming edges between adjacent dots on a grid. Claiming the 4th (final) edge of a box scores that box for the current player and earns an extra turn. The player with more boxes when all edges are claimed wins. A draw occurs when both players have equal box counts.

**Players:** 1 (vs computer) or 2 (local, same device)

**Modes / variants:**
- vs Computer — player picks Dark or Light; Dark always goes first
- vs Human — Dark always goes first; no color picker shown
- Grid size: 4x4 boxes (5x5 dots, small), 6x6 boxes (7x7 dots, standard), 8x8 boxes (9x9 dots, large)

**Win / draw conditions:**
- Win: player has more boxes than opponent when all edges are claimed
- Draw: both players have equal boxes when all edges are claimed
- Game ends exactly when all edges are claimed — never earlier

**Special rules / one-off mechanics:**
- Extra turn: claiming an edge that completes one or more boxes grants the same player another turn immediately; chaining is unlimited
- A single edge claim can complete at most 2 boxes (when the edge is the 4th side for two adjacent boxes simultaneously)
- Turn passes only when no box is completed from the current claim

**UI flow:**
1. Home screen — mode/grid/difficulty selectors, records, New Game / Resume
2. Play screen — SVG board, score display, status text, header buttons
3. Game over overlay (on top of play screen) — result, wins record, Play Again / Menu buttons
4. Help modal (accessible from both screens via help button)
5. Confirm modal — triggered by close/new-game during active play

**Edge cases:**
- Last edge claim may complete 0, 1, or 2 boxes; handle all cases before checking game over
- Extra turn chain: computer move must wait until player's entire chain is resolved before triggering
- Draw: show "Draw" result, no wins recorded
- Resume: if saved game's gridSize or mode differs from current selection, still allow resume with saved values
- All boxes already won by one player before all edges claimed (score can be known early but game continues until all edges claimed)
- Computer turn fires after a short delay (400ms) so the UI updates visibly before AI runs

---

## Data Model

**Board / grid:** `gridSize` = number of boxes per side (4, 6, or 8). Dots: (gridSize+1) × (gridSize+1).

**Edge arrays:**
- `hEdges[r][c]` — horizontal edge at row r, col c; boolean claimed/unclaimed
  - r: 0 .. gridSize (gridSize+1 rows), c: 0 .. gridSize-1 (gridSize cols)
  - Total: (gridSize+1) * gridSize
- `vEdges[r][c]` — vertical edge at row r, col c; boolean claimed/unclaimed
  - r: 0 .. gridSize-1 (gridSize rows), c: 0 .. gridSize (gridSize+1 cols)
  - Total: gridSize * (gridSize+1)
- Grand total edges: 2 * gridSize * (gridSize+1)

**Box ownership:** `boxes[r][c]` — null | 'dark' | 'light', r and c both 0 .. gridSize-1

**Game state shape:**
```js
{
  gridSize: 4 | 6 | 8,
  mode: 'vs-computer' | 'vs-human',
  difficulty: 'normal' | 'hard',
  playerColor: 'dark' | 'light',   // vs-computer only: which side the human plays
  humanSide: 'dark' | 'light',     // derived; same as playerColor in vs-computer, unused in vs-human
  hEdges: boolean[][],    // (gridSize+1) x gridSize
  vEdges: boolean[][],    // gridSize x (gridSize+1)
  boxes: (null|'dark'|'light')[][],  // gridSize x gridSize
  score: { dark: number, light: number },
  currentSide: 'dark' | 'light',   // dark always starts
  gameOver: boolean,
  winner: 'dark' | 'light' | 'draw' | null
}
```

**State flags:**
- `currentSide`: whose turn it is; always starts as 'dark'
- `playerColor`: 'dark' | 'light' — which side the human controls in vs-computer mode
- `gameOver`: true when all edges claimed
- `isAnimating`: true during box-fill animation or AI delay; blocks input
- `hasSavedGame`: true if localStorage has a valid saved game state

**Turn structure:**
1. Player/AI claims an unclaimed edge
2. `claimEdge(type, r, c)` marks the edge, calls `checkBoxes(type, r, c)`, returns list of newly completed box coords
3. If any boxes completed: score them, re-render, check `allEdgesClaimed()`, if not over then repeat from step 1 with same player
4. If no boxes completed: switch player, if now computer's turn fire `scheduleComputerMove()`
5. After any claim: if `allEdgesClaimed()`, call `endGame()`

**Move validation approach:** An edge claim is valid if: indices are in bounds AND `hEdges[r][c]` or `vEdges[r][c]` is false AND `!isAnimating` AND `!gameOver` AND `currentSide === playerColor` (in vs-computer mode) or always (in vs-human mode).

**Invalid move handling:** Silently ignore clicks on already-claimed edges or out-of-bounds. No error shown.

---

## AI / Computer Player

**Strategy approach:**
- `getComputerMove()` dispatches to `aiNormal()` or `aiHard()` based on difficulty
- Both return `{ type: 'h'|'v', r, c }` for the chosen edge

**Normal AI:**
1. Find all unclaimed edges that complete at least one box — pick one at random
2. If none, find all "safe" moves (claiming the edge would not leave any adjacent box with exactly 3 sides) — pick one at random
3. If no safe moves exist, pick any unclaimed edge at random

**Hard AI:**
1. Same step 1 as Normal: complete a box if possible (pick the one completing the most boxes if multiple)
2. Find all safe moves (claiming edge does not create a 3-sided box) — pick one at random
3. If no safe moves, use "doublecross": identify all chains (connected sequences of boxes each missing exactly 1 edge); if a chain has length >= 3, claim all its edges except the last 2 (scoring most of it and leaving 2 for opponent); if all chains have length <= 2, sacrifice the shortest chain

**`countBoxesScoredByEdge(type, r, c)`** — helper returning how many boxes that edge would complete (0, 1, or 2)

**`wouldCreate3SidedBox(type, r, c)`** — returns true if claiming this edge would leave any adjacent unclaimed box with exactly 3 sides claimed

**`findChains()`** — returns array of chain arrays (each chain = ordered list of box coords connected through their missing edges); used by hard AI step 3

**Performance constraints:** AI runs synchronously. For 8x8 (128 edges), exhaustive safe-move scan is O(edges) — fast enough. Chain finding is O(boxes). No depth-limited search needed.

---

## Help & Strategy Guide

**Objective:** Claim the most boxes by drawing lines between dots. The player with the most boxes at the end wins.

**Rules summary:** On your turn, click any unclaimed line between two adjacent dots. If your line completes a box (4th side), you score it and go again. The game ends when every line is drawn.

**Key strategies:**
- Avoid being the first to touch a box that already has 2 sides — you'll likely hand it to your opponent
- Control chains: a chain is a sequence of nearly-complete boxes linked together. The player who opens a chain gives it all to the opponent
- Doublecross: when forced to open a long chain, claim all but the last 2 boxes — your opponent must then open the next chain
- In the early game, build in the center to give yourself more chain options later
- Count boxes: if you're ahead with few edges left and no boxes remain uncontested, you may already have won

**Common mistakes:**
- Taking any available line without checking if it creates a 3-sided box nearby
- Opening a chain of length 1 or 2 when a longer chain is available (always sacrifice the short ones first)
- Forgetting that completing a box gives you another turn — you can chain many boxes in a row
- Offering your opponent a chain when safe moves still exist

**Tips for beginners:**
- Look for lines that don't touch any box with 2 sides already drawn
- When no such line exists, pick the one touching the fewest 2-sided boxes
- Watch the score — if you're behind, opening a chain may be necessary even if risky

---

## Game Logic
- [x] `initGame(gridSize, mode, difficulty, playerColor)` — allocates `hEdges`, `vEdges`, `boxes` arrays filled with false/null; sets `score={dark:0,light:0}`, `currentSide='dark'`, `gameOver=false`, `winner=null`; if vs-computer and `playerColor==='light'`, calls `scheduleComputerMove()` immediately after render (computer is dark and goes first); calls `saveGame()`
- [x] `claimEdge(type, r, c)` — sets `hEdges[r][c]` or `vEdges[r][c]` to true; calls `checkBoxes(type, r, c)`; returns array of completed box coords `[{r, c}]`
- [x] `checkBoxes(type, r, c)` — for a horizontal edge: checks box at (r-1, c) if r > 0 and box at (r, c) if r < gridSize; for a vertical edge: checks box at (r, c-1) if c > 0 and box at (r, c) if c < gridSize; calls `isBoxComplete(br, bc)` for each; returns completed coords
- [x] `isBoxComplete(br, bc)` — returns true if `hEdges[br][bc] && hEdges[br+1][bc] && vEdges[br][bc] && vEdges[br][bc+1]`
- [x] `scoreBoxes(completedCoords, side)` — sets `boxes[r][c] = side` for each coord; increments `score[side]`
- [x] `allEdgesClaimed()` — returns true when sum of all true values in `hEdges` and `vEdges` equals 2 * gridSize * (gridSize+1)
- [x] `handleEdgeClick(type, r, c)` — validates move (in bounds, unclaimed, not animating, not gameOver, correct side's turn); calls `claimEdge`; calls `scoreBoxes`; sets `isAnimating=true` during box-fill animation; checks `allEdgesClaimed()` → `endGame()`; if no boxes completed, calls `switchSide()` and calls `scheduleComputerMove()` if computer's turn; calls `saveGame()`
- [x] `switchSide()` — toggles `currentSide` between 'dark' and 'light'
- [x] `scheduleComputerMove()` — sets `isAnimating=true`, calls `setTimeout(runComputerMove, 400)`
- [x] `runComputerMove()` — calls `getComputerMove()`, then `handleEdgeClick()` with result
- [x] `getComputerMove()` — dispatches to `aiNormal()` or `aiHard()`
- [x] `aiNormal()` — step 1: completing moves; step 2: safe moves; step 3: any move (see AI section)
- [x] `aiHard()` — step 1: completing moves (most boxes first); step 2: safe moves; step 3: doublecross (see AI section)
- [x] `countBoxesScoredByEdge(type, r, c)` — counts adjacent boxes that would be completed by this edge
- [x] `wouldCreate3SidedBox(type, r, c)` — checks adjacent unclaimed boxes for 3-sided condition
- [x] `findChains()` — BFS/DFS over boxes with exactly 1 missing edge; groups connected ones into chains; returns `[[{r,c}, ...], ...]`
- [x] `endGame()` — sets `gameOver=true`; determines `winner` ('dark' | 'light' | 'draw') based on score; if vs-computer and winner===playerColor, increments `records.wins_normal` or `records.wins_hard` depending on difficulty; saves records; calls `showGameOver()`
- [x] `saveGame()` — serializes full game state to `localStorage['dab_game']`; sets `hasSavedGame=true`
- [x] `loadGame()` — parses and returns game state from `localStorage['dab_game']`; returns null if absent or invalid
- [x] `clearSavedGame()` — removes `localStorage['dab_game']`; sets `hasSavedGame=false`

---

## UI & Rendering

- [x] **Home screen** — full viewport centered container; `min-width: 420px`; header row: help, theme, donate icon buttons (SVGs from `.claude/icons/`); game title "Dots and Boxes"; mode selector (vs Computer / vs Human); grid size selector (4x4 / 6x6 / 8x8) labeled "Grid Size"; difficulty selector (Normal / Hard) — visible only when mode is vs Computer; color selector labeled "Your Color" with options "Dark (goes first)" and "Light" — visible only when mode is vs Computer, positioned directly below difficulty; records section — shows "Normal wins: X | Hard wins: X" using `--font-mono`; buttons: "New Game" always, "Resume" only if `hasSavedGame`; all selections persisted on change
- [x] **Play screen** — centered container; `min-width: 420px`; header row: close (x), help, theme, donate icon buttons; horizontal rule; score display "Dark: X — Light: X" in `--font-mono` with each label colored in its side's color; status text below score ("Dark's turn" / "Light's turn" / "Your turn" / "Computer thinking..."); SVG board centered below; clicking close triggers ConfirmModal if `!gameOver`
- [x] **SVG board rendering** — `renderBoard()` generates an `<svg>` sized to fit grid; cell size = min(400/gridSize, 60)px; dots at each (r,c) intersection as `<circle r="5">`; unclaimed edges rendered as faint lines (`--color-border`, stroke-width 2, pointer-events via wider transparent overlay rect/line); claimed edges rendered as solid colored lines (dark side: `--blue-mid`, light side: `--yellow-gold`, stroke-width 4); box fills as `<rect>` with owner's color at 25% opacity; hover on unclaimed edge shows current side's color at 50% opacity; `renderEdge(type, r, c)` and `renderBox(r, c)` update individual elements without full re-render after initial draw
- [x] **Edge hit areas** — each unclaimed edge has an invisible `<line>` or `<rect>` with stroke-width 16 and `pointer-events: stroke` for easy clicking; claimed edges have `pointer-events: none`
- [x] **Game over overlay** — `showGameOver()` injects a fixed overlay div over the play screen; fade + scale animation (see Styling); shows result text: vs-computer → "You win!" / "You lose!" / "Draw!"; vs-human → "Dark wins!" / "Light wins!" / "Draw!"; result colored with `--color-success` / `--color-danger` / `--color-accent`; shows updated wins count in vs-computer mode; "Play Again" resets same settings, "Menu" returns to home
- [x] **HelpModal** — triggered by help button from any screen; overlay with close button; sections: Objective, How to Play (step by step), Key Strategies, Tips; min-width 420px; closes on button click or Escape key
- [x] **ConfirmModal** — `showConfirmModal(message, onConfirm)` — generic overlay; message text; "Confirm" and "Cancel" buttons; used for quit-to-menu and new-game-during-play; min-width 420px

---

## Local Storage

| Key | Value | Notes |
|---|---|---|
| `dab_theme` | `'dark'` \| `'light'` | Applied on load before render |
| `dab_mode` | `'vs-computer'` \| `'vs-human'` | Home screen default |
| `dab_gridSize` | `4` \| `6` \| `8` | Home screen default |
| `dab_difficulty` | `'normal'` \| `'hard'` | Home screen default; ignored in vs-human |
| `dab_playerColor` | `'dark'` \| `'light'` | Home screen default; ignored in vs-human |
| `dab_game` | JSON of full game state | Enables Resume; cleared on game over |
| `dab_records` | `{ wins_normal: number, wins_hard: number }` | Wins vs computer only; never reset by normal gameplay |

- Records are updated only when the human player wins in vs-computer mode (winner === playerColor)
- No losses tracked
- `dab_game` is written after every edge claim; removed with `clearSavedGame()` on game over or when user starts a new game from home

---

## Accessibility
- [x] Keyboard navigation: Tab moves through all interactive elements (edge hit areas, buttons, selectors); Enter/Space activates focused elements
- [x] SVG edges are focusable `<line>` or `<rect>` elements with `tabindex="0"` and `role="button"`; each has `aria-label` describing the edge (e.g. "Horizontal edge row 2 column 3, unclaimed") — claimed edges have `aria-disabled="true"` and `tabindex="-1"`
- [x] All icon buttons have `aria-label` (e.g. "Help", "Toggle theme", "Donate", "Close")
- [x] Mode/grid/difficulty/color selectors use `role="radiogroup"` and `role="radio"` with `aria-checked`
- [x] Game over overlay uses `role="dialog"` and `aria-modal="true"`; focus trapped inside until dismissed
- [x] Help and Confirm modals use `role="dialog"` and `aria-modal="true"`; Escape closes them; focus returns to trigger element on close
- [x] Status text region has `aria-live="polite"` so screen readers announce turn changes and score updates

---

## Styling
- [x] All colors use semantic variables — no hardcoded values
- [x] All spacing uses `--space-*` variables
- [x] Score and win counts use `--font-mono`
- [x] Main container: `--shadow-lg`, inset box-shadow border using `--color-border`, `--radius-lg`, `min-width: 420px`, centered
- [x] All interactive elements have hover, active, and disabled states with `--transition-default` transitions — nothing snaps
- [x] Icon buttons: 32px, borderless, `--color-text-muted` default, `--color-text-primary` on hover, active scales to 0.9
- [x] Mode/grid/difficulty selectors styled as pill toggles using `--color-surface-raised` background; selected item uses `--color-accent` text and `--border-accent` outline
- [x] Status text: active player = `--color-accent`; computer thinking = `--color-text-muted` with "..." suffix
- [x] Dark side color: `--blue-mid`; Light side color: `--yellow-gold` — used consistently for edges, box fills, score labels
- [x] Game over overlay animates in with fade (opacity 0→1) + scale (0.9→1) over `--transition-slow`
- [x] SVG board: background `--color-surface`; dot color `--color-text-muted`; rounded corners via `rx` on box rects
- [x] Extra-turn indicator: brief status flash "Go again!" in `--color-accent` before next move
- [x] Responsive at 375px: board SVG cell size reduces, container padding reduces, selectors stack if needed
- [x] Light theme verified — surfaces have visible depth and contrast; P1/P2 colors remain distinct

---

## Polish
- [x] Box fill fades in over 200ms when claimed (CSS transition on opacity)
- [x] Edge claim plays subtle color transition from unclaimed to claimed color (200ms)
- [x] "Go again!" status text flashes for 600ms before next move or computer delay
- [x] Computer move delay: 400ms before AI claims edge (makes it feel like the computer is thinking)
- [x] Home screen records section hidden (display:none) if both win counts are 0 (no wins yet to show)
- [x] Resume button disappears immediately after starting a new game (clears saved state)
- [x] Score updates animate with a brief scale pulse (transform: scale(1.15) → 1) when a box is scored
