import { describe, it, expect } from 'vitest'
import {
  initBoard,
  initGame,
  rollDice,
  canBearOff,
  getAllValidMoves,
  getValidMovesForChecker,
  applyMove,
  checkWinner,
  getPipCount,
  scoreBoard,
  type GameState,
  type Point,
} from './gameLogic'

// Helper: build a minimal GameState from partial overrides
function makeState(overrides: Partial<GameState>): GameState {
  return {
    points: Array.from({ length: 24 }, () => ({ count: 0, color: null })),
    bar: { white: 0, black: 0 },
    off: { white: 0, black: 0 },
    currentPlayer: 'white',
    dice: [],
    diceRolled: true,
    phase: 'playing',
    winner: null,
    mode: 'two-player',
    selectedPoint: null,
    validMoves: [],
    forcedSkip: false,
    ...overrides,
  }
}

// Helper: set a single point in a points array
function setPoint(points: Point[], index: number, color: 'white' | 'black', count: number): Point[] {
  const copy = points.map(p => ({ ...p }))
  copy[index] = { color, count }
  return copy
}

// ─── initBoard ───────────────────────────────────────────────────────────────

describe('initBoard', () => {
  it('has 24 points', () => {
    expect(initBoard()).toHaveLength(24)
  })

  it('white starting position: 2@0, 5@11, 3@16, 5@18', () => {
    const b = initBoard()
    expect(b[0]).toEqual({ count: 2, color: 'white' })
    expect(b[11]).toEqual({ count: 5, color: 'white' })
    expect(b[16]).toEqual({ count: 3, color: 'white' })
    expect(b[18]).toEqual({ count: 5, color: 'white' })
  })

  it('black starting position: 5@5, 3@7, 5@12, 2@23', () => {
    const b = initBoard()
    expect(b[5]).toEqual({ count: 5, color: 'black' })
    expect(b[7]).toEqual({ count: 3, color: 'black' })
    expect(b[12]).toEqual({ count: 5, color: 'black' })
    expect(b[23]).toEqual({ count: 2, color: 'black' })
  })

  it('all other points are empty', () => {
    const b = initBoard()
    const occupied = new Set([0, 5, 7, 11, 12, 16, 18, 23])
    for (let i = 0; i < 24; i++) {
      if (!occupied.has(i)) {
        expect(b[i]).toEqual({ count: 0, color: null })
      }
    }
  })

  it('total 15 white checkers', () => {
    const b = initBoard()
    const total = b.reduce((sum, p) => sum + (p.color === 'white' ? p.count : 0), 0)
    expect(total).toBe(15)
  })

  it('total 15 black checkers', () => {
    const b = initBoard()
    const total = b.reduce((sum, p) => sum + (p.color === 'black' ? p.count : 0), 0)
    expect(total).toBe(15)
  })
})

// ─── rollDice ────────────────────────────────────────────────────────────────

describe('rollDice', () => {
  it('always returns 2 or 4 values', () => {
    for (let i = 0; i < 100; i++) {
      const d = rollDice()
      expect(d.length === 2 || d.length === 4).toBe(true)
    }
  })

  it('all values are between 1 and 6', () => {
    for (let i = 0; i < 100; i++) {
      for (const v of rollDice()) {
        expect(v).toBeGreaterThanOrEqual(1)
        expect(v).toBeLessThanOrEqual(6)
      }
    }
  })

  it('doubles produce 4 equal values', () => {
    // Run many times; we'll see at least one double in 100 tries
    let sawDoubles = false
    for (let i = 0; i < 200; i++) {
      const d = rollDice()
      if (d.length === 4) {
        sawDoubles = true
        expect(new Set(d).size).toBe(1)
      }
    }
    expect(sawDoubles).toBe(true)
  })

  it('non-doubles produce 2 distinct values', () => {
    let sawNonDoubles = false
    for (let i = 0; i < 200; i++) {
      const d = rollDice()
      if (d.length === 2) {
        sawNonDoubles = true
        expect(d[0]).not.toBe(d[1])
      }
    }
    expect(sawNonDoubles).toBe(true)
  })
})

// ─── canBearOff ──────────────────────────────────────────────────────────────

describe('canBearOff', () => {
  it('false when white has a checker outside home board', () => {
    const state = makeState({
      currentPlayer: 'white',
      points: setPoint(
        setPoint(Array.from({ length: 24 }, () => ({ count: 0, color: null })), 20, 'white', 14),
        5, 'white', 1, // index 5 is outside white home board (18–23)
      ),
    })
    expect(canBearOff(state, 'white')).toBe(false)
  })

  it('false when white has a checker on bar', () => {
    const pts = Array.from({ length: 24 }, () => ({ count: 0, color: null }))
    pts[18] = { count: 15, color: 'white' }
    const state = makeState({ points: pts, bar: { white: 1, black: 0 } })
    expect(canBearOff(state, 'white')).toBe(false)
  })

  it('true when all 15 white checkers are on home board (indices 18–23)', () => {
    const pts = Array.from({ length: 24 }, () => ({ count: 0, color: null }))
    // Spread 15 white checkers across home board
    pts[18] = { count: 5, color: 'white' }
    pts[19] = { count: 4, color: 'white' }
    pts[20] = { count: 3, color: 'white' }
    pts[21] = { count: 2, color: 'white' }
    pts[22] = { count: 1, color: 'white' }
    const state = makeState({ points: pts })
    expect(canBearOff(state, 'white')).toBe(true)
  })

  it('false when black has a checker outside home board', () => {
    const pts = Array.from({ length: 24 }, () => ({ count: 0, color: null }))
    pts[3] = { count: 14, color: 'black' }
    pts[10] = { count: 1, color: 'black' } // outside black home (0–5)
    const state = makeState({ points: pts })
    expect(canBearOff(state, 'black')).toBe(false)
  })

  it('true when all 15 black checkers are on home board (indices 0–5)', () => {
    const pts = Array.from({ length: 24 }, () => ({ count: 0, color: null }))
    pts[0] = { count: 5, color: 'black' }
    pts[1] = { count: 4, color: 'black' }
    pts[2] = { count: 3, color: 'black' }
    pts[3] = { count: 2, color: 'black' }
    pts[4] = { count: 1, color: 'black' }
    const state = makeState({ points: pts })
    expect(canBearOff(state, 'black')).toBe(true)
  })
})

// ─── getAllValidMoves ─────────────────────────────────────────────────────────

describe('getAllValidMoves', () => {
  it('returns empty when dice is empty', () => {
    const state = makeState({ points: initBoard(), dice: [] })
    expect(getAllValidMoves(state)).toHaveLength(0)
  })

  it('returns empty when all landing points are blocked', () => {
    // White checker at index 18, dice = [1]. Target = 19, blocked by 2 black checkers.
    const pts = Array.from({ length: 24 }, () => ({ count: 0, color: null }))
    pts[18] = { count: 1, color: 'white' }
    pts[19] = { count: 2, color: 'black' }
    const state = makeState({ points: pts, dice: [1] })
    expect(getAllValidMoves(state)).toHaveLength(0)
  })

  it('with bar checkers returns only bar re-entry moves', () => {
    // White has 1 checker on bar; entry zone is indices 0–5 (die d → index d-1).
    // Die = 3 → index 2. Index 2 is empty so re-entry is valid.
    const pts = Array.from({ length: 24 }, () => ({ count: 0, color: null }))
    pts[20] = { count: 1, color: 'white' } // checker NOT on bar — should be ignored
    const state = makeState({
      points: pts,
      bar: { white: 1, black: 0 },
      dice: [3],
    })
    const moves = getAllValidMoves(state)
    expect(moves).toHaveLength(1)
    expect(moves[0]).toMatchObject({ from: 'bar', to: 2, dieUsed: 3 })
  })

  it('bar re-entry blocked when all entry points are made points', () => {
    // White on bar; dice = [1, 2]. Both entry points (0 and 1) have 2 black checkers.
    const pts = Array.from({ length: 24 }, () => ({ count: 0, color: null }))
    pts[0] = { count: 2, color: 'black' }
    pts[1] = { count: 2, color: 'black' }
    const state = makeState({
      points: pts,
      bar: { white: 1, black: 0 },
      dice: [1, 2],
    })
    expect(getAllValidMoves(state)).toHaveLength(0)
  })
})

// ─── getValidMovesForChecker ──────────────────────────────────────────────────

describe('getValidMovesForChecker', () => {
  it('cannot move to a made point (2+ opponent checkers)', () => {
    const pts = Array.from({ length: 24 }, () => ({ count: 0, color: null }))
    pts[10] = { count: 1, color: 'white' }
    pts[11] = { count: 2, color: 'black' } // made point — blocked
    const state = makeState({ points: pts, dice: [1] })
    const moves = getValidMovesForChecker(state, 10)
    expect(moves.every(m => m.to !== 11)).toBe(true)
    expect(moves).toHaveLength(0)
  })

  it('can move to a blot and hit it', () => {
    const pts = Array.from({ length: 24 }, () => ({ count: 0, color: null }))
    pts[10] = { count: 1, color: 'white' }
    pts[11] = { count: 1, color: 'black' } // blot — can hit
    const state = makeState({ points: pts, dice: [1] })
    const moves = getValidMovesForChecker(state, 10)
    expect(moves).toHaveLength(1)
    expect(moves[0]).toMatchObject({ from: 10, to: 11, dieUsed: 1 })
  })

  it('bar checker (white) can only enter on indices 0–5', () => {
    // White on bar with dice [3, 6]. Index 2 (die 3) is open; index 5 (die 6) is open.
    const pts = Array.from({ length: 24 }, () => ({ count: 0, color: null }))
    const state = makeState({
      points: pts,
      bar: { white: 1, black: 0 },
      dice: [3, 6],
    })
    const moves = getValidMovesForChecker(state, 'bar')
    for (const m of moves) {
      expect(typeof m.to).toBe('number')
      expect(m.to as number).toBeGreaterThanOrEqual(0)
      expect(m.to as number).toBeLessThanOrEqual(5)
    }
    expect(moves.length).toBeGreaterThan(0)
  })

  it('bar checker (black) can only enter on indices 18–23', () => {
    // Black on bar with dice [3]. Index 24-3=21 should be the entry.
    const pts = Array.from({ length: 24 }, () => ({ count: 0, color: null }))
    const state = makeState({
      currentPlayer: 'black',
      points: pts,
      bar: { white: 0, black: 1 },
      dice: [3],
    })
    const moves = getValidMovesForChecker(state, 'bar')
    expect(moves).toHaveLength(1)
    expect(moves[0]).toMatchObject({ from: 'bar', to: 21, dieUsed: 3 })
  })

  it('bearing off: over-roll allowed only when no checker farther from bearing off', () => {
    // White bearing off. Checker at 18 (pipsNeeded=6), die=6 exact → always valid.
    const pts = Array.from({ length: 24 }, () => ({ count: 0, color: null }))
    pts[18] = { count: 1, color: 'white' }
    const state = makeState({ points: pts, dice: [6] })
    const moves = getValidMovesForChecker(state, 18)
    expect(moves).toHaveLength(1)
    expect(moves[0].to).toBe('off')
  })

  it('bearing off: over-roll blocked when higher-indexed checker exists (white)', () => {
    // White bearing off. Checker at 18 (pipsNeeded=6), die=5 (over for index 18 means
    // die > pipsNeeded: pipsNeeded=6, die=5 < 6, so actually this is under-roll → not valid).
    // Let's use: checker at index 19 (pipsNeeded=5), die=6 (over-roll).
    // Also checker at index 18 (pipsNeeded=6, farther from bearing off for white).
    // Over-roll from 19 should be BLOCKED because index 18 has a checker farther away.
    const pts = Array.from({ length: 24 }, () => ({ count: 0, color: null }))
    pts[18] = { count: 1, color: 'white' } // farther from bearing off
    pts[19] = { count: 1, color: 'white' }
    const state = makeState({ points: pts, dice: [6] })
    const moves = getValidMovesForChecker(state, 19)
    // die=6, pipsNeeded for 19 = 24-19=5; die > pipsNeeded so over-roll.
    // But index 18 has a white checker farther out → not valid.
    expect(moves.filter(m => m.to === 'off')).toHaveLength(0)
  })
})

// ─── applyMove ────────────────────────────────────────────────────────────────

describe('applyMove', () => {
  it('hit blot goes to bar, landing checker occupies the point', () => {
    const pts = Array.from({ length: 24 }, () => ({ count: 0, color: null }))
    pts[10] = { count: 1, color: 'white' }
    pts[11] = { count: 1, color: 'black' } // blot
    const state = makeState({ points: pts, dice: [1] })
    const next = applyMove(state, { from: 10, to: 11, dieUsed: 1 })
    expect(next.points[11]).toEqual({ count: 1, color: 'white' })
    expect(next.bar.black).toBe(1)
  })

  it('bearing off: removes checker from point and increments off count', () => {
    const pts = Array.from({ length: 24 }, () => ({ count: 0, color: null }))
    pts[23] = { count: 1, color: 'white' }
    const state = makeState({ points: pts, dice: [1] })
    const next = applyMove(state, { from: 23, to: 'off', dieUsed: 1 })
    expect(next.points[23]).toEqual({ count: 0, color: null })
    expect(next.off.white).toBe(1)
  })

  it('doubles: dice array has 3 remaining after one move', () => {
    const pts = Array.from({ length: 24 }, () => ({ count: 0, color: null }))
    pts[18] = { count: 2, color: 'white' }
    const state = makeState({ points: pts, dice: [4, 4, 4, 4] })
    const next = applyMove(state, { from: 18, to: 22, dieUsed: 4 })
    expect(next.dice).toHaveLength(3)
    expect(next.dice).toEqual([4, 4, 4])
  })

  it('consuming a die removes it from state.dice', () => {
    const pts = Array.from({ length: 24 }, () => ({ count: 0, color: null }))
    pts[10] = { count: 1, color: 'white' }
    const state = makeState({ points: pts, dice: [3, 5] })
    const next = applyMove(state, { from: 10, to: 13, dieUsed: 3 })
    expect(next.dice).toEqual([5])
  })

  it('re-entering from bar decrements bar count', () => {
    const pts = Array.from({ length: 24 }, () => ({ count: 0, color: null }))
    const state = makeState({ points: pts, bar: { white: 2, black: 0 }, dice: [3] })
    const next = applyMove(state, { from: 'bar', to: 2, dieUsed: 3 })
    expect(next.bar.white).toBe(1)
    expect(next.points[2]).toEqual({ count: 1, color: 'white' })
  })
})

// ─── checkWinner ─────────────────────────────────────────────────────────────

describe('checkWinner', () => {
  it('returns null mid-game', () => {
    const state = makeState({ off: { white: 7, black: 3 } })
    expect(checkWinner(state)).toBeNull()
  })

  it('returns white when white has borne off 15', () => {
    const state = makeState({ off: { white: 15, black: 0 } })
    expect(checkWinner(state)).toBe('white')
  })

  it('returns black when black has borne off 15', () => {
    const state = makeState({ off: { white: 0, black: 15 } })
    expect(checkWinner(state)).toBe('black')
  })
})

// ─── getPipCount ──────────────────────────────────────────────────────────────

describe('getPipCount', () => {
  it('starting position: both players at 167 pips', () => {
    const state = { ...initGame('two-player') }
    expect(getPipCount(state, 'white')).toBe(167)
    expect(getPipCount(state, 'black')).toBe(167)
  })
})

// ─── scoreBoard ──────────────────────────────────────────────────────────────

describe('scoreBoard', () => {
  it('score is worse (lower) when player has more bar checkers', () => {
    const pts = Array.from({ length: 24 }, () => ({ count: 0, color: null }))
    const base = makeState({ points: pts })
    const one = makeState({ points: pts, bar: { white: 1, black: 0 } })
    const two = makeState({ points: pts, bar: { white: 2, black: 0 } })

    expect(scoreBoard(one, 'white')).toBeLessThan(scoreBoard(base, 'white'))
    expect(scoreBoard(two, 'white')).toBeLessThan(scoreBoard(one, 'white'))
  })
})

// ─── Higher-die rule ──────────────────────────────────────────────────────────

describe('higher-die rule', () => {
  it('when only lower die produces moves, must use lower die', () => {
    // White checker at index 10 (outside home board). Dice = [3, 5].
    // die=3 → to=13 (open, valid). die=5 → to=15 (made point — blocked).
    // Only die=3 is playable → only lower-die moves returned.
    const pts = Array.from({ length: 24 }, () => ({ count: 0, color: null }))
    pts[10] = { count: 1, color: 'white' }
    pts[15] = { count: 2, color: 'black' } // made point blocks die=5
    const state = makeState({ points: pts, dice: [3, 5] })
    const moves = getAllValidMoves(state)
    expect(moves.every(m => m.dieUsed === 3)).toBe(true)
    expect(moves.length).toBeGreaterThan(0)
  })

  it('when only higher die produces moves, must use higher die', () => {
    // White checker at index 18. Dice = [1, 3].
    // die=1 → to=19 which has 2 black checkers (blocked).
    // die=3 → to=21 (open).
    const pts = Array.from({ length: 24 }, () => ({ count: 0, color: null }))
    pts[18] = { count: 1, color: 'white' }
    pts[19] = { count: 2, color: 'black' }
    const state = makeState({ points: pts, dice: [1, 3] })
    const moves = getAllValidMoves(state)
    expect(moves.every(m => m.dieUsed === 3)).toBe(true)
    expect(moves.length).toBeGreaterThan(0)
  })
})
