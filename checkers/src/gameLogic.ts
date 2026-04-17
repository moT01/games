export type Player = 'Light' | 'Dark'
export type PieceType = 'man' | 'king'
export type Piece = { player: Player; type: PieceType }
export type Board = (Piece | null)[]
export type Move = { from: number; to: number; captures: number[] }
export type Difficulty = 'easy' | 'hard'
export type Mode = 'vs-player' | 'vs-computer'

function inBounds(row: number, col: number): boolean {
  return row >= 0 && row <= 7 && col >= 0 && col <= 7
}

function getDirections(piece: Piece): [number, number][] {
  if (piece.type === 'king') return [[-1, -1], [-1, 1], [1, -1], [1, 1]]
  if (piece.player === 'Light') return [[-1, -1], [-1, 1]]
  return [[1, -1], [1, 1]]
}

export function createInitialBoard(): Board {
  const board: Board = Array(64).fill(null)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        board[row * 8 + col] = { player: 'Dark', type: 'man' }
      }
    }
  }
  for (let row = 5; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        board[row * 8 + col] = { player: 'Light', type: 'man' }
      }
    }
  }
  return board
}

function generateSimpleMoves(board: Board, index: number, piece: Piece): Move[] {
  const row = Math.floor(index / 8)
  const col = index % 8
  const result: Move[] = []
  for (const [dr, dc] of getDirections(piece)) {
    const nr = row + dr, nc = col + dc
    if (!inBounds(nr, nc)) continue
    const to = nr * 8 + nc
    if (board[to] === null) result.push({ from: index, to, captures: [] })
  }
  return result
}

function generateCaptures(
  board: Board,
  from: number,
  currentPos: number,
  piece: Piece,
  capturedSoFar: number[],
  visitedPositions: number[]
): Move[] {
  const row = Math.floor(currentPos / 8)
  const col = currentPos % 8
  const result: Move[] = []

  for (const [dr, dc] of getDirections(piece)) {
    const midRow = row + dr, midCol = col + dc
    const landRow = row + 2 * dr, landCol = col + 2 * dc
    if (!inBounds(midRow, midCol) || !inBounds(landRow, landCol)) continue

    const midIdx = midRow * 8 + midCol
    const landIdx = landRow * 8 + landCol

    const midPiece = board[midIdx]
    if (!midPiece || midPiece.player === piece.player) continue
    if (capturedSoFar.includes(midIdx)) continue
    if (board[landIdx] !== null) continue
    if (visitedPositions.includes(landIdx)) continue

    const newCaptures = [...capturedSoFar, midIdx]
    const isPromotion =
      (piece.player === 'Light' && landRow === 0) ||
      (piece.player === 'Dark' && landRow === 7)

    if (isPromotion) {
      // Promotion ends the turn — no further jumps
      result.push({ from, to: landIdx, captures: newCaptures })
    } else {
      const workingBoard = [...board]
      workingBoard[currentPos] = null
      workingBoard[midIdx] = null
      workingBoard[landIdx] = piece

      const further = generateCaptures(
        workingBoard, from, landIdx, piece, newCaptures, [...visitedPositions, landIdx]
      )
      if (further.length > 0) {
        result.push(...further)
      } else {
        result.push({ from, to: landIdx, captures: newCaptures })
      }
    }
  }

  return result
}

function getMovesForPiece(board: Board, index: number): { captures: Move[]; simples: Move[] } {
  const piece = board[index]
  if (!piece) return { captures: [], simples: [] }
  const captures = generateCaptures(board, index, index, piece, [], [index])
  const simples = captures.length === 0 ? generateSimpleMoves(board, index, piece) : []
  return { captures, simples }
}

export function getValidMoves(board: Board, player: Player): Move[] {
  const allCaptures: Move[] = []
  const allSimples: Move[] = []
  for (let i = 0; i < 64; i++) {
    const piece = board[i]
    if (!piece || piece.player !== player) continue
    const { captures, simples } = getMovesForPiece(board, i)
    allCaptures.push(...captures)
    allSimples.push(...simples)
  }
  return allCaptures.length > 0 ? allCaptures : allSimples
}

export function getValidMovesForPiece(board: Board, index: number, player: Player): Move[] {
  return getValidMoves(board, player).filter(m => m.from === index)
}

export function applyMove(board: Board, move: Move): Board {
  const newBoard = [...board]
  const piece = newBoard[move.from]!
  newBoard[move.from] = null
  for (const idx of move.captures) newBoard[idx] = null
  const toRow = Math.floor(move.to / 8)
  const promoted =
    (piece.player === 'Light' && toRow === 0) ||
    (piece.player === 'Dark' && toRow === 7)
  newBoard[move.to] = promoted ? { player: piece.player, type: 'king' } : piece
  return newBoard
}

export function checkWinner(board: Board, currentPlayer: Player): Player | null {
  if (getValidMoves(board, currentPlayer).length === 0) {
    return currentPlayer === 'Light' ? 'Dark' : 'Light'
  }
  return null
}

function evaluate(board: Board, aiPlayer: Player): number {
  let score = 0
  for (const piece of board) {
    if (!piece) continue
    const value = piece.type === 'king' ? 3 : 2
    score += piece.player === aiPlayer ? value : -value
  }
  return score
}

function minimax(
  board: Board,
  depth: number,
  isMaximizing: boolean,
  aiPlayer: Player,
  alpha: number,
  beta: number
): number {
  const opponent: Player = aiPlayer === 'Light' ? 'Dark' : 'Light'
  const currentPlayer = isMaximizing ? aiPlayer : opponent
  const winner = checkWinner(board, currentPlayer)
  if (winner !== null) return winner === aiPlayer ? 1000 : -1000
  if (depth === 0) return evaluate(board, aiPlayer)

  const moves = getValidMoves(board, currentPlayer)
  if (isMaximizing) {
    let best = -Infinity
    for (const move of moves) {
      best = Math.max(best, minimax(applyMove(board, move), depth - 1, false, aiPlayer, alpha, beta))
      alpha = Math.max(alpha, best)
      if (beta <= alpha) break
    }
    return best
  } else {
    let best = Infinity
    for (const move of moves) {
      best = Math.min(best, minimax(applyMove(board, move), depth - 1, true, aiPlayer, alpha, beta))
      beta = Math.min(beta, best)
      if (beta <= alpha) break
    }
    return best
  }
}

export function getComputerMove(board: Board, difficulty: Difficulty, aiPlayer: Player): Move {
  const moves = getValidMoves(board, aiPlayer)
  if (difficulty === 'easy') {
    return moves[Math.floor(Math.random() * moves.length)]
  }
  let bestScore = -Infinity
  let bestMove = moves[0]
  for (const move of moves) {
    const score = minimax(applyMove(board, move), 5, false, aiPlayer, -Infinity, Infinity)
    if (score > bestScore) {
      bestScore = score
      bestMove = move
    }
  }
  return bestMove
}
