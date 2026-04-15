# cribbage
> Based on: cribbage

## Game Design

**What we're building:** 2-player cribbage (human vs computer) with a traditional rectangular peg board, standard 121-point rules, and a toggle between manual and auto scoring during the show phase.

**Rules:** Standard 6-card cribbage. Each hand: deal 6 cards each, both discard 2 to the crib (dealer's bonus hand), non-dealer cuts to reveal the starter card, play phase (pegging), then show phase (counting hands and crib). First to 121 wins.

**Players:** Human vs computer. Dealer alternates each hand. First dealer is determined by a cut-for-deal at game start (lower card deals; ties re-cut).

**Modes / variants:** Single mode — human vs computer, 121 points. Counting mode toggle (manual / auto) stored in localStorage and toggleable from the play screen.

**Win / draw conditions:** First player whose score reaches 121 wins — including mid-pegging. If a player hits 121 during pegging, the game ends immediately (no show phase for that hand). Non-dealer counts their show hand first; if they reach 121 during show, the game ends before dealer counts.

**Special rules / one-off mechanics:**
- Nibs: if the starter card cut is a Jack, the dealer scores 2 points immediately.
- Nobs: if a player holds a Jack matching the suit of the starter card, they score 1 point during show.
- Go: during play, if a player cannot play any card without exceeding 31, a "Go" button appears — the player must click it to pass. The opponent then continues playing if able. The player who plays the last card in a go sequence scores 1 point (or 2 if they hit exactly 31).
- Running count resets to 0 after 31 is reached or after a go sequence resolves; all unplayed cards then continue in a new count.
- Crib flush: requires all 5 cards (4 crib + starter) to match suit. A 4-card crib flush does not score.
- Hand flush: 4 hand cards matching suit = 4 pts; if starter also matches = 5 pts. Starter alone does not create a flush.
- Manual counting requires all points to be found before "Done" is enabled — the "Done" button stays disabled while `remainingPoints > 0`. No muggins; the player simply cannot finish until everything is counted.
- Skunk line at 61 shown visually on board; no scoring penalty applied.

**UI flow:**
1. Home screen — title, start button, counting mode toggle, theme toggle, donate button.
2. Cut-for-deal screen — full deck spread face-down; player clicks any card to reveal it; computer's card auto-reveals after a short delay; lower rankOrder wins (Ace lowest); ties re-cut with same UI; winner label shown, then transition.
3. Deal phase — deal 6 cards to each player; computer hand shown face-down.
4. Discard phase — human selects 2 cards to send to crib; computer AI discards simultaneously.
5. Cut phase — non-dealer clicks "Cut" button to reveal starter; nibs check fires immediately with toast.
6. Play phase — human clicks a card to select it (highlighted), then clicks "Play Card" button to confirm; if unable to play, a "Go" button appears and must be clicked to pass; running total shown; scoring events shown as toasts.
7. Show phase — non-dealer counts first; counting mode determines UI. Then dealer counts hand, then dealer counts crib.
8. Hand summary — score breakdown for the completed hand before next deal.
9. Game over screen — winner, final scores, play again.

**Edge cases:**
- Cut-for-deal tie (same rank): re-deal the spread and cut again; repeat until ranks differ.
- If both players run out of cards before 31 is reached, the last card played scores 1 (go rule applies).
- If human pegs to exactly 121 during play phase, game ends immediately before computer plays.
- After a go resolves, the count resets — pairs and runs do not carry across a reset.
- If the starter is a Jack (nibs), dealer scores 2 before pegging begins; check win immediately.
- During show, if the non-dealer reaches 121, the dealer does not count — game ends.
- Crib belongs to the dealer: if computer is dealer, crib is auto-counted regardless of counting mode. If human is dealer and mode is manual, human counts crib manually.
- A run during pegging is detected by looking at the last N cards in the current sequence (N = current sequence length down to 3); check largest N first. Duplicate ranks within a run sequence multiply the run count (e.g., 3-4-3-5 → last 4 cards contain ranks 3,3,4,5: unique ranks 3,4,5 are consecutive, each appears with equal multiplicity 1 except 3 appears twice — invalid multiplicity so no 4-card run; try last 3: many options — 4,3,5 → consecutive ranks 3,4,5 = run of 3; also check 3,3,5 = not consecutive; score best match = 3 pts).
- Flush during pegging does not score.
- Computer show phase is always auto-counted regardless of counting mode.

---

## Data Model

**Board / grid:** Two peg tracks (human and computer), each with 121 holes (hole 0 = start/off-board, holes 1-121). Rendered as a rectangular SVG board: each player's track arranged as two rows of 60 + 61 holes in a snake pattern (left-to-right on row 1, right-to-left on row 2). Skunk mark at hole 61.

**Piece / token types:**
```typescript
type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'
interface Card { id: string; suit: Suit; rank: Rank }
// cardValue(card): A=1, 2-9=pip, 10/J/Q/K=10  (used for 15s and running count)
// rankOrder(card): A=1, 2-9=pip, 10=10, J=11, Q=12, K=13  (used for run detection)
```

**Game state shape:**
```typescript
interface Pegs { front: number; back: number }  // hole positions; 0 = not yet on board

interface PeggingState {
  currentCount: number          // running total (resets after 31 or go resolution)
  currentSequence: Card[]       // cards played since last count reset (for run/pair detection)
  allPlayedThisRound: Card[]    // all cards played this pegging phase (to detect when hands exhausted)
  humanCanPlay: boolean         // false when no card in hand fits within 31
  computerCanPlay: boolean
  isGo: boolean                 // true = current player has no valid card; human must click "Go" button
  selectedCardId: string | null // card human has clicked to select; cleared after play confirmed
  turn: 'human' | 'computer'
}

interface ScoreCombo {
  type: 'fifteen' | 'pair' | 'run' | 'flush' | 'nobs'
  cardIds: string[]
  points: number
  label: string   // e.g. "Fifteen for 2", "Run of 4 for 4"
}

interface ScoreBreakdown {
  fifteens: number
  pairs: number
  runs: number
  flush: number
  nobs: number
  total: number
  combos: ScoreCombo[]
}

interface CutForDealState {
  deck: Card[]               // full shuffled deck spread for cutting
  humanCut: Card | null      // card the human revealed
  computerCut: Card | null   // card the computer revealed
  result: 'pending' | 'human-deals' | 'computer-deals' | 'tie'
}

interface ShowState {
  scorer: 'human' | 'computer' | 'crib' | null  // who is currently counting; null = show complete
  humanBreakdown: ScoreBreakdown | null
  computerBreakdown: ScoreBreakdown | null
  cribBreakdown: ScoreBreakdown | null
  // Manual counting state (only active when scorer is human/crib with human dealer)
  selectedCardIds: string[]
  claimedCombos: ScoreCombo[]
  allCombos: ScoreCombo[]      // full set from allCombinations(); Done is disabled until claimedCombos covers all points
  manualError: string | null
}

type Phase = 'home' | 'cutForDeal' | 'dealing' | 'discard' | 'cut' | 'play' | 'show' | 'summary' | 'gameover'

interface GameState {
  phase: Phase
  deck: Card[]
  humanHand: Card[]
  computerHand: Card[]
  crib: Card[]
  starterCard: Card | null
  humanScore: number
  computerScore: number
  humanPegs: Pegs
  computerPegs: Pegs
  dealer: 'human' | 'computer'
  countingMode: 'manual' | 'auto'
  pegging: PeggingState
  show: ShowState
  cutForDeal: CutForDealState | null  // non-null only during cutForDeal phase
  winner: 'human' | 'computer' | null
  lastScoringEvent: string | null  // shown as toast, cleared after display
  handHistory: string[]            // scoring events for the hand summary screen
}
```

**State flags:**
- `phase` — controls which UI panel renders
- `cutForDeal.result` — 'pending' while awaiting cuts; 'tie' triggers re-cut
- `pegging.isGo` — when true and it's human's turn: all cards are disabled, a "Go" button appears that the player must click; computer auto-passes with a delay
- `pegging.selectedCardId` — the card the human has clicked to select; "Play Card" button appears only when a card is selected and it's human's turn
- `pegging.humanCanPlay / computerCanPlay` — derived each turn from hand cards vs currentCount
- `show.scorer` — iterates: non-dealer → dealer → crib → null
- `show.allCombos` — full combo list; "Done" button is disabled when claimedCombos total points < allCombos total points
- `countingMode` — 'manual' enables card-selection show UI; 'auto' awards points without interaction

**Turn structure:**
1. `cutForDeal` — shuffle deck, spread face-down; human clicks a card to reveal; computer auto-picks a random card after 600ms delay; compare rankOrder (lower = deals); on tie: re-shuffle and repeat; on result: show winner label for 1.5s, then set `dealer` and transition to `dealing`
2. `dealing` — shuffle, deal 6 to each, transition to `discard`
3. `discard` — human selects 2 cards; computer AI selects 2; both cards go to `crib[]`; transition to `cut`
4. `cut` — human (if non-dealer) clicks Cut button; reveal `starterCard`; check nibs (+2 to dealer if Jack, check win); transition to `play`; set `pegging.turn` to non-dealer
5. `play` — alternate turns via `pegging.turn`; on each card played: update `currentCount`, run `scorePegging`, add points, advance pegs, check win; on go or 31: resolve, reset count; when `allPlayedThisRound` === 8 cards (both hands empty), transition to `show`
6. `show` — set `show.scorer` to non-dealer; populate `show.allCombos` via `allCombinations()`; count that hand (manual or auto); award points; check win; advance scorer; repeat for dealer hand then crib; when scorer = null, transition to `summary`
7. `summary` — display `handHistory`; flip dealer; on "Next Hand" click, transition to `dealing`
8. `gameover` — set `winner`; display game over screen

**Move validation approach:**
- Pegging card selection: clicking a card sets `pegging.selectedCardId`; only valid if card value + currentCount <= 31
- Pegging play confirmation: "Play Card" button submits the selected card; button disabled if no card selected or selected card is invalid
- Pegging go: "Go" button visible (and required) when `pegging.isGo === true` and it's the human's turn
- Discard: exactly 2 cards selected from human's 6-card hand, then "Confirm Discard" button
- Manual show combo: "Claim" button submits selected cards; only enabled when `validateManualCombo()` returns valid

**Invalid move handling:**
- Pegging: cards that would exceed 31 are visually disabled (muted, no hover); clicking them does nothing
- Pegging: "Play Card" button disabled until a valid card is selected
- Discard: "Confirm Discard" button disabled until exactly 2 cards selected
- Manual show: "Claim" button disabled if selected cards don't form a valid combo; `manualError` shown inline if player attempts a known-invalid selection

---

## AI / Computer Player

**Strategy approach:**

Discard phase:
- Enumerate all C(6,2) = 15 possible 4-card keep combinations.
- Score each keep combo with `scoreHand(keep4, null)` (no starter yet).
- Score the 2 discarded cards with `cribBonus(discard2, isDealer)`:
  - If dealer: bonus for pairs (+2), cards summing to 5 (+1), cards summing to 15 (+2).
  - If not dealer: penalty for same bonuses (want to minimize opponent's crib gain).
- Select keep combo that maximizes `keepScore + (isDealer ? +cribBonus : -cribBonus)`.
- Tie-break: prefer keep combos where max rankOrder - min rankOrder is smaller (tighter run potential).

Play phase:
- If any card makes currentCount exactly 15 → play it.
- If any card makes currentCount exactly 31 → play it.
- If any card extends an existing run in `currentSequence` → play it.
- If currentCount < 15 and holding a card that gives opponent no easy 15: prefer low cards (avoid 5s as lead).
- If currentCount > 21: play highest card that fits.
- Fallback: play first valid card.

Show phase: always auto-counted (computer never enters manual counting flow).

**Difficulty levels:** Single difficulty — the above strategy is reasonable, not exhaustive.

**Performance constraints:** All AI decisions resolve within 100ms synchronously; use artificial 400-800ms delay before executing to simulate thinking.

---

## Help & Strategy Guide

**Objective:** Be the first player to peg your score to 121 points across multiple hands of card play and counting.

**Rules summary:**
- Dealer deals 6 cards each. Both players discard 2 face-down to the crib (dealer's bonus hand).
- Non-dealer cuts the deck; the top card is the starter. If it's a Jack, dealer scores 2 (nibs).
- Play phase: take turns laying cards, running count can't exceed 31. Score for hitting 15, hitting 31, pairs, and runs.
- Show phase: each player counts their 4-card hand plus the starter for fifteens, pairs, runs, flush, and nobs. Dealer counts the crib last.

**Key strategies:**
- Keep cards that work well together: pairs, consecutive ranks for runs, or cards summing to 5 (a 5 pairs with any 10-value card for 15).
- When not the dealer, give the crib bad cards — widely spread ranks of different suits. Avoid putting a 5 in the opponent's crib.
- When dealer, put cards in the crib that score well: pairs or cards summing to 15 (a 5 + any 10-value is ideal).
- During play, don't lead with a 5 — opponent can score 15 immediately with any 10-value card.
- Pair your opponent's lead if you have a matching card (2 pts), but be aware they may triple for 6.
- Aim for 31 when the count is in the 20s — it denies the opponent the last-card go point.

**Common mistakes:**
- Forgetting nobs (Jack in hand matching starter suit) — 1 free point often missed.
- Discarding a 5 to the opponent's crib — it pairs with J/Q/K/10 for 15.
- Missing multi-run combinations: 3-4-4-5 scores two runs of 3 (6 pts) plus a pair (2 pts) = 8 pts total.
- Playing into a pair when opponent can triple for 6.
- Counting only obvious fifteens — check all 2, 3, 4, and 5-card subsets.

**Tips for beginners:**
- Count fifteens first, then pairs, then runs, then flush, then nobs — systematic prevents missing points.
- The maximum possible hand is 29 points: hold three 5s and the Jack matching the starter's suit, with the fourth 5 as the starter.
- The crib is a big dealer advantage — in close games, being dealer at the right moment matters.
- Points score as they happen during pegging — you can win mid-hand without counting your show.

---

## Game Logic
- [x] `createDeck(): Card[]` — builds standard 52-card deck with unique IDs (e.g. `'5-hearts'`)
- [x] `shuffle(deck: Card[]): Card[]` — Fisher-Yates in-place shuffle, returns shuffled copy
- [x] `dealHands(deck: Card[]): { humanHand: Card[], computerHand: Card[], remainingDeck: Card[] }` — deal 6 to each alternating, starting with non-dealer
- [x] `cardValue(card: Card): number` — A=1, 2-9=pip, 10/J/Q/K=10
- [x] `rankOrder(card: Card): number` — A=1, 2-9=pip, 10=10, J=11, Q=12, K=13
- [x] `scoreFifteens(cards: Card[]): number` — enumerate all subsets of size 2-5; for each subset summing to 15, add 2; return total
- [x] `scorePairs(cards: Card[]): number` — group by rank; for each group of size n, score n*(n-1)/1... actually C(n,2)*2 = n*(n-1); return total
- [x] `scoreRuns(cards: Card[]): number` — find all maximal runs: try length 5, then 4, then 3; a run of length L with multiplicity M (each rank appears M times equally) scores L*M; return highest scoring run total found
- [x] `scoreFlush(handCards: Card[], starterCard: Card | null, isCrib: boolean): number` — if all 4 hand cards share a suit: if starter also matches return 5; if not crib return 4; if crib and not all 5 match return 0
- [x] `scoreNobs(handCards: Card[], starterCard: Card): number` — return 1 if hand contains a Jack whose suit === starterCard.suit, else 0
- [x] `scoreHand(handCards: Card[], starterCard: Card | null, isCrib: boolean): ScoreBreakdown` — combines all 5 scoring functions; if starterCard is null skip nobs/flush bonus
- [x] `allCombinations(handCards: Card[], starterCard: Card, isCrib: boolean): ScoreCombo[]` — returns every individual scoring combo (each fifteen pair, each pair, each run, flush, nobs) as a list of `ScoreCombo` objects; used for manual counting validation and missed-combo reveal
- [x] `detectPeggingPairs(sequence: Card[]): number` — count consecutive same-rank cards at end of sequence; 2 in a row = 2 pts, 3 in a row = 6 pts, 4 in a row = 12 pts
- [x] `detectPeggingRun(sequence: Card[]): number` — for L from sequence.length down to 3: take last L cards; get their rankOrders; check if unique ranks are consecutive (max-min+1 === uniqueCount) and each rank appears with equal multiplicity; if yes, return uniqueCount * multiplicity; else try L-1; return 0 if no run found
- [x] `scorePegging(sequence: Card[], newCard: Card, currentCount: number): { points: number, events: string[] }` — appends newCard to sequence, checks: fifteen (count+value===15 → +2), 31 (count+value===31 → +2), pairs via `detectPeggingPairs`, runs via `detectPeggingRun`; returns total points and event labels
- [x] `resolveGo(sequence: Card[], currentCount: number): number` — called when both players have said go; returns 1 (last card go) if currentCount < 31, or 0 if 31 was already scored
- [x] `validateManualCombo(selected: Card[], starterCard: Card, allCombos: ScoreCombo[], claimedCombos: ScoreCombo[]): { valid: boolean, combo?: ScoreCombo, error?: string }` — checks selected cards match an unclaimed combo in `allCombos`
- [x] `computerDiscard(hand: Card[], isDealer: boolean): [Card, Card]` — returns 2 cards using strategy described in AI section
- [x] `computerPlayCard(hand: Card[], sequence: Card[], currentCount: number): Card` — returns best card using AI play strategy
- [x] `advancePegs(pegs: Pegs, points: number): Pegs` — sets back = front, front = min(front + points, 121)
- [x] `checkWin(score: number): boolean` — returns true if score >= 121

---

## Components
- [x] `App` — holds full `GameState` in `useReducer`; dispatches all actions; renders correct screen based on `phase`
- [x] `HomeScreen` — full viewport; card-suit background pattern (CSS); centered bordered box with: title, start button, counting mode toggle (Manual / Auto), theme toggle, donate button
- [x] `CutForDeal` — full viewport; deck of 52 face-down cards spread in a fan or grid; human clicks any card to flip it face-up; computer card auto-flips after 600ms; displays both cut cards with rank/suit; shows "You deal" / "Computer deals" / "Tie — cut again" result label; "Continue" button appears after result shown
- [x] `GameBoard` — outer layout: PegBoard at top, PlayArea in center, PlayerHand at bottom; responsive flex column
- [x] `PegBoard` — SVG rectangle board; human track at bottom, computer track at top; each track = two rows of holes in snake pattern (left-right row 1, right-left row 2); two pegs per player (front = filled circle, back = outlined circle); skunk mark at hole 61; peg position animates on score change
- [x] `PlayerHand` — renders human's cards face-up; click-to-select during discard phase and manual show phase; selected cards shown raised/highlighted; computer hand shown as face-down card backs with count label
- [x] `CribArea` — shows crib card backs with count badge and dealer label ("Your Crib" / "Computer's Crib")
- [x] `StarterCard` — face-down with "Cut" button before cut phase; face-up after cut
- [x] `PlayArea` — shows cards in `currentSequence` left to right; running count badge; human's playable cards are clickable (click to select, highlighted); "Play Card" button appears when a card is selected (disabled if selection is invalid); "Go" button appears (and replaces "Play Card") when `pegging.isGo` and it's human's turn; last scoring event as inline text
- [x] `ShowPanel` — auto mode: displays ScoreBreakdown with combo list; manual mode: shows 5 cards (hand + starter), card selector, "Claim [X] pts" button (disabled if no valid combo selected), claimed combo list, "Done" button (disabled while total claimed points < total in `allCombos`); a "[X] points remaining" counter helps the player know how much is left
- [x] `ScoringToast` — slide-up fade-out animation overlay showing scoring event text (e.g., "Fifteen for 2!")
- [x] `HandSummary` — displays `handHistory` list for completed hand; "Next Hand" button
- [x] `GameOverScreen` — winner heading, final scores, best score (wins in a session), "Play Again" button
- [x] `HelpModal` — accessible via "?" button on all screens; three sections: Rules, Scoring Reference, Strategy; content from Help & Strategy Guide
- [x] `ConfirmModal` — used for "New Game" and "Quit to Home" with confirm/cancel buttons

---

## Styling
- [ ] `global.css` — CSS variables for light/dark theme: `--bg`, `--surface`, `--felt` (green for board), `--card-bg`, `--card-red`, `--peg-human`, `--peg-computer`, `--text`, `--border`; base reset
- [ ] `App.css` — full-height flex column layout
- [ ] `HomeScreen.css` — full viewport; centered flex column; subtle card-suit background (♠♥♦♣ symbols tiled, low opacity); bordered centered box for menu items
- [ ] `GameBoard.css` — grid rows: peg board (fixed height), play area (flex grow), hand (fixed height); stacks vertically; responsive min-width
- [ ] `PegBoard.css` — SVG fills container width; hole colors distinguish human vs computer tracks; skunk line as a distinct color separator; peg transition animation (CSS transform)
- [ ] `Card.css` — card face with rank/suit at corners; red suits (#cc0000), black suits (#111); selected state: `transform: translateY(-8px)`, blue outline; face-down back: dark green pattern; hover: slight lift
- [ ] `PlayArea.css` — horizontal scrolling card row; count badge (circle with number); go button styling
- [ ] `CutForDeal.css` — full viewport; card spread layout (grid or fan); cut card flip animation (CSS rotateY 0.3s); result label styling
- [ ] `ShowPanel.css` — two-column layout (cards left, combo list right); claimed combos: green check; "points remaining" counter in orange when > 0, hidden at 0; invalid combo error: red inline text
- [ ] `ScoringToast.css` — fixed overlay; `@keyframes slideUpFade` — slides up 20px and fades out over 1.5s
- [ ] `Modal.css` — shared: fixed overlay, centered box, backdrop blur; close button top-right

---

## Polish
- [ ] Peg animation — peg moves to new hole with CSS transition (0.3s ease) on score
- [ ] Scoring toast — appears for each pegging score event; stacks if multiple events occur simultaneously
- [ ] Go button — animated pulse when human must declare go
- [ ] Starter card highlight — glows when it contributes to a combo during show
- [ ] Computer thinking delay — 400-800ms before computer plays or discards; spinner or "thinking..." label
- [ ] Counting mode toggle accessible from play screen (small toggle in header area)
- [ ] Keyboard navigation — Tab to cycle cards, Enter/Space to select, Escape to close modals

---

## Testing

**Unit tests — game logic (`src/gameLogic.test.ts`):**
- [ ] `scoreFifteens`: [5,J,Q,K,A] → 5+J=15, 5+Q=15, 5+K=15 = 6 pts; [5,5,5,J,Q] → 5+J=15, 5+Q=15, 5+J=15, 5+Q=15, 5+J=15, 5+Q=15 = 12 pts
- [ ] `scoreFifteens`: [A,2,3,4,5] → only A+2+3+4+5=15 = 2 pts; [7,8] → 2 pts; [6,9] → 2 pts
- [ ] `scorePairs`: [7,7,A,2,3] → 2 pts; [8,8,8,A,2] → 6 pts; [5,5,5,5,A] → 12 pts; no pairs → 0 pts
- [ ] `scoreRuns`: [A,2,3,4,5] → 5 pts (5-card run); [3,4,4,5,A] → 2 runs of 3 = 6 pts; [3,3,4,4,5] → 4 runs of 3 = 12 pts; [2,3,4,5,J] → 4 pts (4-card run, J breaks 5-card); [A,3,5,7,9] → 0 pts (no run)
- [ ] `scoreFlush`: [A♠,2♠,3♠,4♠] + 5♦ starter, not crib → 4 pts; same with 5♠ starter → 5 pts; same scenario in crib → 0 pts; all 5 same suit in crib → 5 pts
- [ ] `scoreNobs`: J♥ in hand, 5♥ starter → 1 pt; J♥ in hand, 5♠ starter → 0 pts; no Jack in hand → 0 pts
- [ ] `scoreHand` 29-point hand: hand=[5♦,5♥,5♣,J♠], starter=5♠ → fifteens=16, pairs=12, nobs=1 = 29 pts
- [ ] `detectPeggingRun`: [4,3,5] → 3 pts; [5,4,3,2] → 4 pts; [3,4,3,5] → two runs of 3 = 6 pts; [7,8,9,J] → 3 pts (last 3: 8,9,J are not consecutive; 7,8,9 are consecutive, last 3 = 9,J,? — need to re-examine; [7,8,9] → 3 pts); no run in [2,5,9] → 0 pts
- [ ] `detectPeggingPairs`: [7,8,7] → 2 pts (last two are not same rank; actually last card 7, previous 8 — no pair = 0); [7,7,8] → last card 8, previous 7 — no pair; [7,8,8] → last two 8s = 2 pts; [8,8,8] → 3 consecutive 8s = 6 pts; [8,8,8,8] → 12 pts
- [ ] `scorePegging`: count=8, play 7-of-hearts → count=15, events=["Fifteen for 2"]; count=21, play 10-of-spades → count=31, events=["Thirty-one for 2"]
- [ ] `advancePegs`: `{front:10, back:5}` + 4 pts → `{front:14, back:10}`; `{front:118, back:115}` + 5 pts → `{front:121, back:118}` (capped)
- [ ] `computerDiscard` as dealer: given hand with a pair, keeps the pair in hand; given a 5, prefers putting it in crib
- [ ] `validateManualCombo`: [5♥, J♠] summing to 15 → valid, 2 pts; [7♦,7♣] → pair, 2 pts; [A♠,2♦,3♥] → run, 3 pts; [A♠,2♦,J♣] → invalid (not a valid combo); already claimed [5♥,J♠] fifteen → claiming same cards again → invalid (already claimed)

**Component tests — (`src/App.test.tsx`):**
- [ ] Home screen renders title, start button, counting mode toggle defaulting to "Auto"
- [ ] Clicking "Manual" toggle updates countingMode and persists to localStorage
- [ ] Start game click transitions phase to "cutForDeal"
- [ ] CutForDeal renders 52 face-down cards; clicking one flips it and reveals rank/suit
- [ ] After both cards revealed, result label appears ("You deal" / "Computer deals" / "Tie")
- [ ] On tie, re-cut resets and shows a new spread
- [ ] After cut-for-deal, phase transitions to "dealing" then "discard"
- [ ] Discard phase: selecting 1 card keeps confirm disabled; selecting 2 cards enables confirm
- [ ] After confirming discard, phase transitions to "cut"
- [ ] Cut button click reveals starter card and transitions to "play"
- [ ] Play phase: clicking a card selects it and enables "Play Card" button; clicking "Play Card" submits the card
- [ ] Play phase: cards that would exceed 31 are disabled; clicking them does not select them
- [ ] Play phase: when no valid card exists, "Go" button appears; clicking it passes the turn
- [ ] In auto show mode, points are awarded and scorer advances without user interaction
- [ ] In manual show mode, ShowPanel renders with card selector, Claim button, and points-remaining counter
- [ ] Claiming a valid combo adds it to claimed list and decrements points-remaining counter
- [ ] "Done" button is disabled while points remaining > 0; enabled only when all points claimed
- [ ] Game over screen renders correct winner name and final scores
