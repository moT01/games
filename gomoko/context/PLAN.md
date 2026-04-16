# gomoko
> Based on: gomoku

## Game Design

**What we're building:** A 15x15 gomoku game. Two players alternate placing stones. First to get exactly 5 in a row (horizontal, vertical, or diagonal) wins. Human plays blue (goes first) vs computer (light), or two humans can play.

**Rules:** Standard gomoku. Exactly 5 in a row wins — 6 or more does not count. No other forbidden-move restrictions. Stones cannot be moved once placed.

**Players:** 2 — dark and light. Dark always goes first.

**Modes / variants:**
- Human vs Computer (default) — human is dark, AI is light
- Human vs Human — two players share the device

**Win / draw conditions:**
- Win: a player has exactly 5 consecutive stones in any of the 4 directions (horizontal, vertical, diagonal ↗, diagonal ↘). A run of 6 or more does not win.
- Draw: all 225 cells are filled with no winner

**Special rules / one-off mechanics:**
- Overlines (6+ in a row) do not win — the run must be exactly 5
- No swap rule, no pro rules, no renju restrictions beyond the overline rule

**Captured / out-of-play pieces:** None. Stones stay forever.

**UI flow:**
1. Home screen — mode selection (HvC / HvH), start button, help button, theme toggle, donate button
2. Play screen — 15x15 board, whose-turn indicator, last-move dot, win-line highlight, new-game button
3. Game over — overlay on board showing result (Dark wins / Light wins / Draw) with play-again and quit buttons
4. Help modal — rules summary and strategy tips, accessible from all screens

**Edge cases:**
- AI move fires after human places stone; disable board clicks while AI is thinking
- Win check must handle stones that land at board edges without going out of bounds
- Board full (225 stones) with no winner triggers draw
- On mode switch from home screen, reset all state

---

## Data Model

**Board / grid:** 15x15 grid of intersections. `board[row][col]` where 0 = empty, 1 = dark, 2 = light. Row 0 is top, col 0 is left.

**Piece / token types:** Blue stone (player 1), light stone (player 2).

**Game state shape:**
```js
{
  board: number[][],       // 15x15, 0/1/2
  currentPlayer: 1 | 2,
  status: 'idle' | 'playing' | 'won' | 'draw',
  winner: null | 1 | 2,
  winLine: [row, col][],  // 5 cells of the winning sequence (empty if no win)
  lastMove: [row, col] | null,
  mode: 'hvc' | 'hvh',
  aiThinking: boolean,
}
```

**State flags:**
- `status: 'idle'` — home screen visible, no game in progress
- `status: 'playing'` — game in progress
- `status: 'won'` — someone has exactly 5 in a row
- `status: 'draw'` — board full, no winner
- `aiThinking: true` — board is locked, spinner shown, AI computing
- `winLine` — array of winning [row,col] pairs used to draw highlight overlay

**Turn structure:** Dark (1) always moves first. After each valid placement, switch `currentPlayer`. In HvC mode, after human places (dark), fire AI move for light; AI result re-enables board.

**Move validation approach:** A move at `[row, col]` is valid if `status === 'playing'` and `board[row][col] === 0` and `aiThinking === false` and (in HvC) `currentPlayer === 1`.

**Invalid move handling:** Silently ignore clicks on occupied cells or during AI thinking. No error message shown.

---

## AI / Computer Player

**Strategy approach:** Negamax with alpha-beta pruning, depth 4. Candidate move generation limits the search space to cells within 2 intersections of any existing stone. On an empty board, play center (7,7).

**Threat scoring (used at leaf nodes):**
Evaluate each line of 5 consecutive cells in all 4 directions. Score is computed for both AI (light) and human (dark); human score is subtracted. Pattern scores:

| Pattern | Description | Score |
|---|---|---|
| Five | exactly 5 in a row | 100,000,000 |
| Open four | `_XXXX_` | 100,000 |
| Closed four | `OXXXX_` or `_XXXXO` | 10,000 |
| Open three | `_XXX_` | 5,000 |
| Closed three | `OXXX_` or `_XXXO` | 500 |
| Open two | `_XX_` | 100 |
| Closed two | `OXX_` | 10 |

**Candidate generation:** `getCandidates(board)` — return all empty cells that have at least one non-empty neighbour within radius 2. If board is empty, return `[[7,7]]`.

**Move ordering:** Score each candidate with a shallow (depth-1) evaluation and sort descending before the full search — improves alpha-beta cutoffs significantly.

**Performance constraints:** Depth 4 with candidate pruning and move ordering should stay under 500ms per move on modern hardware. AI runs on the main thread using `setTimeout(aiMove, 50)` so the UI can render the human's stone first.

**Difficulty levels:** Single level (competitive). No easy mode.

---

## Help & Strategy Guide

**Objective:** Be the first to place exactly 5 of your stones in an unbroken row — horizontally, vertically, or diagonally. Six or more in a row does not win.

**Rules summary:**
- Dark always goes first
- Players alternate placing one stone per turn
- A stone cannot be moved once placed
- Exactly 5 consecutive stones of the same color wins; 6 or more does not
- If the board fills with no winner, the game is a draw

**Key strategies:**
- Build toward open fours (`_XXXX_`) — your opponent must block immediately or lose
- Create a "double three" or "double four" — two simultaneous threats your opponent cannot both block
- Play in the center early; edge and corner stones have fewer winning directions
- Count how many directions each of your developing lines can grow — dead-end lines waste moves
- Block your opponent's open threes immediately, not after they become open fours

**Common mistakes:**
- Ignoring an opponent's open three — it becomes an unstoppable open four next turn
- Playing only in a straight line — it's predictable and easy to block
- Building closed fours instead of open fours — closed fours give the opponent time to respond
- Neglecting the centre of the board in the opening — centre control wins more games

**Tips for beginners:**
- Start at the centre (H8 in 15x15 notation) every game as dark
- Think of your stones as creating two threats at once — single threats are easy to stop
- Watch for your opponent's growing sequences; a sequence of 3 is urgent, 4 is critical
- A draw is rare — focus on attacking rather than defending

---

## Game Logic
- [x] `createBoard()` — return a fresh 15x15 array of 0s
- [x] `placestone(board, row, col, player)` — return new board with stone placed (immutable copy)
- [x] `checkWin(board, row, col, player)` — check all 4 directions from [row,col]; for each direction count the full consecutive run including the placed stone; return `{ won: true, winLine: [row,col][] }` only if the run is exactly 5 (not 4, not 6+); winLine contains the 5 cells
- [x] `checkDraw(board)` — return true if all 225 cells are non-zero and no winner
- [x] `countInDirection(board, row, col, dr, dc, player)` — count consecutive stones for player in one direction, stopping at edge or different stone; used inside `checkWin`
- [x] `getCandidates(board)` — return empty cells within radius 2 of any stone; return `[[7,7]]` if board empty
- [x] `scoreBoard(board, player)` — score all lines of 5 windows across the board for both players; return net score from `player`'s perspective using the pattern score table
- [x] `negamax(board, depth, alpha, beta, player)` — recursive negamax with alpha-beta; calls `getCandidates`, sorts by `scoreBoard` at depth 0 leaf, returns `{ score, move }`
- [x] `getBestMove(board, player)` — entry point; calls `negamax` at depth 4; returns `[row, col]`
- [x] `handleCellClick(row, col)` — validate move, place stone, `checkWin`, `checkDraw`, switch player, trigger AI if HvC mode
- [x] `triggerAI()` — set `aiThinking = true`, `setTimeout(runAI, 50)`, call `getBestMove`, place stone, check win/draw, set `aiThinking = false`, re-render
- [x] `startGame(mode)` — reset all state, set mode, set `status = 'playing'`, render home→play transition
- [x] `resetGame()` — same as `startGame` with current mode; requires confirmation modal if `status === 'playing'`
- [x] `saveState()` / `loadState()` — persist/restore full game state to localStorage key `gomoko_state`
- [x] On page load: attempt `loadState()`; if saved state exists and `status === 'playing'`, resume; otherwise show home screen

---

## UI & Rendering
- [x] Home screen — centered card with game title, mode toggle (HvC / HvH), start button, help button, theme toggle, donate button; board ghost pattern as background
- [x] Play screen — full-window layout: board centered, status bar above (whose turn / AI thinking...), new-game button below
- [x] Board rendered as SVG: grid lines, star points at (3,3), (3,7), (3,11), (7,7), (11,3), (11,7), (11,11) (0-indexed), stone circles for placed pieces
- [x] Last-move indicator — small dot in the center of the most recently placed stone
- [x] Win-line highlight — change the fill of the 5 winning stones to a distinct highlight color (`--yellow-gold` glow/ring)
- [x] HelpModal — "?" button always visible; overlay with rules and strategy guide; close on backdrop click or Escape
- [x] Confirmation modal — appears when clicking New Game during an active game; "Cancel" and "New Game" buttons
- [x] Game-over overlay — semi-transparent overlay on board, shows result text, "Play Again" and "Home" buttons
- [x] AI thinking indicator — "Thinking..." text replaces whose-turn indicator; board cursor changes to not-allowed
- [x] Donate button — visible on home and play screens; links to donate URL
- [x] Theme toggle — sun/moon icon; toggles `.light-palette` / `.dark-palette` class on `<body>`; saves to localStorage key `gomoko_theme`

---

## Styling
- [x] `style.css` — all game-specific styles
- [x] Theme via `.light-palette` / `.dark-palette` on `<body>`; use global palette variables throughout (`--primary-background`, `--primary-color`, `--secondary-background`, etc.)
- [x] Board background: warm wood tone (`#dcb483`) in light mode, dark wood (`#5c3d1e`) in dark mode
- [x] Player 1 stone: blue — radial gradient from `--blue-light` center to `--blue-mid` edge, with a subtle dark shadow; player 2 stone: light — radial gradient from `#ffffff` center to `--gray-10` edge with shadow
- [x] Win highlight: `--yellow-gold` ring or glow on winning stones
- [x] Home screen: full-height centered card, faint grid-lines as background pattern using `repeating-linear-gradient`
- [x] Responsive board: board size = `min(90vw, 90vh)`, SVG scales with viewBox
- [x] Smooth stone placement: CSS transition on stone opacity (fade in over 120ms)
- [x] Modal backdrop: `rgba(0,0,0,0.5)` semi-transparent overlay

---

## Polish
- [x] Light/dark theme toggle — toggles `.light-palette` / `.dark-palette` on `<body>`, persisted to localStorage key `gomoko_theme`
- [x] Game state persisted and resumed on reload (skip if `status === 'idle'`)
- [x] Last selected mode persisted to localStorage key `gomoko_mode`
- [x] Keyboard navigation: Enter/Space to confirm modals, Escape to close modals
- [x] ARIA labels on all interactive elements (board cells, buttons, modals)
- [x] Board cells are `role="button"` with `aria-label="Row X, Column Y, empty/dark/light"`
- [x] Subtle sound: stone-place click (short beep via Web Audio API — single oscillator burst, no files) — can be disabled
- [x] Animate winning line: brief pulse on winning stones after win detected
