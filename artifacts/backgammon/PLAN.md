# backgammon
> Based on: backgammon

**Visual reference:** `.claude/temp/backgammon.png` — starting board position showing point layout, checker colors, and home board zones.

## Game Design

**What we're building:** A web-based backgammon game with two modes — single-player vs AI and local two-player. Standard backgammon rules apply. No doubling cube, no Crawford rule, no gammon/backgammon scoring. The first player to bear off all 15 checkers wins.

**Rules:**
- The board has 24 points (narrow triangles) numbered 1–24 from each player's perspective. White moves from point 24 to point 1 (bearing off at point 0); Black moves from point 1 to point 24 (bearing off at point 25).
- Each player starts with 15 checkers in the standard starting position: 2 on the opponent's 1-point, 5 on the opponent's 12-point, 3 on the player's 8-point, 5 on the player's 6-point.
- On each turn, the player rolls two dice. Each die value is used to move one checker (or the same checker twice) the indicated number of points in that player's direction.
- A checker may land on any point that is open: either empty, occupied by the player's own checkers, or occupied by exactly one opponent checker (a "blot").
- If a checker lands on a blot, the blot is hit and placed on the bar.
- A point occupied by two or more of the player's checkers is a "made point" — the opponent cannot land there.
- If a player has checkers on the bar, they must re-enter those checkers before moving any others. Re-entry is onto the opponent's home board (points 1–6 for White, points 19–24 for Black) using the dice values.
- If a player cannot use either die value (all landing points are blocked), they forfeit that portion of their turn. If one die is playable, they must play it (the higher value if only one can be used).
- Bearing off: Once all of a player's checkers are on their home board (points 1–6 for White, points 19–24 for Black), they may bear them off. A die roll bears off a checker on the exact point, or the highest occupied point if no checker is on the exact point and the roll is higher than any occupied point.
- Doubles: When both dice show the same number, the player gets four moves of that value instead of two.

**Players:** 2 (White and Black)

**Modes / variants:**
- Single-player vs AI
- Local two-player (same screen, hot-seat)
- Mode select screen shown before the game starts

**Win condition:** The first player to bear off all 15 checkers wins. The game ends immediately when the last checker is borne off.

**Draw / stalemate conditions:** None — backgammon has no draw condition.

**Special rules / one-off mechanics:**
- **Bar re-entry:** Any checker hit is placed on the bar. A player with checkers on the bar cannot move any other checker until all bar checkers are re-entered. If all entry points (opponent's home board) are blocked (made points), the player loses their entire turn.
- **Forced play:** If only one die value can be played, the player must play it. If both are playable but only one can be played due to subsequent blocking, the player must play the higher value.
- **Doubles:** Roll the same number on both dice → four moves of that value. Each of the four moves is independent (can use different checkers).
- **Bearing off:** Only possible once all 15 of the player's own checkers are on their home board. A checker on bar or elsewhere outside the home board prevents bearing off. If no checker is on the exact point rolled, the player may bear off the highest occupied point if the roll exceeds it (e.g., roll 6 but highest is point 4 → bear off from point 4).
- **Bearing off with checkers above the rolled number:** If the roll equals a point with no checker but there are checkers on higher points, the player must move a checker from a higher point if possible, rather than bearing off from a lower point.
- **No doubling cube, no Crawford rule:** Scoring is match-based only by wins/losses; no cube mechanics.

**UI flow:**
1. App loads → Mode Select screen ("vs AI" or "2 Players")
2. In vs AI mode, AI plays as Black, human plays as White
3. Game screen: board is displayed, current player's dice are rolled automatically at the start of their turn
4. Current player selects a checker to move (valid checkers are highlighted); valid destination points are highlighted
5. Player clicks a destination point → checker moves, die value consumed
6. If all dice are used (or no moves remain), turn passes to next player; dice re-roll for next player
7. AI turn plays automatically after a short delay (shows AI dice, animates moves)
8. When a player bears off their last checker, a win banner appears with "Play Again" button
9. "Play Again" returns to mode select screen

**Edge cases:**
- Player has checkers on the bar and all entry points are blocked → entire turn is skipped, turn passes
- Player rolls doubles and has partial moves available (e.g., only 2 of 4 moves are possible) → must use as many as possible
- During bearing off, rolling a number higher than the highest occupied point → bear off from highest point
- During bearing off, rolling a number for which there is no checker but higher points are occupied → must move from a higher point rather than bearing off a lower point
- One die is usable but not the other → must use the playable one; if both are individually playable but not simultaneously, must use the higher value
- Checker lands on a blot → blot goes to bar (even during bearing-off phase, if opponent checker is on home board point)
- Player cannot use any die value → turn is forfeited entirely; inform the player visually
- Re-entering from bar: player rolls a value where the corresponding entry point is not blocked → must enter from bar before making any other move
- All 15 checkers on home board but player rolls a value with no checker on that point and no higher-point checkers → bear off from next highest occupied point

---

## Data Model

**Board / grid:**
- 24 points indexed 0–23 in a fixed internal representation. Point 0 = Black's 1-point (Black's home board); Point 23 = White's 1-point (White's home board). Internally, White moves from index 23 down to 0 (bearing off into `whiteOff`); Black moves from index 0 up to 23 (bearing off into `blackOff`).
- Two special zones: `bar` holds checkers that have been hit; `off` holds borne-off checkers per player.
- **Index orientation note:** Black's home board = indices 0–5; White's home board = indices 18–23. Accordingly, White's bar-entry zone (where White re-enters from the bar) = indices 0–5 (Black's home board); Black's bar-entry zone = indices 18–23 (White's home board).

**Piece / token types:**
```
type Color = 'white' | 'black'

type Point = {
  count: number   // number of checkers on this point
  color: Color | null  // whose checkers (null if empty)
}

type GameState = {
  points: Point[]         // length 24, index 0–23
  bar: { white: number; black: number }
  off: { white: number; black: number }
  currentPlayer: Color
  dice: number[]          // remaining die values to use this turn (1–4 values)
  diceRolled: boolean     // whether dice have been rolled for this turn
  phase: 'mode-select' | 'playing' | 'game-over'
  winner: Color | null
  mode: 'vs-ai' | 'two-player' | null
  selectedPoint: number | null   // index of currently selected checker (-1 = bar)
  validMoves: ValidMove[]        // computed when a checker is selected
  forcedSkip: boolean            // true when player has no legal moves at all
}

type ValidMove = {
  from: number | 'bar'   // source point index or 'bar'
  to: number | 'off'     // destination point index or 'off' (borne off)
  dieUsed: number        // which die value this move consumes
}
```

**State flags:**
- `diceRolled` — prevents re-rolling mid-turn
- `selectedPoint` — tracks which checker is selected; `null` means nothing selected
- `validMoves` — precomputed legal moves for the selected checker
- `forcedSkip` — set when the player has no legal moves at all for the current dice

**Turn structure:**
1. Dice are rolled at the start of the turn (automatically)
2. If no moves are possible, set `forcedSkip = true`, display message, advance turn after brief delay
3. Otherwise, player selects a checker, valid destinations are shown
4. Player clicks destination → move executed, die consumed from `dice`
5. Repeat until `dice` is empty or no more moves are possible with remaining dice
6. Turn ends → switch `currentPlayer`, roll new dice

**Move validation approach:**
- `getValidMovesForChecker(state, from)` — given a checker location, returns all `ValidMove[]` that are legal with the current remaining dice
- Legality checks: destination not blocked by 2+ opponent checkers; for bar checkers, only entry points; for bearing off, only when all checkers are home
- `getAllValidMoves(state)` — returns all moves for all of current player's checkers; used to detect forced-skip and to enforce "must play higher die" rule
- The "must play higher die if only one is playable" rule: if exactly two dice remain and only one die value produces any legal move for any checker, the higher die must be played. This requires checking both possibilities before allowing a selection.
- `canBearOff(state, player)` — returns true when all of player's checkers are on their home board (no bar, no outside checkers)

**Invalid move handling:** Clicking an invalid destination does nothing. Invalid checker sources (opponent's checkers, empty points, or own checkers with no valid moves) cannot be selected — show no highlight if clicked.

---

## AI / Computer Player

**Strategy approach:** A weighted heuristic evaluation with exhaustive sequence selection. The AI enumerates all legal move sequences for the current turn (using the full dice set) and picks the sequence that produces the highest `scoreBoard` result on the final board state. Heuristic factors (ordered by weight):
1. Minimize checkers on bar (highest priority — being on bar is very bad)
2. Maximize number of made points (2+ checkers) in home board
3. Minimize blots (single exposed checkers) in opponent's reach
4. Maximize pip count advantage (move checkers forward)
5. Prefer hitting opponent blots when strategically advantageous
6. Prefer bearing off checkers when in bearing-off phase

**Difficulty levels:** One difficulty level (no easy/hard distinction) — the AI plays at a reasonable intermediate level. No explicit difficulty selector in the UI.

**Performance constraints:** The AI must complete its move selection in under 300ms. With at most 4 moves per turn and 24 points, exhaustive search of sequences is feasible. If performance is an issue, limit search depth to 2 moves deep and use greedy selection for remaining moves.

---

## Interaction Model

**Input method:** Mouse click only (no drag-and-drop). Click a checker to select it; click a highlighted destination point to move.

**Visual feedback:**
- Selected checker's point is highlighted with a distinct ring/glow
- Valid destination points are highlighted with a colored dot or border
- Dice display shows remaining die values; consumed dice are grayed out or removed
- Bar checkers are shown in the center bar section; clicking a bar checker (if current player has checkers there) selects it
- Borne-off checkers shown as a count/stack outside the board
- When it's AI's turn, board is non-interactive; AI moves animate with a brief delay between each move
- "No moves available" message displayed when turn is skipped
- Winning player shown in a modal with "Play Again" button

**Captured / out-of-play pieces:** Checkers on the bar are shown in the bar area in the center of the board, stacked by color. Borne-off checkers shown as a running count in a side panel next to the board.

---

## Setup
- [x] Create `backgammon/` folder and bootstrap project with boilerplate (Vite + React + TypeScript).
- [x] Configure `vite.config.ts` with vitest.
- [x] Set up `index.html`, `src/main.tsx`, `src/App.tsx`, `src/global.css`.

---

## Game Logic

All game logic lives in `src/gameLogic.ts`. Pure functions only — no React, no side effects.

- [ ] `initBoard()` — returns the standard starting `Point[]` array (24 points with correct checker placement)
- [ ] `initGame(mode)` — returns a fresh `GameState` for the given mode; does not roll dice yet
- [ ] `rollDice()` — returns an array of 1–4 die values: `[d1, d2]` or `[d, d, d, d]` for doubles
- [ ] `canBearOff(state, player)` — returns true when all of player's checkers are on their home board (and none on bar)
- [ ] `getAllValidMoves(state)` — returns all legal `ValidMove[]` for the current player given current `state.dice`; used to detect forced-skip and enforce higher-die rule
- [ ] `getValidMovesForChecker(state, from)` — returns legal `ValidMove[]` from a specific point (`from` is 0–23 or `'bar'`); calls `getAllValidMoves(state)` internally to determine whether the higher-die constraint applies (i.e., if only the higher die produces any legal move across all checkers, only moves using the higher die value are returned)
- [ ] `applyMove(state, move)` — returns new `GameState` after applying the move (immutable); handles hit/bar logic, bearing off, updating `dice`. `applyMove` does NOT switch `currentPlayer` or reset `diceRolled` — it only applies the single move and removes the consumed die. Turn transition (switching `currentPlayer`, clearing `selectedPoint`, `validMoves`, `forcedSkip`, and re-rolling dice) is handled by `App` when it detects that `state.dice` is empty or no further moves are possible. No separate `endTurn()` function is needed; `App` handles this inline after each `applyMove` call.
- [ ] `checkWinner(state)` — returns `Color | null`; winner when `off.white === 15` or `off.black === 15`
- [ ] `getAIMove(state)` — returns the best full sequence `ValidMove[]` for the AI (black) by exhaustively evaluating all legal move sequences with the current dice and picking the sequence that produces the highest `scoreBoard` result; `App` executes the sequence move-by-move with animation delays
- [ ] `scoreBoard(state, player)` — heuristic scoring function for AI: evaluates bar count, made points, blots, pip count
- [ ] `getHomeRange(player)` — returns `[minIndex, maxIndex]` of the player's home board points (White: 18–23, Black: 0–5)
- [ ] `getPipCount(state, player)` — returns total pip distance all of a player's checkers must travel to bear off

---

## Components

- [ ] `App` — top-level: holds `GameState`, renders mode-select or game screen, handles turn transitions and AI scheduling
- [ ] `ModeSelect` — initial screen with two buttons: "vs AI" and "2 Players"; sets game mode and transitions to playing
- [ ] `Board` — renders the 24 points, bar area, and off areas; receives click handlers; purely presentational given state
- [ ] `BoardPoint` — renders a single point: stack of checker tokens, highlighting if selected or valid destination
- [ ] `Checker` — renders a single checker token (circle) with the appropriate color
- [ ] `Bar` — renders the center bar with white and black bar checkers; clickable if current player has bar checkers
- [ ] `OffArea` — renders borne-off checker count for one player (one instance per player)
- [ ] `DiceDisplay` — renders current dice values; consumed dice are visually distinct
- [ ] `StatusBar` — shows whose turn it is, any "no moves" message, or winner announcement inline
- [ ] `WinModal` — overlaid modal when game is over; shows winner and "Play Again" button
- [ ] `HelpModal` — overlaid modal for rules/strategy; opened by "?" button in header

---

## Styling

**Theme:** Use the shared freeCodeCamp dark theme variables (defined in each game's `global.css` — see `checkers/src/global.css` for the canonical list). Do not invent new color values; map everything to existing CSS variables.

Color assignments for backgammon-specific elements:
- **Board background / surface:** `var(--color-surface)` (`--gray-85`)
- **Point triangles (alternating):** `var(--gray-75)` and `var(--color-surface-raised)` (`--gray-80`)
- **Home board tint:** `var(--blue-light-translucent)` as a subtle overlay on the home board zones
- **White checker:** `var(--gray-00)` fill with `var(--gray-75)` border
- **Black checker:** `var(--gray-90)` fill with `var(--gray-45)` border
- **Selected checker / point highlight:** `var(--color-accent)` (`--yellow-gold`) ring/glow
- **Valid destination highlight:** `var(--blue-light-translucent)` dot or border
- **Dice:** `var(--color-surface-raised)` background, `var(--color-text-primary)` pips; consumed dice use `var(--color-text-muted)`
- **Bar area:** `var(--color-bg)` (`--gray-90`) background to visually separate it
- **Modals:** `var(--color-surface)` card on `var(--gray-90-translucent)` overlay
- **Buttons / accents:** `var(--color-accent)` with `var(--color-accent-hover)` on hover

- [ ] `global.css` — import shared font (Lato + Inconsolata), full CSS variable set (copy from `checkers/src/global.css`), reset, body background
- [ ] `App.css` — overall layout: board centered, header bar with help button and status
- [ ] `ModeSelect.css` — centered card with two large buttons
- [ ] `Board.css` — board dimensions, point layout (flex column, alternating top/bottom rows of 12 points each), bar column
- [ ] `BoardPoint.css` — triangle shape via CSS clip-path or border trick; checker stack alignment; selection/valid-move highlight classes
- [ ] `Checker.css` — circular token using theme checker colors above, with border for contrast
- [ ] `Bar.css` — center bar styling using `var(--color-bg)`, stacked checker display
- [ ] `OffArea.css` — side panel for borne-off count
- [ ] `DiceDisplay.css` — dice cube appearance using theme colors, consumed-die style
- [ ] `WinModal.css` — full-screen overlay, centered modal card
- [ ] `HelpModal.css` — scrollable modal with rules content

---

## Polish

- [ ] AI move plays with a 600ms delay between individual checker moves so the user can follow what happened
- [ ] Animate checker movement with a CSS transition (translate from source to destination)
- [ ] "No legal moves" message shown for 1.5 seconds before auto-advancing the turn
- [ ] Dice roll shows a brief "rolling" animation (shake or number cycling) before settling
- [ ] The board visually distinguishes the home boards (slight background tint) from the outer boards
- [ ] Bar checkers are shown stacked with a count badge when more than 2 are on the bar
- [ ] Points are numbered (1–24) as small labels so players can orient themselves

---

## Help & Strategy Guide

**Rules summary:** Each player moves 15 checkers around the board in opposite directions. White moves from high-numbered points to low; Black moves from low to high. Roll two dice each turn and move checkers that many points forward. Land on a single opponent checker to hit it to the bar. Make points (2+ checkers) to block the opponent. First to bear off all checkers wins.

**Objective:** Bear off all 15 of your checkers before your opponent does.

**Key strategies:**
- **Make points in your home board:** Blocking consecutive points in your home board (the "prime") traps opponent checkers on the bar and forces them to wait.
- **Hit blots when safe:** Hitting a single opponent checker sends it to the bar, costing them a turn. Prioritize hitting blots near your home board.
- **Build a prime:** Consecutive made points create a wall the opponent cannot pass. A 6-prime (six consecutive made points) is unbreakable and wins games.
- **Timing on the back checkers:** Your two back checkers (on the opponent's 1-point) are the hardest to move. Don't leave them too far behind — start moving them early via the opponent's side.
- **Bar urgency:** Never voluntarily leave checkers stranded behind opponent primes when you have checkers on the bar. Re-entry takes priority.
- **Pip count awareness:** Track roughly how many total pips each player needs. If you're ahead in the race, avoid contact and race home. If behind, create primes and try to hit.

**Common mistakes:**
- Forgetting that all checkers must be on the home board before bearing off begins — even one checker outside stops bearing off.
- Leaving too many blots (single checkers) in the opponent's home board when they still have back checkers — you will get hit.
- Bearing off too aggressively when the opponent is still in contact — playing racing strategy when you should be playing a blocking game.
- Not using doubles to maximum effect — doubles give four moves; think carefully before using them on non-impactful checkers.
- Ignoring checkers on the bar while trying to make new points — bar checkers must re-enter first.

**Tips for beginners:**
- Start by getting your back checkers (on the 1-point) moving as early as possible.
- Try to make your 5-point (the golden point) — it's the most valuable point on the board.
- When you hit an opponent's blot, place your checker there if it's a useful point; don't just hit to hit.
- If you're stuck re-entering from the bar multiple turns in a row, the opponent has a strong prime — wait for a gap.
- Doubles are powerful — use them to make two points at once or move your back checkers through danger zones.

### Help Guide Checklist
- [ ] `HelpModal` — "?" button accessible from main game screen
- [ ] Content is specific to backgammon — covers rules, strategy, and beginner tips with no generic filler

---

## Testing

**Unit tests — game logic (`src/gameLogic.test.ts`):**
- [ ] `initBoard()` — verify correct starting checker counts on all 24 points (2, 5, 3, 5 pattern for each player)
- [ ] `rollDice()` — doubles returns 4 values; non-doubles returns 2 values; all values in range 1–6
- [ ] `canBearOff()` — false when any checker is outside home board; false when checker is on bar; true when all 15 are on home board points
- [ ] `getAllValidMoves()` — returns empty array when no moves are possible (all points blocked)
- [ ] `getAllValidMoves()` — returns correct moves when player has bar checkers (only entry-point moves available)
- [ ] `getValidMovesForChecker()` — checker cannot move to a made point (2+ opponent checkers)
- [ ] `getValidMovesForChecker()` — checker can move to a blot (and hit it)
- [ ] `getValidMovesForChecker()` — bar checker can only enter on internal indices 0–5 (White's entry zone, Black's home board) or 18–23 (Black's entry zone, White's home board)
- [ ] `getValidMovesForChecker()` — bearing off: when roll matches a point with no checker but higher-point checkers exist, only moves from higher points are returned (bearing off a lower point is not allowed)
- [ ] `getAllValidMoves()` — player has checkers on bar and all entry points are made points → returns empty array (forces skip)
- [ ] `applyMove()` — hit blot goes to bar, landing checker occupies the point
- [ ] `applyMove()` — bearing off removes checker from point and increments `off` count
- [ ] `applyMove()` — doubles: `dice` array still has 3 remaining after one move
- [ ] `applyMove()` — consuming a die removes it from `state.dice`
- [ ] `checkWinner()` — returns null mid-game; returns correct color when `off` count reaches 15
- [ ] `getPipCount()` — correct total for starting position (both players start at 167)
- [ ] Higher-die rule: when only one of two dice can be played, `getValidMovesForChecker()` only returns moves using the higher die value
- [ ] `scoreBoard()` — score is worse (lower) when player has more bar checkers

**Component tests — (`src/App.test.tsx`):**
- [ ] Mode select renders two buttons; clicking "vs AI" transitions to game screen
- [ ] Mode select renders two buttons; clicking "2 Players" transitions to game screen
- [ ] Dice display shows correct number of dice values
- [ ] Clicking a checker with no valid moves does not select it
- [ ] Clicking a valid checker highlights it as selected
- [ ] Clicking a valid destination after selecting a checker moves the checker
- [ ] "Play Again" button in win modal resets to mode select screen
- [ ] When `forcedSkip` is true, "No legal moves" message is displayed
- [ ] During AI turn, clicking a checker does not select it (board is non-interactive)
