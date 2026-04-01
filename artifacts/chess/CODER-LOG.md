## Section: Polish

### Files created / modified
- `chess/src/components/Board.tsx` — pass `rankLabel` / `fileLabel` props to each `Square` based on visual position in the grid
- `chess/src/components/Square.tsx` — added `rankLabel?` and `fileLabel?` props; render as positioned `<span>` elements
- `chess/src/components/Square.css` — added `.rank-label`, `.file-label` absolute-positioned styles with contrasting color per square color

### Decisions made

**Board coordinate labels (new work):**
- `displayIdx` (0–63 in visual order) drives label placement: rank on left column (`displayIdx % 8 === 0`), file on bottom row (`Math.floor(displayIdx / 8) === 7`).
- Rank/file values are derived from `boardIdx` (actual board index), not visual position — so labels correctly show the actual chess coordinates regardless of whether the board is flipped.
- Label font size: `calc(var(--square-size) * 0.22)` — scales with the board.
- Label color: contrasting with the square's base color (dark label on light square, light label on dark square) using `.light`/`.dark` parent selectors.

**Items already implemented (no new code needed):**
- Smooth piece move: re-render approach is v1 default — no CSS transition needed ✓
- Flip board for Black: `flipped={isVsComputer && playerColor === 'black'}` was already wired in `Game.tsx` during the Components section ✓
- Prevent interaction while thinking: `if (isThinking) return;` already in `handleSquareClick` in `Game.tsx` ✓
- "Play Again" and "Back to Menu": already in the game-over overlay in `Game.tsx` ✓
- Responsive board size: `min(68px, 11vw)` via `--square-size` in `global.css` ✓

### Uncertainties / flags
- None.

### Anything the reviewer should pay extra attention to
- Label derivation: `displayIdx % 8 === 0` correctly identifies the leftmost visual column for rank labels in both normal and flipped orientations.
- `Math.floor(displayIdx / 8) === 7` correctly identifies the bottom visual row in both orientations.
- Rank value `8 - Math.floor(boardIdx / 8)`: for boardIdx=0 (a8) → rank 8; for boardIdx=56 (a1) → rank 1. ✓
- File value `'abcdefgh'[boardIdx % 8]`: column 0 → 'a', column 7 → 'h'. ✓
- When flipped (black's view), displayIdx=0 corresponds to boardIdx=63 (h1): leftmost visual column shows 'h1' rank label (rank 1) and if it's also the bottom row, file 'h'. Correct per black's perspective.

### Items ready for review
- [ ] Smooth piece move (re-render is v1 approach — no animation added, acceptable per plan)
- [ ] Board coordinate labels (a–h along bottom, 1–8 along left side)
- [ ] Flip board for Black when playing vs Computer as Black
- [ ] Prevent interaction with board while computer is thinking
- [ ] "Play Again" and "Back to Menu" buttons on game-over overlay
- [ ] Responsive board size (scales down on mobile)
