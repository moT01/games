# tower-of-hanoi
> Based on: Tower of Hanoi

## Game Design

**Rules:** 3 pegs (left/source, middle/auxiliary, right/target). All disks start stacked on the left peg, largest at bottom. Move all disks to the right peg. Only one disk may be moved per turn (the top disk of any peg). A larger disk may never be placed on a smaller one.

**Players:** Single player (puzzle)

**Modes:** 3 disks (7 optimal moves) / 5 disks (31 optimal moves) / 7 disks (127 optimal moves). Selected mode persisted to localStorage.

**Win condition:** All disks are on the right peg (pegs[2].length === diskCount).

**Special rules / one-off mechanics:**
- Click a peg to select the top disk (peg highlights, disk highlights). Click a second peg to move. Clicking the same peg again deselects. Clicking an empty peg with nothing selected does nothing.
- Invalid move (larger onto smaller): flash a red error indicator on the target peg, do not deselect the source.
- Timer starts on the first move, not on screen load. Stops when the puzzle is won.
- Optimal move count (2^n - 1) shown as a reference below the move counter at all times during play.

**UI flow:**
1. Home screen — mode selector, records, New Game, Resume (if saved game exists)
2. Play screen — 3 pegs, HUD (moves, timer, optimal), header icons
3. Win → Game Over overlay appears on play screen
4. Game Over overlay → "Play Again" restarts same disk count; "Menu" returns to Home
5. Close button on play screen → ConfirmModal → Home (if game in progress)

**Edge cases:**
- Clicking an empty source peg does nothing (no selection made).
- Clicking a valid source peg that is already selected = deselects.
- Resume loads exact peg state, move count, and elapsed time from localStorage.
- When all disks are on the middle peg (not the right) — game is not won; only pegs[2] === full counts.
- 7-disk game: user may take hundreds of moves; move counter must not overflow display.
- If saved game's diskCount no longer matches selected mode on home screen, Resume still loads the saved game's diskCount (not the home screen selection).

---

## Data Model

**Board:** `pegs` — array of 3 arrays. Each inner array contains disk numbers from bottom (index 0) to top (last index). Disk number represents size: 1 = smallest, diskCount = largest.

**Piece types:** Integer disk values 1–7. Disk width in px = `BASE_WIDTH * (diskNum / diskCount)` with a minimum width so small disks are always clickable.

**Game state shape:**
```js
{
  pegs: [[7,6,5,4,3,2,1], [], []],  // example for 7 disks
  selectedPeg: null,                  // null | 0 | 1 | 2
  diskCount: 5,                       // 3 | 5 | 7
  moveCount: 0,
  elapsedSeconds: 0,
  timerInterval: null,                // setInterval reference, not persisted
  gameStatus: 'idle'                  // 'idle' | 'playing' | 'won'
}
```

**State flags:**
- `selectedPeg` — which peg is currently selected (null = nothing selected)
- `gameStatus` — controls what is rendered; 'idle' before first move, 'playing' after, 'won' on completion

**Turn structure:** No turns (single player). Each click either selects a peg or executes a move.

**Move validation approach:** `isValidMove(fromIndex, toIndex)`:
1. `pegs[fromIndex]` is not empty
2. `pegs[toIndex]` is empty OR top of `pegs[toIndex]` > top of `pegs[fromIndex]`

**Invalid move handling:** Call `flashError(toIndex)` — adds `.error-flash` class to the peg column for 400ms, then removes it. Do not clear selectedPeg.

---

## Help & Strategy Guide

**Objective:** Move all disks from the left peg to the right peg using the middle peg as a helper. Use the fewest moves possible.

**Rules summary:**
- Move only the top disk of any peg.
- Never place a larger disk on a smaller one.
- The puzzle is solved when all disks are stacked on the right peg.

**Key strategies:**
- To move n disks from A to C using B: move the top n-1 disks from A to B (recursively), move disk n from A to C, then move the n-1 disks from B to C.
- With 3 disks the pattern repeats every 7 moves. With each additional 2 disks it multiplies by 4.
- Always keep track of which peg the largest unmoved disk needs to go to — that drives every sub-decision.
- For odd-numbered disks, the first move is always to the target (right) peg. For even-numbered disks, the first move is always to the auxiliary (middle) peg.

**Common mistakes:**
- Moving the second-largest disk before clearing everything above the largest disk.
- Forgetting that you cannot skip a peg — you must physically route disks through the middle.
- Trying to undo a mistake by just reversing one move instead of thinking 3–4 moves ahead.

**Tips for beginners:**
- Start with 3 disks and solve it once manually before trying 5.
- Label the pegs A, B, C in your head. Always know where each disk "belongs" in the recursive plan.
- The optimal move count is shown below the counter — use it as a guide, not a pressure.

---

## Local Storage

| Key | Value | Notes |
|-----|-------|-------|
| `toh_theme` | `'dark'` \| `'light'` | Theme preference |
| `toh_disk_count` | `3` \| `5` \| `7` | Last selected disk count |
| `toh_saved_game` | JSON `{ pegs, diskCount, moveCount, elapsedSeconds, gameStatus }` | Active game state; cleared on win or new game |
| `toh_records` | JSON `{ 3: { moves, time }, 5: { moves, time }, 7: { moves, time } }` | Best moves and best time per disk count; individual entries populated on first win |

---

## Accessibility
- [x] Keyboard navigation: Tab moves between peg columns; Enter/Space triggers `selectPeg()` on focused peg
- [x] ARIA label on each peg column: `"Peg [A/B/C]: [N] disks"` (or `"empty"`)
- [x] ARIA label on each disk element: `"Disk [size]"` (e.g. `"Disk 3"`)
- [x] Selected peg column: `aria-pressed="true"` on the button/column
- [x] ARIA role on modal: `role="dialog"`, `aria-modal="true"`, focus trapped while open
- [x] HUD move counter and timer: `aria-live="polite"` so screen readers announce updates

---

## Game Logic
- [x] `initGame(diskCount)` — sets `pegs` to `[[diskCount, ..., 1], [], []]`, resets `moveCount`, `elapsedSeconds`, `selectedPeg`, `gameStatus` to `'idle'`; saves state to localStorage
- [x] `selectPeg(pegIndex)` — if `selectedPeg === null`: set `selectedPeg = pegIndex` if peg is non-empty, else do nothing; if `selectedPeg === pegIndex`: clear `selectedPeg` (deselect); if `selectedPeg !== pegIndex`: call `attemptMove(selectedPeg, pegIndex)`
- [x] `attemptMove(fromIndex, toIndex)` — call `isValidMove()`; if valid call `executeMove()`; if invalid call `flashError(toIndex)` (keep selection)
- [x] `isValidMove(fromIndex, toIndex)` — returns bool per move validation rules above
- [x] `executeMove(fromIndex, toIndex)` — pop top of `pegs[fromIndex]`, push to `pegs[toIndex]`, increment `moveCount`, clear `selectedPeg`; if `gameStatus === 'idle'` set to `'playing'` and call `startTimer()`; call `checkWin()`; save state; re-render
- [x] `checkWin()` — if `pegs[2].length === diskCount`: set `gameStatus = 'won'`, call `stopTimer()`, call `saveRecord()`, call `showGameOver()`
- [x] `startTimer()` — sets `timerInterval = setInterval(() => { elapsedSeconds++; renderHud(); }, 1000)`
- [x] `stopTimer()` — clears `timerInterval`, sets to null
- [x] `formatTime(seconds)` — returns `MM:SS` string
- [x] `saveRecord(diskCount, moves, time)` — reads existing record from localStorage for this diskCount; updates only if `moves` is lower (or no record exists); if same moves, update time only if lower
- [x] `saveGameState()` — serializes `{ pegs, diskCount, moveCount, elapsedSeconds, gameStatus }` to localStorage key `toh_saved_game`
- [x] `loadGameState()` — parses localStorage `toh_saved_game`; returns null if not present or corrupt
- [x] `hasSavedGame()` — returns true if `toh_saved_game` exists in localStorage
- [x] `clearSavedGame()` — removes `toh_saved_game` from localStorage
- [x] `flashError(pegIndex)` — adds `.error-flash` CSS class to peg column element; removes after 400ms
- [x] `getOptimalMoves(diskCount)` — returns `Math.pow(2, diskCount) - 1`
- [x] `getDiskColor(diskNum)` — returns the CSS variable string for the disk's color based on theme. Disk-to-color mapping (1 = smallest): 1=red, 2=orange, 3=yellow, 4=green, 5=blue, 6=purple, 7=teal. Dark theme uses light variants (`--red-light`, `--orange-light`, `--yellow-light`, `--green-light`, `--blue-light`, `--purple-light`, `--teal-light`); light theme uses dark variants (`--red-dark`, `--orange-dark`, `--yellow-dark`, `--green-dark`, `--blue-dark`, `--purple-dark`, `--teal-dark`). Color is consistent per disk number regardless of total disk count.

---

## UI & Rendering

- [x] Home screen — title "Tower of Hanoi"; 3-button header (help, theme, donate); disk count selector with 3 toggle buttons ("3 Disks" / "5 Disks" / "7 Disks"), active button highlighted with `--color-accent`; records table with columns: Disks | Best Moves | Best Time — show `--` if no record; "New Game" button always shown; "Resume" button shown only if `hasSavedGame()` returns true
- [x] Play screen — 4-button header (close, help, theme, donate); horizontal rule; HUD row: "Moves: N" + "Optimal: N" on left, timer on right; peg area below HUD — 3 equal-width columns, each containing a peg rod and base, with disks rendered on them; peg column click area covers full column height
- [x] Peg rendering — each peg column: thin vertical rod (centered), wide flat base at bottom; disks drawn as rounded rectangles stacked bottom-up on the rod, centered; disk width = `40px + (diskNum / diskCount) * 160px`; disk height = 28px; 7 fixed disk colors (see getDiskColor); selected peg column has `--color-accent` glow border; top disk of selected peg has a white highlight ring
- [x] Game Over overlay — fades in over play screen; shows result "Puzzle Solved!", moves taken, time taken, best moves record, best time record; "Play Again" button restarts with same diskCount; "Menu" button goes to home (no confirm needed — game is won)
- [x] HelpModal — accessible from home and play screens via help icon; shows Objective, Rules, Key Strategies, Tips sections from Help & Strategy Guide above; min-width 420px
- [x] ConfirmModal — triggered by close button on play screen if `gameStatus === 'playing'`; message: "Quit this game? Your progress will be lost."; "Quit" confirms and navigates home; "Cancel" dismisses; if `gameStatus === 'idle'` or `'won'`, close navigates home without confirm

---

## Styling
- [x] All colors use semantic variables — no hardcoded values; disk colors use `--red-light/dark`, `--orange-light/dark`, `--yellow-light/dark`, `--green-light/dark`, `--blue-light/dark`, `--purple-light/dark`, `--teal-light/dark` from `global.css`
- [x] All spacing uses `--space-*` variables
- [x] Move counter, timer, and optimal count use `--font-mono`
- [x] No surface is flat — subtle gradient on all panels and containers
- [x] Main container: `--shadow-lg`, inset box-shadow border, min-width 420px, centered
- [x] All interactive elements have hover, active, and disabled states with transitions — nothing snaps
- [x] Status text on game over: win = `--color-success`
- [x] Game over overlay animates in with fade + scale
- [x] Responsive at 375px — peg area scales so all disks fit; disk widths use relative units or clamp at narrow widths
- [x] Light theme verified — surfaces have visible depth and contrast
- [x] Peg columns have a subtle inset background to distinguish them from the container background
- [x] Selected peg column: `box-shadow: 0 0 12px var(--color-accent)`, border `1px solid var(--color-accent)`
- [x] `.error-flash` class: `box-shadow: 0 0 12px var(--color-danger)`, border `1px solid var(--color-danger)`, transition in/out 120ms
- [x] Disk selector buttons on home screen: inactive uses `--color-surface-raised`; active uses `--color-accent` background with `--gray-90` text
- [x] Records table: subtle borders, muted header text, mono font for values

---

## Polish
- [x] Disk move animation: when a disk moves, briefly scale it up (1.05) on pickup, scale back to 1 on placement — 150ms ease
- [x] Win state: all disks on right peg glow with `--color-success` shadow for 600ms after game over triggers
- [x] Move counter pulses (brief scale 1.1 → 1.0) on each valid move
- [x] Timer ticks smoothly — no layout shift from digit width changes (mono font handles this)
- [x] Empty peg base has a subtle dashed border to indicate it is a valid drop target
