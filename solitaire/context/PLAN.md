# solitaire
> Based on: Klondike Solitaire

## Game Design

**What we're building:** A single-player Klondike Solitaire card game with draw-1 or draw-3 mode selection, Windows-style scoring, and session win/loss tracking.

**Rules:**
- Standard 52-card deck
- 7 tableau columns (1–7 cards, only bottom card face-up)
- 4 foundation piles (one per suit, built Ace → King)
- 1 stock pile (remaining cards face-down)
- 1 waste pile (flipped cards from stock)
- Tableau: build down in alternating red/black colors
- Foundation: build up by suit (A, 2, 3 … K)
- Face-down tableau cards are flipped when uncovered
- Empty tableau columns accept only Kings (or stacks starting with a King)
- Empty foundation piles accept only Aces

**Players:** Single player, no AI.

**Modes / variants:**
- Draw 1 — flip one card from stock at a time; unlimited recycles through stock, no recycle penalty
- Draw 3 — flip three cards at a time, only top card of waste is playable; unlimited passes through stock, -20 score penalty per recycle (after first pass through)

**Win condition:** All 52 cards moved to the four foundation piles.

**Draw / stalemate conditions:** No forced draw/stalemate detection required. Game ends when player gives up or wins.

**Special rules / one-off mechanics:**
- Auto-complete: once all cards are face-up, offer an "Auto-Complete" button that plays remaining moves automatically to foundations one card at a time (animated)
- Stock exhausted: clicking empty stock resets waste back to stock (unlimited recycles); draw-3 mode incurs -20 penalty per recycle after first pass
- Score floor: score cannot go below 0

**UI flow:**
1. Setup screen: choose Draw 1 or Draw 3, then click "New Game"
2. Game screen: tableau, foundations, stock/waste, score display, timer, session record (W–L), New Game button
3. Win screen: celebration message, final score (including time bonus), session tally (W–L), "Play Again" button

**Edge cases:**
- Clicking empty stock resets waste to stock; draw-3 incurs -20 penalty each time after first pass
- Moving a partial tableau stack (only face-up cards can be moved as a group; face-down cards cannot be part of a moved stack)
- King moved to empty column starts a new stack
- Draw 3 shows up to 3 cards fanned in waste; only top (rightmost) card is interactive
- Score cannot go below 0
- Time bonus only awarded on win: `Math.max(0, 35000 / secondsElapsed) | 0` (integer division), only if game won in under 30,000 seconds; if elapsed ≤ 0 treat as 1 to avoid divide-by-zero

---

## Data Model

**Board / grid:** No grid. Positional layout determined by pile type.

**Piece / token types:**
```ts
type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
type Card = { suit: Suit; rank: Rank; faceUp: boolean };
```

**Game state shape:**
```ts
type GameState = {
  tableau: Card[][];       // 7 columns; index 0 = leftmost
  foundations: Card[][];   // 4 piles; index order: hearts, diamonds, clubs, spades
  stock: Card[];
  waste: Card[];
  drawMode: 1 | 3;
  score: number;
  stockRecycles: number;   // how many times stock has been reset (penalty kicks in after first recycle in draw-3)
};

type SessionStats = {
  wins: number;
  losses: number;
};
```

**State flags:**
- `gameStatus: 'setup' | 'playing' | 'won'`
- `autoCompleteAvailable: boolean` — true when stock is empty and all tableau cards are face-up (waste may still have cards; auto-complete will move them too)
- `startTime: number | null` — `Date.now()` when game starts, used for time bonus on win

**Turn structure:** Player performs one action at a time (click or drag). No turns — continuous play.

**Move type:**
```ts
type MoveSource = 'waste' | 'tableau' | 'foundation';
type MoveTarget = 'tableau' | 'foundation';
type Move = {
  source: MoveSource;
  sourceIndex: number;   // column or pile index (0–6 for tableau, 0–3 for foundation, 0 for waste)
  cardIndex?: number;    // index of the bottom card of the moved stack within the source tableau column
  target: MoveTarget;
  targetIndex: number;   // column or pile index
};
```

**Move validation approach:** Pure functions in `gameLogic.ts`. Each move type validated before state update.

**Invalid move handling:** Ignore silently (no visual error). Selected card deselects if click target is invalid.

---

## AI / Computer Player

N/A — single player game.

---

## Setup
- [x] Create `solitaire/` folder and bootstrap project with boilerplate.

---

## Game Logic
- [x] `gameLogic.ts` — deck creation and shuffle (`createDeck`, `shuffleDeck`)
- [x] `gameLogic.ts` — deal initial Klondike layout (`dealGame`): returns fresh `GameState` with tableau, stock, empty foundations/waste
- [x] `gameLogic.ts` — move validation: tableau stack → tableau column (`canMoveToTableau(bottomCard: Card, targetColumn: Card[])`): `bottomCard` is the bottom card of the moving stack; validity is determined solely by that card against the top of the target column (or empty column rule)
- [x] `gameLogic.ts` — move validation: single card → foundation (`canMoveToFoundation(card, foundationPile)`)
- [x] `gameLogic.ts` — draw from stock (`drawFromStock(state)`): flip 1 or 3 cards to waste per `drawMode`
- [x] `gameLogic.ts` — reset stock from waste (`resetStock(state)`): moves waste back to stock face-down, increments `stockRecycles`, applies -20 score penalty if draw-3 and `stockRecycles >= 1`
- [x] `gameLogic.ts` — apply move and return new state (`applyMove(state, move)`): handles all move types, awards points, flips newly revealed tableau cards (+5 score), clamps score ≥ 0, and sets `autoCompleteAvailable` by calling `canAutoComplete` on the resulting state
- [x] `gameLogic.ts` — win detection (`checkWin(state)`): true when all 4 foundations have 13 cards
- [x] `gameLogic.ts` — auto-complete check (`canAutoComplete(state)`): true when `stock.length === 0` and every card in every tableau column is face-up; waste cards may still be present — auto-complete handles moving them to foundations too; called by `applyMove`, `drawFromStock`, and `resetStock` to keep `autoCompleteAvailable` in sync after every state change
- [x] `gameLogic.ts` — time bonus calculation (`calcTimeBonus(startTime, endTime)`): `Math.floor(35000 / Math.max(1, seconds))`

**Scoring rules (Windows Classic):**
| Action | Points |
|---|---|
| Waste → Foundation | +10 |
| Waste → Tableau | +5 |
| Tableau → Foundation | +10 |
| Flip tableau card (face-down → face-up) | +5 |
| Foundation → Tableau (moving card back) | -15 |
| Stock recycle (draw-3, recycles after first pass) | -20 each |
| Time bonus on win | `floor(35000 / seconds)` added to final score |
| Score floor | 0 (never negative) |

---

## Components
- [x] `App` — top-level state container: `gameStatus`, `gameState`, `sessionStats`, `startTime`; renders the correct screen
- [x] `SetupScreen` — draw mode radio buttons (Draw 1 / Draw 3) + "New Game" button
- [x] `GameBoard` — lays out all pile areas: Stock+Waste row, Foundations row, Tableau
- [x] `FoundationPile` — single foundation slot; shows top card or empty placeholder; accepts drops/clicks
- [x] `TableauColumn` — single tableau column; renders stacked cards with offsets; handles selection
- [x] `StockPile` — stock pile (click to draw) and waste fan (shows top 1 or top 3 fanned slightly)
- [x] `Card` — renders a single card face-up (rank + suit, colored) or face-down (back pattern); selected state styling
- [x] `ScoreBar` — score, session W–L, draw mode label, New Game button; sits above board
- [x] `WinScreen` — win overlay: "You Win!", base score, time bonus, total score, session W–L, "Play Again" button

---

## Interaction Model

**Input method:** Click-to-select then click-to-place (two-click move). Click a card or stack to select it (highlighted), then click a valid target pile/column to complete the move. Click elsewhere or re-click to deselect. No drag required.

**Selection rules:**
- Clicking a face-up card in tableau selects it and all cards below it in the column (the movable stack)
- Clicking the top card of the waste pile selects it
- Clicking a foundation top card selects it (to move back to tableau; rare but legal)
- Face-down cards are not selectable

**Visual feedback:**
- Selected card/stack: highlighted border or slight lift (CSS class `selected`)
- Valid drop targets when a card is selected: subtle highlight on eligible columns/foundations
- Face-down cards show card back pattern (CSS only, no image)
- Empty piles show a placeholder outline

**Captured / out-of-play pieces:** N/A — no captures in solitaire.

---

## Styling
- [x] `global.css` — CSS variables (green felt `--felt-green`, card white/cream, red/black suit colors, font), box-sizing reset
- [x] `App.css` — full-height layout, centers board
- [x] `SetupScreen.css` — centered card-style panel, radio buttons, button
- [x] `GameBoard.css` — CSS grid: top row (stock/waste + spacer + 4 foundations), second row (7 tableau columns)
- [x] `Card.css` — card dimensions (fixed width/height ratio), face-up display (rank top-left + bottom-right, suit center), face-down back pattern, `.selected` highlight
- [x] `ScoreBar.css` — horizontal bar above board, spaced items
- [x] `WinScreen.css` — centered overlay with win message and stats

---

## Polish
- [x] CSS transition on card selection (subtle scale or border animation)
- [x] Auto-complete button appears when `canAutoComplete` is true; clicking it steps cards one-by-one to foundations with a short interval (e.g., 50ms per card) using `setInterval`
- [x] Card back has a simple repeating CSS pattern (e.g., diagonal lines or dot grid via CSS)
- [x] Waste pile in draw-3 mode fans the top 3 cards with slight horizontal offset so player can see them

---

## Testing

**Unit tests — game logic (`src/gameLogic.test.ts`):**
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

**Component tests — (`src/App.test.tsx`):**
- [ ] Renders setup screen initially
- [ ] Selecting draw mode and clicking New Game transitions to game screen
- [ ] Clicking stock pile adds card(s) to waste
- [ ] Win screen appears when `checkWin` returns true (mock `gameLogic`)
- [ ] Win screen shows correct session tally after win
- [ ] "Play Again" on win screen returns to setup screen and increments win count
- [ ] Auto-complete button renders when `canAutoComplete` returns true (mock `gameLogic` so `canAutoComplete` returns true)
- [ ] Clicking auto-complete button steps cards to foundations — mock `setInterval` (via `vi.useFakeTimers`) and advance timers to verify `applyMove` is called for each remaining card
