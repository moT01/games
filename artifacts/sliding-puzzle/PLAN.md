# sliding-puzzle
> Based on: 15-puzzle

## Game Design

**What we're building:** A classic 15-puzzle (4×4 sliding tile puzzle) where the player slides numbered tiles on a grid to arrange them in order from 1–15, with the empty space in the bottom-right corner. The board is shuffled at the start of each game and the player solves it by sliding adjacent tiles into the blank space. A move counter and timer track performance.

**Rules:**
- The board is a 4×4 grid containing tiles numbered 1–15 and one empty space (16 cells total).
- A tile can be moved if it is directly adjacent (up, down, left, right — no diagonals) to the empty space.
- Clicking a tile adjacent to the empty space slides it into the empty space.
- Multiple tiles in the same row or column as the empty space can be shifted in one click: clicking any tile in the same row/column as the blank slides all tiles between the clicked tile and the blank as a group (optional "row/column shift" variant — include as a setting).
- The puzzle is solved when tiles 1–15 appear in row-major order and the empty space is in position 15 (bottom-right).

**Players:** Single player only. This is a puzzle game — no multiplayer or computer opponent.

**Modes / variants:**
- Grid size: 3×3 (8-puzzle), 4×4 (15-puzzle, default), 5×5 (24-puzzle)
- A size selector on the start/settings screen lets the player choose difficulty.

**Win condition:** Tiles are in order 1, 2, 3 … (n²−1) reading left-to-right, top-to-bottom, with the empty space at the last position.

**Draw / stalemate conditions:** None. The puzzle always has a solution (enforced by generating the shuffle via valid moves from the solved state).

**Special rules / one-off mechanics:**
- Solvability: not all random permutations of 1–15 are solvable. Enforce solvability by either (a) shuffling via random valid moves from the solved state, or (b) checking the inversion count parity rule after shuffling. Approach (a) is simpler and is the one to use.
- The solved state must not be accidentally handed to the player — shuffle must make at least ~200 random moves.
- Tile animation: tiles should animate smoothly when they slide.
- Move counter increments once per click (even if multiple tiles shift in row/column mode).

**UI flow:**
1. Start screen — shows game title, grid size selector (3×3 / 4×4 / 5×5), and a "New Game" button.
2. Game screen — shows the puzzle grid, move counter, elapsed timer, and a "New Game" / "Restart" button.
3. Win screen (overlay or modal) — congratulates the player, shows move count and elapsed time, offers "Play Again" (same size) and "Change Size" buttons.
4. Help modal — accessible via "?" button on the game screen.

**Edge cases:**
- Clicking the empty cell itself: no-op.
- Clicking a tile not adjacent to the empty space (and row/column shift is off): no-op.
- Winning on the very first move (extremely unlikely but must still trigger win detection).
- Restarting mid-game: reset move count and timer, generate a new shuffle.
- Timer should stop when the puzzle is solved; it should not restart until a new game begins.
- 3×3 shuffle needs fewer moves (~50) to still be challenging but not trivial.
- 5×5 shuffle needs more moves (~300) to ensure sufficient randomness.
- Preventing a "solved" shuffle: after generating the shuffle, verify it is not already solved (re-shuffle if it is — practically never happens with enough shuffle moves, but guard anyway).

---

## Data Model

**Board / grid:** Flat array of numbers, length n² (where n is the grid size). Value `0` represents the empty space. Index `i` maps to row `Math.floor(i / n)` and column `i % n`.

**Piece / token types:** Integers 1 … (n²−1) for tiles; `0` for the blank.

**Game state shape:**
```ts
type GameState = {
  tiles: number[];       // flat array, 0 = blank
  size: number;          // 3, 4, or 5
  moves: number;
  elapsed: number;       // seconds
  status: 'idle' | 'playing' | 'won';
  timerActive: boolean;
  rowShift: boolean;     // whether clicking a non-adjacent tile in same row/col slides the whole line
};
```

**State flags:**
- `status: 'idle'` — start screen shown, no game in progress.
- `status: 'playing'` — game in progress.
- `status: 'won'` — puzzle solved; win overlay shown; timer stopped.
- `timerActive` — true while the timer interval should be running (playing and not won).
- `rowShift` — toggled in the start screen settings; persists for the duration of the session. Defaults to `false`.

**Turn structure:** Not turn-based. Any valid tile click advances the game state immediately.

**Move validation approach:** Given the blank's index, a tile at index `i` is valid to move if `|i - blankIndex| === 1` and same row (horizontal neighbor), or `|i - blankIndex| === size` (vertical neighbor). Implemented in `getValidMoves(tiles, size): number[]` returning valid tile indices.

**Invalid move handling:** Silently ignored — no error message, no animation. The tile simply does not move.

---

## AI / Computer Player

Not applicable. This is a single-player puzzle game with no computer opponent.

---

## Interaction Model

**Input method:** Mouse click (or touch tap) on a tile. The tile slides into the blank if valid. Keyboard arrow keys can also move the tile adjacent to the blank in the arrow direction (e.g., pressing Left moves the tile to the right of the blank into the blank space, which visually slides left).

**Visual feedback:**
- Valid tiles (adjacent to blank) have a subtle hover highlight so the player knows they're clickable.
- Tile slides with a CSS `transition` on `transform` or grid position for smooth animation (~150 ms).
- Move counter increments visibly.
- Timer ticks every second once the first move is made.
- Win overlay appears with a brief fade-in after solve is detected.

**Captured / out-of-play pieces:** Not applicable — all tiles remain on the board throughout.

---

## Setup
- [x] Create `sliding-puzzle/` folder and bootstrap project with Vite + React + TypeScript boilerplate.
- [x] Install dependencies and verify dev server runs.

---

## Game Logic
- [x] `generateSolvedTiles(size: number): number[]` — returns `[1, 2, …, n²-1, 0]`.
- [x] `shuffle(tiles: number[], size: number): number[]` — performs random valid moves from solved state (200+ moves for 4×4) to produce a solvable, non-trivially-solved board.
- [x] `getBlankIndex(tiles: number[]): number` — returns index of `0`.
- [x] `getValidMoveIndices(tiles: number[], size: number): number[]` — returns indices of tiles adjacent to blank.
- [x] `moveTile(tiles: number[], tileIndex: number, size: number): number[] | null` — returns new tiles array with the tile swapped into blank, or `null` if invalid (tile not adjacent to blank).
- [x] `shiftLine(tiles: number[], tileIndex: number, size: number): number[] | null` — used when `rowShift` is enabled. If the clicked tile is in the same row or column as the blank (but not adjacent), slides all tiles between the clicked tile and the blank as a group toward the blank. Returns `null` if the tile is neither adjacent nor in the same row/column.
- [x] `getTileIndexByDirection(tiles: number[], size: number, direction: 'up' | 'down' | 'left' | 'right'): number | null` — maps an arrow key to the tile index that should be moved. Arrow direction refers to the direction the blank moves; the tile moving is the one on the opposite side. Returns `null` if there is no tile in that direction (blank is at the edge).
- [x] `isSolved(tiles: number[], size: number): boolean` — checks tiles equal `[1, 2, …, n²-1, 0]`.
- [x] Timer logic — start on first move, stop on win, reset on new game.

---

## Components
- [x] `App` — top-level state management (`useReducer` or `useState`), routing between screens, timer tick via `useEffect`.
- [x] `StartScreen` — size selector, row/column shift toggle, and New Game button.
- [x] `Board` — renders the n×n grid; passes click handler down; receives `tiles`, `size`, `validIndices`.
- [x] `Tile` — individual tile; applies move animation via CSS transition; highlights if valid/hoverable; renders blank as empty.
- [x] `GameInfo` — displays move counter and elapsed timer.
- [x] `WinModal` — overlay shown on win; displays stats; Play Again / Change Size buttons.
- [x] `HelpModal` — rules and strategy guide; toggled by "?" button.

---

## Styling
- [ ] `global.css` — CSS variables (colors, font, tile size per grid size), reset, body background.
- [ ] `App.css` — overall layout.
- [ ] `StartScreen.css` — size selector styling.
- [ ] `Board.css` — CSS grid layout scaled to size; gap between cells.
- [ ] `Tile.css` — tile appearance, hover state, transition animation, blank tile style.
- [ ] `GameInfo.css` — move counter and timer layout.
- [ ] `WinModal.css` — overlay, modal box, buttons.
- [ ] `HelpModal.css` — modal styling, tip list.

---

## Polish
- [ ] Tile slide animation using CSS `transition: transform 150ms ease` (or re-render-based layout transition).
- [ ] Keyboard support: arrow keys move the appropriate tile into the blank.
- [ ] Responsive layout: board scales so it fits comfortably on mobile screens.
- [ ] Puzzle number tiles use a clean, readable large font.
- [ ] "?" help button always visible during play.
- [ ] Graceful empty-space rendering — blank tile is visually distinct (no number, different background).

---

## Help & Strategy Guide

**Rules summary:** Slide tiles one at a time into the empty space to arrange them in numerical order (1–15 for 4×4) left-to-right, top-to-bottom.

**Objective:** Reach the solved state — tiles 1 through n²−1 in order, blank in the bottom-right — in as few moves as possible.

**Key strategies:**
- Solve row by row from the top. The top row (1, 2, 3, 4) can be solved independently, then the second row (5, 6, 7, 8), leaving a 2×4 bottom section.
- For the last two rows, switch to solving column by column from the left.
- Placing tile 1 and tile 2 in the top row at the same time (a "row insert" maneuver) avoids breaking already-placed tiles.
- The bottom-right 2×2 corner (tiles 14, 15 and blank) is solved as a group using a standard 3-tile rotation.
- Learn the "3-cycle" rotation pattern: it lets you move one tile without disturbing the rest of the board.

**Common mistakes:**
- Placing early tiles individually and then dislodging them when solving later tiles.
- Trying to brute-force the last few tiles rather than using rotation patterns.
- Moving the blank into a corner — it can take many moves to free it.
- Forgetting that tiles in the same row as the blank can be slid horizontally in sequence without clicking each one.

**Tips for beginners:**
- Start with the 3×3 (8-puzzle) — it's much easier and teaches the core techniques.
- Count your moves — trying to beat your personal best is a good motivator.
- If you get stuck, use "Restart" to reshuffle without leaving the game screen.
- The solved image in the Help modal shows exactly what the goal looks like.

### Help Guide Checklist
- [ ] `HelpModal` — "?" button accessible from main game screen
- [ ] Content is specific to this game — no generic filler

---

## Testing

**Unit tests — game logic (`src/gameLogic.test.ts`):**
- [ ] `generateSolvedTiles(4)` returns `[1,2,…,15,0]`.
- [ ] `generateSolvedTiles(3)` returns `[1,2,…,8,0]`.
- [ ] `isSolved` returns `true` for a solved board.
- [ ] `isSolved` returns `false` for an unsolved board.
- [ ] `getBlankIndex` returns correct index when blank is at start, middle, and end.
- [ ] `getValidMoveIndices` returns correct neighbors for blank in a corner, edge, and center.
- [ ] `getValidMoveIndices` does not include diagonal neighbors.
- [ ] `moveTile` swaps a valid tile with blank and returns new array.
- [ ] `moveTile` returns `null` for an invalid tile index (not adjacent to blank).
- [ ] `shiftLine` slides multiple tiles when clicked tile is in same row as blank (non-adjacent).
- [ ] `shiftLine` slides multiple tiles when clicked tile is in same column as blank (non-adjacent).
- [ ] `shiftLine` returns `null` when clicked tile is not in same row or column as blank.
- [ ] `getTileIndexByDirection` returns the correct tile index for each of the four arrow directions.
- [ ] `getTileIndexByDirection` returns `null` when blank is at the edge in the requested direction.
- [ ] `shuffle` never returns a solved board.
- [ ] `shuffle` returns an array of the same length as the input.
- [ ] After `shuffle`, `isSolved` is `false`.

**Component tests — (`src/App.test.tsx`):**
- [ ] Start screen renders size selector and New Game button.
- [ ] Clicking New Game transitions to game screen with a Board rendered.
- [ ] Clicking a valid tile increments the move counter.
- [ ] Clicking an invalid tile does not increment the move counter.
- [ ] Clicking the blank cell does nothing.
- [ ] Win modal appears when `isSolved` mock returns `true` after a move.
- [ ] "Play Again" in win modal resets moves to 0 and renders a new board.
- [ ] "Change Size" in win modal returns to the start screen.
- [ ] Help modal opens when "?" is clicked and closes when dismissed.
