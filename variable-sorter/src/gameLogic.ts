import { JS_POOL, PY_POOL } from "./variables"
import type { Difficulty } from "./variables"

export type JSType = 'string' | 'number' | 'boolean' | 'null' | 'undefined' | 'object' | 'array'
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
  javascript: { easy: number | null; medium: number | null; hard: number | null }
  python: { easy: number | null; medium: number | null; hard: number | null }
}

export const DIFFICULTY_COUNT: Record<Difficulty, number> = { easy: 10, medium: 20, hard: 30 }

export type { Difficulty }

export interface FailedDrop {
  variable: Variable
  droppedType: VarType
  correctType: VarType
}

export interface GameState {
  phase: GamePhase
  language: Language
  difficulty: Difficulty
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

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = shuffleArray(arr)
  const result: T[] = []
  for (let i = 0; i < n; i++) result.push(shuffled[i % shuffled.length])
  return result
}

export function generateQueue(language: Language, difficulty: Difficulty): Variable[] {
  const pool = language === 'javascript' ? JS_POOL : PY_POOL
  const easy = pool.filter(v => v.difficulty === 'easy')
  const medium = pool.filter(v => v.difficulty === 'medium')
  const hard = pool.filter(v => v.difficulty === 'hard')

  let entries: typeof pool
  if (difficulty === 'easy') {
    entries = pickN(easy, 10)
  } else if (difficulty === 'medium') {
    entries = [...pickN(easy, 5), ...pickN(medium, 15)]
  } else {
    entries = [...pickN(medium, 10), ...pickN(hard, 20)]
  }

  const shuffled = shuffleArray(entries)
  let idCounter = 0
  const result: Variable[] = []

  for (let i = 0; i < shuffled.length; i++) {
    const candidate = shuffled[i]
    const prev = result[result.length - 1]
    if (prev && prev.declaration === candidate.declaration) {
      const swapIdx = (i + 1) % shuffled.length
      const swap = shuffled[swapIdx]
      shuffled[i] = swap
      shuffled[swapIdx] = candidate
      result.push({ id: `v${idCounter++}`, ...shuffled[i] })
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
  const prev = bests[state.language][state.difficulty]
  if (prev === null || elapsed < prev) {
    bests[state.language][state.difficulty] = elapsed
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
  if (closest && minDist <= 100) return closest
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
  const types: JSType[] = ['string', 'number', 'boolean', 'null', 'undefined', 'object', 'array']
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
    javascript: { easy: null, medium: null, hard: null },
    python: { easy: null, medium: null, hard: null },
  }
}
