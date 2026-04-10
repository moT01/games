import { JS_POOL, PY_POOL } from "./variables"

export type JSType = 'string' | 'number' | 'boolean' | 'null' | 'undefined' | 'object' | 'array' | 'function'
export type PyType = 'str' | 'int' | 'float' | 'bool' | 'None' | 'list' | 'dict' | 'tuple' | 'set'
export type Language = 'javascript' | 'python'
export type VarType = JSType | PyType

export interface Variable {
  id: string
  declaration: string
  type: VarType
}

export interface Bucket {
  type: VarType
  label: string
  keyboardKey: number
}

export type GamePhase = 'home' | 'playing' | 'win' | 'fail'

export interface PersonalBests {
  javascript: { 10: number | null; 20: number | null; 30: number | null }
  python: { 10: number | null; 20: number | null; 30: number | null }
}

export interface FailedDrop {
  variable: Variable
  droppedType: VarType
  correctType: VarType
}

export interface GameState {
  phase: GamePhase
  language: Language
  variableCount: 10 | 20 | 30
  queue: Variable[]
  current: Variable | null
  next: Variable | null
  sorted: number
  startTime: number | null
  endTime: number | null
  failedDrop: FailedDrop | null
  dragging: boolean
  personalBests: PersonalBests
}

// ---- Core functions ----

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function generateQueue(language: Language, count: number): Variable[] {
  const pool = language === 'javascript' ? JS_POOL : PY_POOL
  const shuffled = shuffleArray(pool)
  const result: Variable[] = []
  let idCounter = 0

  for (let i = 0; i < count; i++) {
    const candidate = shuffled[i % shuffled.length]
    const prev = result[result.length - 1]
    if (prev && prev.declaration === candidate.declaration) {
      // swap with next available entry that differs
      const swapIdx = (i + 1) % shuffled.length
      const swap = shuffled[swapIdx]
      shuffled[i % shuffled.length] = swap
      shuffled[swapIdx] = candidate
      result.push({ id: `v${idCounter++}`, ...shuffled[i % shuffled.length] })
    } else {
      result.push({ id: `v${idCounter++}`, ...candidate })
    }
  }

  return result
}

export function getVariableType(variable: Variable): VarType {
  return variable.type
}

export function checkDrop(bucketType: VarType, variable: Variable): boolean {
  return bucketType === variable.type
}

export function advanceQueue(state: GameState): Partial<GameState> {
  const newQueue = [...state.queue]
  const newNext = newQueue.length > 0 ? newQueue.shift()! : null
  return {
    current: state.next,
    next: newNext,
    queue: newQueue,
  }
}

export function recordWin(state: GameState): Partial<GameState> {
  const endTime = Date.now()
  const elapsed = endTime - (state.startTime ?? endTime)
  const bests = structuredClone(state.personalBests)
  const prev = bests[state.language][state.variableCount]
  if (prev === null || elapsed < prev) {
    bests[state.language][state.variableCount] = elapsed
  }
  return {
    phase: 'win',
    endTime,
    personalBests: bests,
  }
}

export function recordFail(state: GameState, droppedType: VarType): Partial<GameState> {
  return {
    phase: 'fail',
    endTime: Date.now(),
    failedDrop: {
      variable: state.current!,
      droppedType,
      correctType: state.current!.type,
    },
  }
}

export interface BucketRect {
  type: VarType
  centerX: number
  centerY: number
}

export function getProximityBucket(dropX: number, dropY: number, buckets: BucketRect[]): BucketRect | null {
  let closest: BucketRect | null = null
  let minDist = Infinity
  for (const bucket of buckets) {
    const dx = dropX - bucket.centerX
    const dy = dropY - bucket.centerY
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < minDist) {
      minDist = dist
      closest = bucket
    }
  }
  if (closest && minDist <= 80) return closest
  return null
}

export function formatTime(ms: number): string {
  const totalSeconds = ms / 1000
  if (totalSeconds < 60) {
    return `${totalSeconds.toFixed(2)}s`
  }
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = (totalSeconds % 60).toFixed(2).padStart(5, '0')
  return `${minutes}:${seconds}`
}

export function getJSBuckets(): Bucket[] {
  const types: JSType[] = ['string', 'number', 'boolean', 'null', 'undefined', 'object', 'array', 'function']
  return types.map((type, i) => ({ type, label: type, keyboardKey: i + 1 }))
}

export function getPyBuckets(): Bucket[] {
  const types: PyType[] = ['str', 'int', 'float', 'bool', 'None', 'list', 'dict', 'tuple', 'set']
  return types.map((type, i) => ({ type, label: type, keyboardKey: i + 1 }))
}

export function getBuckets(language: Language): Bucket[] {
  return language === 'javascript' ? getJSBuckets() : getPyBuckets()
}

export function makeInitialPersonalBests(): PersonalBests {
  return {
    javascript: { 10: null, 20: null, 30: null },
    python: { 10: null, 20: null, 30: null },
  }
}
