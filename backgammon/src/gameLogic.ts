// Board orientation:
// - Indices 0–23. Index 0 = Dark's 1-point (Dark's home). Index 23 = Light's 1-point (Light's home).
// - Light moves from LOW to HIGH (increasing index), bears off past index 23.
// - Dark moves from HIGH to LOW (decreasing index), bears off past index 0.
// - Light home board: indices 18–23. Dark home board: indices 0–5.
// - Light re-enters from bar onto indices 0–5 (die d → index d-1).
// - Dark re-enters from bar onto indices 18–23 (die d → index 24-d).
// - Light pip count at index k = (24 - k). Dark pip count at index k = (k + 1).
// - Both players start at 167 total pips.

export type Color = 'light' | 'dark'

export type Point = {
  count: number
  color: Color | null
}

export type ValidMove = {
  from: number | 'bar'
  to: number | 'off'
  dieUsed: number
}

export type GameState = {
  points: Point[]
  bar: { light: number; dark: number }
  off: { light: number; dark: number }
  currentPlayer: Color
  dice: number[]
  diceRolled: boolean
  phase: 'mode-select' | 'playing' | 'game-over'
  winner: Color | null
  mode: 'vs-ai' | 'two-player' | null
  selectedPoint: number | null // index 0–23, or -1 for bar selection
  validMoves: ValidMove[]
  forcedSkip: boolean
}

// Standard starting position:
// Light: 2@0, 5@11, 3@16, 5@18
// Dark:  2@23, 5@12, 3@7,  5@5
export function initBoard(): Point[] {
  const points: Point[] = Array.from({ length: 24 }, () => ({ count: 0, color: null }))
  points[0] = { count: 2, color: 'light' }
  points[11] = { count: 5, color: 'light' }
  points[16] = { count: 3, color: 'light' }
  points[18] = { count: 5, color: 'light' }
  points[23] = { count: 2, color: 'dark' }
  points[12] = { count: 5, color: 'dark' }
  points[7] = { count: 3, color: 'dark' }
  points[5] = { count: 5, color: 'dark' }
  return points
}

export function initGame(mode: 'vs-ai' | 'two-player'): GameState {
  return {
    points: initBoard(),
    bar: { light: 0, dark: 0 },
    off: { light: 0, dark: 0 },
    currentPlayer: 'light',
    dice: [],
    diceRolled: false,
    phase: 'playing',
    winner: null,
    mode,
    selectedPoint: null,
    validMoves: [],
    forcedSkip: false,
  }
}

export function rollDice(): number[] {
  const d1 = Math.floor(Math.random() * 6) + 1
  const d2 = Math.floor(Math.random() * 6) + 1
  return d1 === d2 ? [d1, d1, d1, d1] : [d1, d2]
}

// Returns [minIndex, maxIndex] of the player's home board.
// Light: 18–23 (Light moves toward 23, bears off past 23)
// Dark:  0–5   (Dark moves toward 0,  bears off past 0)
export function getHomeRange(player: Color): [number, number] {
  return player === 'light' ? [18, 23] : [0, 5]
}

export function getPipCount(state: GameState, player: Color): number {
  let total = 0
  for (let i = 0; i < 24; i++) {
    if (state.points[i].color === player && state.points[i].count > 0) {
      const pips = player === 'light' ? 24 - i : i + 1
      total += pips * state.points[i].count
    }
  }
  // Bar checkers count as 25 pips (must re-enter from far end)
  total += state.bar[player] * 25
  return total
}

export function canBearOff(state: GameState, player: Color): boolean {
  if (state.bar[player] > 0) return false
  const [homeMin, homeMax] = getHomeRange(player)
  for (let i = 0; i < 24; i++) {
    if (i >= homeMin && i <= homeMax) continue
    if (state.points[i].color === player && state.points[i].count > 0) return false
  }
  return true
}

function canLandOn(state: GameState, player: Color, index: number): boolean {
  const pt = state.points[index]
  if (pt.count === 0) return true
  if (pt.color === player) return true
  return pt.count === 1 // blot — can hit
}

// Returns true if bearing off from `from` with `die` is legal.
// Exact roll (die == pipsNeeded): always valid.
// Over-roll (die > pipsNeeded): valid only if no checker is farther from bearing off.
function isValidBearOff(state: GameState, from: number, die: number, player: Color): boolean {
  const [homeMin, homeMax] = getHomeRange(player)
  if (player === 'light') {
    const pipsNeeded = 24 - from
    if (die < pipsNeeded) return false
    if (die === pipsNeeded) return true
    // Over-roll: no checker at lower indices (farther from bearing off for Light)
    for (let i = homeMin; i < from; i++) {
      if (state.points[i].color === 'light' && state.points[i].count > 0) return false
    }
    return true
  } else {
    const pipsNeeded = from + 1
    if (die < pipsNeeded) return false
    if (die === pipsNeeded) return true
    // Over-roll: no checker at higher indices (farther from bearing off for Dark)
    for (let i = from + 1; i <= homeMax; i++) {
      if (state.points[i].color === 'dark' && state.points[i].count > 0) return false
    }
    return true
  }
}

function getBarMoves(state: GameState): ValidMove[] {
  const player = state.currentPlayer
  const moves: ValidMove[] = []
  const uniqueDice = [...new Set(state.dice)]
  for (const die of uniqueDice) {
    const toIndex = player === 'light' ? die - 1 : 24 - die
    if (canLandOn(state, player, toIndex)) {
      moves.push({ from: 'bar', to: toIndex, dieUsed: die })
    }
  }
  return moves
}

function getPointMoves(state: GameState, from: number): ValidMove[] {
  const player = state.currentPlayer
  const moves: ValidMove[] = []
  const bearing = canBearOff(state, player)
  const uniqueDice = [...new Set(state.dice)]
  for (const die of uniqueDice) {
    if (player === 'light') {
      const to = from + die
      if (to <= 23) {
        if (canLandOn(state, player, to)) moves.push({ from, to, dieUsed: die })
      } else if (bearing && isValidBearOff(state, from, die, player)) {
        moves.push({ from, to: 'off', dieUsed: die })
      }
    } else {
      const to = from - die
      if (to >= 0) {
        if (canLandOn(state, player, to)) moves.push({ from, to, dieUsed: die })
      } else if (bearing && isValidBearOff(state, from, die, player)) {
        moves.push({ from, to: 'off', dieUsed: die })
      }
    }
  }
  return moves
}

// Returns all legal moves for the current player, with the higher-die rule applied.
// If the player has bar checkers, only bar re-entry moves are returned.
export function getAllValidMoves(state: GameState): ValidMove[] {
  const player = state.currentPlayer
  if (state.dice.length === 0) return []

  let rawMoves: ValidMove[]

  if (state.bar[player] > 0) {
    rawMoves = getBarMoves(state)
  } else {
    rawMoves = []
    for (let i = 0; i < 24; i++) {
      if (state.points[i].color === player && state.points[i].count > 0) {
        rawMoves.push(...getPointMoves(state, i))
      }
    }
  }

  // Higher-die rule: if exactly 2 distinct dice remain and only one value produces moves,
  // the higher die must be played (or lower if higher is unplayable).
  if (state.dice.length === 2 && state.dice[0] !== state.dice[1]) {
    const higher = Math.max(state.dice[0], state.dice[1])
    const lower = Math.min(state.dice[0], state.dice[1])
    const hasHigher = rawMoves.some(m => m.dieUsed === higher)
    const hasLower = rawMoves.some(m => m.dieUsed === lower)
    if (hasHigher && !hasLower) return rawMoves.filter(m => m.dieUsed === higher)
    if (hasLower && !hasHigher) return rawMoves.filter(m => m.dieUsed === lower)
  }

  return rawMoves
}

// Returns legal moves for a specific checker location, filtered by the higher-die rule.
export function getValidMovesForChecker(state: GameState, from: number | 'bar'): ValidMove[] {
  return getAllValidMoves(state).filter(m => m.from === from)
}

// Applies a single move immutably. Does NOT switch currentPlayer or roll new dice —
// turn transition is handled by App after detecting empty dice or no remaining moves.
export function applyMove(state: GameState, move: ValidMove): GameState {
  const player = state.currentPlayer
  const opponent: Color = player === 'light' ? 'dark' : 'light'

  const newPoints = state.points.map(p => ({ ...p }))
  const newBar = { ...state.bar }
  const newOff = { ...state.off }

  // Remove from source
  if (move.from === 'bar') {
    newBar[player]--
  } else {
    newPoints[move.from].count--
    if (newPoints[move.from].count === 0) newPoints[move.from].color = null
  }

  // Place at destination
  if (move.to === 'off') {
    newOff[player]++
  } else {
    const dest = newPoints[move.to]
    if (dest.count === 1 && dest.color === opponent) {
      // Hit blot — send to bar
      newBar[opponent]++
      dest.count = 0
      dest.color = null
    }
    dest.count++
    dest.color = player
  }

  // Remove one instance of the used die
  const newDice = [...state.dice]
  const dieIndex = newDice.indexOf(move.dieUsed)
  newDice.splice(dieIndex, 1)

  return {
    ...state,
    points: newPoints,
    bar: newBar,
    off: newOff,
    dice: newDice,
    selectedPoint: null,
    validMoves: [],
  }
}

export function checkWinner(state: GameState): Color | null {
  if (state.off.light === 15) return 'light'
  if (state.off.dark === 15) return 'dark'
  return null
}

export function scoreBoard(state: GameState, player: Color): number {
  const opponent: Color = player === 'light' ? 'dark' : 'light'
  const [homeMin, homeMax] = getHomeRange(player)
  let score = 0

  // 1. Heavily penalize bar checkers
  score -= state.bar[player] * 100

  // 2. Reward made points (2+ checkers) in home board
  for (let i = homeMin; i <= homeMax; i++) {
    if (state.points[i].color === player && state.points[i].count >= 2) score += 10
  }

  // 3. Penalize exposed blots
  for (let i = 0; i < 24; i++) {
    if (state.points[i].color === player && state.points[i].count === 1) score -= 5
  }

  // 4. Pip count advantage (fewer pips = better)
  score += getPipCount(state, opponent) - getPipCount(state, player)

  // 5. Reward borne-off checkers
  score += state.off[player] * 5

  return score
}

// Exhaustively evaluates all legal move sequences for the AI (Dark) and returns
// the sequence producing the highest scoreBoard result.
// App executes the sequence move-by-move with animation delays.
export function getAIMove(state: GameState): ValidMove[] {
  const startTime = Date.now()

  function search(s: GameState): { moves: ValidMove[]; score: number } {
    if (s.dice.length === 0) return { moves: [], score: scoreBoard(s, 'dark') }

    const moves = getAllValidMoves(s)
    if (moves.length === 0) return { moves: [], score: scoreBoard(s, 'dark') }

    // Performance guard: fall back to greedy if search is taking too long
    if (Date.now() - startTime > 250) {
      const m = moves[0]
      return { moves: [m], score: scoreBoard(applyMove(s, m), 'dark') }
    }

    let best: { moves: ValidMove[]; score: number } | null = null
    const seen = new Set<string>()

    for (const move of moves) {
      const key = `${String(move.from)}:${String(move.to)}:${move.dieUsed}`
      if (seen.has(key)) continue
      seen.add(key)

      const next = applyMove(s, move)
      const result = search(next)
      const score = result.score

      if (best === null || score > best.score) {
        best = { moves: [move, ...result.moves], score }
      }
    }

    return best!
  }

  return search(state).moves
}
