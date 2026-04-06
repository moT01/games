import { describe, it, expect } from 'vitest'
import {
  createGoalState,
  isSolvable,
  shuffle,
  getBlankIndex,
  getAdjacentToBlank,
  slideTile,
  isSolved,
} from './logic'

describe('createGoalState', () => {
  it('3x3 returns [1,2,3,4,5,6,7,8,0]', () => {
    expect(createGoalState(3)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 0])
  })

  it('4x4 returns [1,2,...,15,0]', () => {
    const result = createGoalState(4)
    expect(result).toHaveLength(16)
    expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0])
  })
})

describe('isSolvable', () => {
  it('goal state 3x3 is solvable', () => {
    expect(isSolvable([1, 2, 3, 4, 5, 6, 7, 8, 0], 3)).toBe(true)
  })

  it('one swap 3x3 [1,2,3,4,5,6,8,7,0] is unsolvable', () => {
    expect(isSolvable([1, 2, 3, 4, 5, 6, 8, 7, 0], 3)).toBe(false)
  })

  it('known solvable 4x4 — blank on row 3 (row from bottom = 1, odd)', () => {
    // Goal state: blank at index 15, row=3, rowFromBottom=1, inversions=0; 0+1=1 (odd) → solvable
    expect(isSolvable([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0], 4)).toBe(true)
  })
})

describe('shuffle', () => {
  it('returns array of length 16 with each 0-15 exactly once and is solvable', () => {
    const result = shuffle(4)
    expect(result).toHaveLength(16)
    const sorted = [...result].sort((a, b) => a - b)
    expect(sorted).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
    expect(isSolvable(result, 4)).toBe(true)
  })
})

describe('getBlankIndex', () => {
  it('returns index of 0', () => {
    expect(getBlankIndex([1, 0, 2, 3])).toBe(1)
  })
})

describe('getAdjacentToBlank', () => {
  it('blank at corner (0,0) of 3x3 returns only right and below', () => {
    // blank at index 0: row=0, col=0 → right=1, below=3
    const tiles = [0, 1, 2, 3, 4, 5, 6, 7, 8]
    const result = getAdjacentToBlank(tiles, 3)
    expect(result.sort()).toEqual([1, 3].sort())
  })

  it('blank at center (1,1) of 3x3 returns 4 indices', () => {
    // blank at index 4: above=1, below=7, left=3, right=5
    const tiles = [1, 2, 3, 4, 0, 5, 6, 7, 8]
    const result = getAdjacentToBlank(tiles, 3)
    expect(result).toHaveLength(4)
    expect(result.sort()).toEqual([1, 3, 5, 7].sort())
  })
})

describe('slideTile', () => {
  it('slides tile at index 1 with blank at index 0', () => {
    const original = [0, 1, 2, 3]
    const result = slideTile(original, 1)
    expect(result[0]).toBe(1)
    expect(result[1]).toBe(0)
    // original unchanged
    expect(original[0]).toBe(0)
    expect(original[1]).toBe(1)
  })
})

describe('isSolved', () => {
  it('goal state returns true', () => {
    expect(isSolved([1, 2, 3, 4, 5, 6, 7, 8, 0])).toBe(true)
  })

  it('one tile swapped returns false', () => {
    expect(isSolved([1, 2, 3, 4, 5, 6, 8, 7, 0])).toBe(false)
  })
})
