export type Suit = 'clubs' | 'diamonds' | 'hearts' | 'spades'
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14

export interface Card {
  suit: Suit
  rank: Rank
}

export type PlayerId = 0 | 1 | 2 | 3
export type PassDirection = 'left' | 'right' | 'across' | 'none'
export type Phase = 'home' | 'passing' | 'playing' | 'handSummary' | 'gameOver'

export interface TrickPlay {
  player: PlayerId
  card: Card
}

export interface HandSummaryData {
  handPoints: [number, number, number, number]
  cumulativeAfter: [number, number, number, number]
  moonShooter: PlayerId | null
}

export interface GameOverData {
  finalScores: [number, number, number, number]
  winner: PlayerId | PlayerId[]
}

export interface GameState {
  phase: Phase
  handNumber: number
  scores: [number, number, number, number]
  handPoints: [number, number, number, number]
  hands: [Card[], Card[], Card[], Card[]]
  passDirection: PassDirection
  passSelections: Card[]
  currentTrick: TrickPlay[]
  trickLeader: PlayerId
  heartsBroken: boolean
  queenOfSpadesPlayed: boolean
  activePlayer: PlayerId
  trickCount: number
  lastTrickWinner: PlayerId | null
  handSummaryData: HandSummaryData | null
  gameOverData: GameOverData | null
}

export interface HeartsRecord {
  wins: number
  losses: number
  bestScore: number | null
}

// Display helpers
export function rankLabel(rank: Rank): string {
  if (rank === 11) return 'J'
  if (rank === 12) return 'Q'
  if (rank === 13) return 'K'
  if (rank === 14) return 'A'
  return String(rank)
}

export function suitSymbol(suit: Suit): string {
  return { clubs: '♣', diamonds: '♦', hearts: '♥', spades: '♠' }[suit]
}

export function isRedSuit(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds'
}

export function cardEquals(a: Card, b: Card): boolean {
  return a.suit === b.suit && a.rank === b.rank
}

function isPenaltyCard(card: Card): boolean {
  return card.suit === 'hearts' || (card.suit === 'spades' && card.rank === 12)
}

const SUITS: Suit[] = ['clubs', 'diamonds', 'hearts', 'spades']
const RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]

export function createDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank })
    }
  }
  return deck
}

export function shuffleDeck(deck: Card[]): Card[] {
  const d = [...deck]
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[d[i], d[j]] = [d[j], d[i]]
  }
  return d
}

export function dealHands(deck: Card[]): [Card[], Card[], Card[], Card[]] {
  return [deck.slice(0, 13), deck.slice(13, 26), deck.slice(26, 39), deck.slice(39, 52)]
}

export function getPassDirection(handNumber: number): PassDirection {
  const dirs: PassDirection[] = ['left', 'right', 'across', 'none']
  return dirs[(handNumber - 1) % 4]
}

export function applyPass(
  hands: [Card[], Card[], Card[], Card[]],
  selections: [Card[], Card[], Card[], Card[]],
  direction: PassDirection
): [Card[], Card[], Card[], Card[]] {
  if (direction === 'none') {
    return hands.map(h => [...h]) as [Card[], Card[], Card[], Card[]]
  }
  const offsets: Record<Exclude<PassDirection, 'none'>, number> = {
    left: 1,
    right: 3,
    across: 2,
  }
  const offset = offsets[direction as Exclude<PassDirection, 'none'>]
  const newHands: [Card[], Card[], Card[], Card[]] = [
    [...hands[0]],
    [...hands[1]],
    [...hands[2]],
    [...hands[3]],
  ]
  for (let src = 0; src < 4; src++) {
    const dst = (src + offset) % 4
    const passed = selections[src]
    newHands[src] = newHands[src].filter(c => !passed.some(p => cardEquals(c, p)))
    newHands[dst] = [...newHands[dst], ...passed]
  }
  return newHands
}

export function findTwoOfClubs(hands: [Card[], Card[], Card[], Card[]]): PlayerId {
  for (let i = 0; i < 4; i++) {
    if (hands[i].some(c => c.suit === 'clubs' && c.rank === 2)) return i as PlayerId
  }
  return 0
}

export function getLegalCards(
  hand: Card[],
  currentTrick: TrickPlay[],
  heartsBroken: boolean,
  trickCount: number
): Card[] {
  // Leading
  if (currentTrick.length === 0) {
    if (trickCount === 0) {
      const twoClubs = hand.find(c => c.suit === 'clubs' && c.rank === 2)
      if (twoClubs) return [twoClubs]
      return [...hand] // fallback: no 2♣ in hand (shouldn't happen in valid game)
    }
    if (heartsBroken) return [...hand]
    const nonHearts = hand.filter(c => c.suit !== 'hearts')
    return nonHearts.length > 0 ? nonHearts : [...hand]
  }

  // Following
  const ledSuit = currentTrick[0].card.suit
  const suitCards = hand.filter(c => c.suit === ledSuit)
  if (suitCards.length > 0) return suitCards

  // Void in led suit
  if (trickCount === 0) {
    const nonPenalty = hand.filter(c => !isPenaltyCard(c))
    return nonPenalty.length > 0 ? nonPenalty : [...hand]
  }
  return [...hand]
}

export function getTrickWinner(trick: TrickPlay[]): PlayerId {
  const ledSuit = trick[0].card.suit
  let winner = trick[0]
  for (const play of trick) {
    if (play.card.suit === ledSuit && play.card.rank > winner.card.rank) {
      winner = play
    }
  }
  return winner.player
}

export function getTrickPoints(trick: TrickPlay[]): number {
  return trick.reduce((sum, play) => {
    if (play.card.suit === 'hearts') return sum + 1
    if (play.card.suit === 'spades' && play.card.rank === 12) return sum + 13
    return sum
  }, 0)
}

export function getPenaltyCards(trick: TrickPlay[]): Card[] {
  return trick.filter(p => isPenaltyCard(p.card)).map(p => p.card)
}

export function checkMoonShot(
  handPoints: [number, number, number, number]
): PlayerId | null {
  for (let i = 0; i < 4; i++) {
    if (handPoints[i] === 26) return i as PlayerId
  }
  return null
}

export function applyMoonShot(
  scores: [number, number, number, number],
  shooter: PlayerId
): [number, number, number, number] {
  return scores.map((s, i) => (i === shooter ? s : s + 26)) as [number, number, number, number]
}

export function applyHandScores(
  scores: [number, number, number, number],
  handPoints: [number, number, number, number],
  moonShooter: PlayerId | null
): [number, number, number, number] {
  if (moonShooter !== null) return applyMoonShot(scores, moonShooter)
  return scores.map((s, i) => s + handPoints[i]) as [number, number, number, number]
}

export function isGameOver(scores: [number, number, number, number]): boolean {
  return scores.some(s => s >= 100)
}

export function getWinner(scores: [number, number, number, number]): PlayerId[] {
  const min = Math.min(...scores)
  return scores.reduce<PlayerId[]>((acc, s, i) => {
    if (s === min) acc.push(i as PlayerId)
    return acc
  }, [])
}

const SUIT_ORDER: Record<Suit, number> = { clubs: 0, diamonds: 1, spades: 2, hearts: 3 }

export function sortHand(hand: Card[]): Card[] {
  return [...hand].sort((a, b) => {
    const sd = SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit]
    return sd !== 0 ? sd : a.rank - b.rank
  })
}

// AI

export function getAIPass(hand: Card[], _direction: PassDirection): Card[] {
  const toPass: Card[] = []
  const spades = hand.filter(c => c.suit === 'spades')
  const hearts = hand.filter(c => c.suit === 'hearts')
  const hasQS = spades.some(c => c.rank === 12)

  // Pass Q♠ if unprotected
  if (hasQS && spades.length < 3) {
    toPass.push(spades.find(c => c.rank === 12)!)
  }

  // Pass A♠ / K♠ if not holding Q♠
  if (!hasQS && toPass.length < 3) {
    for (const c of spades.filter(c => c.rank === 14 || c.rank === 13).sort((a, b) => b.rank - a.rank)) {
      if (toPass.length < 3) toPass.push(c)
    }
  }

  // Pass high hearts if 4+
  if (hearts.length >= 4 && toPass.length < 3) {
    for (const c of hearts.filter(c => c.rank >= 12).sort((a, b) => b.rank - a.rank)) {
      if (toPass.length < 3 && !toPass.some(p => cardEquals(p, c))) toPass.push(c)
    }
  }

  // Fill with highest cards from longest suits
  if (toPass.length < 3) {
    const remaining = hand.filter(c => !toPass.some(p => cardEquals(p, c)))
    const bySuit = (['clubs', 'diamonds', 'spades', 'hearts'] as Suit[])
      .map(suit => remaining.filter(c => c.suit === suit).sort((a, b) => b.rank - a.rank))
      .sort((a, b) => b.length - a.length)
    for (const group of bySuit) {
      for (const c of group) {
        if (toPass.length < 3) toPass.push(c)
      }
    }
  }

  return toPass.slice(0, 3)
}

export function getAIPlay(
  hand: Card[],
  trick: TrickPlay[],
  heartsBroken: boolean,
  trickCount: number,
  _handPoints: [number, number, number, number],
  queenOfSpadesPlayed: boolean
): Card {
  const legalCards = getLegalCards(hand, trick, heartsBroken, trickCount)
  if (legalCards.length === 1) return legalCards[0]

  // Leading
  if (trick.length === 0) {
    const aiHoldsQS = hand.some(c => c.suit === 'spades' && c.rank === 12)
    const avoidSpades = !queenOfSpadesPlayed && !aiHoldsQS

    const clubs = legalCards.filter(c => c.suit === 'clubs').sort((a, b) => a.rank - b.rank)
    const diamonds = legalCards.filter(c => c.suit === 'diamonds').sort((a, b) => a.rank - b.rank)
    const spades = legalCards.filter(c => c.suit === 'spades').sort((a, b) => a.rank - b.rank)
    const hearts = legalCards.filter(c => c.suit === 'hearts').sort((a, b) => a.rank - b.rank)

    if (clubs.length > 0) return clubs[0]
    if (diamonds.length > 0) return diamonds[0]
    if (!avoidSpades && spades.length > 0) return spades[0]
    if (hearts.length > 0) return hearts[0]
    if (spades.length > 0) return spades[0]
    return legalCards[0]
  }

  // Following
  const ledSuit = trick[0].card.suit
  const hasLedSuit = hand.some(c => c.suit === ledSuit)

  if (hasLedSuit) {
    const winningRank = trick.reduce((max, p) => {
      return p.card.suit === ledSuit && p.card.rank > max ? p.card.rank : max
    }, 0)
    const losing = legalCards.filter(c => c.rank < winningRank)
    const hasPenalty = trick.some(p => isPenaltyCard(p.card))

    if (hasPenalty) {
      if (losing.length > 0) return losing.sort((a, b) => b.rank - a.rank)[0]
      return legalCards.sort((a, b) => a.rank - b.rank)[0]
    } else {
      if (losing.length > 0) return losing.sort((a, b) => b.rank - a.rank)[0]
      return legalCards.sort((a, b) => a.rank - b.rank)[0]
    }
  }

  // Void: discard
  const qs = legalCards.find(c => c.suit === 'spades' && c.rank === 12)
  if (qs) return qs

  const heartCards = legalCards.filter(c => c.suit === 'hearts').sort((a, b) => b.rank - a.rank)
  if (heartCards.length > 0) return heartCards[0]

  return legalCards.sort((a, b) => b.rank - a.rank)[0]
}
