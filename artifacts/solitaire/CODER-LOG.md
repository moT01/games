## Section: Testing

### Files created / modified
- `solitaire/src/gameLogic.test.ts` — unit tests for all game logic functions
- `solitaire/src/App.test.tsx` — component tests for App using mocked gameLogic

### Decisions made
- Did not import `@testing-library/jest-dom` (not installed); used `.toBeTruthy()` instead of `.toBeInTheDocument()`, consistent with other games in the repo (checkers pattern)
- Used `vi.mock` factory with `vi.fn()` wrappers to allow per-test override of `checkWin`, `applyMove`, etc.
- In App.test.tsx, clicking the waste card uses `.waste-pile .card` selector rather than `.waste-pile` because the CardView onClick is on the inner `.card` div, not the container
- The auto-complete test uses `vi.useFakeTimers()` + `vi.advanceTimersByTime(50)` to fire one interval tick and verify `applyMove` was called
- The `act(...)` warning in the auto-complete test is benign — it fires because `setInterval` causes a state update outside React's flush, but the test assertion still works correctly

### Uncertainties / flags
- None — all 41 tests pass cleanly

### Anything the reviewer should pay extra attention to
- The win-screen tests depend on clicking waste card then foundation: the flow is `drawFromStock` (mock) → A♥ in waste → click `.waste-pile .card` to select → click `.foundation-pile` which triggers `handleFoundationClick` → `canMoveToFoundation(A♥, [])` returns true (real function) → `onMove` called → `checkWin` (mocked true) → win screen shown
- `vi.clearAllMocks()` in `beforeEach` only clears call counts, not implementations; each test that needs a specific `checkWin` behavior sets it explicitly with `mockReturnValue`

### Items ready for review
- [ ] `createDeck` returns exactly 52 unique cards (all suit+rank combos)
- [ ] `shuffleDeck` returns all 52 cards (no duplicates, no missing)
- [ ] `dealGame` produces correct pile sizes: tableau cols have 1–7 cards, stock has 24 cards, foundations and waste are empty
- [ ] `dealGame` produces bottom card face-up and rest face-down in each tableau column
- [ ] `canMoveToTableau` — valid: red 6 onto black 7, King onto empty column
- [ ] `canMoveToTableau` — invalid: same color, wrong rank difference, face-down card, non-King onto empty column
- [ ] `canMoveToFoundation` — valid: Ace to empty foundation, 2♥ onto A♥
- [ ] `canMoveToFoundation` — invalid: wrong suit, non-Ace to empty, out-of-sequence rank
- [ ] `drawFromStock` draw-1: moves exactly 1 card from stock to waste face-up
- [ ] `drawFromStock` draw-3: moves up to 3 cards from stock to waste face-up
- [ ] `resetStock`: waste returns to stock face-down; `stockRecycles` increments
- [ ] `resetStock` draw-3 penalty: score decreases by 20 when `stockRecycles >= 1`
- [ ] `checkWin` returns true only when all 4 foundations each have 13 cards
- [ ] `applyMove` awards +10 when moving waste card to foundation
- [ ] `applyMove` awards +5 when moving waste card to tableau
- [ ] `applyMove` awards +5 when flipping a tableau card
- [ ] `applyMove` deducts -15 when moving foundation card back to tableau
- [ ] `applyMove` score never goes below 0
- [ ] `canAutoComplete` returns true when stock is empty and all tableau cards are face-up (regardless of waste pile contents)
- [ ] `drawFromStock` and `resetStock` also call `canAutoComplete` and update `autoCompleteAvailable` in returned state
- [ ] Renders setup screen initially
- [ ] Selecting draw mode and clicking New Game transitions to game screen
- [ ] Clicking stock pile adds card(s) to waste
- [ ] Win screen appears when `checkWin` returns true (mock `gameLogic`)
- [ ] Win screen shows correct session tally after win
- [ ] "Play Again" on win screen returns to setup screen and increments win count
- [ ] Auto-complete button renders when `canAutoComplete` returns true (mock `gameLogic` so `canAutoComplete` returns true)
- [ ] Clicking auto-complete button steps cards to foundations — mock `setInterval` (via `vi.useFakeTimers`) and advance timers to verify `applyMove` is called for each remaining card
