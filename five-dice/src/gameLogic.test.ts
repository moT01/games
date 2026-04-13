import { describe, it, expect } from 'vitest'
import {
  scoreCategory, calcUpperTotal, calcUpperBonus, calcGrandTotal,
  isGameOver, handleScoreCategory, isFiveOfAKind,
} from './gameLogic'
import type { Die, GameState } from './gameLogic'

function dice(...values: number[]): Die[] {
  return values.map(v => ({ value: v, held: false }))
}

describe('scoreCategory', () => {
  it('ones: counts matching dice', () => {
    expect(scoreCategory('ones', dice(1, 1, 3, 4, 5))).toBe(2)
  })

  it('sixes: all sixes', () => {
    expect(scoreCategory('sixes', dice(6, 6, 6, 6, 6))).toBe(30)
  })

  it('threeOfAKind: three matching → sum all', () => {
    expect(scoreCategory('threeOfAKind', dice(3, 3, 3, 4, 5))).toBe(18)
  })

  it('threeOfAKind: no match → 0', () => {
    expect(scoreCategory('threeOfAKind', dice(1, 2, 3, 4, 5))).toBe(0)
  })

  it('fourOfAKind: four matching → sum all', () => {
    expect(scoreCategory('fourOfAKind', dice(2, 2, 2, 2, 5))).toBe(13)
  })

  it('fullHouse: 3+2 → 25', () => {
    expect(scoreCategory('fullHouse', dice(2, 2, 3, 3, 3))).toBe(25)
  })

  it('fullHouse: 4+1 → 0', () => {
    expect(scoreCategory('fullHouse', dice(2, 2, 2, 2, 3))).toBe(0)
  })

  it('smallStraight: 1-2-3-4 present → 30', () => {
    expect(scoreCategory('smallStraight', dice(1, 2, 3, 4, 6))).toBe(30)
  })

  it('smallStraight: no sequence of 4 → 0', () => {
    expect(scoreCategory('smallStraight', dice(1, 2, 3, 5, 6))).toBe(0)
  })

  it('largeStraight: 1-2-3-4-5 → 40', () => {
    expect(scoreCategory('largeStraight', dice(1, 2, 3, 4, 5))).toBe(40)
  })

  it('largeStraight: not all 5 sequential → 0', () => {
    expect(scoreCategory('largeStraight', dice(1, 2, 3, 4, 6))).toBe(0)
  })

  it('fiveOfAKind: all same → 50', () => {
    expect(scoreCategory('fiveOfAKind', dice(4, 4, 4, 4, 4))).toBe(50)
  })

  it('chance: sum all dice', () => {
    expect(scoreCategory('chance', dice(1, 2, 3, 4, 5))).toBe(15)
  })
})

describe('calcUpperTotal', () => {
  it('sums only defined upper scores', () => {
    expect(calcUpperTotal({ sixes: 18, fives: 15 })).toBe(33)
  })

  it('returns 0 with no upper scores', () => {
    expect(calcUpperTotal({})).toBe(0)
  })
})

describe('calcUpperBonus', () => {
  it('returns 35 when upper total is exactly 63', () => {
    const scores = { ones: 3, twos: 6, threes: 9, fours: 12, fives: 15, sixes: 18 }
    expect(calcUpperBonus(scores)).toBe(35)
  })

  it('returns 0 when upper total is 62', () => {
    const scores = { ones: 2, twos: 6, threes: 9, fours: 12, fives: 15, sixes: 18 }
    expect(calcUpperBonus(scores)).toBe(0)
  })
})

describe('calcGrandTotal', () => {
  it('sums upper + bonus + lower + fiveOfAKindBonus', () => {
    const scores = {
      ones: 3, twos: 6, threes: 9, fours: 12, fives: 15, sixes: 18,
      threeOfAKind: 25, fourOfAKind: 22, fullHouse: 25,
      smallStraight: 30, largeStraight: 40, fiveOfAKind: 0, chance: 25,
    }
    // upper=63, bonus=35, lower=167, fiveOfAKindBonus=100 → 365
    expect(calcGrandTotal(scores, 100)).toBe(365)
  })
})

describe('isGameOver', () => {
  it('returns true when all 13 categories defined', () => {
    const scores = {
      ones: 3, twos: 6, threes: 9, fours: 12, fives: 15, sixes: 18,
      threeOfAKind: 25, fourOfAKind: 22, fullHouse: 25,
      smallStraight: 30, largeStraight: 40, fiveOfAKind: 50, chance: 25,
    }
    expect(isGameOver(scores)).toBe(true)
  })

  it('returns false when 12 categories defined', () => {
    const scores = {
      ones: 3, twos: 6, threes: 9, fours: 12, fives: 15, sixes: 18,
      threeOfAKind: 25, fourOfAKind: 22, fullHouse: 25,
      smallStraight: 30, largeStraight: 40, fiveOfAKind: 50,
    }
    expect(isGameOver(scores)).toBe(false)
  })
})

describe('Five of a Kind bonus', () => {
  const baseState: GameState = {
    dice: dice(5, 5, 5, 5, 5),
    rollCount: 1,
    scores: { fiveOfAKind: 50 },
    fiveOfAKindBonus: 0,
    gamePhase: 'playing',
  }

  it('adds 100 bonus when scoring any category with five-of-a-kind dice and first was scored 50', () => {
    const next = handleScoreCategory('chance', baseState)
    expect(next.fiveOfAKindBonus).toBe(100)
  })

  it('does not add bonus when fiveOfAKind was scored as 0', () => {
    const state: GameState = { ...baseState, scores: { fiveOfAKind: 0 } }
    const next = handleScoreCategory('chance', state)
    expect(next.fiveOfAKindBonus).toBe(0)
  })
})

describe('isFiveOfAKind', () => {
  it('returns true when all dice same', () => {
    expect(isFiveOfAKind(dice(3, 3, 3, 3, 3))).toBe(true)
  })

  it('returns false when not all same', () => {
    expect(isFiveOfAKind(dice(3, 3, 3, 3, 4))).toBe(false)
  })
})
