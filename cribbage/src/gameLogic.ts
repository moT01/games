export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'

export interface Card {
  id: string
  suit: Suit
  rank: Rank
}

export interface Pegs {
  front: number
  back: number
}

export interface ScoreCombo {
  type: 'fifteen' | 'pair' | 'run' | 'flush' | 'nobs'
  cardIds: string[]
  points: number
  label: string
}

export interface ScoreBreakdown {
  fifteens: number
  pairs: number
  runs: number
  flush: number
  nobs: number
  total: number
  combos: ScoreCombo[]
}

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades']
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

export function createDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ id: `${rank}-${suit}`, suit, rank })
    }
  }
  return deck
}

export function shuffle(deck: Card[]): Card[] {
  const d = [...deck]
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[d[i], d[j]] = [d[j], d[i]]
  }
  return d
}

export function dealHands(deck: Card[]): {
  humanHand: Card[]
  computerHand: Card[]
  remainingDeck: Card[]
} {
  const humanHand: Card[] = []
  const computerHand: Card[] = []
  const remaining = [...deck]
  for (let i = 0; i < 6; i++) {
    humanHand.push(remaining.shift()!)
    computerHand.push(remaining.shift()!)
  }
  return { humanHand, computerHand, remainingDeck: remaining }
}

export function cardValue(card: Card): number {
  if (card.rank === 'A') return 1
  if (['J', 'Q', 'K'].includes(card.rank)) return 10
  return parseInt(card.rank, 10)
}

export function rankOrder(card: Card): number {
  if (card.rank === 'A') return 1
  if (card.rank === 'J') return 11
  if (card.rank === 'Q') return 12
  if (card.rank === 'K') return 13
  return parseInt(card.rank, 10)
}

function subsets<T>(arr: T[], size: number): T[][] {
  if (size === 0) return [[]]
  if (arr.length < size) return []
  const [first, ...rest] = arr
  const withFirst = subsets(rest, size - 1).map(s => [first, ...s])
  const withoutFirst = subsets(rest, size)
  return [...withFirst, ...withoutFirst]
}

export function scoreFifteens(cards: Card[]): number {
  let total = 0
  for (let size = 2; size <= 5; size++) {
    for (const subset of subsets(cards, size)) {
      if (subset.reduce((sum, c) => sum + cardValue(c), 0) === 15) {
        total += 2
      }
    }
  }
  return total
}

export function scorePairs(cards: Card[]): number {
  let total = 0
  const byRank: Record<string, number> = {}
  for (const c of cards) {
    byRank[c.rank] = (byRank[c.rank] || 0) + 1
  }
  for (const n of Object.values(byRank)) {
    // C(n,2) * 2 = n*(n-1)
    total += n * (n - 1)
  }
  return total
}

export function scoreRuns(cards: Card[]): number {
  const orders = cards.map(rankOrder).sort((a, b) => a - b)
  for (let len = cards.length; len >= 3; len--) {
    let best = 0
    for (const subset of subsets(orders, len)) {
      const sorted = [...subset].sort((a, b) => a - b)
      const unique = [...new Set(sorted)]
      if (unique.length < 3) continue
      const isConsecutive = unique[unique.length - 1] - unique[0] === unique.length - 1
      if (!isConsecutive) continue
      const multiplicity = sorted.length / unique.length
      // Each unique rank must appear exactly multiplicity times
      const counts: Record<number, number> = {}
      for (const v of sorted) counts[v] = (counts[v] || 0) + 1
      const uniform = Object.values(counts).every(c => c === multiplicity)
      if (!uniform) continue
      const score = unique.length * multiplicity
      if (score > best) best = score
    }
    if (best > 0) return best
  }
  return 0
}

export function scoreFlush(handCards: Card[], starterCard: Card | null, isCrib: boolean): number {
  const suit = handCards[0].suit
  if (!handCards.every(c => c.suit === suit)) return 0
  if (starterCard && starterCard.suit === suit) return 5
  if (isCrib) return 0
  return 4
}

export function scoreNobs(handCards: Card[], starterCard: Card): number {
  return handCards.some(c => c.rank === 'J' && c.suit === starterCard.suit) ? 1 : 0
}

export function scoreHand(
  handCards: Card[],
  starterCard: Card | null,
  isCrib: boolean
): ScoreBreakdown {
  const allCards = starterCard ? [...handCards, starterCard] : [...handCards]
  const fifteens = scoreFifteens(allCards)
  const pairs = scorePairs(allCards)
  const runs = scoreRuns(allCards)
  const flush = scoreFlush(handCards, starterCard, isCrib)
  const nobs = starterCard ? scoreNobs(handCards, starterCard) : 0
  const total = fifteens + pairs + runs + flush + nobs
  return { fifteens, pairs, runs, flush, nobs, total, combos: [] }
}

export function allCombinations(
  handCards: Card[],
  starterCard: Card,
  isCrib: boolean
): ScoreCombo[] {
  const allCards = [...handCards, starterCard]
  const combos: ScoreCombo[] = []

  // Fifteens
  for (let size = 2; size <= 5; size++) {
    for (const subset of subsets(allCards, size)) {
      if (subset.reduce((sum, c) => sum + cardValue(c), 0) === 15) {
        combos.push({
          type: 'fifteen',
          cardIds: subset.map(c => c.id),
          points: 2,
          label: 'Fifteen for 2',
        })
      }
    }
  }

  // Pairs
  for (const subset of subsets(allCards, 2)) {
    if (subset[0].rank === subset[1].rank) {
      combos.push({
        type: 'pair',
        cardIds: subset.map(c => c.id),
        points: 2,
        label: 'Pair for 2',
      })
    }
  }

  // Runs — find maximal run length and multiplicity
  const orders = allCards.map(rankOrder).sort((a, b) => a - b)
  let foundRunLen = 0
  outer: for (let len = allCards.length; len >= 3; len--) {
    for (const subset of subsets(orders, len)) {
      const sorted = [...subset].sort((a, b) => a - b)
      const unique = [...new Set(sorted)]
      if (unique.length < 3) continue
      const isConsecutive = unique[unique.length - 1] - unique[0] === unique.length - 1
      if (!isConsecutive) continue
      const multiplicity = sorted.length / unique.length
      const counts: Record<number, number> = {}
      for (const v of sorted) counts[v] = (counts[v] || 0) + 1
      const uniform = Object.values(counts).every(c => c === multiplicity)
      if (!uniform) continue
      foundRunLen = unique.length
      break outer
    }
  }
  if (foundRunLen >= 3) {
    // Generate each individual run combo
    // Build subsets of allCards with the right unique rankOrders
    const uniqueRanks = [...new Set(allCards.map(rankOrder))].sort((a, b) => a - b)
    // Find a consecutive sequence of foundRunLen in uniqueRanks
    for (let start = 0; start <= uniqueRanks.length - foundRunLen; start++) {
      const seq = uniqueRanks.slice(start, start + foundRunLen)
      if (seq[seq.length - 1] - seq[0] !== foundRunLen - 1) continue
      // Cards matching these rank orders
      const groups: Card[][] = seq.map(ro => allCards.filter(c => rankOrder(c) === ro))
      // Generate combinations picking 1 card per rank group (foundMultiplicity=1) or all combos
      function pickOne(groups: Card[][], idx: number, current: Card[]): Card[][] {
        if (idx === groups.length) return [current]
        const result: Card[][] = []
        for (const c of groups[idx]) {
          result.push(...pickOne(groups, idx + 1, [...current, c]))
        }
        return result
      }
      for (const run of pickOne(groups, 0, [])) {
        combos.push({
          type: 'run',
          cardIds: run.map(c => c.id),
          points: foundRunLen,
          label: `Run of ${foundRunLen} for ${foundRunLen}`,
        })
      }
    }
  }

  // Flush
  const flushPoints = scoreFlush(handCards, starterCard, isCrib)
  if (flushPoints > 0) {
    const flushCards = flushPoints === 5 ? allCards : handCards
    combos.push({
      type: 'flush',
      cardIds: flushCards.map(c => c.id),
      points: flushPoints,
      label: `Flush for ${flushPoints}`,
    })
  }

  // Nobs
  if (scoreNobs(handCards, starterCard) > 0) {
    const jack = handCards.find(c => c.rank === 'J' && c.suit === starterCard.suit)!
    combos.push({
      type: 'nobs',
      cardIds: [jack.id],
      points: 1,
      label: 'Nobs for 1',
    })
  }

  return combos
}

export function detectPeggingPairs(sequence: Card[]): number {
  if (sequence.length < 2) return 0
  const last = sequence[sequence.length - 1]
  let count = 1
  for (let i = sequence.length - 2; i >= 0; i--) {
    if (sequence[i].rank === last.rank) {
      count++
    } else {
      break
    }
  }
  if (count < 2) return 0
  // 2 in a row=2pts, 3=6pts, 4=12pts => count*(count-1)
  return count * (count - 1)
}

export function detectPeggingRun(sequence: Card[]): number {
  for (let len = sequence.length; len >= 3; len--) {
    const tail = sequence.slice(sequence.length - len)
    const sorted = tail.map(rankOrder).sort((a, b) => a - b)
    const unique = [...new Set(sorted)]
    if (unique.length < 3) continue
    const isConsecutive = unique[unique.length - 1] - unique[0] === unique.length - 1
    if (!isConsecutive) continue
    const multiplicity = sorted.length / unique.length
    const counts: Record<number, number> = {}
    for (const v of sorted) counts[v] = (counts[v] || 0) + 1
    const uniform = Object.values(counts).every(c => c === multiplicity)
    if (!uniform) continue
    return unique.length * multiplicity
  }
  return 0
}

export function scorePegging(
  sequence: Card[],
  newCard: Card,
  currentCount: number
): { points: number; events: string[] } {
  const newSequence = [...sequence, newCard]
  const newCount = currentCount + cardValue(newCard)
  let points = 0
  const events: string[] = []

  if (newCount === 15) {
    points += 2
    events.push('Fifteen for 2')
  }
  if (newCount === 31) {
    points += 2
    events.push('Thirty-one for 2')
  }

  const pairPts = detectPeggingPairs(newSequence)
  if (pairPts > 0) {
    points += pairPts
    events.push(`Pair for ${pairPts}`)
  }

  // Only check runs if count hasn't hit 31
  if (newCount !== 31) {
    const runPts = detectPeggingRun(newSequence)
    if (runPts > 0) {
      points += runPts
      events.push(`Run of ${runPts} for ${runPts}`)
    }
  }

  return { points, events }
}

export function resolveGo(_sequence: Card[], currentCount: number): number {
  if (currentCount === 31) return 0
  return 1
}

export function validateManualCombo(
  selected: Card[],
  _starterCard: Card,
  allCombos: ScoreCombo[],
  claimedCombos: ScoreCombo[]
): { valid: boolean; combo?: ScoreCombo; error?: string } {
  const selectedIds = selected.map(c => c.id).sort()

  const matchingCombo = allCombos.find(combo => {
    const comboIds = [...combo.cardIds].sort()
    return (
      comboIds.length === selectedIds.length &&
      comboIds.every((id, i) => id === selectedIds[i])
    )
  })

  if (!matchingCombo) {
    return { valid: false, error: 'Not a valid scoring combination' }
  }

  const alreadyClaimed = claimedCombos.some(claimed => {
    const claimedIds = [...claimed.cardIds].sort()
    return (
      claimedIds.length === selectedIds.length &&
      claimedIds.every((id, i) => id === selectedIds[i]) &&
      claimed.type === matchingCombo.type
    )
  })

  if (alreadyClaimed) {
    return { valid: false, error: 'Already claimed' }
  }

  return { valid: true, combo: matchingCombo }
}

export function computerDiscard(hand: Card[], isDealer: boolean): [Card, Card] {
  const indices = [0, 1, 2, 3, 4, 5]
  let bestScore = -Infinity
  let bestDiscard: [Card, Card] = [hand[0], hand[1]]

  for (const keepIdx of subsets(indices, 4)) {
    const discardIdx = indices.filter(i => !keepIdx.includes(i))
    const keep = keepIdx.map(i => hand[i])
    const discard = discardIdx.map(i => hand[i]) as [Card, Card]

    const keepScore = scoreHand(keep, null, false).total
    const cribBonusScore = cribBonus(discard, isDealer)
    const total = keepScore + (isDealer ? cribBonusScore : -cribBonusScore)

    if (
      total > bestScore ||
      (total === bestScore &&
        Math.max(...keep.map(rankOrder)) - Math.min(...keep.map(rankOrder)) <
          Math.max(...bestDiscard.map(rankOrder)) - Math.min(...bestDiscard.map(rankOrder)))
    ) {
      bestScore = total
      bestDiscard = discard
    }
  }

  return bestDiscard
}

function cribBonus(discard: [Card, Card], _isDealer: boolean): number {
  let bonus = 0
  if (discard[0].rank === discard[1].rank) bonus += 2
  const sum = cardValue(discard[0]) + cardValue(discard[1])
  if (sum === 5) bonus += 1
  if (sum === 15) bonus += 2
  return bonus
}

export function computerPlayCard(
  hand: Card[],
  sequence: Card[],
  currentCount: number
): Card {
  const valid = hand.filter(c => cardValue(c) + currentCount <= 31)
  if (valid.length === 0) throw new Error('No valid card to play')

  // Prefer hitting exactly 15
  const hit15 = valid.find(c => currentCount + cardValue(c) === 15)
  if (hit15) return hit15

  // Prefer hitting exactly 31
  const hit31 = valid.find(c => currentCount + cardValue(c) === 31)
  if (hit31) return hit31

  // Prefer extending a run
  for (const c of valid) {
    const testSeq = [...sequence, c]
    if (detectPeggingRun(testSeq) > 0) return c
  }

  // If count < 15, prefer low cards (avoid 5s as lead)
  if (currentCount < 15) {
    const noFives = valid.filter(c => c.rank !== '5')
    if (noFives.length > 0) {
      return noFives.sort((a, b) => cardValue(a) - cardValue(b))[0]
    }
  }

  // If count > 21, play highest card that fits
  if (currentCount > 21) {
    return valid.sort((a, b) => cardValue(b) - cardValue(a))[0]
  }

  return valid[0]
}

export function advancePegs(pegs: Pegs, points: number): Pegs {
  return {
    back: pegs.front,
    front: Math.min(pegs.front + points, 121),
  }
}

export function checkWin(score: number): boolean {
  return score >= 121
}
