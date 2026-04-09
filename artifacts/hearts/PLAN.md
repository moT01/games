# hearts
> Based on: Hearts

## Game Design

**What we're building:** A 4-player trick-taking card game where the goal is to finish with the lowest score. 1 human (South) plays against 3 AI opponents (West, North, East). Hands are played until any player reaches 100 points; lowest score wins.

**Rules:**
- Standard 52-card deck, dealt 13 cards each
- Before each hand (except "no pass" hands), each player passes exactly 3 cards simultaneously
- Pass direction cycles: Left → Right → Across → None → repeat
- The player holding 2♣ leads the first trick of each hand
- Players must follow suit if possible; if void, may play any card
- Trick won by highest card of the led suit (no trumps)
- Hearts cannot be led until hearts are "broken" (a heart played on a non-heart-led trick), unless the leader has only hearts
- Q♠ does NOT break hearts
- First trick restriction: penalty cards (hearts, Q♠) cannot be played on the first trick unless the player has no alternative
- Scoring per hand: each heart = 1 point, Q♠ = 13 points
- Shoot the moon: if one player takes all 13 hearts AND Q♠ in one hand, all other 3 players receive 26 points instead (shooter receives 0 for that hand)
- Game ends when any player's cumulative score reaches or exceeds 100; player with lowest score wins

**Players:** 1 human (South), 3 AI opponents (West, North, East)

**Modes / variants:** Single mode only — 1 human vs 3 AI

**Win / draw conditions:**
- Game ends when any player hits 100+ points after a complete hand
- Player with the lowest cumulative score wins
- If tied for lowest, all tied players win (display as tie)

**Special rules / one-off mechanics:**
- 2♣ always leads the very first trick of a hand; player holding it has no choice
- First trick: if a player is void in clubs and all remaining cards are penalty cards, they may play them; otherwise penalty cards are illegal on trick 1
- Hearts broken: tracked as a flag; set to `true` the first time any heart is played on a non-heart-led trick; once broken, hearts may be led
- Shooting the moon check: occurs after all 13 tricks in a hand; if one player's `trickPoints` has all 13 hearts + Q♠ (total 26), trigger moon shot
- Pass "none" hand: no cards are exchanged; play begins immediately with 2♣ holder leading
- Passing is simultaneous: all 4 players' passed cards are applied at once before any card is revealed

**Captured / out-of-play pieces:** Won tricks are face-down in each player's trick pile. The cards in them are not visible during play, but point totals (hearts taken, Q♠ taken) are tracked per player in state.

**UI flow:**
1. Home screen — title, record (W/L from local storage), start button, theme toggle, donate button
2. Passing phase — human sees hand, selects 3 cards to pass, clicks "Pass" button; direction label shown ("Pass Left", "Pass Right", etc.); on "no pass" hand, this screen is skipped
3. Play screen — 4-player card table layout; human hand at bottom (South), AI card backs at West/North/East; current trick in center; score panel showing current hand points and cumulative scores; hearts-broken indicator
4. AI plays automatically with a short delay (300–500ms per card)
5. After all 4 cards in a trick are played, show completed trick briefly (800ms), then clear and advance to next trick
6. After 13 tricks, show Hand Summary modal — each player's points this hand, cumulative scores, moon shot notification if triggered
7. If game continues, return to passing phase (or play if no-pass)
8. Game Over screen — final scores, winner announced, record updated, "Play Again" and "Home" buttons

**Edge cases:**
- Player void in all non-heart suits before hearts broken: allow leading hearts (exception to hearts-not-broken rule)
- All penalty cards in hand on trick 1: allow playing them (no valid alternative)
- Exact tie at 100+: display "Tie" result; record counts as a loss for human
- AI player has only one legal card: auto-play it (no delay needed if it's the only option)
- Shoot the moon on final hand: still apply the +26 to others before checking game over; a player who was at 99 before that hand may now be at 125, human wins if at lower score
- 2♣ holder after passing: re-check after pass resolution; the 2♣ may have been passed to another player

---

## Data Model

**Board / grid:** No grid. 4 player positions (South, West, North, East) arranged around a center trick area.

**Piece / token types:**
```typescript
type Suit = 'clubs' | 'diamonds' | 'hearts' | 'spades'
type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14
// 11=J, 12=Q, 13=K, 14=A

interface Card {
  suit: Suit
  rank: Rank
}
```

**Game state shape:**
```typescript
type PlayerId = 0 | 1 | 2 | 3  // 0=South/human, 1=West, 2=North, 3=East
type PassDirection = 'left' | 'right' | 'across' | 'none'
type Phase = 'home' | 'passing' | 'playing' | 'handSummary' | 'gameOver'

interface TrickPlay {
  player: PlayerId
  card: Card
}

interface GameState {
  phase: Phase
  handNumber: number            // 1-indexed total hands played; mod 4 → pass direction
  scores: [number, number, number, number]      // cumulative scores per player
  handPoints: [number, number, number, number]  // points taken this hand per player
  hands: [Card[], Card[], Card[], Card[]]       // cards in each player's current hand
  passDirection: PassDirection
  passSelections: Card[]        // human's chosen cards to pass (0–3 selected)
  currentTrick: TrickPlay[]     // plays in current trick, in play order (0–3 entries)
  trickLeader: PlayerId         // who leads current trick
  heartsBroken: boolean
  activePlayer: PlayerId        // whose turn it is to play
  trickCount: number            // tricks completed this hand (0–13)
  lastTrickWinner: PlayerId | null
  handSummaryData: HandSummaryData | null
  gameOverData: GameOverData | null
}

interface HandSummaryData {
  handPoints: [number, number, number, number]
  cumulativeAfter: [number, number, number, number]
  moonShooter: PlayerId | null
}

interface GameOverData {
  finalScores: [number, number, number, number]
  winner: PlayerId | PlayerId[]  // array if tie
}
```

**State flags:**
- `heartsBroken: boolean` — set true when first heart played on non-heart-led trick
- `phase` — controls which screen/modal is shown
- `passSelections` — human's 3 chosen cards during passing phase; "Pass" button enabled only when length === 3

**Turn structure:**
- Passing phase: human selects 3 cards → clicks Pass → AI passes applied → all 4 hands updated → find 2♣ holder → set `trickLeader` and `activePlayer`
- Playing phase: `activePlayer` plays a card (human = wait for click, AI = auto after delay)
- After 4 plays in `currentTrick`: determine winner → add penalty cards to winner's `handPoints` → update `trickLeader` and `activePlayer` to winner → clear `currentTrick` → increment `trickCount`
- After `trickCount === 13`: check shoot the moon → update `scores` → set `handSummaryData` → phase = 'handSummary'
- After handSummary dismissed: check if any score >= 100 → phase = 'gameOver' or start new hand

**Move validation approach:**
`getLegalCards(hand: Card[], currentTrick: TrickPlay[], heartsBroken: boolean, trickCount: number): Card[]`
- If trick is empty (leading): if `!heartsBroken` and hand has non-heart cards, exclude hearts; else return all cards
- If trick has cards (following): filter hand to `ledSuit`; if non-empty return those; else return all cards (void)
- First trick override (`trickCount === 0`): if leading and player is 2♣ holder, return `[{suit:'clubs', rank:2}]`; if following and legal cards include penalty cards only, allow all; otherwise filter out hearts and Q♠

**Invalid move handling:** Non-legal cards are visually non-selectable (no click handler attached). AI only picks from `getLegalCards` output.

---

## AI / Computer Player

**Strategy approach:** Rule-based heuristic, no minimax.

Passing strategy (`getAIPass(hand: Card[], direction: PassDirection): Card[]`):
- Pass A♠ and K♠ if Q♠ is not held (unprotected high spades)
- Pass Q♠ if held with fewer than 3 spades total (unprotected)
- Pass high hearts (A♥, K♥, Q♥) if holding 4+ hearts
- Fill remaining slots with highest cards in longest suit

Playing strategy (`getAIPlay(hand: Card[], trick: TrickPlay[], heartsBroken: boolean, trickCount: number, handPoints: HandPoints): Card`):
1. Get `legalCards = getLegalCards(hand, trick, heartsBroken, trickCount)`
2. If following suit (void = false):
   - If can win the trick (highest of led suit in hand): check if trick has penalty points; if yes, play highest card that loses; if no penalty in trick, play highest card that loses (avoid winning pointless tricks too)
   - If cannot win: play highest legal card of led suit
3. If void in led suit (discarding):
   - Dump Q♠ first if held
   - Else dump highest heart
   - Else dump highest card in hand
4. If leading:
   - Avoid leading spades if Q♠ not yet played and AI doesn't hold it (too risky)
   - Lead lowest club or diamond
   - If forced to lead hearts, lead lowest heart

**Shoot the moon detection (AI):** Not attempted — AI does not strategize toward moon shot; it only plays defensively.

**Difficulty levels:** Single difficulty only.

**Performance constraints:** AI decision is synchronous and instant; delay is artificial (setTimeout 350ms) to simulate thinking.

---

## Help & Strategy Guide

**Objective:** Take as few penalty cards as possible. Each heart = 1 point, Q♠ = 13 points. Lowest score when someone hits 100 wins.

**Rules summary:**
- 13 cards dealt to each of 4 players
- Pass 3 cards (direction rotates L/R/Across/None each hand)
- 2♣ always leads the first trick
- Follow suit if you can; highest card of the led suit wins the trick
- Hearts can't be led until someone "breaks" hearts by discarding one
- Shooting the moon: take ALL hearts + Q♠ in one hand → all other players get 26 points

**Key strategies:**
- Pass A♠ and K♠ unless you also hold Q♠ (otherwise you're just clearing the way for Q♠ to win)
- Pass Q♠ if you have fewer than 3 spades — it needs protection (cards below it)
- Void yourself in a suit during passing so you can dump high cards or Q♠ when that suit is led
- In early tricks, play low cards to avoid winning tricks with penalty cards in them
- Track whether Q♠ has been played — after it has, spades become safe to lead
- If you pick up all the hearts accidentally in the first few tricks, consider whether shooting the moon is still possible

**Common mistakes:**
- Passing A♠ or K♠ without realizing you also hold Q♠ — you've just made Q♠ unbeatable
- Leading spades before Q♠ has been played — you force another player to dump Q♠ on you
- Playing a high card (A or K) when there are already penalty cards in the trick — you'll win those points
- Forgetting hearts aren't broken — you can't lead that A♥ yet even if you want to

**Tips for beginners:**
- The safest discards are low diamonds and low clubs — they're worth nothing
- If you hold Q♠ with only 1–2 small spades, pass it immediately
- Watch the score tracker — if an opponent is at 85+ points, play aggressively to end the game quickly on a hand where they score more

---

## Game Logic
- [x] `createDeck(): Card[]` — returns all 52 cards in sorted order (suits × ranks)
- [x] `shuffleDeck(deck: Card[]): Card[]` — Fisher-Yates shuffle, returns new array
- [x] `dealHands(deck: Card[]): [Card[], Card[], Card[], Card[]]` — split into 4 × 13
- [x] `getPassDirection(handNumber: number): PassDirection` — `['left','right','across','none'][(handNumber - 1) % 4]`
- [x] `applyPass(hands, selections: [Card[], Card[], Card[], Card[]], direction): [Card[], Card[], Card[], Card[]]` — remove passed cards from each hand and give to target player; left=+1 mod 4, right=-1 mod 4, across=+2 mod 4
- [x] `findTwoOfClubs(hands): PlayerId` — find which hand contains `{suit:'clubs', rank:2}`
- [x] `getLegalCards(hand, trick, heartsBroken, trickCount): Card[]` — see move validation above
- [x] `getTrickWinner(trick: TrickPlay[]): PlayerId` — highest rank of led suit wins; `trick[0].card.suit` is led suit
- [x] `getTrickPoints(trick: TrickPlay[]): number` — sum: hearts count 1 each, Q♠ counts 13
- [x] `getPenaltyCards(trick: TrickPlay[]): Card[]` — returns hearts and Q♠ in trick (for attribution)
- [x] `checkMoonShot(handPoints: [number,number,number,number]): PlayerId | null` — return player who scored exactly 26 (all hearts + Q♠), else null
- [x] `applyMoonShot(scores, shooter: PlayerId): [number,number,number,number]` — add 26 to all players except shooter
- [x] `applyHandScores(scores, handPoints, moonShooter): [number,number,number,number]` — if moon shot, use applyMoonShot; else add handPoints to scores
- [x] `isGameOver(scores): boolean` — any score >= 100
- [x] `getWinner(scores): PlayerId[]` — player(s) with minimum score
- [x] `getAIPass(hand: Card[], direction: PassDirection): Card[]` — see AI section
- [x] `getAIPlay(hand, trick, heartsBroken, trickCount, handPoints): Card` — see AI section
- [x] `sortHand(hand: Card[]): Card[]` — sort by suit (clubs, diamonds, spades, hearts) then rank ascending; used for display

---

## Components
- [x] `App` — holds full `GameState`, renders active screen/phase, orchestrates AI turns via `useEffect`
- [x] `HomeScreen` — title, record display (W/L/best score from local storage), Start button, theme toggle, Donate button
- [x] `GameBoard` — play screen layout: `OpponentHand` ×3, `TrickArea`, `PlayerHand`, `ScorePanel`
- [x] `PlayerHand` — renders human's 13 cards sorted by `sortHand`; highlights legal cards; non-legal cards dimmed and non-clickable; during passing phase renders selection UI (click to select/deselect, "Pass" button)
- [x] `OpponentHand` — renders N card backs for West/North/East; rotated 90° for West/East; shows player label
- [x] `TrickArea` — center area showing up to 4 played cards in positional layout (South/West/North/East slots); shows trick winner briefly before clearing
- [x] `ScorePanel` — sidebar showing each player's cumulative score and this-hand points; highlights current leader (lowest score); Q♠ played indicator; hearts broken indicator
- [x] `HandSummaryModal` — shown after each hand: table of hand points per player, cumulative scores, moon shot banner if triggered; "Next Hand" button
- [x] `GameOverScreen` — final score table, winner announcement, record stats, "Play Again" and "Home" buttons
- [x] `HelpModal` — "?" button on play screen; shows rules summary, strategies, common mistakes
- [x] `ConfirmModal` — "Are you sure?" for "New Game" and "Quit to Home" actions; props: `message`, `onConfirm`, `onCancel`

---

## Styling
- [x] `global.css` — CSS custom properties for light/dark theme: `--bg`, `--surface`, `--text`, `--text-muted`, `--border`, `--card-bg`, `--card-text`, `--accent`; base reset; font (system-ui)
- [x] `App.css` — full-screen flex layout, theme class toggling
- [x] `HomeScreen.css` — centered card, title, record grid, button row
- [x] `GameBoard.css` — CSS grid: 3×3 or table-like layout placing opponents at top/left/right, trick center, player hand bottom; responsive to viewport height
- [x] `PlayerHand.css` — card fan or row with overlap; selected cards raised; legal cards full opacity, illegal cards 40% opacity
- [x] `OpponentHand.css` — card backs in a row; West/East rotated 90deg using `transform: rotate`
- [x] `TrickArea.css` — 2×2 grid or absolute positioning for each player's played card slot (South/West/North/East)
- [x] `ScorePanel.css` — vertical list of player rows; current leader highlighted; small badges for Q♠ and hearts-broken state
- [x] `HandSummaryModal.css` — centered modal overlay, score table, moon shot banner
- [x] `GameOverScreen.css` — full-screen overlay or page, score table, winner highlight
- [x] `HelpModal.css` — scrollable modal overlay
- [x] `ConfirmModal.css` — small centered modal overlay, two-button row

---

## Polish
- [x] Card animations: cards slide from hand to trick area on play (CSS transition, 200ms)
- [x] Trick clearing: brief 800ms pause after 4th card played so user sees the complete trick before it clears; winning player's slot briefly highlighted
- [x] AI thinking delay: 350ms setTimeout between AI turns so play doesn't feel instant
- [x] Passing phase: selected cards visually "lifted" (translateY -12px) to confirm selection; pass button disabled until 3 cards selected
- [x] Hearts broken banner: brief toast "Hearts are broken!" when first heart played
- [x] Moon shot banner: full-screen flash or bold modal header "Shot the moon!" before showing HandSummaryModal
- [x] Suit colors: hearts/diamonds in red, clubs/spades in black (respects dark theme — surface changes, suit colors stay)
- [x] Q♠ icon styled distinctly (bold or badge) in ScorePanel to draw attention
- [x] Theme toggle accessible from both HomeScreen and GameBoard (top-right corner)
- [x] Keyboard: Tab/Enter to select cards in hand and confirm pass; Escape to close modals

---

## Local Storage

- [x] `hearts_theme` — `'light' | 'dark'`; loaded on mount, applied immediately
- [x] `hearts_record` — `{ wins: number, losses: number, bestScore: number | null }` — updated on game over; `bestScore` is human's lowest final score across all wins; a tie counts as a loss for record purposes
- [x] `hearts_gameState` — serialized `GameState`; saved on every state change; loaded on mount; if `phase !== 'home'`, offer "Resume" button on home screen alongside "New Game"; cleared on game over

---

## Testing

**Unit tests — game logic (`src/gameLogic.test.ts`):**
- [x] `createDeck` returns 52 unique cards
- [x] `dealHands` produces 4 arrays of exactly 13 cards each, no duplicates
- [x] `getPassDirection(1)` = 'left', `(2)` = 'right', `(3)` = 'across', `(4)` = 'none', `(5)` = 'left'
- [x] `applyPass` with direction 'left': player 0's selected cards move to player 1, player 1's to player 2, etc.
- [x] `getLegalCards`: player must follow suit if possible — given hand `[3♥, 5♣]` and led suit clubs, returns `[5♣]` only
- [x] `getLegalCards`: player void in led suit returns all cards
- [x] `getLegalCards` trick 1 (trickCount=0), leading, only hearts and Q♠ in hand → returns all (no alternative)
- [x] `getLegalCards` trick 1 (trickCount=0), following, void in clubs, has non-penalty cards → excludes hearts and Q♠
- [x] `getLegalCards` leading, heartsBroken=false, has non-hearts → excludes hearts
- [x] `getLegalCards` leading, heartsBroken=false, hand is all hearts → returns all (only option)
- [x] `getTrickWinner`: led suit 3♣, plays are [3♣, 9♦, J♣, 5♣] → winner is player who played J♣
- [x] `getTrickPoints`: trick with 3♥, Q♠, 2♦, 4♥ → 15 points
- [x] `checkMoonShot`: player 2 has 26 points, others have 0 → returns 2
- [x] `checkMoonShot`: points split among multiple players → returns null
- [x] `applyMoonShot`: shooter=1, scores=[10,0,10,10] → scores=[36,0,36,36]
- [x] `getWinner([10,50,30,40])` → `[0]`
- [x] `getWinner([10,10,30,40])` → `[0,1]` (tie)

**Component tests — (`src/App.test.tsx`):**
- [x] Home screen renders with Start button and record display
- [x] Clicking Start transitions to passing phase (or playing if no-pass hand)
- [x] During passing phase, selecting 3 cards enables the Pass button
- [x] Selecting a 4th card deselects the previously selected card (no, actually show that clicking a selected card deselects it, and 4th click replaces nothing — test that only 3 can be selected)
- [x] After passing, phase transitions to 'playing' and human hand has 13 cards
