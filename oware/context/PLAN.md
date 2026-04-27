# oware
> Based on: oware (Abapa rules)

## Game Design

**Rules:** Abapa (standard Oware). 2 rows of 6 pits, 4 seeds each (48 total). Sow counter-clockwise, skipping the starting pit on wraparound (seeds >= 12). Capture if the last seed lands in an opponent's pit with exactly 2 or 3 seeds; continue capturing backward through consecutive opponent pits with 2 or 3 seeds. Grand slam forbidden: if a capture would empty all opponent pits, skip the entire capture. Feeding rule: if opponent has no seeds, current player must choose a pit that sows into the opponent's side; if no such move exists, game ends and current player collects all remaining seeds.

**Players:** 2 (south vs north). South = human (bottom row, pits 0-5). North = computer or player 2 (top row, pits 6-11).

**Modes:** Player vs Computer (PvC), Player vs Player local (PvP).

**Win / draw conditions:**
- Win: first player to capture 25+ seeds wins (majority of 48).
- Draw: cycle detected — same board state (pits + currentPlayer) appears 3 times in boardHistory; declare draw and no further play.
- Game end (no-move): active player cannot feed an opponent with empty side; each player takes the seeds remaining on their own side (south takes pits 0-5, north takes pits 6-11); whoever has more total seeds wins (or draw if tied at 24).

**Special rules / one-off mechanics:**
- Grand slam: after sowing, compute the full chain capture; if it would take every seed on the opponent's entire row, cancel all captures — seeds remain where they are.
- Feeding obligation: if opponent's row is entirely empty, only moves that sow at least one seed into the opponent's row are valid. If none exist, trigger end-of-game sweep.
- Skip start pit on wraparound: every time the distribution cursor would land on the starting pit, skip it and continue (applies when seeds >= 12).
- Cycle detection: after each move serialize `pits.join(',') + '|' + currentPlayer`; store in `boardHistory[]`; if the same string appears 3 times, declare draw immediately.

**UI flow:**
1. Home screen — mode, difficulty (PvC only), records, New Game / Resume
2. Play screen — board, stores, status bar; sub-states: idle (awaiting click), animating (sowing), computer-thinking
3. Game over overlay on play screen — result, scores, Play Again / Menu
4. HelpModal — accessible from home and play screens via question-mark icon
5. ConfirmModal — triggered on close or New Game during active game

**Edge cases:**
- Pit with exactly 12 seeds: wraps full board once, skipping start pit; last seed lands in the pit immediately before start.
- Pit with 23 seeds: skips start pit twice on two full laps.
- A pit can receive seeds from itself on a subsequent lap if seeds >= 12.
- Opponent has 0 seeds at start of turn and no feeding move exists: current player wins by sweep even if trailing in captures.
- Chain capture goes backward from lastPit; stops at first pit that is not 2-3 seeds or crosses back to current player's row.
- Grand slam check: count total seeds in opponent's entire range before capture; if chain would take all, skip all — not just the grand slam pit.
- If both stores reach 24 exactly after a sweep, declare draw.

---

## Data Model

**Board / grid:** Flat array `pits[12]`. Indices 0-5 = south row left-to-right on screen. Indices 6-11 = north row right-to-left on screen (pit 6 is rightmost of top row, pit 11 is leftmost). Sowing order: 0→1→2→3→4→5→6→7→8→9→10→11→0→...

**Piece / token types:** Seeds are uniform; only count per pit matters.

**Game state shape:**
```js
{
  pits: number[12],          // seed counts per pit
  stores: [number, number],  // [south captured, north captured]
  currentPlayer: 0 | 1,     // 0 = south, 1 = north
  phase: 'home' | 'playing' | 'gameover',
  mode: 'pvc' | 'pvp',
  difficulty: 'normal' | 'hard',
  winner: 0 | 1 | 'draw' | null,
  lastSownPit: number | null,   // pit highlighted after move
  capturedPits: number[],       // indices captured this turn, for flash animation
  boardHistory: string[],       // serialized states for cycle detection
  animating: boolean,           // true during sow/capture animation; blocks input
}
```

**State flags:**
- `animating` — blocks all pit clicks during sow and capture animations
- `phase` — controls which screen renders
- `winner` — set at game end; null during play
- `capturedPits` — indices captured this move; used to flash before removing seeds

**Turn structure:**
1. Player clicks a pit in `getValidMoves(pits, currentPlayer)`.
2. Set `animating = true`.
3. `sowSeeds(pits, pitIndex)` → `{ newPits, lastPit }`.
4. `resolveCapture(newPits, lastPit, currentPlayer)` → `{ newPits, captured, capturedPits }`.
5. Set `capturedPits`; flash them for 350ms; then apply `newPits` and add `captured` to `stores[currentPlayer]`.
6. Serialize board → push to `boardHistory`; `checkCycle(boardHistory)` → if true, set `winner = 'draw'`, `phase = 'gameover'`.
7. `checkWin(stores)` → if non-null, set `winner`, `phase = 'gameover'`.
8. Check `getValidMoves` for next player; if empty, call `sweepBoard` (both sides collect their own remaining seeds) then re-check win.
9. Toggle `currentPlayer ^= 1`; `animating = false`.
10. If PvC and now computer's turn, call `computerMove()` after 400ms delay.

**Move validation:** `getValidMoves(pits, currentPlayer)`:
- `myRange = currentPlayer === 0 ? [0,1,2,3,4,5] : [6,7,8,9,10,11]`
- `opponentRange = opposite`
- If `opponentRange.every(i => pits[i] === 0)`: return `myRange.filter(i => pits[i] > 0 && pitReachesOpponent(i, pits, currentPlayer))`. If that is empty, return `[]` (trigger sweep).
- Otherwise: return `myRange.filter(i => pits[i] > 0)`.

**Invalid move handling:** Clicking a pit not in `getValidMoves` does nothing. Invalid pits get `.disabled` class — `pointer-events: none`, reduced opacity.

---

## AI / Computer Player

**Strategy approach:** Minimax with alpha-beta pruning. North maximizes `evaluateBoard`; south minimizes. `evaluateBoard(pits, stores)` = `stores[1] - stores[0] + 0.1 * sum(pits[0..5])` (north prefers more captures and more seeds on south's side as future threats). Move ordering for Hard: sort candidate moves by immediate capture count descending before recursing.

**Difficulty levels:**
- Normal: depth 4, no move ordering; 30% of the time skip minimax and pick a random valid move instead (makes the computer feel fallible).
- Hard: depth 6, move ordering by immediate capture count descending; always plays the best move.

**Performance constraints:** With branching factor ~5 and alpha-beta, depth 6 resolves in well under 100ms. Run synchronously (no Web Worker needed). If `getValidMoves` returns `[]`, return `null` (game over).

---

## Help & Strategy Guide

**Objective:** Capture more than half the seeds (25 of 48) before your opponent does.

**Rules summary:**
- On your turn, pick one of your pits (must have seeds). Pick up all seeds and sow them one by one counter-clockwise, skipping the starting pit on wraparound.
- If the last seed lands in an opponent's pit with exactly 2 or 3 seeds, capture those seeds. Keep capturing backward through consecutive opponent pits with 2 or 3 seeds.
- You can never strip all seeds from your opponent's side in one move (grand slam rule).
- If your opponent has no seeds and you can give them some, you must. If you cannot, the game ends and you collect all remaining seeds on your side.
- First to 25 wins. Repeating the same position 3 times is a draw.

**Key strategies:**
- Keep seeds in your rightmost pits (4 and 5 for south) to reach the opponent's side quickly and set up captures.
- A pit on the opponent's side with 1 or 2 seeds is a capture opportunity — aim to land your last seed there.
- Set up chain captures: position multiple adjacent opponent pits with 2-3 seeds so one sow captures several at once.
- Deny your opponent's captures: avoid leaving 2 or 3 seeds in your pits when the opponent can reach them.
- A pit with 12+ seeds wraps the board — useful for spreading seeds while landing unpredictably.
- Always count where the last seed falls before committing to a move.

**Common mistakes:**
- Forgetting the grand slam rule and expecting a capture that does not happen.
- Ignoring the feeding obligation — letting the opponent go empty-handed forces a sweep that may benefit them if they are ahead.
- Sowing from a pit that does not reach the opponent when feeding is required.
- Forgetting that chain captures go backward (toward lower pit index on north, toward higher index on south), not forward.

**Tips for beginners:**
- Trace the full sow path before clicking — count pit by pit.
- Prioritize captures over pure seed movement in the early game.
- Watch for two adjacent opponent pits each with 2 seeds — that is a chain capture setup for them.
- In the endgame with few seeds, every sow matters; plan 2-3 turns ahead.

---

## Game Logic
- [x] `initState(mode, difficulty)` — returns fresh state: `pits = Array(12).fill(4)`, `stores = [0,0]`, `currentPlayer = 0`, `phase = 'playing'`, `boardHistory = []`, `animating = false`, `winner = null`, `capturedPits = []`, `lastSownPit = null`
- [x] `sowSeeds(pits, startPit)` — copies pits, zeros `startPit`, distributes seeds counter-clockwise skipping `startPit` on each wraparound; returns `{ newPits, lastPit }`
- [x] `getOpponentRange(currentPlayer)` — returns `[6,7,8,9,10,11]` for player 0; `[0,1,2,3,4,5]` for player 1
- [x] `getMyRange(currentPlayer)` — opposite of `getOpponentRange`
- [x] `resolveCapture(pits, lastPit, currentPlayer)` — if `lastPit` not in opponent range, return `{ newPits: pits, captured: 0, capturedPits: [] }`; walk backward (`cursor = (cursor - 1 + 12) % 12`) from `lastPit` while cursor is in opponent range and `pits[cursor]` is 2 or 3; accumulate indices and count; grand slam check: if `capturedCount === totalOpponentSeeds(pits, currentPlayer)`, return `{ newPits: pits, captured: 0, capturedPits: [] }`; otherwise zero captured pits and return `{ newPits, captured, capturedPits }`
- [x] `totalOpponentSeeds(pits, currentPlayer)` — sum of `pits[i]` for `i` in `getOpponentRange(currentPlayer)`
- [x] `pitReachesOpponent(pitIndex, pits, currentPlayer)` — simulates `sowSeeds(pits, pitIndex)` and checks if any pit in `getOpponentRange(currentPlayer)` gained a seed; returns boolean
- [x] `getValidMoves(pits, currentPlayer)` — see Data Model section; returns `number[]`
- [x] `serializeBoard(pits, currentPlayer)` — returns `pits.join(',') + '|' + currentPlayer`
- [x] `checkCycle(boardHistory)` — counts occurrences of `boardHistory[boardHistory.length - 1]`; returns `true` if count >= 3
- [x] `checkWin(stores)` — returns `0` if `stores[0] >= 25`, `1` if `stores[1] >= 25`, `'draw'` if both equal 24, `null` otherwise
- [x] `sweepBoard(pits, stores)` — south collects sum of `pits[0..5]` into `stores[0]`, north collects sum of `pits[6..11]` into `stores[1]`; sets all pits to 0; returns `{ pits: Array(12).fill(0), stores }`
- [x] `applyMove(state, pitIndex)` — orchestrates full turn: sow → capture → win check → cycle check → next-player valid-move check (sweep if empty) → re-check win → toggle player; returns next full state; does not mutate input state
- [x] `evaluateBoard(pits, stores)` — returns `stores[1] - stores[0] + 0.1 * (pits[0]+pits[1]+pits[2]+pits[3]+pits[4]+pits[5])`
- [x] `minimax(pits, stores, boardHistory, currentPlayer, depth, alpha, beta)` — returns `{ score, pitIndex }`; base case: depth 0 or no valid moves → return `{ score: evaluateBoard(pits, stores), pitIndex: null }`; for Hard, sort moves by immediate capture result descending before iterating; prune with alpha-beta
- [x] `computerMove(state)` — for Normal: if `Math.random() < 0.3`, pick a random pit from `getValidMoves`; otherwise call `minimax` at depth 4; for Hard: always call `minimax` at depth 6 with move ordering; returns chosen `pitIndex`; called after 400ms delay; sets `animating = true` before starting

---

## UI & Rendering
- [x] Home screen — title "Oware", mode selector (PvC / PvP tabs or radio), difficulty selector (Normal / Hard, visible only when PvC selected), records display (`Wins vs Normal: N`, `Wins vs Hard: N`, `Wins PvP: N`), New Game button, Resume button (visible only if `localStorage` has a saved game); header row: question-mark, sun/moon, heart icons
- [x] Play screen — board container with north store (left) | pits area | south store (right), status bar below board, pit click handler; header row: x, question-mark, sun/moon, heart icons; horizontal rule below header
- [x] Board pits area — two rows: top row renders pits `[11,10,9,8,7,6]` left-to-right (north's pits); bottom row renders pits `[0,1,2,3,4,5]` left-to-right (south's pits); each pit is a clickable div with seed dot grid and count
- [x] Pit element — seed dot grid (up to 12 small filled circles in a 4x3 grid); counts 13+ shown as number only; classes: `.valid` on valid-move pits, `.disabled` on invalid pits, `.last-sown` briefly after a move, `.captured` flash before seeds removed; ARIA label: "Pit [n], [k] seeds[, valid move]"
- [x] Store element — left store labeled "Opp" or "P2" (north), right store labeled "You" or "P1" (south); displays captured count with `--font-mono`; same height as combined pit rows
- [x] Game over overlay — fades in with fade+scale over play screen; shows "You win!" / "You lose." / "Player 1 wins!" / "Draw!" in appropriate `--color-success` / `--color-danger` / `--color-accent`; shows both stores' final counts; Play Again and Menu buttons
- [x] HelpModal — question-mark icon on any screen opens it; contains full rules summary and strategy guide from Help & Strategy Guide section; X button and backdrop click to close; traps focus
- [x] ConfirmModal — x icon or New Game during active play triggers "Abandon this game?" with Confirm (abandon) and Cancel buttons; min-width 420px
- [x] Status bar — "Your turn" (south in PvC idle), "Thinking..." with dot-pulse (computer turn), "Player 1's turn" / "Player 2's turn" (PvP); color: `--color-accent`; game over message replaces it

---

## Styling
- [x] All colors use semantic variables — no hardcoded values
- [x] All spacing uses `--space-*` variables
- [x] Seed counts in stores and pit overflow labels use `--font-mono`
- [x] Main container: `--shadow-lg`, inset box-shadow border, min-width 420px, centered
- [x] All interactive elements have hover, active, and disabled states with transitions — nothing snaps
- [x] Status text: win=`--color-success`, loss=`--color-danger`, neutral=`--color-accent`
- [x] Game over overlay animates in with fade + scale (0.3s ease)
- [x] Responsive at 375px — pit size shrinks, board stays centered, stores remain flanking
- [x] Light theme verified — pit wells have visible inset depth, stores visually distinct from pits
- [x] North store on left, south store on right; both span full height of pit rows
- [x] `.valid` pits: elevated border using `--color-accent`, scale(1.03) on hover
- [x] `.disabled` pits: `opacity: 0.4`, `cursor: not-allowed`, `pointer-events: none`
- [x] `.last-sown` pit: 500ms ring highlight using `--color-accent` outline, then removed
- [x] `.captured` pits: 350ms flash using `--color-danger` background before seeds cleared
- [x] Seed dots: small circles `6-8px`, `--color-text` fill, arranged in 3-col grid inside pit
- [x] Board background: warm earth tone via `--color-surface` variant — evokes wood/stone in both themes
- [x] "Thinking..." status: CSS dot-pulse keyframe animation on three dots

---

## Polish
- [x] Sow animation: seeds travel pit-to-pit at 80ms per pit using JS-timed class toggling (`.receiving` class pulses briefly on each pit as it receives a seed); `animating` flag blocks input for full duration
- [x] Capture flash: `.captured` class applied to all captured pit indices simultaneously for 350ms, then seeds removed and stores updated
- [x] Computer move delay: 400ms pause before computer's sow animation begins (feels deliberate)
- [x] Seed dot grid: dots rendered as small circles in a CSS grid (max 12); if seeds > 12, show count number centered instead
- [x] Keyboard nav: Tab cycles through `.valid` pits only; Enter/Space selects focused pit; Escape closes open modal
- [x] ARIA labels on all pits, stores, and buttons; `role="button"` on pit divs; `aria-disabled` on invalid pits
- [x] Save full game state to `localStorage` key `oware_state` on every `applyMove`; clear on game over
- [x] Records in localStorage: `oware_wins_normal`, `oware_wins_hard`, `oware_wins_pvp`; increment on win, display on home screen
- [x] Theme toggle persists to `oware_theme` in localStorage; applied to `<body>` as `.light-palette` or `.dark-palette` before first render to avoid flash
- [x] Last selected mode and difficulty persisted to `oware_mode` and `oware_difficulty` in localStorage; restored on home screen load
