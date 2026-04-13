# Game Standards

These features are required in every game. The planner must include all of them in the plan and checklist.

## UI & Layout

- Light/dark theme toggle — persisted to local storage
- Donate button — visible on home screen
- Home screen and play screen (no routing, conditional render)
- "Are you sure?" confirmation modal for destructive actions (new game, quit).
- Help modal — "?" button accessible from play screen, content specific to the game
- Do not pause the game when opening the help modal or "Are you sure?" modal.

## Local Storage

- Theme preference
- Best score / best time (where applicable)
- Last selected mode
- Game state (resume on reload)

## Screens

- Home — mode selection, start button, donate button, theme toggle
- Play — game board, score, controls, help button
- Game over — result, best score, play again

## Accessibility

- Keyboard navigation
- ARIA labels on interactive elements

---

## Game Decisions

- **Based on:** Tetris, differentiated with pentominoes (5-cell pieces) on a 12×20 board
- **Rotation:** Both clockwise and counterclockwise
- **Ghost piece:** Disabled
- **Next piece preview:** Enabled (show next 1 piece)
- **Hold piece:** Disabled
- **High score:** Saved to local storage
- **Scoring:** Lines cleared × level multiplier, with combo bonus for back-to-back clears
- **Speed:** Increases every 10 lines cleared (level up)
- **Piece set:** Pentominoes (12 distinct pieces using 5 cells each) — distinguishes from standard Tetris tetrominoes
- **Board:** 12 columns × 20 rows
- **Controls:** Arrow keys (move/soft drop), Space (hard drop), Z/X or Up/Ctrl to rotate left/right
- **Soft drop:** Holding the down arrow accelerates the falling piece (like Tetris)
- **Pre-game options (home screen):**
  - Starting speed: Slow (default) / Medium / Fast — higher speeds are harder
  - Starting board: Empty (default) / Light fill (~25% rows) / Medium fill (~50% rows) / Heavy fill (~75% rows) — each level harder than the last
- **Hard drop:** Space bar instantly drops the piece to the lowest valid position
- **High score:** Single value saved to local storage (no per-mode tracking — all modes share one leaderboard)
- **Help modal:** Displays full control reference (keys for move, rotate CW/CCW, soft drop, hard drop) alongside game rules
