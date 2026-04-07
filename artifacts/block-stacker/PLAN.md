# block-stacker
> Based on: tetris

## Game Design

**What we're building:**
A single-player falling-block puzzle game using the 12 free pentominoes (5-cell pieces) on a 12×20 board. Pieces fall from the top and the player rotates and positions them to complete full horizontal rows. Completed rows are cleared and the player scores points. Speed increases every 10 lines. The game ends when a newly spawned piece cannot be placed (top-out). Differentiates from standard Tetris by using pentominoes instead of tetrominoes. The 12 free pentominoes are: F, I, L, N, P, T, U, V, W, X, Y, Z. Mirror images (e.g. J/S) are not treated as distinct pieces — rotation covers both orientations.

**Players:**
1 (single player, no AI)

**Modes:**
No named modes. Pre-game options on home screen:
- Starting Speed: Slow (default) / Medium / Fast
- Starting Board: Empty (default) / Light fill (~25% rows pre-filled) / Medium fill (~50%) / Heavy fill (~75%)
All modes share a single high score leaderboard.

**Rules:**
- A random pentomino spawns at the top-center of the 12-column board
- The piece falls one row per gravity tick; tick interval decreases as level increases
- Player moves piece left/right, rotates CW/CCW, soft-drops (accelerated fall), or hard-drops (instant to lowest valid position)
- When a piece can no longer fall (bottom or stack below), it locks in place after the current tick
- Any rows that are completely filled are cleared immediately after lock; cells above shift down
- Score is awarded based on lines cleared, current level, and combo bonus
- Level increases by 1 every 10 lines cleared; gravity tick interval decreases each level
- Game ends when a newly spawned piece's starting cells overlap already-occupied cells (top-out)

**Win condition:**
No win — survival/score game. The goal is to achieve the highest score possible before topping out. High score is saved to local storage.

**Special rules / one-off mechanics:**
- **Wall kick / rotation offset:** When rotating near a wall or obstacle, try a set of offset positions (kick table) to find a valid placement before rejecting the rotation. Pentominoes need a richer kick table than standard Tetris — try offsets: (0,0), (0,-1), (0,+1), (0,-2), (0,+2), (-1,0), (+1,0) in order.
- **Hard drop lock:** Piece locks instantly on hard drop — no slide time after landing.
- **Soft drop score:** Each row advanced by soft drop scores 1 point.
- **Hard drop score:** Each row dropped by hard drop scores 2 points.
- **Multi-line clear bonus:** Clearing more than 1 row at once earns a multiplier: 1 line = ×1, 2 lines = ×2, 3 lines = ×3, 4 lines = ×5, 5 lines = ×8.
- **Back-to-back combo:** Consecutive piece locks that each clear at least one line earn an additional ×1.5 bonus. Combo resets on any lock that clears zero lines.
- **Bag randomizer:** All 12 pentominoes are shuffled into a bag; pieces are drawn in order. When the bag is exhausted, a new shuffled bag is generated. This ensures fair distribution.
- **Spawn position:** Piece spawns horizontally centered (columns 4–8 for a 5-wide bounding box), at row 0 (top of visible board). If the spawn position is blocked, game over.
- **Starting fill:** Pre-filled rows are generated randomly but are guaranteed to have at least one gap per row (no accidental full rows at game start). Cells are placed from the bottom up.
- **Line clear flash:** Completed rows briefly flash before being removed (visual feedback, ~200ms).
- **Lock delay:** After a piece lands, there is a short lock delay (~300ms) during which the player can still slide/rotate. Hard drop bypasses lock delay.

**UI flow:**
1. Home screen: game title, starting speed selector, starting board selector, best score display, Start button, Donate button, theme toggle, Help (?) button
2. Play screen: board (12×20), active piece, ghost preview disabled, next-piece panel (1 piece), score, level, lines cleared, Help (?) button, Quit button
3. "Are you sure?" modal on Quit (does not pause game)
4. Game over screen: "Game Over", final score, best score (updated if beaten), Play Again button, Home button
5. Help modal: accessible from both home and play screens; does not pause game

**Edge cases:**
- Piece spawns overlapping existing cells → immediate game over (no partial spawn)
- Rotation blocked by walls and stack in all kick positions → rotation silently fails (piece stays)
- Hard drop when piece is already at lowest valid position → locks instantly in place
- Clearing 5 rows at once with a pentomino (theoretically possible but rare) → ×8 multiplier applies
- Level increases mid-game: next gravity tick uses new interval (no mid-tick adjustment)
- Starting fill "Heavy" at ~75%: 15 of 20 rows are partially filled; piece may top-out very quickly — this is intentional
- Bag exhaustion mid-game: seamlessly generate next bag without delay
- Soft drop held across row boundary: each row advanced during soft drop adds 1 point continuously
- Back-to-back combo persists across multiple pieces — reset only on a lock with zero line clears

---

## Data Model

**Board / grid:**
12 columns × 20 rows, stored as a flat array of 240 cells or a 2D array `number[][]` where `board[row][col]`. Each cell is `0` (empty) or a piece-type index (1–12) for color.

**Piece / token types:**
12 free pentomino pieces, each defined by a set of 4 rotations (each rotation = array of [row, col] offsets from a pivot):
- F, I, L, N, P, T, U, V, W, X, Y, Z
Note: J and S are NOT included — they are mirror images of L and N respectively. Rotation through all 4 orientations covers both the original and its mirror, so no separate piece type is needed.
Each piece has a unique color index (1–12).

**Game state shape:**
```ts
type PieceType = 'F' | 'I' | 'L' | 'N' | 'P' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z'; // 12 free pentominoes; J and S omitted (covered by L and N rotations)

interface PieceDef {
  type: PieceType;
  rotations: [number, number][][]; // array of 4 rotations, each is array of [row,col] offsets
  color: number;                    // 1–12 for CSS color lookup
}

interface ActivePiece {
  type: PieceType;
  rotation: number;   // 0–3
  row: number;        // top-left anchor row
  col: number;        // top-left anchor col
}

type Board = number[][];  // [row][col], 0 = empty, 1–12 = locked piece color

interface GameState {
  board: Board;
  active: ActivePiece | null;
  next: PieceType;
  bag: PieceType[];          // remaining pieces in current bag
  score: number;
  level: number;
  linesCleared: number;      // total lines cleared (used for level-up)
  combo: number;             // consecutive locks that cleared lines
  status: 'idle' | 'playing' | 'gameover';
  flashRows: number[];       // rows currently in clear-flash animation
  lockDelayActive: boolean;      // true when piece has landed and lock delay timer is running
  lockDelayStart: number | null; // timestamp (ms) when lock delay began; null when not active
  startSpeed: 'slow' | 'medium' | 'fast';
  startFill: 'empty' | 'light' | 'medium' | 'heavy';
}

interface StoredData {
  bestScore: number;
  lastStartSpeed: 'slow' | 'medium' | 'fast';
  lastStartFill: 'empty' | 'light' | 'medium' | 'heavy';
  theme: 'light' | 'dark';
  savedGame: SavedGameState | null;  // persisted on every state change; cleared on game over
}

interface SavedGameState {
  board: Board;
  active: ActivePiece | null;
  next: PieceType;
  bag: PieceType[];
  score: number;
  level: number;
  linesCleared: number;
  combo: number;
  startSpeed: 'slow' | 'medium' | 'fast';
  startFill: 'empty' | 'light' | 'medium' | 'heavy';
}
// Restore path: on App mount, read `StoredData.savedGame` from local storage.
// If present, hydrate GameState from SavedGameState fields and set `status: 'playing'`.
// Also set `lockDelayActive: false`, `lockDelayStart: null`, `flashRows: []`.
// This logic lives in the App.tsx state initializer (passed as the init function to useState).
// `savedGame` is written on every piece lock and line clear; cleared (set to null) on top-out or confirmed quit.
```

**Turn / phase structure:**
- Each "tick" the active piece attempts to fall one row
- Gravity interval by level: Slow base = 800ms, Medium = 500ms, Fast = 300ms; each level reduces interval by ~50ms (floor at 100ms)
- On lock: run line-clear detection → animate flash → remove rows → shift board down → update score/level/combo → spawn next piece
- Soft drop: tick interval reduced to 50ms while down arrow held
- Hard drop: piece teleports to lowest valid position and locks immediately (skip lock delay)

---

## Setup
- [x] Bootstrap `block-stacker/` with Vite + React + TypeScript

## Game Logic
(`src/game/logic.ts`)

- [x] Define `PIECES`: all 12 free pentomino definitions (F, I, L, N, P, T, U, V, W, X, Y, Z) with 4 rotations each and color index (1–12); no J or S
- [x] `createEmptyBoard(): Board` — returns 12×20 grid of zeros
- [x] `createStartingBoard(fill: StartFill): Board` — generates board with random partial rows; guarantees no complete rows and at least one gap per row
- [x] `newBag(): PieceType[]` — returns all 12 piece types in random shuffle order
- [x] `spawnPiece(type: PieceType): ActivePiece` — returns piece anchored at top-center
- [x] `isValidPosition(board: Board, piece: ActivePiece): boolean` — checks all cells are in-bounds and unoccupied
- [x] `rotate(piece: ActivePiece, dir: 'cw' | 'ccw'): ActivePiece` — returns new piece with rotation index updated (mod 4)
- [x] `tryRotate(board: Board, piece: ActivePiece, dir: 'cw' | 'ccw'): ActivePiece | null` — applies wall-kick: tries offsets (0,0),(0,-1),(0,+1),(0,-2),(0,+2),(-1,0),(+1,0); returns first valid or null
- [x] `moveLeft(board: Board, piece: ActivePiece): ActivePiece | null` — returns shifted piece or null if blocked
- [x] `moveRight(board: Board, piece: ActivePiece): ActivePiece | null` — returns shifted piece or null if blocked
- [x] `moveDown(board: Board, piece: ActivePiece): ActivePiece | null` — returns shifted piece or null if at bottom/stack
- [x] `hardDropPosition(board: Board, piece: ActivePiece): ActivePiece` — returns piece at lowest valid row
- [x] `hardDropDistance(board: Board, piece: ActivePiece): number` — number of rows dropped (for scoring)
- [x] `lockPiece(board: Board, piece: ActivePiece): Board` — stamps piece cells into board, returns new board
- [x] `findCompleteRows(board: Board): number[]` — returns sorted array of row indices that are fully filled
- [x] `clearRows(board: Board, rows: number[]): Board` — removes specified rows and inserts empty rows at top
- [x] `calcScore(lineCount: number, level: number, combo: number, dropBonus: number): number` — base score for 1 line = 100 points; applies line multiplier (×1/2/3/5/8 for 1–5 lines), then multiplies by `(level + 1)`, then applies combo ×1.5 if `combo >= 2`, then adds `dropBonus`
- [x] `calcLevel(totalLines: number, startSpeed: StartSpeed): number` — returns current level from total lines (level = floor(totalLines / 10) + baseLevel)
- [x] `gravityInterval(level: number, softDrop: boolean): number` — returns ms between ticks
- [x] `isTopOut(board: Board, piece: ActivePiece): boolean` — true if spawn position is blocked

## Components

- [x] `App.tsx` — root: manages `GameState`, game loop (useInterval), keyboard handler, routes between home/play/gameover screens via `status`
- [x] `HomeScreen.tsx` / `HomeScreen.css` — title, speed selector, fill selector, best score, Start/Donate/theme-toggle buttons, Help (?) button
- [x] `Board.tsx` / `Board.css` — renders 12×20 grid; overlays active piece cells; highlights flash rows; no ghost piece
- [x] `Cell.tsx` / `Cell.css` — single board cell; accepts color index prop; flash state prop
- [x] `NextPiece.tsx` / `NextPiece.css` — renders small preview grid for next piece
- [x] `ScorePanel.tsx` / `ScorePanel.css` — displays score, level, lines cleared
- [x] `Controls.tsx` / `Controls.css` — on-screen buttons for mobile (left, right, rotate CW, rotate CCW, soft drop, hard drop); hidden on large screens
- [x] `HelpModal.tsx` / `HelpModal.css` — full control reference and game rules; triggered without pausing game
- [x] `ConfirmModal.tsx` / `ConfirmModal.css` — "Are you sure?" modal for Quit; does not pause game
- [x] `GameOverScreen.tsx` / `GameOverScreen.css` — final score, best score, Play Again / Home buttons
- [x] `Header.tsx` / `Header.css` — theme toggle, Help (?) button, Quit button (play screen only)

## Styling

- [x] `global.css` — CSS custom properties for light/dark themes, base reset, font
- [x] Color palette: 12 distinct piece colors (one per free pentomino, indices 1–12); empty cell color; board background
- [x] Board cells: square aspect ratio maintained via CSS (e.g. `aspect-ratio: 1`)
- [x] Flash animation: brief brightness/white flash on complete rows before clearing
- [x] Responsive layout: board scales to fit viewport; score panel beside or below board
- [x] Dark theme: deep background, high-contrast pieces
- [x] Smooth piece movement: CSS transitions on cell state changes (optional, keep simple)

## Polish

- [x] Theme toggle persisted to local storage; applied on first load (no flash of wrong theme)
- [x] Best score updates immediately when beaten (no need to finish game)
- [x] Last selected speed and fill saved to local storage; pre-selected on next visit
- [x] Donate button links to freeCodeCamp donation page
- [x] Line-clear flash (200ms) before row removal — gives satisfying visual feedback
- [x] Level-up visual cue (brief color pulse on score panel or "Level Up!" text)
- [x] Keyboard repeat rate handled by tracking keydown/keyup (not relying on OS key repeat for DAS/ARR — implement basic Delayed Auto Shift)
- [x] Mobile on-screen controls for devices without keyboards
- [x] "Are you sure?" modal for Quit — does not pause game (game continues behind modal)
- [x] Help modal accessible from play screen — does not pause game
- [x] Game state persisted to local storage on every lock/line-clear/level-up; restored on reload if `savedGame` is present (resume in-progress game); `savedGame` cleared when game ends (top-out or quit confirmed)

## Accessibility

- [x] All interactive elements (buttons, selectors, theme toggle) have descriptive `aria-label` or visible label text
- [x] Board grid has `role="grid"` and `aria-label="Block Stacker board"` on the container element
- [x] Each board row has `role="row"`; each cell has `role="gridcell"` with `aria-label` reflecting its state (e.g. "empty", piece color name, or "active")
- [x] Help modal: focus trapped inside while open; focus restored to the "?" button on close; `role="dialog"` with `aria-modal="true"` and `aria-labelledby` pointing to modal title
- [x] Confirm modal: same focus trap and restore pattern as Help modal; default focus on the "Cancel" (safe) button
- [x] Game Over screen: focus moves to the "Play Again" button when screen appears
- [x] Score panel values use `aria-live="polite"` so screen readers announce score/level/lines updates without interrupting
- [x] On-screen mobile controls: each button has an `aria-label` (e.g. "Move left", "Rotate clockwise", "Hard drop")

## Testing
(`src/game/logic.test.ts`)

- [x] `createEmptyBoard` returns 12×20 grid of all zeros
- [x] `createStartingBoard('light')` — no complete rows, every row has at least one gap
- [x] `createStartingBoard('heavy')` — same guarantees, ~75% fill
- [x] `isValidPosition` returns false when piece cell is out-of-bounds (left, right, bottom)
- [x] `isValidPosition` returns false when piece cell overlaps occupied board cell
- [x] `isValidPosition` returns true for valid spawn position on empty board
- [x] `tryRotate` succeeds without kick on open board
- [x] `tryRotate` succeeds with kick offset when rotation would hit left wall
- [x] `tryRotate` returns null when all kick positions are blocked
- [x] `moveDown` returns null when piece is at bottom row
- [x] `moveDown` returns null when cell directly below is occupied
- [x] `hardDropPosition` returns piece at lowest valid row on empty board (row 15 for 5-cell-tall I piece)
- [x] `hardDropDistance` returns correct row count
- [x] `lockPiece` stamps correct cells into board; does not mutate original board
- [x] `findCompleteRows` returns correct row indices for fully filled rows
- [x] `findCompleteRows` returns empty array when no rows are complete
- [x] `clearRows` removes specified rows and adds empty rows at top; board height stays 20
- [x] `clearRows` preserves row order correctly (top rows shift down)
- [x] `calcScore` single line clear at level 1, no combo = baseline score
- [x] `calcScore` 5-line clear applies ×8 multiplier
- [x] `calcScore` back-to-back combo (combo=2) applies ×1.5
- [x] `calcLevel` returns level 0 at 0 lines, level 1 at 10 lines, level 5 at 50 lines
- [x] `gravityInterval` decreases with each level; soft drop returns 50ms
- [x] `newBag` contains exactly 12 unique piece types (F, I, L, N, P, T, U, V, W, X, Y, Z — no J or S)
- [x] `isTopOut` returns true when spawn cells are occupied
- [x] `isTopOut` returns false on empty board

---

## Help & Strategy Guide

**Controls reference (shown in help modal):**
| Action | Key(s) |
|---|---|
| Move left | ← Arrow |
| Move right | → Arrow |
| Soft drop | ↓ Arrow (hold) |
| Hard drop | Space |
| Rotate clockwise | X or ↑ Arrow |
| Rotate counter-clockwise | Z or Ctrl |

**Pentomino pieces:**
Block-Stacker uses the 12 free pentominoes (5-cell pieces) instead of the 4-cell tetrominoes of standard Tetris. The pieces are named F, I, L, N, P, T, U, V, W, X, Y, Z. (J and S are not included — they are mirror images of L and N, which rotation already covers.) Many are wider or more irregular than classic Tetris pieces, which means:
- Holes are easier to create accidentally
- Clearing multiple rows at once is harder but more rewarding
- Planning 2–3 pieces ahead becomes critical at higher levels

**Beginner tips:**
- Keep the stack flat. Tall towers with uneven tops are hard to recover from with pentominoes because their irregular shapes struggle to fill narrow gaps.
- Use hard drop sparingly at first — use soft drop to feel out where pieces land.
- The "U" and "W" pieces leave awkward holes if placed carelessly on an uneven surface. Try to place them on flat or slightly recessed sections.
- The "X" and "I" pieces are the most versatile. Save the "I" piece for narrow columns you need to fill vertically.
- When using Heavy starting fill, clear a row immediately with your first piece if possible — the board fills up fast.

**Intermediate strategy:**
- Stack pieces toward one side (usually the right) and leave a 1–2 column well on the other side for I-pieces and tall pieces. This mirrors the classic Tetris "flat stack + well" approach.
- Back-to-back combos (clearing lines on consecutive drops) multiply your score quickly. Try to set up positions where every piece you place clears at least one row.
- Rotating early (before the piece descends) gives you more time to position it.

**Common mistakes:**
- Leaving isolated holes covered by locked cells — these holes can never be filled and will doom the run.
- Waiting too long to rotate near the top, resulting in pieces locking in wrong orientation.
- Overlooking the soft drop: at higher levels, using soft drop to guide pieces precisely is faster than waiting for natural fall.
- Ignoring the next-piece preview — always plan your current placement with the next piece in mind.

**Scoring summary:**
Base score per clear = 100 × line_multiplier × (level + 1):
- 1 line: 100 × 1 × (level + 1)
- 2 lines: 100 × 2 × (level + 1)
- 3 lines: 100 × 3 × (level + 1)
- 4 lines: 100 × 5 × (level + 1)
- 5 lines (rare): 100 × 8 × (level + 1)
- Back-to-back combo (2+ consecutive line-clearing locks): ×1.5 on the clear score
- Soft drop: +1 per row advanced
- Hard drop: +2 per row dropped
