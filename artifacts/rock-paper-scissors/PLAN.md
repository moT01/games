# rock-paper-scissors
> Based on: rock-paper-scissors

## Game Design

**What we're building:** A browser-based Rock Paper Scissors game where a player chooses rock, paper, or scissors and the result of each round is immediately determined against the computer's random choice. The game tracks wins, losses, and draws across multiple rounds, with a configurable "best of N" match or unlimited free-play mode.

**Rules:**
- Rock beats Scissors
- Scissors beats Paper
- Paper beats Rock
- Matching choices result in a draw

**Players:** 1 player vs computer

**Modes / variants:**
- Free Play — play unlimited rounds, running score displayed
- Best of 3 — first to win 2 rounds wins the match
- Best of 5 — first to win 3 rounds wins the match

A mode select screen is shown before the game starts. After a match ends the player can return to mode select or play again in the same mode.

**Win condition:**
- Free Play: no match-level win; player tracks their own score
- Best of N: first player to reach `Math.ceil(N / 2)` round wins

**Draw / stalemate conditions:** Both players chose the same option — the round is a draw; neither score increments; round is replayed.

**Special rules / one-off mechanics:**
- None beyond the standard three-choice rules.

**UI flow:**
1. Mode select screen: player picks Free Play, Best of 3, or Best of 5
2. Game screen: player sees three choice buttons (Rock, Paper, Scissors)
3. Player clicks a choice → computer choice is randomly selected → result of the round is shown (win/loss/draw), both choices displayed with icons
4. Score updates; if match is over (Best of N), a result banner appears with a "Play Again" and "Change Mode" button
5. In Free Play, a "Reset Score" button is available; a "Change Mode" button returns to mode select

**Edge cases:**
- Draw round: neither score increments, prompt player to play again
- Match over immediately (e.g., player wins first two rounds of Best of 3)
- Rapid clicks: disable buttons while result is being shown (brief reveal delay)
- All three modes must correctly compute the required wins threshold

---

## Data Model

**Board / grid:** None — no board. Each round is a single simultaneous choice.

**Piece / token types:**
```ts
type Choice = 'rock' | 'paper' | 'scissors';
type RoundResult = 'win' | 'loss' | 'draw';
type GameMode = 'free' | 'best-of-3' | 'best-of-5';
type MatchResult = 'player' | 'computer' | null;
```

**Game state shape:**
```ts
interface GameState {
  mode: GameMode | null;          // null = on mode select screen
  playerScore: number;
  computerScore: number;
  drawCount: number;
  roundsPlayed: number;
  lastPlayerChoice: Choice | null;
  lastComputerChoice: Choice | null;
  lastRoundResult: RoundResult | null;
  matchResult: MatchResult;       // null = match still in progress
  isRevealing: boolean;           // true during brief animation/disable window
}
```

**State flags:**
- `mode === null` → show mode select screen
- `matchResult !== null` → show match-over banner (Best of N modes only)
- `isRevealing` → buttons disabled

**Turn structure:** Every round is atomic: player picks → computer picks → result computed → state updated. No multi-step turns.

**Move validation approach:** No invalid moves possible — the three buttons are always valid. Buttons are disabled (`isRevealing`) while result is showing to prevent double submission.

**Invalid move handling:** N/A — UI prevents it via button disabled state.

---

## AI / Computer Player

**Strategy approach:** Pure random — `Math.random()` selects uniformly from `['rock', 'paper', 'scissors']`. No adaptive or difficulty-based logic needed for this game.

**Difficulty levels:** None — random is the canonical RPS computer opponent.

**Performance constraints:** None — the computation is trivial.

---

## Setup
- [x] Create `rock-paper-scissors/` folder and bootstrap.

---

## Game Logic
- [x] `getComputerChoice(): Choice` — returns a random choice
- [x] `getRoundResult(player: Choice, computer: Choice): RoundResult` — returns win/loss/draw
- [x] `getWinsRequired(mode: GameMode): number` — returns threshold (Infinity for free, 2 for best-of-3, 3 for best-of-5)
- [x] `getMatchResult(playerScore: number, computerScore: number, mode: GameMode): MatchResult` — returns winner or null if match ongoing

---

## Components
- [x] `App` — top-level layout, holds all game state via `useReducer` or `useState`, renders `ModeSelect` or `GameScreen` based on `mode`
- [x] `ModeSelect` — three buttons for Free Play / Best of 3 / Best of 5; no state of its own
- [x] `GameScreen` — displays the choice buttons, current scores, last round choices and result, match-over banner; receives state and callbacks from App
- [x] `ChoiceButton` — renders a single Rock/Paper/Scissors button with icon; accepts `choice`, `onClick`, `disabled` props
- [x] `RoundResult` — displays both choices (player and computer) with icons and the round outcome text (e.g., "You win! Rock beats Scissors")
- [x] `ScoreBoard` — displays player score, computer score, draw count, and (for Best of N) the match progress

---

## Interaction Model

**Input method:** Mouse/touch clicks on `ChoiceButton` components. No keyboard shortcuts needed.

**Visual feedback:**
- Buttons highlight on hover
- After a choice, both the player's and computer's choices are shown with icons
- Round result text (Win / Loss / Draw) shown prominently
- In Best of N, a match-over banner overlays or replaces the choice buttons
- `isRevealing` flag disables buttons for ~600ms after each choice to let the player read the result before playing again

**Captured / out-of-play pieces:** N/A — no pieces.

---

## Styling
- [x] `global.css` — CSS variables (colors, font), reset, body background
- [x] `App.css` — overall page layout, centered container
- [x] `ModeSelect.css` — mode select screen layout, button group
- [x] `GameScreen.css` — game area layout, score area, choice buttons row, result area
- [x] `ChoiceButton.css` — button size, icon sizing, hover/active states, disabled state
- [x] `RoundResult.css` — result display, choice icons side by side, outcome text styling
- [x] `ScoreBoard.css` — score row layout, label and number styling

---

## Polish
- [x] Show emoji or SVG icons for each choice (rock ✊, paper ✋, scissors ✌️) on the buttons and in the round result display
- [x] Smooth reveal animation on the round result (fade-in or slide-in)
- [x] Match-over banner with clear win/loss message and action buttons
- [x] "vs" text between player and computer choices in the result display
- [x] Subtle button press animation (scale down on active)

---

## Testing

**Unit tests — game logic (`src/gameLogic.test.ts`):**
- [x] `getRoundResult`: rock beats scissors, scissors beats paper, paper beats rock
- [x] `getRoundResult`: all three draw combinations return 'draw'
- [x] `getComputerChoice`: returns only valid choices ('rock' | 'paper' | 'scissors')
- [x] `getWinsRequired`: returns correct threshold for each mode
- [x] `getMatchResult`: returns 'player' when player reaches threshold
- [x] `getMatchResult`: returns 'computer' when computer reaches threshold
- [x] `getMatchResult`: returns null when neither has reached threshold
- [x] `getMatchResult`: free mode always returns null

**Component tests — (`src/App.test.tsx`):**
- [x] Mode select screen renders on initial load
- [x] Clicking "Best of 3" transitions to the game screen
- [x] Clicking a choice button shows a round result
- [x] Score increments correctly after a win
- [x] Match-over banner appears after player wins required rounds
- [x] "Play Again" button resets scores and hides the banner
- [x] "Change Mode" button returns to mode select screen
