# chess
> Based on: chess

## Game Design

**What we're building:** A fully playable chess game with a standard 8x8 board, all legal chess rules (including special moves), and three modes: local two-player, vs computer (single AI difficulty), and single-player (player is White vs AI).

**Rules:**
- Two players alternate turns, White moves first
- Each piece type has specific movement rules (see Data Model)
- A player cannot make a move that leaves their own king in check
- A player in check must resolve the check on their next move
- Checkmate ends the game; the player whose king is in checkmate loses
- Stalemate is a draw (player to move has no legal moves but is not in check)
- En passant: a pawn that advances two squares from its starting rank can be captured by an opposing pawn on the 5th rank as if it had only moved one square — this capture is only legal on the immediately following move
- Castling: king moves two squares toward a rook; the rook jumps to the other side of the king. Conditions: neither piece has previously moved, no pieces between them, king is not in check, king does not pass through or land on an attacked square
- Pawn promotion: when a pawn reaches the opposite back rank, it must be promoted to a queen, rook, bishop, or knight (player choice)

**Players:** 2 (White and Black)

**Modes / variants:**
- Local multiplayer (two players on same device, alternating turns)
- vs Computer (player chooses color or defaults to White; computer is the other side)
- Mode select screen shown on load

**Win condition:** Checkmate — the opposing king is in check and the player has no legal move to escape

**Draw / stalemate conditions:**
- Stalemate: player to move has no legal moves and is not in check
- Threefold repetition: the same board position (including castling rights and en passant square) has occurred three times
- Fifty-move rule: fifty consecutive moves by both sides with no pawn advance and no capture
- Insufficient material: neither side has enough material to deliver checkmate (e.g., K vs K, K+B vs K, K+N vs K)

**Special rules / one-off mechanics:**
- En passant capture (pawn captures diagonally onto the square the opposing pawn skipped)
- Castling (both kingside and queenside)
- Pawn promotion (modal/inline UI to choose piece)
- Pins: a piece is pinned if moving it would expose the king to check — the move must be rejected
- Discovered check: moving one piece reveals a check from another — must be considered in check detection
- Double check: two pieces give check simultaneously — only the king can move to escape

**UI flow:**
1. Mode select screen (Local Multiplayer / vs Computer)
2. If vs Computer, show color picker (White / Black / Random)
3. Game board is shown; White moves first
4. Click a piece to select it — valid destination squares are highlighted
5. Click a highlighted square to execute the move
6. If pawn reaches back rank, promotion modal appears; player picks piece
7. After each move, check detection runs; UI shows "Check!" indicator if applicable
8. Game ends with winner/draw overlay; offer "Play Again" and "Back to Menu" buttons

**Edge cases:**
- Moving a pinned piece (must be rejected — the piece cannot move in a way that exposes the king)
- Castling through check (must be rejected)
- En passant expiring (only available for one move)
- Promotion piece selection (game must wait for player input before continuing)
- Stalemate vs checkmate distinction (no legal moves — is king in check?)
- King cannot move into check (attacked-square detection required)
- Capturing en passant when the resulting board position leaves own king in check (rare, must be checked)
- Fifty-move counter reset on pawn move or capture
- Threefold repetition must track full FEN-like position including castling rights and en passant availability

---

## Data Model

**Board / grid:** 8x8 flat array of 64 squares, indexed 0–63 (row-major, rank 8 at index 0). Each cell is `Piece | null`.

**Piece / token types:**
```ts
type Color = 'white' | 'black';
type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
type Piece = { type: PieceType; color: Color };
```

**Game state shape:**
```ts
type GameState = {
  board: (Piece | null)[];         // 64-cell flat array
  turn: Color;                     // whose turn it is
  castlingRights: CastlingRights;  // which castles are still available
  enPassantTarget: number | null;  // index of square where en passant capture can land
  halfMoveClock: number;           // for fifty-move rule
  fullMoveNumber: number;          // increments after Black's move
  positionHistory: string[];       // serialized positions for threefold repetition
  status: 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw';
  winner: Color | null;
  pendingPromotion: { from: number; to: number } | null;
  lastMove: { from: number; to: number } | null; // for last-move highlight
  selectedSquare: number | null;   // UI state
  legalMovesForSelected: number[]; // UI state — destination squares for selected piece
};

type CastlingRights = {
  whiteKingside: boolean;
  whiteQueenside: boolean;
  blackKingside: boolean;
  blackQueenside: boolean;
};
```

**State flags:**
- `castlingRights` — updated whenever a king or rook moves or is captured
- `enPassantTarget` — set when a pawn moves two squares, cleared after any other move
- `pendingPromotion` — set when a pawn reaches the back rank; game waits until resolved
- `halfMoveClock` — reset to 0 on pawn move or capture; incremented otherwise
- `positionHistory` — appended after every half-move (every individual move by either White or Black) for threefold detection
- `lastMove` — updated by `applyMove` to record the from/to of the most recent move; used by `Square` for last-move highlight

**Turn structure:** White always moves first. After a legal move is applied (and promotion resolved if needed), turn flips. Check/checkmate/stalemate/draw detection runs after each flip. Position is serialized and appended to `positionHistory` after every half-move (every individual move by either side), not just after Black's move — threefold repetition can complete on either player's move.

**Move validation approach:**
- `getAttackedSquares(board, color)` — all squares attacked by `color` (used for check detection, castling legality, king move legality)
- `getPseudoLegalMoves(board, square, gameState)` — candidate moves for piece at square without regard to self-check
- `getLegalMoves(board, square, gameState)` — filter pseudo-legal moves by simulating each move and checking that own king is not in check afterward
- `isInCheck(board, color)` — is `color`'s king attacked?
- `getAllLegalMoves(board, color, gameState)` — all legal moves for `color` (used for checkmate/stalemate detection)
- `applyMove(gameState, from, to)` — returns new GameState with move applied, updating all flags
- `serializePosition(gameState)` — produces a string key for threefold repetition comparison

**Invalid move handling:** A clicked destination square that is not in `legalMovesForSelected` is ignored silently. Clicking a non-highlighted square deselects the current piece (or selects a different own piece if clicked).

---

## AI / Computer Player

**Strategy approach:** Minimax with alpha-beta pruning, depth 3 (adjustable). Evaluation function: material count using standard values (Q=9, R=5, B=3, N=3, P=1) plus simple positional bonuses (piece-square tables for pawns, knights, bishops). Picks the best-scoring move for the computer's color.

**Difficulty levels:** One level (medium strength depth-3 minimax). No difficulty selector in UI for now.

**Performance constraints:** Depth-3 search on the web should complete in under 2 seconds for most positions. Run in a `useEffect`/`setTimeout(0)` so the UI updates before the AI thinks. Consider a "thinking..." indicator.

---

## Setup
- [ ] Create `chess/` folder and bootstrap project with boilerplate (Vite + React + TypeScript).

---

## Game Logic
- [ ] `initBoard()` — returns the standard chess starting position as a 64-cell flat array
- [ ] `initGameState()` — returns initial `GameState` with board, white to move, all castling rights, no en passant
- [ ] `isInCheck(board, color)` — returns true if `color`'s king is under attack
- [ ] `getAttackedSquares(board, color)` — returns set of square indices attacked by `color`
- [ ] `getPseudoLegalMoves(board, square, gameState)` — all candidate moves for piece at square (no self-check filter)
  - Pawn: forward one, forward two from start rank, diagonal captures, en passant capture
  - Knight: L-shape jumps
  - Bishop: diagonal rays until blocked or capture
  - Rook: horizontal/vertical rays until blocked or capture
  - Queen: rook + bishop combined
  - King: one square in any direction plus castling candidates
- [ ] `getLegalMoves(board, square, gameState)` — filters pseudo-legal by simulating move and calling `isInCheck`
- [ ] `getAllLegalMoves(board, color, gameState)` — unions legal moves for all pieces of `color`
- [ ] `applyMove(gameState, from, to)` — applies the move, handles en passant capture, castling rook move, promotion flag, updates castling rights, en passant target, clocks, position history, flips turn
- [ ] `applyPromotion(gameState, pieceType)` — replaces promoted pawn with chosen piece, clears `pendingPromotion`, flips turn, runs post-move checks
- [ ] `detectGameStatus(gameState)` — returns updated status: playing / check / checkmate / stalemate / draw (fifty-move, threefold, insufficient material)
- [ ] `serializePosition(gameState)` — serializes board + turn + castling rights + en passant for repetition detection
- [ ] `hasInsufficientMaterial(board)` — detects K vs K, K+B vs K, K+N vs K, K+B vs K+B (same color bishops)
- [ ] `getBestMove(gameState)` — minimax with alpha-beta, returns `{ from, to }` for the computer's best move. During lookahead, pawn promotions are always assumed to be queen (no modal interaction mid-search). The returned move may include an implicit promotion to queen if the moving pawn reaches the back rank.
- [ ] `evaluateBoard(board, color)` — material + piece-square table score from `color`'s perspective

---

## Components
- [ ] `App` — top-level state, mode routing, renders `ModeSelect` or `Game`
- [ ] `ModeSelect` — shows two buttons: "Local Multiplayer" and "vs Computer"; when "vs Computer" is chosen, `ColorPicker` renders inline as a second step within the same screen (not a separate route or page). Confirming a color in `ColorPicker` starts the game.
- [ ] `ColorPicker` — rendered inside `ModeSelect` as a conditional second step after choosing vs Computer; lets player pick White / Black / Random
- [ ] `Game` — owns `GameState`, handles click logic (select/move), triggers AI moves, renders `Board`, `CapturedPieces`, `StatusBar`, `PromotionModal`
- [ ] `Board` — renders 8x8 grid of `Square` components; passes click handlers and highlight sets
- [ ] `Square` — renders one cell, shows piece SVG if occupied, applies highlight/selected/check CSS classes
- [ ] `Piece` (display) — renders the correct SVG icon for a piece type + color
- [ ] `PromotionModal` — shown when `pendingPromotion` is set; four piece buttons (Q, R, B, N) in the promoting player's color
- [ ] `StatusBar` — shows current turn, check indicator, game over message
- [ ] `CapturedPieces` — shows pieces captured by each side, sorted by value

---

## Interaction Model

**Input method:** Click to select a piece, click to move. No drag-and-drop.

**Visual feedback:**
- Selected square: distinct highlight (e.g., yellow border or background tint)
- Legal move destinations: dot or tinted circle overlay on empty squares; capture highlight on occupied enemy squares
- King in check: red highlight on the king's square
- Last move: subtle highlight on from/to squares of the most recent move
- Computer thinking: "Thinking..." text in the StatusBar while AI computes

**Captured / out-of-play pieces:** Displayed in `CapturedPieces` component below the board, one row per side, sorted by piece value descending.

---

## Styling
- [ ] `global.css` — CSS variables for board colors (light/dark squares), highlight colors, font; box-sizing reset
- [ ] `App.css` — top-level layout (centered page, full-height flex column)
- [ ] `ModeSelect.css` — centered card with large buttons
- [ ] `ColorPicker.css` — color option buttons (White / Black / Random) styled consistently with ModeSelect
- [ ] `Game.css` — game layout: board centered with status bar above and captured pieces below
- [ ] `Board.css` — 8x8 grid layout, square sizing (responsive, e.g., `min(62px, 10vw)`)
- [ ] `Square.css` — light/dark square colors, highlight classes (selected, legal-move, capture-target, in-check, last-move)
  - Note: `Piece` (display component) has no own CSS file — SVG sizing is inherited from the parent `Square` dimensions via `Square.css`; no separate `Piece.css` is needed
- [ ] `PromotionModal.css` — modal overlay centered over board, four piece buttons in a row
- [ ] `StatusBar.css` — turn indicator, check warning styling
- [ ] `CapturedPieces.css` — flex row of small piece icons

---

## Polish
- [ ] Smooth piece move (CSS transition on position, or simply re-render is fine for v1)
- [ ] Board coordinate labels (a–h along bottom, 1–8 along left side)
- [ ] Flip board for Black when playing vs Computer as Black
- [ ] Prevent interaction with board while computer is thinking
- [ ] "Play Again" and "Back to Menu" buttons on game-over overlay
- [ ] Responsive board size (scales down on mobile)

---

## Testing

**Unit tests — game logic (`src/gameLogic.test.ts`):**
- [ ] `initBoard()` — correct piece placement in starting position (spot-check key squares)
- [ ] `getPseudoLegalMoves` — pawn: forward one, forward two from start, diagonal capture, en passant
- [ ] `getPseudoLegalMoves` — knight: correct L-shape from center and corner squares
- [ ] `getPseudoLegalMoves` — rook: rays blocked by own piece, stopped by capture of enemy piece
- [ ] `getPseudoLegalMoves` — bishop: diagonal rays, blocked correctly
- [ ] `getPseudoLegalMoves` — queen: combined rook + bishop
- [ ] `getPseudoLegalMoves` — king: one-square moves, no castling if rook/king moved
- [ ] `getLegalMoves` — pinned piece cannot move (leaving own king in check)
- [ ] `getLegalMoves` — castling kingside and queenside legal from starting rights
- [ ] `getLegalMoves` — castling blocked when king passes through attacked square
- [ ] `getLegalMoves` — castling blocked when king is in check
- [ ] `getLegalMoves` — en passant capture available on the correct move, gone the next move
- [ ] `isInCheck` — detects check from all piece types
- [ ] `detectGameStatus` — returns `'checkmate'` in Scholar's mate position
- [ ] `detectGameStatus` — returns `'stalemate'` in a stalemate position
- [ ] `detectGameStatus` — returns `'draw'` on threefold repetition
- [ ] `detectGameStatus` — returns `'draw'` on fifty-move rule
- [ ] `detectGameStatus` — returns `'draw'` on insufficient material (K vs K)
- [ ] `applyMove` — en passant removes the captured pawn from the correct square
- [ ] `applyMove` — castling moves both king and rook
- [ ] `applyMove` — pawn reaching back rank sets `pendingPromotion`, does not flip turn yet
- [ ] `applyPromotion` — replaces pawn with chosen piece type, clears `pendingPromotion`, flips turn
- [ ] `hasInsufficientMaterial` — correctly identifies K vs K, K+N vs K, K+B vs K

**Component tests — (`src/App.test.tsx`):**
- [ ] Mode select screen renders on load with "Local Multiplayer" and "vs Computer" buttons
- [ ] Clicking "Local Multiplayer" transitions to game board
- [ ] Clicking a piece highlights its legal move squares
- [ ] Clicking a non-legal square deselects without moving
- [ ] Promotion modal appears when a pawn reaches the back rank
- [ ] Game-over overlay shows correct winner message on checkmate
- [ ] "Play Again" resets to a fresh game board
- [ ] "Back to Menu" returns to mode select screen
