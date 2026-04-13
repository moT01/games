## Section: Testing

### Files created / modified
- `rock-paper-scissors/src/gameLogic.test.ts` — unit tests for all four exported functions
- `rock-paper-scissors/src/App.test.tsx` — component integration tests for App

### Decisions made
- No jest-dom package is installed; used `.toBeTruthy()` and `.toBeNull()` (native vitest/chai) instead of `toBeInTheDocument` / jest-dom matchers
- Used `vi.spyOn(gameLogic, 'getComputerChoice')` to control computer choices deterministically — computer always picks scissors so player wins with rock
- For the two-round tests (banner, play-again), waited for `isRevealing` to clear between rounds using `waitFor` checking `.disabled === false` on the button element — avoids fake timers which caused deadlocks with userEvent
- `getByRole('button', { name: /rock/i })` correctly matches the ChoiceButton because accessible name is computed from all text content (emoji + label span)
- `getComputerChoice` randomness test runs 50 iterations and checks each result is in the valid set

### Uncertainties / flags
- None — all 24 tests pass cleanly

### Anything the reviewer should pay extra attention to
- The `waitFor` check uses `(element as HTMLButtonElement).disabled` since `toBeDisabled` is a jest-dom matcher and jest-dom is not installed
- Score increment test uses `getAllByText('1')` (not `getByText`) because multiple score cells exist; checks length > 0

### Items ready for review
- [ ] `getRoundResult`: rock beats scissors, scissors beats paper, paper beats rock
- [ ] `getRoundResult`: all three draw combinations return 'draw'
- [ ] `getComputerChoice`: returns only valid choices ('rock' | 'paper' | 'scissors')
- [ ] `getWinsRequired`: returns correct threshold for each mode
- [ ] `getMatchResult`: returns 'player' when player reaches threshold
- [ ] `getMatchResult`: returns 'computer' when computer reaches threshold
- [ ] `getMatchResult`: returns null when neither has reached threshold
- [ ] `getMatchResult`: free mode always returns null
- [ ] Mode select screen renders on initial load
- [ ] Clicking "Best of 3" transitions to the game screen
- [ ] Clicking a choice button shows a round result
- [ ] Score increments correctly after a win
- [ ] Match-over banner appears after player wins required rounds
- [ ] "Play Again" button resets scores and hides the banner
- [ ] "Change Mode" button returns to mode select screen
