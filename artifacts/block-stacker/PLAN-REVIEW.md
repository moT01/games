STATUS: REVISE

## Feedback

1. **Piece type count mismatch (Data Model — `PieceType`):** The `PieceType` union lists 14 values (F, I, L, J, N, S, P, T, U, V, W, X, Y, Z) but the plan states there are 12 pentominoes throughout. J and S are mirror images of L and N respectively and are not distinct free pentominoes. Either clarify that this game uses one-sided pentominoes (including mirrors) and update all references to the piece count, or drop J and S and keep the 12 free pentominoes. The `PIECES` constant, color count, bag size (currently described as "all 12"), and `newBag` test case all depend on this being resolved consistently.

2. **Lock delay has no state representation (Data Model — `GameState`):** Lock delay is a specified mechanic (300ms window after landing, allows slide/rotate, bypassed by hard drop). The `GameState` interface has no field for it — e.g. `lockDelayActive: boolean` and `lockDelayStartTime: number | null`. Without these fields, a developer has no clear place to track this and will have to invent the representation.

3. **`calcScore` base point value undefined (Game Logic — `calcScore`):** The function signature is `calcScore(lineCount, level, combo, dropBonus): number` and the Help section says "base points × level" for 1 line, but no base point value is ever defined anywhere in the plan. The developer must invent the constant. Specify the base score for a single-line clear (e.g. 100 points) so the scoring formula is fully deterministic.

4. **`SavedGameState` restoration path not specified (Data Model / Polish):** `SavedGameState` omits `status`. The plan says game state is restored on reload if `savedGame` is present, but does not specify what `status` should be set to on restore (`'playing'`), nor where this logic lives (App.tsx initializer?). Add a note clarifying the restore path and the `status` value to use.
