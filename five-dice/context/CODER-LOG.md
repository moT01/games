## Section: Testing

### Files created / modified
- `five-dice/src/gameLogic.test.ts` — unit tests for all game logic functions
- `five-dice/src/App.test.tsx` — component integration tests via @testing-library/react

### Decisions made
- `globals: true` is set in vite.config.ts so vitest globals are available, but imports from 'vitest' are used explicitly for type safety
- No `@testing-library/jest-dom` in devDependencies, so all assertions use standard DOM APIs (`element.disabled`, `element.className`) rather than jest-dom matchers like `toBeDisabled()` / `toHaveClass()`
- `d(values, heldAt)` helper creates Die arrays concisely for logic tests
- `nullScores` constant avoids repeating the full 13-category null object in every upper/bonus test
- `playFullGame()` helper in App tests clicks Roll then scores each of the 13 categories in scorecard order — used for the game over and Play Again tests
- `rollDice` tests mock `Math.random` with `vi.spyOn` + `afterEach(vi.restoreAllMocks)` to get deterministic results
- All 47 tests pass (`npm test -- --run`)

### Uncertainties / flags
- None

### Anything the reviewer should pay extra attention to
- `scoreFullHouse` five-of-a-kind test: verifies the non-obvious rule that five-of-a-kind does NOT count as full house
- `scoreSmallStraight` duplicate test: `[1,2,3,4,4]` must return 30 (duplicates allowed)
- `getGrandTotal` test: math check — 63 + 35 + 183 + 100 = 381 with yahtzeeBonusCount=1
- App test "clicking an already-scored category does nothing": scores Chance on turn 1, advances to turn 2, then verifies clicking the same (now locked) row on turn 2 does not advance to turn 3
- App test "after 13 turns": the `playFullGame` helper uses `/Roll/i` regex to match roll button across all turn states (1/3, 2/3, 3/3—must score)

### Items ready for review
- [ ] `rollDice` — held dice keep their values; unheld dice change (mock Math.random)
- [ ] `toggleHold` — toggles held flag on correct die, others unchanged
- [ ] `scoreOnes` through `scoreSixes` — correct sum for various inputs
- [ ] `scoreThreeOfAKind` — returns sum when 3+ match, 0 otherwise
- [ ] `scoreFourOfAKind` — returns sum when 4+ match, 0 otherwise
- [ ] `scoreFullHouse` — 25 for valid full house, 0 otherwise; five-of-a-kind does NOT count
- [ ] `scoreSmallStraight` — 30 for valid 4-run, 0 otherwise; duplicates allowed
- [ ] `scoreLargeStraight` — 40 for valid 5-run, 0 otherwise
- [ ] `scoreYahtzee` — 50 for five matching, 0 otherwise
- [ ] `scoreChance` — always returns sum of all five dice
- [ ] `getUpperSectionTotal` — sums only non-null upper scores
- [ ] `getUpperBonus` — 35 when >= 63, 0 otherwise
- [ ] `getYahtzeeBonusTotal` — returns 0, 100, 200 for 0, 1, 2 bonuses
- [ ] `getGrandTotal` — correctly combines all parts including yahtzee bonus
- [ ] Initial render shows 5 dice and a Roll button
- [ ] Roll button is enabled on first turn before rolling
- [ ] Clicking Roll increments roll count display
- [ ] After 3 rolls, Roll button becomes disabled
- [ ] Clicking a die after rolling toggles its held appearance
- [ ] Clicking an unscored category after rolling assigns a score and advances the turn
- [ ] Clicking an already-scored category does nothing
- [ ] Clicking Roll before rolling blocks scoring
- [ ] After 13 turns, GameOverScreen renders with final score
- [ ] Play Again button resets the game to initial state
