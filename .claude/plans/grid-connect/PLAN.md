## Grid-Connect

### Game Design

**What we're building:** A browser-based Connect 4 game with two play modes and an optional AI opponent.

**Players:** Red (goes first) and Yellow

**Modes:**
- **vs Player** — two humans take turns on the same browser/device
- **vs Computer** — one human plays against an AI

**Computer difficulty:**
- **Easy** — AI picks a random non-full column
- **Hard** — AI uses minimax with alpha-beta pruning (depth 5)

**Player side (vs Computer only):**
- Player picks Red (goes first) or Yellow (goes second)
- Computer automatically takes the other side
- If player picks Yellow, computer makes the first move immediately

**UI flow:**
1. App opens on the **Mode Selector** screen
2. Player picks "vs Player" or "vs Computer"
3. If "vs Computer": player picks Easy or Hard, then Red or Yellow
4. Game board (6 rows × 7 columns) is shown — game begins
5. Click a column to drop a piece; it falls to the lowest empty row in that column
6. On win or draw: result message shown with a "Play Again" button
7. "Play Again" returns to the Mode Selector screen

**Edge cases:**
- Clicking a full column does nothing
- No moves accepted after game is over (win or draw)
- In vs Computer mode, board is locked while the AI is "thinking"
- Draw is detected when all 42 cells are filled with no winner
- The winning 4 cells are highlighted

### Setup
- [x] Bootstrap `grid-connect/` (see CLAUDE.md → Bootstrapping a New Game)

### Game Logic
(`src/gameLogic.ts`)
- [x] Types: `Player = 'Red' | 'Yellow'`, `Board = (Player | null)[]` (42 cells, indexed `row * 7 + col`, row 0 = top)
- [x] `dropPiece(board, col, player)` — returns index of the cell filled, or null if column is full
- [x] `checkWinner(board)` — checks all horizontal, vertical, and diagonal windows of 4; returns winning player or null
- [x] `getWinningCells(board)` — returns the 4 cell indices of the winning line (for highlighting), or null
- [x] `checkDraw(board)` — returns true when all 42 cells are filled and there is no winner
- [x] `isColumnFull(board, col)` — returns true if the top row of a column is occupied
- [x] Mode state (vs-player | vs-computer)
- [x] Difficulty state (easy | hard)
- [x] Player side state (Red | Yellow)
- [x] `getComputerMove(board, difficulty, aiPlayer)` — returns column index
  - Easy: random non-full column
  - Hard: minimax with alpha-beta pruning, depth 5
- [x] Auto-trigger computer move when it's the computer's turn

### Components
- [x] `App` — top-level layout, holds all game state
- [x] `ModeSelector` — pick mode, difficulty (if vs Computer), color (if vs Computer)
- [x] `Board` — renders the 6×7 grid
- [x] `Cell` — single cell (empty / red / yellow); click triggers `onColumnClick(col)`
- [x] `GameStatus` — current turn indicator during play; result + "Play Again" when game is over

### Styling
- [x] `global.css` (copied from tic-tac-toe)
- [x] `App.css`
- [x] `ModeSelector.css`
- [x] `GameStatus.css`
- [x] `Board.css`
- [x] `Cell.css`

### Polish
- [x] Highlight the winning 4 cells
- [x] Drop preview: a ghost piece appears in the top cell of the hovered column
- [x] Disable clicks on full columns
- [x] Prevent moves after game is over
- [x] Responsive layout (works on mobile)

### Testing

**Framework:** Vitest + React Testing Library + jsdom (same setup as tic-tac-toe — already in CLAUDE.md)

**Unit tests — game logic (`src/gameLogic.test.ts`):**
- [x] `checkWinner` — detects horizontal wins
- [x] `checkWinner` — detects vertical wins
- [x] `checkWinner` — detects both diagonal directions
- [x] `checkWinner` — returns null for partial boards and no-win full boards
- [x] `checkDraw` — returns true when board is full with no winner
- [x] `checkDraw` — returns false when board has empty cells
- [x] `dropPiece` — places piece in the lowest empty row; returns null when column is full
- [x] `getComputerMove` easy — always returns a non-full column
- [x] `getComputerMove` hard — never loses (simulate full games; result is always AI win or draw)

**Component tests — (`src/App.test.tsx`):**
- [x] Mode selector renders on initial load
- [x] Selecting "vs Computer" reveals difficulty and color pickers
- [x] Clicking a column drops the current player's piece into the lowest available row
- [x] A winning move shows the result message with the correct winner
- [x] Filling the board with no winner shows the draw message
- [x] Clicking "Play Again" returns to the mode selector

---
