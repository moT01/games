# five-dice
> Based on: yahtzee

## Game Design

**What we're building:** A single-player browser game based on Yahtzee. The player rolls five dice up to three times per turn, holding any dice they want between rolls, then scores the result in one of thirteen scoring categories. After thirteen turns the game ends and the player's total score is displayed. The goal is to maximize the final score.

**Rules:**
- Each turn consists of up to three rolls of five dice.
- After the first roll the player may hold any combination of dice (0–5) to keep them out of the next roll.
- After the second roll the player may again hold/unhold dice.
- After three rolls (or at any point the player chooses to stop early) the player must select exactly one scoring category that has not yet been used.
- Each category may only be scored once per game.
- If a category cannot be scored positively, the player may still assign it (scoring 0) to use it up — this is called a "scratch".
- The game lasts exactly 13 turns (one per category).

**Players:** Single player (no multiplayer, no AI opponent).

**Modes / variants:** None. Standard Yahtzee rules, single player.

**Win condition:** There is no win/lose — the game ends after 13 turns and displays the final score. Players aim for the highest score possible. A perfect game is 1575 points (theoretical maximum).

**Draw / stalemate conditions:** Not applicable.

**Special rules / one-off mechanics:**
- **Upper section bonus:** If the sum of the upper section (Ones through Sixes) is 63 or more, a 35-point bonus is added to the upper section subtotal.
- **Yahtzee bonus:** If the player scores a Yahtzee (five of a kind) in the Yahtzee category and rolls additional Yahtzees later, each extra Yahtzee earns a 100-point bonus, AND the player must score the additional Yahtzee somewhere else following joker rules (full house = 25, small straight = 30, large straight = 40, or upper section matching the die face, or any lower section for 0).
- **Yahtzee scored as 0:** If the player originally scratched the Yahtzee category (scored 0 there), no Yahtzee bonus applies on subsequent Yahtzees.
- **Joker rules (v1 scope):** When a Yahtzee bonus applies, joker rules (full house = 25, small straight = 30, large straight = 40) are fully out of scope for v1 — not enforced, not hinted. The player may score the extra Yahtzee in any unscored category using standard scoring.

**UI flow:**
1. Player sees five dice rendered greyed out (placeholder state — not yet rolled). A "Roll Dice" button is enabled and prompts the first roll.
2. Player clicks "Roll Dice" — all unheld dice are re-rolled. Roll count increments (1 of 3).
3. Player may click individual dice to toggle hold/unhold. Held dice are visually marked.
4. Player may roll again (up to two more times) or score immediately.
5. After choosing to score, the player clicks an unscored category in the scorecard.
6. The score for that category is calculated and locked in. The turn ends.
7. Hold state clears, roll count resets for the new turn.
8. After 13 turns, a "Game Over" screen shows the final scorecard and total score with a "Play Again" button.

**Edge cases:**
- Player tries to score before rolling — Roll button must be clicked at least once before scoring is allowed.
- Player tries to roll a 4th time — Roll button is disabled after 3 rolls; player must score.
- Player clicks an already-scored category — no action, visually locked.
- All dice held — rolling is allowed but nothing changes (all dice stay the same). Roll count still increments.
- Zero dice held — all five re-roll.
- Yahtzee category already scored as 0, then player rolls another Yahtzee — no bonus, no joker rules enforced (standard scratch behavior).
- Yahtzee category scored as 50, then player rolls another Yahtzee — 100-point bonus added to `yahtzeeBonusCount`. No joker rules enforced or hinted; player scores the extra Yahtzee in any unscored category using standard scoring.
- Player scores on turn 1 without rolling (not allowed — Roll button must fire at least once).
- Game over state — all interactions locked except "Play Again".

---

## Data Model

**Board / grid:** No grid. Five dice displayed in a row.

**Piece / token types:**
- Die: `{ id: number; value: 1 | 2 | 3 | 4 | 5 | 6; held: boolean }`

**Game state shape:**
```ts
type Die = { id: number; value: number; held: boolean };

type ScoreCategory =
  | 'ones' | 'twos' | 'threes' | 'fours' | 'fives' | 'sixes'
  | 'threeOfAKind' | 'fourOfAKind' | 'fullHouse'
  | 'smallStraight' | 'largeStraight'
  | 'yahtzee' | 'chance';

type Scores = Record<ScoreCategory, number | null>; // null = not yet scored

type GameState = {
  dice: Die[];
  rollCount: number;       // 0 = not rolled yet this turn, 1–3
  turn: number;            // 1–13
  scores: Scores;
  yahtzeeBonusCount: number;
  gameOver: boolean;
};
```

**State flags:**
- `rollCount === 0` — player has not rolled yet this turn (must roll before scoring)
- `rollCount === 3` — player must score (no more rolls)
- `gameOver === true` — all interactions disabled, show final screen

**Turn structure:**
1. Roll count resets to 0, all dice unheld.
2. Player rolls (rollCount 1→2→3).
3. Player selects a category → score locked → turn increments.
4. After turn 13 → `gameOver = true`.

**Move validation approach:**
- Scoring a category: blocked if `rollCount === 0` (no roll yet) or if the category is already scored (not null).
- Rolling: blocked if `rollCount >= 3` or `gameOver`.

**Invalid move handling:** Buttons are disabled in the UI. No error messages needed — disabled state is sufficient.

---

## AI / Computer Player

Not applicable. Single-player game only.

---

## Setup
- [x] Create `five-dice/` folder and bootstrap (see CLAUDE.md → Bootstrapping a New Game)
- [x] Clean up Vite boilerplate
- [x] Add `global.css`

---

## Game Logic

All logic lives in `src/gameLogic.ts`.

- [ ] `rollDice(dice: Die[]): Die[]` — re-rolls all unheld dice, returns new dice array with random values 1–6
- [ ] `toggleHold(dice: Die[], id: number): Die[]` — flips the `held` flag on the die with matching id
- [ ] `scoreOnes(dice: Die[]): number` — sum of all dice showing 1
- [ ] `scoreTwos(dice: Die[]): number` — sum of all dice showing 2
- [ ] `scoreThrees(dice: Die[]): number` — sum of all dice showing 3
- [ ] `scoreFours(dice: Die[]): number` — sum of all dice showing 4
- [ ] `scoreFives(dice: Die[]): number` — sum of all dice showing 5
- [ ] `scoreSixes(dice: Die[]): number` — sum of all dice showing 6
- [ ] `scoreThreeOfAKind(dice: Die[]): number` — sum of all dice if three or more share a value, else 0
- [ ] `scoreFourOfAKind(dice: Die[]): number` — sum of all dice if four or more share a value, else 0
- [ ] `scoreFullHouse(dice: Die[]): number` — 25 if dice show a three-of-a-kind and a pair, else 0
- [ ] `scoreSmallStraight(dice: Die[]): number` — 30 if dice contain four sequential values (1-2-3-4, 2-3-4-5, or 3-4-5-6), else 0
- [ ] `scoreLargeStraight(dice: Die[]): number` — 40 if dice are exactly 1-2-3-4-5 or 2-3-4-5-6, else 0
- [ ] `scoreYahtzee(dice: Die[]): number` — 50 if all five dice show the same value, else 0
- [ ] `scoreChance(dice: Die[]): number` — sum of all five dice
- [ ] `calculateScore(category: ScoreCategory, dice: Die[]): number` — dispatcher that calls the correct scorer; also used directly for scorecard preview display (no separate `getPotentialScore` wrapper needed)
- [ ] `getUpperSectionTotal(scores: Scores): number` — sum of ones through sixes (excluding nulls)
- [ ] `getUpperBonus(scores: Scores): number` — 35 if upper section total >= 63, else 0
- [ ] `getLowerSectionTotal(scores: Scores): number` — sum of lower section categories (excluding nulls)
- [ ] `getYahtzeeBonusTotal(bonusCount: number): number` — bonusCount * 100
- [ ] `getGrandTotal(scores: Scores, bonusCount: number): number` — upper total + upper bonus + lower total + yahtzee bonus total
- [ ] `isGameOver(turn: number): boolean` — returns true when turn > 13
- [ ] `initialDice(): Die[]` — returns array of 5 dice all with value 1 and `held: false`; these are placeholder values used before the first roll. Dice with `rollCount === 0` are rendered greyed out to signal they have not been rolled yet — their face values are not meaningful.

---

## Components

- [ ] `App` (`src/App.tsx`) — top-level state management (useReducer or useState), renders DiceArea, Scorecard, and GameOverScreen
- [ ] `DiceArea` (`src/components/DiceArea.tsx`) — displays five `Die` components and the Roll button; receives dice, rollCount, onRoll, onToggleHold
- [ ] `Die` (`src/components/Die.tsx`) — displays a single die face (value 1–6 as dots or number), held/unheld visual state; receives die, onToggleHold, disabled
- [ ] `Scorecard` (`src/components/Scorecard.tsx`) — displays all 13 categories with current score or potential score preview; preview scores are computed by calling `calculateScore` directly; handles category selection; displays a Yahtzee Bonus row showing `yahtzeeBonusCount × 100`; displays the grand total; receives scores, dice, rollCount, yahtzeeBonusCount, onScore
- [ ] `ScoreRow` (`src/components/ScoreRow.tsx`) — a single row in the scorecard: category name, score or preview, locked state; receives category label, score, previewScore, isLocked, onScore, and `canScore: boolean` — true when `rollCount >= 1`, the category is not yet scored, and game is not over
- [ ] `GameOverScreen` (`src/components/GameOverScreen.tsx`) — final scorecard summary and total score with a Play Again button; receives scores, yahtzeeBonusCount, onPlayAgain

---

## Interaction Model

**Input method:** Mouse clicks only (no keyboard or drag-and-drop in v1).
- Click "Roll Dice" button to roll
- Click a die to toggle hold (only allowed after at least one roll, and only when rollCount < 3 and not game over)
- Click a scorecard row to assign a score (only when rollCount >= 1 and category is unscored)

**Visual feedback:**
- Held dice: visually distinct (e.g. border highlight, pushed-in appearance, or marked with a lock icon)
- Potential scores: unscored categories show a greyed-out preview of what the current dice would score
- Roll button: shows "Roll (1/3)", "Roll (2/3)", "Roll (3/3 — must score)" — or disabled when rollCount === 3 or gameOver
- Locked categories: styled differently (darker, not clickable)
- Upper bonus: progress shown (e.g. "42 / 63") in the scorecard between upper and lower sections
- Current turn and roll count displayed near the dice area

**Captured / out-of-play pieces:** Not applicable (no pieces are removed from play).

---

## Styling
- [ ] `global.css` — CSS variables for colors, fonts, resets
- [ ] `App.css` — overall layout (two-column: dice area left, scorecard right, or stacked on mobile)
- [ ] `DiceArea.css` — dice row, roll button placement
- [ ] `Die.css` — die face with dots or number, held state highlight
- [ ] `Scorecard.css` — table-like scorecard layout with upper/lower section dividers
- [ ] `ScoreRow.css` — row hover, locked, preview, and scored states
- [ ] `GameOverScreen.css` — centered overlay or full-page final score display

---

## Polish
- [ ] Die faces shown as pip dots (like real dice) rather than plain numbers
- [ ] Roll button shake/roll animation on dice that are not held
- [ ] Smooth transition when a score is locked in (row color change)
- [ ] Disabled Roll button clearly greyed out with cursor: not-allowed
- [ ] "Play Again" resets all state cleanly (no page reload)
- [ ] Responsive layout — scorecard stacks below dice on narrow screens

---

## Testing

**Unit tests — game logic (`src/gameLogic.test.ts`):**
- [ ] `rollDice` — held dice keep their values; unheld dice change (statistical: run multiple times or mock Math.random)
- [ ] `toggleHold` — toggles held flag on correct die, others unchanged
- [ ] `scoreOnes` through `scoreSixes` — correct sum for various inputs
- [ ] `scoreThreeOfAKind` — returns sum when 3+ match, 0 otherwise
- [ ] `scoreFourOfAKind` — returns sum when 4+ match, 0 otherwise
- [ ] `scoreFullHouse` — 25 for valid full house, 0 otherwise; five-of-a-kind does NOT count as full house (standard rules)
- [ ] `scoreSmallStraight` — 30 for valid 4-run, 0 otherwise; duplicates allowed (e.g. 1,2,3,4,4 is valid)
- [ ] `scoreLargeStraight` — 40 for valid 5-run, 0 otherwise
- [ ] `scoreYahtzee` — 50 for five matching, 0 otherwise
- [ ] `scoreChance` — always returns sum of all five dice
- [ ] `getUpperSectionTotal` — sums only non-null upper scores
- [ ] `getUpperBonus` — 35 when >= 63, 0 otherwise
- [ ] `getYahtzeeBonusTotal` — returns 0 for 0 bonuses, 100 for 1, 200 for 2
- [ ] `getGrandTotal` — correctly combines all parts including yahtzee bonus

**Component tests — (`src/App.test.tsx`):**
- [ ] Initial render shows 5 dice and a Roll button
- [ ] Roll button is enabled on first turn before rolling
- [ ] Clicking Roll increments roll count display
- [ ] After 3 rolls, Roll button becomes disabled
- [ ] Clicking a die after rolling toggles its held appearance
- [ ] Clicking an unscored category after rolling assigns a score and advances the turn
- [ ] Clicking an already-scored category does nothing
- [ ] Clicking Roll before rolling at least once blocks scoring (score rows non-interactive)
- [ ] After 13 turns, GameOverScreen renders with final score
- [ ] Play Again button resets the game to initial state
