## Checkers

### Game Design

**What we're building:** A browser-based American Checkers game with two play modes and an optional AI opponent.

**Players:** Red (goes first) and Black

**Modes:**
- **vs Player** — two humans take turns on the same browser/device
- **vs Computer** — one human plays against an AI

**Computer difficulty:**
- **Easy** — AI picks a random valid move
- **Hard** — AI uses minimax with alpha-beta pruning (depth 6)

**Player side (vs Computer only):**
- Player picks Red (goes first) or Black (goes second)
- Computer automatically takes the other side
- If player picks Black, computer makes the first move immediately

**Rules (American Checkers):**
- 8×8 board; pieces only occupy dark squares
- Red starts on rows 5–7 (bottom), Black starts on rows 0–2 (top)
- Regular pieces move diagonally forward one square
- **Mandatory capture:** if a capture is available, you must take it (any valid capture, player's choice if multiple)
- Captures: jump over an adjacent opponent piece to the empty square beyond; the captured piece is removed
- **Multi-jump:** after a capture, if the same piece can capture again, it must continue (turn does not end)
- **King promotion:** a piece reaching the opponent's back row becomes a king; a king may move diagonally in any direction
- A piece promoted to king during a multi-jump stops there (no further jumps that turn)

**Win / draw conditions:**
- Win: opponent has no pieces remaining, or opponent has no legal moves on their turn
- Draw: not implemented (checkers draws are rare and require complex detection — out of scope)

**UI flow:**
1. App opens on the **Mode Selector** screen
2. Player picks "vs Player" or "vs Computer"
3. If "vs Computer": player picks Easy or Hard, then Red or Black
4. 8×8 board is shown — game begins
5. Click a piece to select it; valid destination squares are highlighted
6. Click a highlighted destination to move; if a capture was made and another capture is available with the same piece, the piece stays selected and must jump again
7. On win: result message shown with a "Play Again" button
8. "Play Again" returns to the Mode Selector screen

**Edge cases:**
- Clicking an opponent's piece or an empty square does nothing (unless it's a valid destination)
- Board is locked while the AI is "thinking"
- No moves accepted after game is over
- If multiple captures are available, the player may choose which piece captures (but must capture with one of them)
- A king is visually distinguished from a regular piece

### Setup
- [x] Bootstrap `checkers/` (see CLAUDE.md → Bootstrapping a New Game)

### Game Logic
(`src/gameLogic.ts`)
- [x] Types: `Player = 'Red' | 'Black'`, `PieceType = 'man' | 'king'`, `Piece = { player: Player, type: PieceType }`, `Board = (Piece | null)[]` (64 cells, row-major; only dark squares used)
- [x] `Move = { from: number, to: number, captures: number[] }` — captures holds indices of removed pieces (one per jump in a multi-jump)
- [x] `getValidMoves(board, player)` — returns all legal `Move[]` for the player; if any capture exists, only captures are returned (mandatory capture rule)
- [x] `getValidMovesForPiece(board, index)` — returns legal `Move[]` for a single piece (used for selection highlighting)
- [x] `applyMove(board, move)` — returns new board after applying the move; promotes to king if back row reached
- [x] `checkWinner(board, currentPlayer)` — returns winning player if current player has no legal moves or no pieces, else null
- [x] `getComputerMove(board, difficulty, aiPlayer)` — returns a `Move`
  - Easy: random valid move
  - Hard: minimax with alpha-beta pruning, depth 6
- [x] Board initialisation: `createInitialBoard()` — 12 Black pieces on rows 0–2 (dark squares), 12 Red pieces on rows 5–7

### Components
- [x] `App` — top-level layout, holds all game state
- [x] `ModeSelector` — pick mode, difficulty (if vs Computer), color (if vs Computer)
- [x] `Board` — renders the 8×8 grid
- [x] `Square` — single square; dark squares are playable, light squares are inert
- [x] `Piece` — renders inside a `Square`; visually distinct for man vs king, Red vs Black
- [x] `GameStatus` — current turn indicator during play; result + "Play Again" when game is over

**Note on multi-jump UX:** `getValidMovesForPiece` returns full jump sequences (including multi-jumps as a single move). Clicking a highlighted destination executes the entire chain at once. If a piece has two different multi-jump paths, both final destinations are highlighted and the player picks one. This differs from the hop-by-hop description above but is simpler and equally valid.

### Styling
- [x] `global.css` (copied from tic-tac-toe)
- [x] `App.css`
- [x] `ModeSelector.css`
- [x] `Board.css`
- [x] `Square.css`
- [x] `Piece.css`
- [x] `GameStatus.css`

### Polish
- [x] Highlight valid destination squares when a piece is selected
- [x] Visually distinguish kings (crown icon or double-ring)
- [x] Lock board during AI thinking
- [x] Prevent moves after game is over
- [x] Responsive layout (works on mobile)

### Testing

**Framework:** Vitest + React Testing Library + jsdom

**Unit tests — game logic (`src/gameLogic.test.ts`):**
- [x] `createInitialBoard` — correct piece counts and positions for both players
- [x] `getValidMoves` — regular piece can only move forward diagonally
- [x] `getValidMoves` — king can move in all four diagonal directions
- [x] `getValidMoves` — mandatory capture: only captures returned when any exist
- [x] `getValidMoves` — multi-jump: after a capture, continuation captures are returned if available
- [x] `applyMove` — piece moves to destination, captured piece is removed
- [x] `applyMove` — piece is promoted to king when reaching the back row
- [x] `applyMove` — no promotion mid-multi-jump
- [x] `checkWinner` — returns current opponent when current player has no legal moves
- [x] `checkWinner` — returns null during normal play

**Component tests — (`src/App.test.tsx`):**
- [x] Mode selector renders on initial load
- [x] Selecting "vs Computer" reveals difficulty and color pickers
- [x] Clicking a piece selects it and highlights valid moves
- [x] Clicking a valid destination moves the piece
- [x] A winning condition shows the result message
- [x] Clicking "Play Again" returns to the mode selector

---
