import { describe, it, expect } from 'vitest'
import {
  createDeck, dealHands, getPassDirection, applyPass,
  getLegalCards, getTrickWinner, getTrickPoints,
  checkMoonShot, applyMoonShot, getWinner,
  type Card, type TrickPlay,
} from './gameLogic'

describe('createDeck', () => {
  it('returns 52 unique cards', () => {
    const deck = createDeck()
    expect(deck.length).toBe(52)
    const keys = new Set(deck.map(c => `${c.suit}-${c.rank}`))
    expect(keys.size).toBe(52)
  })
})

describe('dealHands', () => {
  it('produces 4 arrays of 13 cards each with no duplicates', () => {
    const deck = createDeck()
    const hands = dealHands(deck)
    expect(hands.length).toBe(4)
    hands.forEach(h => expect(h.length).toBe(13))
    const all = hands.flat()
    const keys = new Set(all.map(c => `${c.suit}-${c.rank}`))
    expect(keys.size).toBe(52)
  })
})

describe('getPassDirection', () => {
  it('cycles left, right, across, none', () => {
    expect(getPassDirection(1)).toBe('left')
    expect(getPassDirection(2)).toBe('right')
    expect(getPassDirection(3)).toBe('across')
    expect(getPassDirection(4)).toBe('none')
    expect(getPassDirection(5)).toBe('left')
  })
})

describe('applyPass', () => {
  it('moves cards left: player 0 to 1, 1 to 2, 2 to 3, 3 to 0', () => {
    const hands: [Card[], Card[], Card[], Card[]] = [
      [{ suit: 'clubs', rank: 2 }, { suit: 'clubs', rank: 3 }, { suit: 'clubs', rank: 4 }],
      [{ suit: 'diamonds', rank: 2 }, { suit: 'diamonds', rank: 3 }, { suit: 'diamonds', rank: 4 }],
      [{ suit: 'hearts', rank: 2 }, { suit: 'hearts', rank: 3 }, { suit: 'hearts', rank: 4 }],
      [{ suit: 'spades', rank: 2 }, { suit: 'spades', rank: 3 }, { suit: 'spades', rank: 4 }],
    ]
    const selections: [Card[], Card[], Card[], Card[]] = [
      [{ suit: 'clubs', rank: 2 }],
      [{ suit: 'diamonds', rank: 2 }],
      [{ suit: 'hearts', rank: 2 }],
      [{ suit: 'spades', rank: 2 }],
    ]
    const result = applyPass(hands, selections, 'left')
    // Player 0 passed clubs-2 to player 1
    expect(result[0].some(c => c.suit === 'clubs' && c.rank === 2)).toBe(false)
    expect(result[1].some(c => c.suit === 'clubs' && c.rank === 2)).toBe(true)
    // Player 3 passed spades-2 to player 0
    expect(result[3].some(c => c.suit === 'spades' && c.rank === 2)).toBe(false)
    expect(result[0].some(c => c.suit === 'spades' && c.rank === 2)).toBe(true)
  })
})

describe('getLegalCards', () => {
  it('must follow suit if possible', () => {
    const hand: Card[] = [{ suit: 'hearts', rank: 3 }, { suit: 'clubs', rank: 5 }]
    const trick: TrickPlay[] = [{ player: 1, card: { suit: 'clubs', rank: 7 } }]
    const legal = getLegalCards(hand, trick, true, 1)
    expect(legal).toEqual([{ suit: 'clubs', rank: 5 }])
  })

  it('allows all cards when void in led suit', () => {
    const hand: Card[] = [{ suit: 'hearts', rank: 3 }, { suit: 'diamonds', rank: 5 }]
    const trick: TrickPlay[] = [{ player: 1, card: { suit: 'clubs', rank: 7 } }]
    const legal = getLegalCards(hand, trick, true, 1)
    expect(legal.length).toBe(2)
  })

  it('trick 1, leading with only hearts and Q-spades: returns all', () => {
    const hand: Card[] = [
      { suit: 'hearts', rank: 14 },
      { suit: 'hearts', rank: 10 },
      { suit: 'spades', rank: 12 },
    ]
    const legal = getLegalCards(hand, [], false, 0)
    expect(legal.length).toBe(hand.length)
  })

  it('trick 1 following, void in clubs, has non-penalty cards: excludes hearts and Q-spades', () => {
    const hand: Card[] = [
      { suit: 'hearts', rank: 5 },
      { suit: 'spades', rank: 12 },
      { suit: 'diamonds', rank: 8 },
    ]
    const trick: TrickPlay[] = [{ player: 1, card: { suit: 'clubs', rank: 2 } }]
    const legal = getLegalCards(hand, trick, false, 0)
    expect(legal).toEqual([{ suit: 'diamonds', rank: 8 }])
  })

  it('leading, hearts not broken, has non-hearts: excludes hearts', () => {
    const hand: Card[] = [
      { suit: 'hearts', rank: 5 },
      { suit: 'clubs', rank: 8 },
    ]
    const legal = getLegalCards(hand, [], false, 3)
    expect(legal).toEqual([{ suit: 'clubs', rank: 8 }])
  })

  it('leading, hearts not broken, only hearts: returns all', () => {
    const hand: Card[] = [
      { suit: 'hearts', rank: 5 },
      { suit: 'hearts', rank: 9 },
    ]
    const legal = getLegalCards(hand, [], false, 3)
    expect(legal.length).toBe(2)
  })
})

describe('getTrickWinner', () => {
  it('returns player who played highest card of led suit', () => {
    const trick: TrickPlay[] = [
      { player: 0, card: { suit: 'clubs', rank: 3 } },
      { player: 1, card: { suit: 'diamonds', rank: 9 } },
      { player: 2, card: { suit: 'clubs', rank: 11 } },
      { player: 3, card: { suit: 'clubs', rank: 5 } },
    ]
    expect(getTrickWinner(trick)).toBe(2)
  })
})

describe('getTrickPoints', () => {
  it('counts hearts as 1 each and Q-spades as 13', () => {
    const trick: TrickPlay[] = [
      { player: 0, card: { suit: 'hearts', rank: 3 } },
      { player: 1, card: { suit: 'spades', rank: 12 } },
      { player: 2, card: { suit: 'diamonds', rank: 2 } },
      { player: 3, card: { suit: 'hearts', rank: 4 } },
    ]
    expect(getTrickPoints(trick)).toBe(15)
  })
})

describe('checkMoonShot', () => {
  it('returns player id when one player has all 26 points', () => {
    expect(checkMoonShot([0, 26, 0, 0])).toBe(1)
    expect(checkMoonShot([0, 0, 26, 0])).toBe(2)
  })

  it('returns null when points are split', () => {
    expect(checkMoonShot([13, 13, 0, 0])).toBeNull()
    expect(checkMoonShot([1, 25, 0, 0])).toBeNull()
  })
})

describe('applyMoonShot', () => {
  it('adds 26 to all players except the shooter', () => {
    const result = applyMoonShot([10, 0, 10, 10], 1)
    expect(result).toEqual([36, 0, 36, 36])
  })
})

describe('getWinner', () => {
  it('returns player with lowest score', () => {
    expect(getWinner([10, 50, 30, 40])).toEqual([0])
  })

  it('returns all tied players when scores are equal', () => {
    expect(getWinner([10, 10, 30, 40])).toEqual([0, 1])
  })
})
