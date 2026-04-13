# five-dice
> Based on: yahtzee

## Game Design

**What we're building:** A single-player dice game where the player rolls 5 dice up to 3 times per turn to score in 13 categories across an upper and lower section. Goal is to beat the high score.

**Rules:** Standard Yahtzee rules with these specifics:
- 5 dice, 13 rounds (one per category)
- Up to 3 rolls per turn; must score after the 3rd roll or choose to score earlier
- Upper section: score the sum of the matching die face (Ones through Sixes); 35-point bonus if upper total >= 63
- Lower section: fixed scores for Three of a Kind (sum of all dice), Four of a Kind (sum of all dice), Full House (25), Small Straight (30), Large Straight (40), Five of a Kind (50), Chance (sum of all dice)
- No Joker rule
- No term "yahtzee" anywhere in the UI; the five-of-a-kind category is called "Five of a Kind"
- Bonus for extra Five of a Kind rolls: if Five of a Kind category is already scored with 50, each additional Five of a Kind scores 100 bonus points; if Five of a Kind was scored as 0, no bonus applies
- Player cannot re-score a category already filled

**Players:** Single player only. Score tracked against personal high score.

**Modes / variants:** None. Single mode only.

**Win / draw conditions:** Game ends after 13 rounds (all categories filled). Final score is totaled. If final score > stored high score, high score is updated.

**Special rules / one-off mechanics:**
- Upper section bonus: if sum of upper section scores >= 63, add 35 bonus points (tracked separately, displayed in scorecard)
- Five of a Kind bonus: 100 points per extra Five of a Kind if first one was scored as 50; 0 bonus if first was scored as 0
- Held dice are not re-rolled; player toggles hold on individual dice between rolls
- On the first roll of a turn, all dice are rolled (no holds active from prior turn)
- After scoring, all dice are cleared and held states reset for next turn

**UI flow:**
1. Home screen — shows game title, high score, Start button, Donate button, theme toggle, Help button
2. Play screen — dice area (top), roll button + roll counter, scorecard (scrollable), quit button, rules button, donate button
3. Game over screen — final score, high score (updated if beaten), Play Again button, Home button

**Edge cases:**
- Player clicks Roll on roll 3: disabled after scoring, must pick a category first
- All categories filled: auto-advance to game over
- Player tries to score a category already filled: ignore click
- Five of a Kind bonus applies mid-game: accumulate bonus separately, add to total at end and show in scorecard
- Upper bonus threshold: show running upper total and how many points away from 63 bonus
- Reload mid-game: restore full game state from local storage
- High score of 0 or no prior score: show "No high score yet" on home screen

---

## Data Model

**Board / grid:** No board. Scorecard is a list of 13 category rows.

**Piece / token types:** 5 dice, each with value (1–6) and held (boolean).

**Game state shape:**
```ts
type Die = { value: number; held: boolean }

type CategoryKey =
  | 'ones' | 'twos' | 'threes' | 'fours' | 'fives' | 'sixes'
  | 'threeOfAKind' | 'fourOfAKind' | 'fullHouse'
  | 'smallStraight' | 'largeStraight' | 'fiveOfAKind' | 'chance'

type GameState = {
  dice: Die[]                          // length 5
  rollCount: number                    // 0 = not yet rolled this turn, 1–3
  scores: Partial<Record<CategoryKey, number>>  // undefined = not yet scored
  fiveOfAKindBonus: number             // accumulated bonus (multiples of 100)
  gamePhase: 'home' | 'playing' | 'gameOver'
}
```

**State flags:**
- `rollCount === 0`: start of turn, Roll button says "Roll" and all dice are unlit
- `rollCount === 3`: must score before rolling again — Roll button disabled
- `scores[key] !== undefined`: category is locked, row is non-interactive
- `fiveOfAKindBonus > 0`: bonus section visible in scorecard

**Turn structure:**
1. Roll (up to 3 times), toggling holds between rolls
2. Click a category row to score — locks that category
3. If all 13 categories filled, trigger game over
4. Otherwise, reset `rollCount` to 0, clear held states, start next turn

**Move validation approach:**
- `canScore(key)`: returns false if `scores[key] !== undefined`
- `canRoll()`: returns false if `rollCount >= 3` or `rollCount > 0 && no category scored yet this turn` — actually returns false only if `rollCount >= 3` (scoring resets rollCount)
- Scoring a category when `rollCount === 0`: blocked (must roll at least once)

**Invalid move handling:**
- Clicking a locked category: no-op (row has no click handler when locked)
- Clicking Roll when disabled: button has `disabled` attribute

---

## Help & Strategy Guide

**Objective:** Fill all 13 scoring categories in 13 rounds to get the highest total score possible. Beat your high score.

**Rules summary:**
- Roll up to 3 times per turn. Click dice to hold them between rolls.
- After rolling (at least once), click a category to record your score.
- Upper section (Ones–Sixes): score the sum of matching dice. Aim for 63+ to earn a 35-point bonus.
- Lower section scores: Three of a Kind and Four of a Kind score the sum of all five dice. Full House = 25. Small Straight = 30. Large Straight = 40. Five of a Kind = 50. Chance = sum of all dice.

**Key strategies:**
- Prioritize Five of a Kind early — it's worth 50 and unlocks 100-point bonuses for each additional one
- Aim for 63 in the upper section (average 3 of each number per category): getting the 35-point bonus is key to a high score
- Use Chance as a dump for a bad roll, not a good one — save it for when nothing else fits
- Full House (25) is fixed — take it as soon as you have it, don't fish for Five of a Kind
- Small Straight (30) is easier to complete than Large Straight (40); keep 4-card straights and re-roll the outlier

**Common mistakes:**
- Scoring upper categories too low (e.g., scoring Sixes with only one 6) — you need 3 per category to hit 63
- Using Five of a Kind as a Joker in another category when the bonus is more valuable
- Forgetting that Three of a Kind and Four of a Kind score sum of ALL dice — high dice values matter
- Wasting Chance on a low sum early when you'll need it as a dump later

**Tips for beginners:**
- On the first roll, look for pairs or three-of-a-kinds and hold them
- If you have 4 of a straight after one roll, hold all 4 and re-roll the fifth
- It's fine to score a 0 in a category you can't fill — just pick the least painful one to sacrifice

---

## Game Logic
- [x] `rollDice(dice: Die[]): Die[]` — re-rolls all non-held dice with random 1–6, returns new dice array
- [x] `scoreCategory(key: CategoryKey, dice: Die[]): number` — computes score for a given category and current dice
  - Ones–Sixes: sum of dice matching that face value
  - Three of a Kind: any 3+ same value → sum all dice, else 0
  - Four of a Kind: any 4+ same value → sum all dice, else 0
  - Full House: exactly 3 of one value and 2 of another → 25, else 0
  - Small Straight: 4 sequential values present (1-2-3-4, 2-3-4-5, or 3-4-5-6) → 30, else 0
  - Large Straight: 5 sequential values (1-2-3-4-5 or 2-3-4-5-6) → 40, else 0
  - Five of a Kind: all 5 same value → 50, else 0
  - Chance: sum all dice
- [x] `getPotentialScore(key: CategoryKey, dice: Die[], scores: Partial<Record<CategoryKey, number>>): number | null` — returns potential score if category unscored, null if already scored
- [x] `calcUpperTotal(scores): number` — sum of Ones–Sixes scored so far
- [x] `calcUpperBonus(scores): number` — 35 if upper total >= 63, else 0
- [x] `calcLowerTotal(scores): number` — sum of lower section scores
- [x] `calcFiveOfAKindBonus(fiveOfAKindBonus): number` — return accumulated bonus value
- [x] `calcGrandTotal(scores, fiveOfAKindBonus): number` — upper + bonus + lower + five-of-a-kind bonus
- [x] `isFiveOfAKind(dice): boolean` — all 5 dice same value
- [x] `handleScoreCategory(key)` — if `rollCount === 0` or category locked, ignore; compute score; if Five of a Kind and `scores.fiveOfAKind === 50` and `isFiveOfAKind(dice)`, add 100 to `fiveOfAKindBonus`; update scores; check if all 13 filled → game over; else reset `rollCount` to 0 and unheld all dice
- [x] `isGameOver(scores): boolean` — all 13 CategoryKeys have defined values
- [x] `saveHighScore(score: number)` — write to localStorage key `five-dice-high-score` if score > current
- [x] `loadHighScore(): number | null` — read from localStorage
- [x] `saveGameState(state: GameState)` — serialize to localStorage key `five-dice-state`
- [x] `loadGameState(): GameState | null` — restore and validate from localStorage; return null if invalid/missing
- [x] `clearGameState()` — remove `five-dice-state` from localStorage on game over or quit

---

## Components
- [x] `App` — holds all game state, renders current screen based on `gamePhase`, loads/saves to localStorage
- [x] `HomeScreen` — title, high score display ("No high score yet" if null), Start button, Donate button, theme toggle, Help button
- [x] `PlayScreen` — composes DiceArea, RollButton, ScoreCard, quit button, help button
- [x] `DiceArea` — renders 5 `Die` components; passes held toggle handler
- [x] `Die` — single die face (showing pip count), highlight when held, click to toggle hold (disabled when `rollCount === 0`)
- [x] `RollButton` — shows "Roll (X/3)" where X is rollCount; disabled when `rollCount >= 3`; on click calls `rollDice`
- [x] `ScoreCard` — renders upper section rows, upper bonus row, lower section rows, Five of a Kind bonus row (if > 0), grand total row
- [x] `ScoreRow` — single category row: name, potential score (if unscored and dice rolled), actual score (if scored); clickable when unscored and `rollCount > 0`
- [x] `GameOverScreen` — final score, high score, "New high score!" if beaten, Play Again button, Home button
- [x] `HelpModal` — rules summary and strategy tips; triggered by "?" button; accessible from all screens
- [x] `ConfirmModal` — generic confirmation dialog for quit/new game actions

---

## Styling
- [x] `global.css` — CSS variables for light/dark theme (colors, backgrounds, fonts), base reset
- [x] `App.css` — top-level layout, screen transitions
- [x] `HomeScreen.css` — full-window centered layout, border around menu items, subtle dice-themed background
- [x] `PlayScreen.css` — play area layout; dice area fixed at top, scorecard scrollable below
- [x] `DiceArea.css` — dice row layout, die sizing
- [x] `Die.css` — die face styling with pips, held highlight (border/glow), hover effect
- [x] `RollButton.css` — prominent button styling, disabled state
- [x] `ScoreCard.css` — table-like scorecard layout, section dividers
- [x] `ScoreRow.css` — row hover (if clickable), potential score styled differently from actual (muted/italic), locked row styling
- [x] `GameOverScreen.css` — centered result layout
- [x] `HelpModal.css` — modal overlay, scrollable content
- [x] `ConfirmModal.css` — compact modal with confirm/cancel buttons

---

## Accessibility
- [x] Keyboard navigation: dice holdable via Space/Enter, Roll button focusable, scorecard rows focusable and activatable via Enter
- [x] ARIA labels on all interactive elements: each die (`aria-label="Die [n]: [value], held/not held"`), Roll button, scorecard rows (`aria-label="[Category]: [score or potential score]"`)
- [x] Modal traps focus while open; Escape key closes modals

---

## Polish
- [x] Light/dark theme toggle — persisted to `five-dice-theme` in localStorage, applied via CSS class on `<html>`
- [x] Dice roll animation — brief shake/spin on dice that are being re-rolled
- [x] Potential score preview highlights the best unscored category subtly on hover
- [x] Five of a Kind bonus row appears in scorecard only after first bonus is earned
- [x] Upper bonus progress shown as "Upper: X / 63" in scorecard, turns green when 63+ reached
- [x] Donate button visible on all screens (fixed position or in header)
- [x] Game state auto-saved to localStorage on every state change (resume on reload)
- [x] Resume prompt on home screen if saved game exists: "Resume game?" button alongside Start

---

## Testing

**Unit tests — game logic (`src/gameLogic.test.ts`):**
- [x] `scoreCategory('ones', [{value:1},{value:1},{value:3},{value:4},{value:5}])` → 2
- [x] `scoreCategory('sixes', [{value:6},{value:6},{value:6},{value:6},{value:6}])` → 30
- [x] `scoreCategory('threeOfAKind', [{value:3},{value:3},{value:3},{value:4},{value:5}])` → 18
- [x] `scoreCategory('threeOfAKind', [{value:1},{value:2},{value:3},{value:4},{value:5}])` → 0
- [x] `scoreCategory('fourOfAKind', [{value:2},{value:2},{value:2},{value:2},{value:5}])` → 13
- [x] `scoreCategory('fullHouse', [{value:2},{value:2},{value:3},{value:3},{value:3}])` → 25
- [x] `scoreCategory('fullHouse', [{value:2},{value:2},{value:2},{value:2},{value:3}])` → 0
- [x] `scoreCategory('smallStraight', [{value:1},{value:2},{value:3},{value:4},{value:6}])` → 30
- [x] `scoreCategory('smallStraight', [{value:1},{value:2},{value:3},{value:5},{value:6}])` → 0
- [x] `scoreCategory('largeStraight', [{value:1},{value:2},{value:3},{value:4},{value:5}])` → 40
- [x] `scoreCategory('largeStraight', [{value:1},{value:2},{value:3},{value:4},{value:6}])` → 0
- [x] `scoreCategory('fiveOfAKind', [{value:4},{value:4},{value:4},{value:4},{value:4}])` → 50
- [x] `scoreCategory('chance', [{value:1},{value:2},{value:3},{value:4},{value:5}])` → 15
- [x] `calcUpperTotal` with sixes=18, fives=15, rest undefined → 33
- [x] `calcUpperBonus` with upper total = 63 → 35; with 62 → 0
- [x] `calcGrandTotal` — full scorecard example: upper 63 + bonus 35 + lower 167 + fiveOfAKindBonus 100 → 365
- [x] `isGameOver` — all 13 keys defined → true; 12 defined → false
- [x] Five of a Kind bonus accumulation: scoring second Five of a Kind when first scored 50 → fiveOfAKindBonus increases by 100
- [x] Five of a Kind bonus blocked: scoring second Five of a Kind when first scored 0 → fiveOfAKindBonus unchanged

**Component tests — (`src/App.test.tsx`):**
- [x] Home screen renders high score from localStorage if present
- [x] Home screen shows "No high score yet" when localStorage is empty
- [x] Clicking Start transitions to play screen
- [x] Roll button is enabled at turn start (rollCount === 0)
- [x] Roll button disabled after 3rd roll until category scored
- [x] Clicking a die toggles held state (only when rollCount > 0)
- [x] Clicking a scored category row has no effect
- [x] Scoring the final category triggers game over screen
- [x] Game over screen shows updated high score if beaten
