# bomb-buster
> Based on: minesweeper

## Game Design

**What we're building:** A single-player Minesweeper clone called Bomb Buster. The player reveals cells on a grid by left-clicking and flags suspected bombs with right-click. Numbers on revealed cells indicate how many of the 8 adjacent cells contain bombs. The goal is to reveal every non-bomb cell without triggering a bomb.

**Rules:**
- The grid contains a fixed number of hidden bombs randomly placed at game start.
- Left-click a cell to reveal it. If it contains a bomb, the game is lost.
- If a revealed cell has zero adjacent bombs, all adjacent unrevealed, unflagged cells are automatically revealed (flood fill / cascade).
- A revealed cell with adjacent bombs shows a number (1–8) indicating how many neighbors are bombs.
- Right-click a cell to toggle a flag on it. Flagged cells cannot be accidentally revealed by left-click.
- The first click is always safe — bombs are placed after the first click, guaranteeing the clicked cell (and optionally its neighbors) is never a bomb.
- The mine counter (top of board) shows remaining bombs minus flags placed.
- A timer starts on the first click and stops when the game ends.

**Players:** 1 (single player only — Minesweeper is a puzzle game)

**Modes / variants:**
- Beginner: 9×9 grid, 10 bombs
- Intermediate: 16×16 grid, 40 bombs
- Expert: 30×16 grid, 99 bombs
- Custom: player-specified rows, columns, and bomb count
- Difficulty is selected on a start/config screen before the game begins.

**Win condition:** All non-bomb cells are revealed. The player does not need to flag all bombs — only revealing all safe cells is required.

**Draw / stalemate conditions:** None. Minesweeper has no draw state.

**Special rules / one-off mechanics:**
- First-click safety: bombs are distributed only after the first cell is clicked, and the clicked cell is always placed in a safe zone.
- Cascade/flood fill: revealing a 0-cell triggers an automatic recursive reveal of all reachable 0-cells and their numbered border cells.
- Auto-win flag: when the last safe cell is revealed, all un-flagged bomb cells are automatically flagged and the win screen is shown.
- Chord click (optional polish): clicking a revealed numbered cell when the correct number of neighboring flags equals its number reveals all remaining unflagged neighbors at once.
- The flag counter can go negative if the player places more flags than there are bombs.

**UI flow:**
1. Difficulty / mode select screen — choose Beginner, Intermediate, Expert, or Custom.
2. Game screen — board, mine counter, timer, reset button ("New Game"), and "?" help button.
3. On win: overlay with congratulations and elapsed time, "Play Again" and "Change Difficulty" buttons.
4. On loss: overlay reveals all bomb locations, marks incorrect flags, shows "Play Again" and "Change Difficulty" buttons.

**Edge cases:**
- First click must never hit a bomb (deferred bomb placement).
- Cascade must not loop infinitely — track visited cells during flood fill.
- Flagging a cell that is already revealed should do nothing.
- Right-click on an already-flagged cell removes the flag (toggle).
- Clicking a flagged cell (left-click) does nothing — flags protect cells.
- Clicking an already-revealed cell does nothing (unless chord click is implemented).
- Custom mode: bomb count must be less than total cells; validate input before starting.
- Timer should not start until the first click; should stop immediately on win or loss.
- If all non-bomb cells are revealed simultaneously via cascade on the first click (edge case on tiny boards), the win condition must still trigger.
- Mine counter should display negative values (e.g., "−3") if over-flagged.

---

## Data Model

**Board / grid:** Flat array of `Cell` objects, length = `rows * cols`. Index formula: `row * cols + col`.

**Cell type:**
```ts
type Cell = {
  isBomb: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentCount: number; // 0–8, only meaningful after bombs are placed
};
```

`isWrongFlag` is **not** stored in `Cell`. It is a derived value computed at render time: `cell.isFlagged && !cell.isBomb`. The `BoardCell` component uses this condition to render the wrong-flag "X" appearance when the game is lost. No extra state field is needed.

**Game state shape:**
```ts
type GameStatus = 'idle' | 'playing' | 'won' | 'lost';

type Difficulty = 'beginner' | 'intermediate' | 'expert' | 'custom';

type Config = {
  rows: number;
  cols: number;
  bombs: number;
  difficulty: Difficulty;
};

type GameState = {
  cells: Cell[];
  config: Config;
  status: GameStatus;
  flagCount: number;    // number of flags placed
  elapsedSeconds: number;
};
```

**State flags:**
- `status: 'idle'` — board initialized, no clicks yet (timer not running, bombs not placed)
- `status: 'playing'` — first click has happened, timer running
- `status: 'won'` — all safe cells revealed
- `status: 'lost'` — a bomb was clicked

**Turn structure:** No turns — single-player. Player clicks cells freely while status is `'playing'` or `'idle'`.

**Move validation approach:** In `revealCell(index)` — check cell is not already revealed, not flagged, and game is not over. In `toggleFlag(index)` — check cell is not already revealed and game is not over.

**Invalid move handling:** Silently ignore (return early) — no error message needed.

---

## AI / Computer Player

Not applicable — Minesweeper is single player only.

---

## Interaction Model

**Input method:**
- Left-click: reveal a cell (or chord-click a number if implemented)
- Right-click: toggle flag on unrevealed cell (must call `e.preventDefault()` to suppress browser context menu)
- Reset button: start a new game with current config
- Difficulty buttons: return to difficulty select screen

**Visual feedback:**
- Unrevealed cell: flat, slightly raised button look
- Revealed cell with number: distinct color per number (1=blue, 2=green, 3=red, 4=dark blue, 5=dark red, 6=teal, 7=black, 8=gray)
- Revealed cell with 0 adjacent bombs: blank, sunken look
- Flagged cell: flag icon (emoji or CSS icon)
- On loss: all bomb cells revealed; incorrectly flagged cells (flagged but not a bomb) shown with an X; the triggered bomb cell highlighted in red
- On win: brief animation or color change; all bombs auto-flagged
- Timer: live seconds counter, displayed as padded 3-digit number (e.g., "007")
- Mine counter: remaining bombs minus flags, also padded 3-digit number, can go negative

**Captured / out-of-play pieces:** Not applicable.

---

## Setup
- [x] Create `bomb-buster/` folder and bootstrap project with Vite + React + TypeScript boilerplate.
- [x] Install dependencies (`react`, `react-dom`, TypeScript, Vite, Vitest).
- [x] Set up `vite.config.ts` with test configuration.
- [x] Create folder structure: `src/components/`, `src/hooks/`.

---

## Game Logic

All pure functions live in `src/gameLogic.ts`. No React imports.

- [x] `createEmptyBoard(rows, cols): Cell[]` — creates a board of unrevealed, unflagged, non-bomb cells with adjacentCount 0
- [x] `placeBombs(cells, rows, cols, bombs, safeIndex): Cell[]` — randomly places `bombs` bombs, skipping `safeIndex` (and optionally its neighbors), then recalculates all adjacentCounts; returns new cells array
- [x] `getNeighborIndices(index, rows, cols): number[]` — returns valid neighbor indices for a given cell (handles edges/corners)
- [x] `calculateAdjacentCounts(cells, rows, cols): Cell[]` — iterates every cell, counts bomb neighbors, sets adjacentCount
- [x] `revealCells(cells, index, rows, cols): Cell[]` — reveals cell at index; if adjacentCount is 0, recursively flood-fills neighbors (BFS, not recursion, to avoid stack overflow on large boards); returns new cells array
- [x] `toggleFlag(cells, index): Cell[]` — toggles isFlagged on unrevealed cell; returns new cells array
- [x] `checkWin(cells): boolean` — returns true if every non-bomb cell is revealed
- [x] `countFlags(cells): number` — returns total number of flagged cells
- [x] `revealAllBombs(cells): Cell[]` — used on loss; sets `isRevealed: true` on every bomb cell so they are visible; does not touch flagged state. Incorrectly flagged cells (`isFlagged && !isBomb`) are rendered with an "X" by `BoardCell` using the derived condition — no state mutation required for that.

---

## Components

- [x] `App` — holds all game state, config, status, timer; renders either `DifficultySelect` or `GameBoard` depending on state
- [x] `DifficultySelect` — difficulty picker with Beginner / Intermediate / Expert / Custom buttons; custom shows row/col/bomb inputs; calls `onStart(config)` callback
- [x] `GameBoard` — renders the grid of `Cell` components, mine counter, timer, reset button, and help button; receives game state and handlers as props
- [x] `BoardCell` — single cell component; handles left-click and right-click; displays correct visual state (unrevealed, revealed number, revealed blank, flagged, bomb, wrong-flag). Named `BoardCell` (not `Cell`) to avoid a name collision with the `Cell` type from `gameLogic.ts`.
- [x] `HelpModal` — modal overlay triggered by "?" button; shows rules and strategy guide; dismissible with close button or clicking backdrop

---

## Styling

- [x] `global.css` — CSS variables for colors, fonts, reset; number color variables (`--num-1` through `--num-8`)
- [x] `App.css` — centering, overall layout
- [x] `DifficultySelect.css` — button grid, custom input form
- [x] `GameBoard.css` — grid layout (CSS grid with `grid-template-columns: repeat(cols, size)`), header bar with counter + timer + reset
- [x] `BoardCell.css` — cell sizing, states (unrevealed vs revealed vs flagged vs bomb), number colors using CSS variables
- [x] `HelpModal.css` — overlay backdrop, modal box, close button

---

## Polish

- [x] Smiley / emoji reset button that changes face on win (😎) and loss (😵), normal state (🙂)
- [x] Number colors follow classic Minesweeper convention (1=blue, 2=green, 3=red, etc.)
- [x] Cells have a subtle inset/raised 3D effect using box-shadow (classic Windows Minesweeper feel)
- [x] Brief "shake" animation on loss (optional)
- [x] Auto-flag remaining bombs on win
- [x] Mine counter and timer use a classic 7-segment LCD look (red digits on dark background) using a monospace or custom font

---

## Help & Strategy Guide

**Rules summary:** Left-click to reveal a cell. Right-click to place or remove a flag. Numbers show how many of the 8 surrounding cells contain bombs. Avoid all bombs to win.

**Objective:** Reveal every cell that does not contain a bomb. You do not need to flag all bombs — flagging is optional but helps track your progress.

**Key strategies:**
- If a revealed number is already satisfied by the correct number of adjacent flags, the remaining unrevealed neighbors are safe to click.
- When a "1" cell touches only one unrevealed cell, that cell must be the bomb — flag it.
- Look for cells where the number equals the count of remaining unrevealed neighbors — all of them are bombs.
- Corners and edges reduce the number of unknown neighbors, making them easier to reason about.
- When logic runs out (no safe deductions possible), guess at a corner or edge cell — those have fewer bomb neighbors and are statistically safer.
- On Beginner, the board is usually solvable with pure logic. Expert almost always requires at least one guess.

**Common mistakes:**
- Forgetting that the flag count in the header is not a reliable indicator of how many flags are left to place — it's mines minus current flags, which can be wrong if you misplace flags.
- Left-clicking too fast and missing the visual state — slow down when mines are nearby.
- Trying to flag every bomb before revealing safe cells — unnecessary and slows you down.

**Tips for beginners:**
- Start with Beginner (9×9, 10 mines) to learn how numbers work before trying larger boards.
- Open corners first — they tend to cascade well and expose large safe areas.
- When stuck, count carefully: write down or mentally note which cells account for which numbers.
- The first click is always safe, so click boldly to start.

### Help Guide Checklist
- [x] `HelpModal` — "?" button accessible from main game screen
- [x] Content is specific to this game — no generic filler

---

## Testing

**Unit tests — game logic (`src/gameLogic.test.ts`):**
- [x] `createEmptyBoard` returns correct length array with all cells unrevealed, unflagged, not bombs
- [x] `getNeighborIndices` returns correct neighbors for a center cell, corner cell, and edge cell
- [x] `placeBombs` places exactly the requested number of bombs and never places one at `safeIndex`
- [x] `calculateAdjacentCounts` correctly counts adjacent bombs for a manually constructed board
- [x] `revealCells` on a 0-cell cascades to all reachable connected 0-cells and their numbered borders
- [x] `revealCells` does not cascade through flagged cells
- [x] `revealCells` on a numbered cell reveals only that cell (no cascade)
- [x] `revealCells` on a bomb cell reveals it (game logic caller handles status change)
- [x] `toggleFlag` flags an unrevealed cell; calling again removes the flag
- [x] `toggleFlag` on a revealed cell does nothing
- [x] `checkWin` returns false when bombs are unrevealed and safe cells are unrevealed
- [x] `checkWin` returns true when all non-bomb cells are revealed (bombs may or may not be revealed)
- [x] `countFlags` returns correct count

**Component tests — (`src/App.test.tsx`):**
- [x] Renders difficulty select screen on initial load
- [x] Clicking a difficulty button transitions to the game board
- [x] Mine counter shows correct initial value (bombs count)
- [x] Right-clicking a cell places a flag and decrements the mine counter display
- [x] Right-clicking a flagged cell removes the flag and increments the mine counter display
- [x] Clicking a flagged cell (left-click) does nothing
- [x] On loss (click a bomb): game status becomes 'lost', overlay is shown — mock `placeBombs` in `gameLogic.ts` via `vi.mock` to return a board with a known bomb at a specific index so the test can click that cell reliably
- [x] On win: game status becomes 'won', overlay is shown — use the same `vi.mock` of `placeBombs` to produce a minimal board (e.g. 2×2 with one bomb) so all safe cells can be clicked in the test without guessing positions
- [x] Reset button starts a new game (board resets, timer resets)
- [x] "Change Difficulty" from end screen returns to difficulty select
