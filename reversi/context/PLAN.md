# reversi
> Based on: reversi

## Game Design

**What we're building:** An 8x8 Reversi (Othello) game. Two players alternate placing discs. A move must flip at least one opponent disc. All opponent discs sandwiched between the new disc and any existing friendly disc (in any of 8 directions) are flipped. Most discs of your color when neither player can move wins.

**Rules:** Standard Othello rules. Dark always goes first. A player with no valid moves must pass; if neither player has a valid move, the game ends. Game also ends when all 64 squares are filled.

**Players:** 2 — Dark (1) and Light (2). Dark always goes first.

**Modes / variants:**
- vs Computer (default) — human picks Dark or Light; if Light, AI (Dark) moves first; difficulty is Normal or Hard
- 2 Players — two humans share the device, no color picker, no difficulty selector

**Win / draw conditions:**
- Win: player with more discs on the board when the game ends
- Draw: equal disc count when game ends
- Game ends when: both players consecutively pass (no valid moves) OR all 64 squares are filled

**Special rules / one-off mechanics:**
- Starting position: Light at (3,3) and (4,4), Dark at (3,4) and (4,3) (0-indexed)
- A move is only valid if it flips at least one opponent disc in at least one direction
- Flipping is simultaneous — all flippable directions resolved for a single placement
- If a player has no valid moves, their turn is skipped (passed) automatically with a brief notification; if the opponent also has no valid moves, game ends immediately
- Placing a disc that results in zero flips is illegal — not just any empty square is playable

**Captured / out-of-play pieces:** None. All 64 discs remain on the board; they flip color.

**UI flow:**
1. Home screen — mode tabs (vs Computer / 2 Players), color selector (Dark / Light, only shown in vs Computer mode), WINS counter (vs Computer only, read from localStorage), New Game button, Resume Game button (only if saved game exists), 3 header buttons: ?, theme, donate
2. Play screen — 4 header buttons (X close, ?, theme, donate), horizontal rule, score bar "Dark: N  Light: N", whose-turn label or "Thinking..." when AI, 8x8 board, pass message area below board
3. Game over overlay — result text, final disc counts, Play Again and Home buttons
4. Help modal — rules summary and strategy tips, accessible from all screens

**Edge cases:**
- If human picks Light in HvC, AI (Dark) fires immediately at game start
- After human places, check opponent's valid moves; if none, skip opponent and check human again; if human also has none, end game
- Board full: end game immediately, count discs
- Confirmation modal before starting new game if `status === 'playing'`
- On mode/color switch on home screen, do not start game until New Game is clicked

---

## Data Model

**Board / grid:** 8x8 grid of squares. `board[row][col]` where 0 = empty, 1 = dark, 2 = light. Row 0 is top, col 0 is left.

**Piece / token types:** Dark disc (1), Light disc (2).

**Game state shape:**
```js
{
  board: number[][],           // 8x8, 0/1/2
  currentPlayer: 1 | 2,
  status: 'idle' | 'playing' | 'won' | 'draw',
  winner: null | 1 | 2,
  scores: { 1: number, 2: number },
  validMoves: string[],        // "row,col" strings for current player's valid moves
  lastMove: [row, col] | null,
  flippedCells: [row, col][],  // cells flipped on last move, used for flip animation
  mode: 'hvc' | 'hvh',
  playerColor: 1 | 2,          // human's color in HvC mode (1=dark, 2=light)
  aiThinking: boolean,
  passMessage: string | null,  // e.g. "Dark has no moves — Light's turn"; clears after 1.5s
  difficulty: 'normal' | 'hard', // only relevant in HvC mode
  wins: { normal: number, hard: number }, // persisted separately to localStorage key reversi_wins
}
```

**State flags:**
- `status: 'idle'` — home screen visible
- `status: 'playing'` — game in progress
- `status: 'won'` — game over, `winner` is 1 or 2
- `status: 'draw'` — game over, equal discs
- `aiThinking: true` — board locked, cursor changes, "Thinking..." shown
- `flippedCells` — populated after each move for flip CSS animation, cleared after 400ms
- `passMessage` — set in `advanceTurn` when a turn is skipped, cleared after 1.5s via setTimeout

**Turn structure:** Dark (1) always moves first. After a valid placement: flip discs, update scores, compute opponent's valid moves. If opponent has valid moves, switch `currentPlayer`. If opponent has no valid moves but current player has moves, keep `currentPlayer` and set `passMessage`. If neither has moves (or board full), call `endGame`.

**Move validation approach:** `getValidMoves(board, player)` — for each empty cell, call `getFlips(board, row, col, player)`; cell is valid if result is non-empty. Returns array of `[row, col]`. Pre-computed and stored in `validMoves` after each move.

**Invalid move handling:** Silently ignore clicks on cells not in `validMoves`, occupied cells, or when `aiThinking`. No error shown.

---

## AI / Computer Player

**Strategy approach:** Negamax with alpha-beta pruning, depth 6. Evaluation combines positional weights, mobility, and disc count (disc count weighted more near endgame).

**Positional weight table (8x8):**
```
 100  -20   10    5    5   10  -20  100
 -20  -50   -2   -2   -2   -2  -50  -20
  10   -2    0    1    1    0   -2   10
   5   -2    1    0    0    1   -2    5
   5   -2    1    0    0    1   -2    5
  10   -2    0    1    1    0   -2   10
 -20  -50   -2   -2   -2   -2  -50  -20
 100  -20   10    5    5   10  -20  100
```

**`evaluateBoard(board, player)`:**
- If no moves for either player: return disc count difference * 1000 (endgame terminal)
- Positional score: sum of `weight[r][c]` for all player discs minus sum for opponent discs
- Mobility score: `(playerMoves.length - opponentMoves.length) * 10`
- Near endgame (total discs >= 50): add disc count difference * 5
- Return positional + mobility + endgame bonus

**`negamax(board, depth, alpha, beta, player)`:** Standard negamax with alpha-beta. At depth 0 or terminal, return `evaluateBoard`. If `getValidMoves` is empty for current player, check if opponent has moves; if so, pass (recurse with opponent, same depth, negated); if neither has moves, return terminal eval.

**`getBestMove(board, player, depth)`:** Calls negamax at the given depth; returns `[row, col]`. Fired from `triggerAI`.

**Difficulty levels:**
- Normal — depth 3: plays reasonable moves, makes exploitable mistakes
- Hard — depth 5: very strong, punishes strategic errors, beatable with solid Reversi knowledge

**Minimum think time:** 500ms. Record `Date.now()` before calling `getBestMove`; after it returns, `setTimeout(applyAIMove, Math.max(0, 500 - elapsed))`.

**Performance constraints:** Both depths complete well under 500ms with alpha-beta pruning, so minimum think time is the dominant delay.

---

## Help & Strategy Guide

**Objective:** Have more discs of your color on the board than your opponent when neither player can move.

**Rules summary:**
- Dark goes first; players alternate placing one disc per turn
- A disc can only be placed where it flips at least one opponent disc
- All opponent discs sandwiched between your new disc and an existing friendly disc (in any direction) are flipped simultaneously
- If you have no valid move, your turn is skipped automatically
- Game ends when neither player can move or all 64 squares are filled

**Key strategies:**
- Corners are permanent — once captured, they can never be flipped; anchor your edge control around them
- Avoid X-squares (diagonally adjacent to corners: (1,1), (1,6), (6,1), (6,6)) — giving those away hands your opponent the corner
- Avoid C-squares (edge squares adjacent to corners: (0,1), (1,0), etc.) for the same reason
- Prioritize mobility (more valid moves than opponent) over raw disc count early in the game
- Fewer discs mid-game is often an advantage — it limits your opponent's flipping options
- Stable discs (corners and filled edges) cannot be flipped — build toward them

**Common mistakes:**
- Taking X-squares to gain a few discs — your opponent captures the corner next turn
- Chasing disc count in the first 30 moves — a player with 40 discs mid-game is usually losing
- Ignoring opponent mobility — many opponent moves means they control the board direction
- Playing only in the center and ignoring edge structure

**Tips for beginners:**
- Count your opponent's valid moves after each placement — fewer is better
- The first player to capture a corner almost always wins
- Edges are strong once fully filled; try to complete edge sequences before your opponent
- A disc that cannot be flipped is worth more than one that can

---

## Game Logic
- [x] `createBoard()` — return 8x8 array of 0s with starting setup: dark at [3][4] and [4][3], light at [3][3] and [4][4]
- [x] `getFlips(board, row, col, player)` — check all 8 directions; for each direction collect consecutive opponent discs; if terminated by a friendly disc (no gaps, no edge), add those to result; return flat array of `[r,c]` pairs; return `[]` if no direction yields flips
- [x] `getValidMoves(board, player)` — iterate all empty cells; return array of `[row, col]` where `getFlips` is non-empty
- [x] `applyMove(board, row, col, player)` — return `{ board: newBoard, flipped: [row,col][] }` — place disc at [row][col] and flip all cells from `getFlips`; immutable (create new board array)
- [x] `countDiscs(board)` — return `{ 1: number, 2: number }` of each player's disc count
- [x] `handleCellClick(row, col)` — guard: `status !== 'playing'`, `aiThinking`, cell key `"row,col"` not in `validMoves`; call `applyMove`, set `lastMove`, set `flippedCells`, call `countDiscs` to update `scores`, call `advanceTurn(board, justPlayedPlayer)`; clear `flippedCells` after 400ms
- [x] `advanceTurn(board, justPlayedPlayer)` — compute opponent valid moves; if board full OR (no moves for opponent AND no moves for current player): call `endGame`; else if opponent has no moves: keep `currentPlayer`, set `passMessage = "[Color] has no moves — [OtherColor]'s turn"`, `setTimeout(clearPass, 1500)`, in HvC if it's AI's turn call `triggerAI`; else switch `currentPlayer`, update `validMoves`, in HvC if it's AI's turn call `triggerAI`
- [x] `triggerAI()` — set `aiThinking = true`, render; record `aiStartTime = Date.now()`; call `getBestMove(board, aiColor, depth)` where depth is 3 (normal) or 5 (hard); compute `elapsed = Date.now() - aiStartTime`; `setTimeout(applyAIMove, Math.max(0, 500 - elapsed))`; inside `applyAIMove`: place disc via `handleCellClick`, set `aiThinking = false`
- [x] `endGame(board)` — call `countDiscs`; if scores[1] > scores[2]: winner=1; if scores[2] > scores[1]: winner=2; else draw; set `status`; if HvC and `winner === playerColor`: increment `wins[difficulty]`, persist to `reversi_wins`, update wins display
- [x] `startGame()` — reset board via `createBoard`, set `currentPlayer = 1`, compute `validMoves` for dark, set `status = 'playing'`, clear `lastMove`, `flippedCells`, `passMessage`; if HvC and `playerColor === 2`: call `triggerAI`
- [x] `resetGame()` — call `startGame` with current mode/color; requires confirmation modal if `status === 'playing'`
- [x] `saveState()` — persist state object (excluding `flippedCells`, `aiThinking`, `passMessage`) to `reversi_state`
- [x] `loadState()` — on page load, read `reversi_state`; if `status === 'playing'`, restore and re-compute `validMoves` (derived); else show home screen; always read `reversi_wins` into `winsVsComputer`
- [x] `getBestMove(board, player, depth)` — entry point for AI; calls `negamax(board, depth, -Infinity, Infinity, player)`; returns best `[row, col]`
- [x] `negamax(board, depth, alpha, beta, player)` — alpha-beta negamax; at depth 0 return `evaluateBoard(board, player)`; if no moves for `player`: check opponent; if opponent has moves recurse passing (negate, same depth); if neither has moves return terminal eval; iterate `getValidMoves`, apply each, recurse depth-1 with opponent
- [x] `evaluateBoard(board, player)` — return positional weight sum + mobility bonus + endgame disc bonus as described in AI section

---

## UI & Rendering
- [x] Home screen — full-window centered card; faint disc silhouette background; title "Reversi", subtitle "MOST DISCS WINS"; 3 header buttons (?, theme, donate) using SVG from `.claude/icons/question-mark.html`, `.claude/icons/sun.html` / `.claude/icons/moon.html`, `.claude/icons/heart.html`; mode tabs (vs Computer / 2 Players); color selector row (Dark / Light pill toggle) shown only when vs Computer tab active, default Dark, label "(goes first)" next to Dark; difficulty toggle (Normal / Hard) shown only when vs Computer tab active, default Normal; WINS display shown only when vs Computer tab active: "Normal: N  Hard: N" reading from `wins`; New Game button; Resume Game button only if localStorage has `reversi_state` with `status === 'playing'`
- [x] Play screen — 4 header buttons (X, ?, theme, donate) using SVGs from `.claude/icons/x.html`, `question-mark.html`, `sun/moon.html`, `heart.html`; `<hr>` below; score bar showing disc circle icon + count for Dark and Light; whose-turn text ("Dark's turn" / "Light's turn" / "Thinking..."); 8x8 board; pass message text below board; game-over overlay when `status !== 'playing'`
- [x] Board rendered as 8x8 CSS grid of `div.cell` elements; each cell contains a `div.disc.dark` or `div.disc.light` when occupied, or a `div.valid-dot` when it's a valid move for the human
- [x] Valid move indicators — `div.valid-dot` (small faint circle) in each valid cell; hidden when `aiThinking` or it's not the human's turn in HvC
- [x] Last-move indicator — `div.last-move-ring` overlay on the `lastMove` cell
- [x] Disc flip animation — on `flippedCells`, add CSS class `flip-to-dark` or `flip-to-light`; CSS keyframe `scaleX(1 -> 0)` at 50% then swap color then `scaleX(0 -> 1)`; 350ms total
- [x] New disc placement — new disc fades in with `opacity: 0 -> 1` over 100ms (CSS transition)
- [x] Game-over overlay — semi-transparent overlay on board; "Dark wins!" / "Light wins!" / "Draw!"; "Dark N — Light N"; Play Again button (restarts with same mode/color); Home button
- [x] Pass notification — `div#pass-message` with `aria-live="polite"` below board; visible when `passMessage` is set; auto-hides after 1.5s
- [x] HelpModal — overlay; close button, backdrop click, or Escape key to close; contains rules summary and strategy from Help & Strategy Guide section
- [x] Confirmation modal — "Start a new game?" message; Cancel and New Game buttons; triggered by New Game click or X click during `status === 'playing'`

---

## Styling
- [x] `style.css` — all game-specific styles; use CSS variables from `global.css` throughout
- [x] Dark palette default; `.light-palette` / `.dark-palette` on `<body>` for theming
- [x] Board: dark green felt `#1a5c38` (dark mode) / `#2d7a4f` (light mode); subtle cell grid lines `rgba(0,0,0,0.2)`; board is `min(min(80vw, 80vh), 560px)` square; CSS grid 8x8
- [x] Dark disc (player 1): radial gradient `#3a3a3a` center to `#111` edge, `box-shadow` for depth; Light disc (player 2): radial gradient `#ffffff` center to `#cccccc` edge, `box-shadow`; both discs fill ~80% of cell width
- [x] Valid-move dot: `8px` circle, `rgba(255,255,255,0.3)` in dark theme / `rgba(0,0,0,0.25)` in light theme, centered in cell
- [x] Last-move ring: 3px inset border on the cell, `--yellow-gold` color
- [x] Disc flip `@keyframes flip-disc` using `transform: scaleX()`, color swap at midpoint
- [x] Home background: faint disc circles (~30% opacity) scattered in a grid pattern using CSS or SVG background
- [x] Mode tabs and color selector: pill-style toggle; active = `--yellow-gold` background, dark text; inactive = `--secondary-background` background
- [x] Score bar: small CSS disc circles next to player labels; bold count numbers
- [x] Responsive: board scales via `min()` formula; header buttons stay in one row on narrow screens; score bar wraps gracefully
- [x] Modal backdrop: `rgba(0,0,0,0.5)` overlay; modal card uses `--secondary-background`

---

## Polish
- [x] Light/dark theme toggle persisted to `reversi_theme`; default dark
- [x] Last selected mode persisted to `reversi_mode`; selected player color persisted to `reversi_color`
- [x] Win counts persisted to `reversi_wins` as `{ normal: N, hard: N }`; loaded on page init and shown on home screen when vs Computer tab is active
- [x] Last selected difficulty persisted to `reversi_difficulty`
- [x] Full game state persisted to `reversi_state`; restored on page reload if `status === 'playing'`
- [x] Keyboard navigation: Tab through cells and buttons; Enter/Space to place disc or confirm; Escape to close modals
- [x] ARIA: board cells are `role="button"` with `aria-label="Row X Column Y, empty/dark disc/light disc"`; `aria-disabled="true"` when not a valid move or AI thinking
- [x] Pass notification uses `aria-live="polite"` region so screen readers announce it
- [x] Sound: short click via Web Audio API on disc placement; distinct lower-pitch click when discs flip; no audio files needed
