# congkak
> Based on: congkak

## Game Design

**Rules:** Standard Malaysian Congkak. Board has 2 rows of 7 houses and 2 stores. Each house starts with 7 seeds (98 total). Players sow counter-clockwise, skipping the opponent's store. Landing in your own store grants an extra turn. Landing in your own empty house when the opposite house has seeds triggers a capture (take the 1 landing seed + all seeds opposite into your store). Game ends when one player's houses are all empty; the other player sweeps their remaining house seeds into their store. Most seeds in store wins.

**Players:** 2 (vs Computer or 2-player local)

**Modes / variants:** vs Computer (Normal / Hard difficulty), 2 Players (local, same device)

**Win / draw conditions:**
- Win: player with more seeds in their store after game ends
- Draw: both players have exactly 49 seeds in their store

**Special rules / one-off mechanics:**
- First move is simultaneous: both players secretly choose a house, then both sow at once. In 2-player local, P1 chooses first (screen hidden), then P2 chooses, then both are animated simultaneously. In vs Computer, computer pre-selects while P1 is choosing.
- Sowing skips opponent's store only (you do drop into your own store)
- A player with no seeds in their houses on their turn cannot move; opponent sweeps all their remaining seeds into their own store and game ends immediately
- If sowing passes through your own store and continues into opponent's territory, you still skip only opponent's store

**UI flow:**
1. Home screen — mode selector (vs Computer / 2 Players), difficulty selector (Normal / Hard, vs Computer only), records, New Game / Resume
2. Play screen — board, status bar (whose turn / score), header with close/help/theme/donate icons
   - Sub-state: first-move-p1 (P1 selects their opening house, message: "Player 1: choose your opening hole")
   - Sub-state: first-move-p2 (P2/Computer selects, message: "Player 2: choose your opening hole" or hidden for computer)
   - Sub-state: first-move-reveal (both moves animate simultaneously)
   - Sub-state: playing (normal alternating turns)
   - Sub-state: animating (seed distribution in progress, board locked)
   - Sub-state: computer-thinking (show thinking indicator before computer move)
3. Game over overlay (on play screen) — result, seed totals, Play Again / Menu buttons

**Edge cases:**
- Sowing from a house with enough seeds to lap the board: seeds skip opponent's store each time they pass it, and also skip your own store on the second pass? No — standard Congkak: you drop into your own store every pass, only skip opponent's store. So a 16+ seed sow will drop a seed in your store on each lap.
- Last seed lands in opponent's empty house: no capture (capture only on your own side)
- Last seed lands in your own empty house but opposite house is also empty: no capture, just end turn
- Player selects a house with 0 seeds: invalid, ignore click
- During first-move reveal, if both players pick the same house index on their respective sides: no conflict, each row is independent
- A sow passes through your store: drop a seed, continue sowing — this still counts as an extra turn trigger only if that final seed is the one that lands in the store
- If after a capture the player's houses become all empty, game ends immediately (do not grant another turn)

---

## Data Model

**Board / grid:** Flat array `pits[16]`:
- `pits[0..6]` — Player 1's houses, left to right
- `pits[7]` — Player 1's store
- `pits[8..14]` — Player 2's houses, where `pits[8]` is directly opposite `pits[6]` and `pits[14]` is directly opposite `pits[0]`
- `pits[15]` — Player 2's store

Opposite-pit formula: P1 pit `i` (0–6) ↔ P2 pit `(14 - i)`; P2 pit `j` (8–14) ↔ P1 pit `(22 - j)`

Sowing sequence (CCW): both players follow index order `0→1→2→...→15→0`. P1 skips index 15 (P2 store). P2 skips index 7 (P1 store).

**Piece / token types:** Seeds — undifferentiated; just integer counts per pit.

**Game state shape:**
```js
{
  pits: number[16],
  phase: 'home' | 'first-move-p1' | 'first-move-p2' | 'first-move-reveal' | 'playing' | 'animating' | 'computer-thinking' | 'game-over',
  turn: 1 | 2,
  mode: 'vs-computer' | '2-player',
  difficulty: 'normal' | 'hard',
  firstMoveP1: number | null,   // pit index P1 chose for first move
  firstMoveP2: number | null,   // pit index P2 chose for first move
  winner: 1 | 2 | 'draw' | null,
  animQueue: AnimStep[],        // ordered list of pit-index/count changes for animation
  scores: { p1: number, p2: number }  // mirror of pits[7] and pits[15] for quick access
}
```

**State flags:**
- `phase` drives all UI rendering decisions
- `animQueue` non-empty means animation is in progress; board is non-interactive
- `turn` is only meaningful during `playing`, `animating`, `computer-thinking` phases

**Turn structure:**
1. Player clicks a non-empty house on their side
2. `sowSeeds(pitIndex)` computes `animQueue` steps and resulting `pits`
3. Animate the queue (one seed at a time, ~120ms per pit)
4. After animation: evaluate `resolveTurn()`:
   - Extra turn: `phase` stays `playing` (or `computer-thinking`), same `turn`
   - Capture: apply capture to `pits`, then `endTurn()`
   - Normal end: `endTurn()`
5. `endTurn()`: check if next player has any seeds; if not, sweep and go to `game-over`; else flip `turn`

**Move validation approach:** `isValidMove(pitIndex, player)` — returns true if `pitIndex` is on `player`'s side (not a store) and `pits[pitIndex] > 0`.

**Invalid move handling:** Click on empty pit or opponent's pit is ignored silently. No error shown.

---

## AI / Computer Player

**Strategy approach:** Minimax with alpha-beta pruning on a copy of `pits`. Evaluates positions using `heuristic(pits)` = `pits[15] - pits[7]` (P2 store minus P1 store) plus bonuses.

**Heuristic bonuses:**
- +3 for each extra-turn opportunity (last seed would land in own store)
- +5 for each capture opportunity (last seed lands in own empty pit with non-empty opposite)
- -2 for each of your own houses left exposed as empty (potential opponent capture landing)

**Difficulty levels:**
- Normal: minimax depth 3, no randomization
- Hard: minimax depth 6 with alpha-beta pruning; if multiple moves score equally, picks the one that maximizes seeds captured

**Performance constraints:** Depth 6 runs synchronously — worst case ~50ms. Use `setTimeout(0)` before computing so the "thinking" indicator renders first.

---

## Help & Strategy Guide

**Objective:** Collect more than 49 seeds in your store (the large pit on your right) before all houses are empty.

**Rules summary:**
- Pick up all seeds from one of your 7 houses and drop one into each pit going counter-clockwise
- You skip your opponent's store when sowing
- Landing in your store earns another turn
- Landing in your own empty house captures the seeds from the opposite house into your store
- When your houses are all empty, your opponent sweeps their remaining seeds and the game ends

**Key strategies:**
- On your first move, the rightmost house (closest to your store) is often strongest — fewer seeds to sow means you land in your store and get an immediate extra turn
- Prioritize moves that land your last seed in your store for a free extra turn
- Look 2 turns ahead: set up a capture by emptying a house on one turn, then sowing into it next turn
- Keeping your houses nearest the opponent's side stocked protects them from being captured
- In the endgame, if your opponent's houses near their store are empty, sow past them to skip a potential capture zone

**Common mistakes:**
- Sowing from a full house when a smaller house gives an extra turn instead
- Ignoring the capture threat: leaving a house empty on your side when the opposite house is loaded
- Taking an extra turn blindly without checking if that turn sets up a capture for the opponent
- Not counting seeds before sowing — running one short of your store loses the extra turn

**Tips for beginners:**
- Count the seeds in a house before clicking — if the count equals the distance to your store, you get a free turn
- At the start, houses 0 and 1 (far left) are hardest to use efficiently; focus on houses 4-6 first
- Watch the opponent's empty houses — if you can land a seed in your own empty house opposite one of their loaded houses, that is a big capture

---

## Game Logic
- [x] `initBoard()` — return `pits[16]` all set to 7 except stores (0), and initial `GameState`
- [x] `getNextPit(currentIndex, player)` — return next valid index skipping opponent's store
- [x] `computeSow(pits, startIndex, player)` — return `{ newPits, animSteps, lastPit }` without mutating; `animSteps` is array of `{ pit, delta }` for animation
- [x] `resolveTurn(pits, lastPit, player)` — return `{ outcome: 'extra-turn' | 'capture' | 'end', newPits }`:
  - extra-turn: `lastPit === player's store index`
  - capture: `lastPit` is on player's side (not store), `newPits[lastPit] === 1` (just landed, was empty before), and opposite pit has seeds; apply capture to `newPits`
  - end: otherwise
- [x] `checkGameOver(pits)` — return `true` if either player's houses (indices 0–6 or 8–14) are all 0
- [x] `sweepRemaining(pits)` — for the player whose side is non-empty, add all house seeds to their store, zero out houses; return new pits
- [x] `getWinner(pits)` — compare `pits[7]` vs `pits[15]`, return `1 | 2 | 'draw'`
- [x] `isValidMove(pits, pitIndex, player)` — pit on player's side, not a store, count > 0
- [x] `getValidMoves(pits, player)` — filter all player's house indices by `isValidMove`
- [x] `minimax(pits, depth, alpha, beta, maximizing)` — returns best score for current position
- [x] `getBestMove(pits, difficulty)` — call minimax with depth 3 (normal) or 6 (hard), return best pit index for P2
- [x] `heuristic(pits)` — score from P2's perspective: store diff + bonuses for extra-turn and capture opportunities
- [x] `applyFirstMoves(pits, p1Pit, p2Pit)` — compute both sows simultaneously (both start pits emptied at once, then seeds distributed), return `{ newPits, p1AnimSteps, p2AnimSteps }`
- [x] `saveState(state)` — serialize to `localStorage['congkak-state']`
- [x] `loadState()` — deserialize and validate; return `null` if invalid or missing
- [x] `savePrefs(prefs)` — persist `{ mode, difficulty, theme }` to `localStorage['congkak-prefs']`
- [x] `loadPrefs()` — return saved prefs or defaults
- [x] `saveRecord(result, difficulty, mode)` — update win counts or best scores in `localStorage['congkak-records']`
- [x] `loadRecords()` — return records object

---

## UI & Rendering
- [x] Home screen — title "Congkak", mode tab (vs Computer / 2 Players), difficulty selector (Normal / Hard, shown only in vs Computer mode), records display (wins Normal / wins Hard for vs Computer; total 2-player games for local), New Game button always shown, Resume button shown only when saved game exists in localStorage; header: help, theme, donate icon buttons
- [x] Play screen — centered board container, status bar showing current player label and seed counts per store, header: close (with confirm modal), help, theme, donate icon buttons; horizontal rule below header
- [x] Board rendering — `renderBoard(pits, phase, turn)` draws the boat-shaped board: outer oval container, 2 store ovals on left (P2) and right (P1), 2 rows of 7 house circles, seed count centered in each house, active-player houses highlighted with accent border, empty houses dimmed
- [x] First-move-p1 overlay — message "Player 1: tap your opening house" displayed above board; P1's houses are clickable, P2's houses are not; selected house gets a pulsing accent ring
- [x] First-move-p2 overlay (2-player only) — "Pass to Player 2" screen shown to hide P1's choice, then "Player 2: tap your opening house"; for vs Computer, skip this overlay (computer pre-selects instantly)
- [x] First-move-reveal animation — both P1 and P2 seeds animate simultaneously using two concurrent `animateQueue` calls; board locked during animation
- [x] Sow animation — `animateQueue(steps, onComplete)` — iterate `animSteps`, for each step: increment displayed count in target pit, flash the pit briefly, wait 120ms, then move to next; trigger `onComplete` when done
- [x] Capture flash — when capture resolved, highlight both captured pit and player's store with a brief gold flash (300ms)
- [x] Computer-thinking indicator — "Thinking..." text replaces turn label; appears for minimum 400ms even if AI resolves faster (to avoid instant moves feeling wrong)
- [x] Game over overlay — fade+scale in over play screen; shows result text ("Player 1 wins!", "Player 2 wins!", "Draw"), seed counts (P1: X | P2: Y), Play Again button, Menu button
- [x] HelpModal — accessible via help button on all screens; shows rules, board diagram (ASCII or CSS), objective, key strategies; close via X button or backdrop click
- [x] ConfirmModal — triggered by close button during active game; "Abandon this game?" with Cancel and Quit buttons; min-width 420px

---

## Styling
- [x] All colors use semantic variables — no hardcoded values
- [x] All spacing uses `--space-*` variables
- [x] Numbers, scores, and timers use `--font-mono`
- [x] Main container: `--shadow-lg`, inset box-shadow border, min-width 420px, centered
- [x] All interactive elements have hover, active, and disabled states with transitions — nothing snaps
- [x] Status text: win=`--color-success`, loss=`--color-danger`, neutral=`--color-accent`
- [x] Game over overlay animates in with fade + scale
- [x] Responsive at 375px
- [x] Light theme verified — surfaces have visible depth and contrast
- [x] Board oval container uses `--color-surface-raised` background with a warm wood-tone tint using `--orange-dark` at low opacity for the outer border (suggests a wooden board)
- [x] House circles: 52px diameter, `--color-surface` background, 2px inset border; active-player houses get `--border-accent` on hover; empty houses get 0.4 opacity
- [x] Store ovals: taller than wide, use `--color-surface` background with `--shadow-md`
- [x] Seed count in houses uses `--font-mono`, `--text-sm`; store count uses `--font-mono`, `--text-xl`
- [x] Pit highlight animation: `@keyframes pit-flash` scales from 1 to 1.12 and back, 150ms
- [x] Capture flash: `@keyframes capture-flash` — gold glow using `--shadow-accent`, 300ms
- [x] Board fits within 375px width at min scale: houses shrink to 40px at narrow widths via media query

---

## Accessibility
- [x] All house and store pits have `aria-label` e.g. "Player 1 house 3, 7 seeds" and `role="button"` with `aria-disabled` when not interactive
- [x] Tab order follows the board CCW: P1 houses left to right, then P2 houses right to left
- [x] Enter/Space activates focused house (same as click)
- [x] Modal traps focus when open; returns focus to trigger element on close
- [x] Theme toggle has `aria-label="Switch to light theme"` / `"Switch to dark theme"`
- [x] Status bar announces turn changes via `aria-live="polite"` region

---

## Polish
- [x] Seed animation steps are smooth — 120ms per pit, no jank at 60fps
- [x] First-move reveal animates both rows simultaneously (two independent animation loops)
- [x] Computer move has minimum 400ms thinking delay so it never feels instant
- [x] Clicking your own store or opponent's pits gives no visual response (silent ignore)
- [x] Pass-device prompt between first moves in 2-player mode is clearly styled and non-skippable (requires a button tap to continue to P2 selection)
- [x] Resume button only appears if saved state's `phase` is not `home` or `game-over`
- [x] Board orientation: P1 always on bottom, P2 always on top, regardless of who's turn it is
