import { describe, it, expect } from 'vitest'
import {
  generateQueue,
  getVariableType,
  checkDrop,
  getProximityBucket,
  formatTime,
  advanceQueue,
  makeInitialPersonalBests,
} from './gameLogic'
import type { GameState, Variable, BucketRect } from './gameLogic'

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    phase: 'playing',
    language: 'javascript',
    difficulty: 'easy',
    queue: [],
    current: null,
    next: null,
    sorted: 0,
    startTime: 1000,
    endTime: null,
    failedDrop: null,
    dragging: false,
    personalBests: makeInitialPersonalBests(),
    ...overrides,
  }
}

function makeVar(declaration: string, type: Variable['type'], id = 'v0'): Variable {
  return { id, declaration, type }
}

// ---- generateQueue ----

describe('generateQueue', () => {
  it('returns exactly 10 Variable objects for javascript', () => {
    const queue = generateQueue('javascript', 10)
    expect(queue).toHaveLength(10)
    queue.forEach(v => {
      expect(v.id).toBeDefined()
      expect(v.declaration).toBeTruthy()
      expect(v.type).toBeTruthy()
    })
  })

  it('returns exactly 30 Variable objects for python', () => {
    const queue = generateQueue('python', 30)
    expect(queue).toHaveLength(30)
  })

  it('no two consecutive entries have identical declarations (JS, 10)', () => {
    const queue = generateQueue('javascript', 10)
    for (let i = 1; i < queue.length; i++) {
      expect(queue[i].declaration).not.toBe(queue[i - 1].declaration)
    }
  })

  it('no two consecutive entries have identical declarations (Python, 20)', () => {
    const queue = generateQueue('python', 20)
    for (let i = 1; i < queue.length; i++) {
      expect(queue[i].declaration).not.toBe(queue[i - 1].declaration)
    }
  })
})

// ---- getVariableType ----

describe('getVariableType', () => {
  it('returns string for JS string variable', () => {
    expect(getVariableType(makeVar('const x = "hello"', 'string'))).toBe('string')
  })

  it('returns array for JS array variable (not object)', () => {
    expect(getVariableType(makeVar('const x = [1, 2, 3]', 'array'))).toBe('array')
    expect(getVariableType(makeVar('const x = [1, 2, 3]', 'array'))).not.toBe('object')
  })

  it('returns function for JS arrow function variable', () => {
    expect(getVariableType(makeVar('const x = () => 42', 'function'))).toBe('function')
  })

  it('returns null for JS null variable', () => {
    expect(getVariableType(makeVar('const x = null', 'null'))).toBe('null')
  })

  it('returns undefined for JS undefined variable', () => {
    expect(getVariableType(makeVar('let x = undefined', 'undefined'))).toBe('undefined')
  })

  it('returns float for Python float variable (not int)', () => {
    expect(getVariableType(makeVar('x = 3.14', 'float'))).toBe('float')
    expect(getVariableType(makeVar('x = 3.14', 'float'))).not.toBe('int')
  })

  it('returns dict for Python dict variable (not set)', () => {
    expect(getVariableType(makeVar('x = {"a": 1}', 'dict'))).toBe('dict')
    expect(getVariableType(makeVar('x = {"a": 1}', 'dict'))).not.toBe('set')
  })

  it('returns tuple for Python tuple variable (not list)', () => {
    expect(getVariableType(makeVar('x = (1, 2)', 'tuple'))).toBe('tuple')
    expect(getVariableType(makeVar('x = (1, 2)', 'tuple'))).not.toBe('list')
  })
})

// ---- checkDrop ----

describe('checkDrop', () => {
  const jsArrayVar = makeVar('const x = [1, 2]', 'array')

  it('returns true when bucket type matches variable type', () => {
    expect(checkDrop('array', jsArrayVar)).toBe(true)
  })

  it('returns false when bucket type does not match variable type', () => {
    expect(checkDrop('object', jsArrayVar)).toBe(false)
  })
})

// ---- getProximityBucket ----

describe('getProximityBucket', () => {
  const buckets: BucketRect[] = [
    { type: 'string', centerX: 100, centerY: 300 },
    { type: 'number', centerX: 200, centerY: 300 },
    { type: 'boolean', centerX: 300, centerY: 300 },
  ]

  it('returns null when closest bucket is more than 80px away', () => {
    // Drop at (100, 500) — 200px below string bucket
    expect(getProximityBucket(100, 500, buckets)).toBeNull()
  })

  it('returns the correct bucket when drop is within 80px threshold', () => {
    // Drop at (110, 310) — ~14px from string bucket center
    const result = getProximityBucket(110, 310, buckets)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('string')
  })

  it('returns the nearest bucket among multiple within range', () => {
    // Drop at (155, 300) — between string (55px) and number (45px)
    const result = getProximityBucket(155, 300, buckets)
    expect(result!.type).toBe('number')
  })

  it('returns null for empty bucket list', () => {
    expect(getProximityBucket(100, 300, [])).toBeNull()
  })
})

// ---- formatTime ----

describe('formatTime', () => {
  it('formats milliseconds under 60s as X.XXs', () => {
    expect(formatTime(1234)).toBe('1.23s')
  })

  it('formats exactly 60s as 1:00.00', () => {
    expect(formatTime(60000)).toBe('1:00.00')
  })

  it('formats 62000ms as 1:02.00', () => {
    expect(formatTime(62000)).toBe('1:02.00')
  })

  it('formats 500ms as 0.50s', () => {
    expect(formatTime(500)).toBe('0.50s')
  })
})

// ---- advanceQueue ----

describe('advanceQueue', () => {
  const v0 = makeVar('const a = 1', 'number', 'v0')
  const v1 = makeVar('const b = "x"', 'string', 'v1')
  const v2 = makeVar('const c = true', 'boolean', 'v2')

  it('shifts next to current and pops from queue', () => {
    const state = makeState({ current: v0, next: v1, queue: [v2] })
    const patch = advanceQueue(state)
    expect(patch.current).toEqual(v1)
    expect(patch.next).toEqual(v2)
    expect(patch.queue).toHaveLength(0)
  })

  it('sets next to null when queue is empty', () => {
    const state = makeState({ current: v0, next: v1, queue: [] })
    const patch = advanceQueue(state)
    expect(patch.current).toEqual(v1)
    expect(patch.next).toBeNull()
    expect(patch.queue).toHaveLength(0)
  })

  it('sets current to null when next is null and queue is empty', () => {
    const state = makeState({ current: v0, next: null, queue: [] })
    const patch = advanceQueue(state)
    expect(patch.current).toBeNull()
    expect(patch.next).toBeNull()
  })
})
