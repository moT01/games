export type Die = { value: number; held: boolean }

export type CategoryKey =
  | 'ones' | 'twos' | 'threes' | 'fours' | 'fives' | 'sixes'
  | 'threeOfAKind' | 'fourOfAKind' | 'fullHouse'
  | 'smallStraight' | 'largeStraight' | 'fiveOfAKind' | 'chance'

export const ALL_CATEGORIES: CategoryKey[] = [
  'ones', 'twos', 'threes', 'fours', 'fives', 'sixes',
  'threeOfAKind', 'fourOfAKind', 'fullHouse',
  'smallStraight', 'largeStraight', 'fiveOfAKind', 'chance',
]

export const UPPER_CATEGORIES: CategoryKey[] = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes']
export const LOWER_CATEGORIES: CategoryKey[] = [
  'threeOfAKind', 'fourOfAKind', 'fullHouse',
  'smallStraight', 'largeStraight', 'fiveOfAKind', 'chance',
]

export type GameState = {
  dice: Die[]
  rollCount: number
  scores: Partial<Record<CategoryKey, number>>
  fiveOfAKindBonus: number
  gamePhase: 'home' | 'playing' | 'gameOver'
}

export function rollDice(dice: Die[]): Die[] {
  return dice.map(d => d.held ? d : { value: Math.ceil(Math.random() * 6), held: false })
}

function vals(dice: Die[]): number[] {
  return dice.map(d => d.value)
}

function counts(dice: Die[]): Map<number, number> {
  const m = new Map<number, number>()
  for (const v of vals(dice)) m.set(v, (m.get(v) ?? 0) + 1)
  return m
}

function sumAll(dice: Die[]): number {
  return vals(dice).reduce((a, b) => a + b, 0)
}

export function isFiveOfAKind(dice: Die[]): boolean {
  return counts(dice).size === 1
}

export function scoreCategory(key: CategoryKey, dice: Die[]): number {
  const c = counts(dice)
  const sum = sumAll(dice)

  switch (key) {
    case 'ones':   return (c.get(1) ?? 0) * 1
    case 'twos':   return (c.get(2) ?? 0) * 2
    case 'threes': return (c.get(3) ?? 0) * 3
    case 'fours':  return (c.get(4) ?? 0) * 4
    case 'fives':  return (c.get(5) ?? 0) * 5
    case 'sixes':  return (c.get(6) ?? 0) * 6
    case 'threeOfAKind': return [...c.values()].some(n => n >= 3) ? sum : 0
    case 'fourOfAKind':  return [...c.values()].some(n => n >= 4) ? sum : 0
    case 'fullHouse': {
      const cv = [...c.values()].sort()
      return cv.length === 2 && cv[0] === 2 && cv[1] === 3 ? 25 : 0
    }
    case 'smallStraight': {
      const unique = [...new Set(vals(dice))].sort((a, b) => a - b)
      const seqs = [[1,2,3,4],[2,3,4,5],[3,4,5,6]]
      return seqs.some(s => s.every(n => unique.includes(n))) ? 30 : 0
    }
    case 'largeStraight': {
      const unique = [...new Set(vals(dice))].sort((a, b) => a - b)
      return (JSON.stringify(unique) === JSON.stringify([1,2,3,4,5]) ||
              JSON.stringify(unique) === JSON.stringify([2,3,4,5,6])) ? 40 : 0
    }
    case 'fiveOfAKind': return isFiveOfAKind(dice) ? 50 : 0
    case 'chance': return sum
  }
}

export function getPotentialScore(
  key: CategoryKey,
  dice: Die[],
  scores: Partial<Record<CategoryKey, number>>
): number | null {
  if (scores[key] !== undefined) return null
  return scoreCategory(key, dice)
}

export function calcUpperTotal(scores: Partial<Record<CategoryKey, number>>): number {
  return UPPER_CATEGORIES.reduce((sum, k) => sum + (scores[k] ?? 0), 0)
}

export function calcUpperBonus(scores: Partial<Record<CategoryKey, number>>): number {
  return calcUpperTotal(scores) >= 63 ? 35 : 0
}

export function calcLowerTotal(scores: Partial<Record<CategoryKey, number>>): number {
  return LOWER_CATEGORIES.reduce((sum, k) => sum + (scores[k] ?? 0), 0)
}

export function calcFiveOfAKindBonus(fiveOfAKindBonus: number): number {
  return fiveOfAKindBonus
}

export function calcGrandTotal(
  scores: Partial<Record<CategoryKey, number>>,
  fiveOfAKindBonus: number
): number {
  return calcUpperTotal(scores) + calcUpperBonus(scores) + calcLowerTotal(scores) + fiveOfAKindBonus
}

export function isGameOver(scores: Partial<Record<CategoryKey, number>>): boolean {
  return ALL_CATEGORIES.every(k => scores[k] !== undefined)
}

export function handleScoreCategory(
  key: CategoryKey,
  state: GameState
): GameState {
  if (state.rollCount === 0) return state
  if (state.scores[key] !== undefined) return state

  const score = scoreCategory(key, state.dice)
  let fiveOfAKindBonus = state.fiveOfAKindBonus

  if (isFiveOfAKind(state.dice) && state.scores.fiveOfAKind === 50) {
    fiveOfAKindBonus += 100
  }

  const newScores = { ...state.scores, [key]: score }
  const gameOver = isGameOver(newScores)

  return {
    ...state,
    scores: newScores,
    fiveOfAKindBonus,
    rollCount: 0,
    dice: state.dice.map(d => ({ ...d, held: false })),
    gamePhase: gameOver ? 'gameOver' : 'playing',
  }
}

const LS_HIGH_SCORE = 'five-dice-high-score'
const LS_STATE = 'five-dice-state'

export function loadHighScore(): number | null {
  const v = localStorage.getItem(LS_HIGH_SCORE)
  if (v === null) return null
  const n = parseInt(v, 10)
  return isNaN(n) ? null : n
}

export function saveHighScore(score: number): void {
  const current = loadHighScore()
  if (current === null || score > current) {
    localStorage.setItem(LS_HIGH_SCORE, String(score))
  }
}

export function saveGameState(state: GameState): void {
  localStorage.setItem(LS_STATE, JSON.stringify(state))
}

export function loadGameState(): GameState | null {
  try {
    const raw = localStorage.getItem(LS_STATE)
    if (!raw) return null
    const s = JSON.parse(raw) as GameState
    if (!s.dice || !Array.isArray(s.dice) || s.dice.length !== 5) return null
    if (typeof s.rollCount !== 'number') return null
    if (!s.scores || typeof s.scores !== 'object') return null
    if (s.gamePhase !== 'playing') return null
    return s
  } catch {
    return null
  }
}

export function clearGameState(): void {
  localStorage.removeItem(LS_STATE)
}
