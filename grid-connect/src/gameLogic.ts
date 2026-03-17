export type Player = 'Red' | 'Yellow'
export type Board = (Player | null)[]
export type Difficulty = 'easy' | 'hard'
export type Mode = 'vs-player' | 'vs-computer'

export const ROWS = 6
export const COLS = 7

export function isColumnFull(board: Board, col: number): boolean {
  return board[col] !== null
}

// Mutates board, returns filled index or null if column is full
export function dropPiece(board: Board, col: number, player: Player): number | null {
  for (let r = ROWS - 1; r >= 0; r--) {
    const idx = r * COLS + col
    if (board[idx] === null) {
      board[idx] = player
      return idx
    }
  }
  return null
}

export function checkWinner(board: Board): Player | null {
  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const a = board[r * COLS + c]
      if (a && a === board[r * COLS + c + 1] && a === board[r * COLS + c + 2] && a === board[r * COLS + c + 3]) return a
    }
  }
  // Vertical
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      const a = board[r * COLS + c]
      if (a && a === board[(r + 1) * COLS + c] && a === board[(r + 2) * COLS + c] && a === board[(r + 3) * COLS + c]) return a
    }
  }
  // Diagonal down-right
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const a = board[r * COLS + c]
      if (a && a === board[(r + 1) * COLS + c + 1] && a === board[(r + 2) * COLS + c + 2] && a === board[(r + 3) * COLS + c + 3]) return a
    }
  }
  // Diagonal down-left
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 3; c < COLS; c++) {
      const a = board[r * COLS + c]
      if (a && a === board[(r + 1) * COLS + c - 1] && a === board[(r + 2) * COLS + c - 2] && a === board[(r + 3) * COLS + c - 3]) return a
    }
  }
  return null
}

export function getWinningCells(board: Board): number[] | null {
  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const cells = [r * COLS + c, r * COLS + c + 1, r * COLS + c + 2, r * COLS + c + 3]
      const v = board[cells[0]]
      if (v && cells.every(i => board[i] === v)) return cells
    }
  }
  // Vertical
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      const cells = [r * COLS + c, (r + 1) * COLS + c, (r + 2) * COLS + c, (r + 3) * COLS + c]
      const v = board[cells[0]]
      if (v && cells.every(i => board[i] === v)) return cells
    }
  }
  // Diagonal down-right
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const cells = [r * COLS + c, (r + 1) * COLS + c + 1, (r + 2) * COLS + c + 2, (r + 3) * COLS + c + 3]
      const v = board[cells[0]]
      if (v && cells.every(i => board[i] === v)) return cells
    }
  }
  // Diagonal down-left
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 3; c < COLS; c++) {
      const cells = [r * COLS + c, (r + 1) * COLS + c - 1, (r + 2) * COLS + c - 2, (r + 3) * COLS + c - 3]
      const v = board[cells[0]]
      if (v && cells.every(i => board[i] === v)) return cells
    }
  }
  return null
}

export function checkDraw(board: Board): boolean {
  return board.every(cell => cell !== null) && checkWinner(board) === null
}

// --- AI ---

function getValidCols(board: Board): number[] {
  const cols: number[] = []
  for (let c = 0; c < COLS; c++) {
    if (!isColumnFull(board, c)) cols.push(c)
  }
  return cols
}

function dropInto(board: Board, col: number, player: Player): Board {
  const next = [...board]
  dropPiece(next, col, player)
  return next
}

function scoreWindow(window: (Player | null)[], player: Player, opponent: Player): number {
  const p = window.filter(c => c === player).length
  const o = window.filter(c => c === opponent).length
  const e = window.filter(c => c === null).length
  if (p === 4) return 100
  if (p === 3 && e === 1) return 5
  if (p === 2 && e === 2) return 2
  if (o === 3 && e === 1) return -4
  return 0
}

function scoreBoard(board: Board, player: Player): number {
  const opponent: Player = player === 'Red' ? 'Yellow' : 'Red'
  let score = 0
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += scoreWindow([board[r * COLS + c], board[r * COLS + c + 1], board[r * COLS + c + 2], board[r * COLS + c + 3]], player, opponent)
    }
  }
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      score += scoreWindow([board[r * COLS + c], board[(r + 1) * COLS + c], board[(r + 2) * COLS + c], board[(r + 3) * COLS + c]], player, opponent)
    }
  }
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += scoreWindow([board[r * COLS + c], board[(r + 1) * COLS + c + 1], board[(r + 2) * COLS + c + 2], board[(r + 3) * COLS + c + 3]], player, opponent)
    }
  }
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 3; c < COLS; c++) {
      score += scoreWindow([board[r * COLS + c], board[(r + 1) * COLS + c - 1], board[(r + 2) * COLS + c - 2], board[(r + 3) * COLS + c - 3]], player, opponent)
    }
  }
  return score
}

function minimax(board: Board, depth: number, alpha: number, beta: number, isMaximizing: boolean, aiPlayer: Player): number {
  const opponent: Player = aiPlayer === 'Red' ? 'Yellow' : 'Red'
  const winner = checkWinner(board)
  if (winner === aiPlayer) return 1000 + depth
  if (winner === opponent) return -(1000 + depth)
  if (checkDraw(board)) return 0
  if (depth === 0) return scoreBoard(board, aiPlayer)

  const validCols = getValidCols(board)

  if (isMaximizing) {
    let maxScore = -Infinity
    for (const col of validCols) {
      const score = minimax(dropInto(board, col, aiPlayer), depth - 1, alpha, beta, false, aiPlayer)
      maxScore = Math.max(maxScore, score)
      alpha = Math.max(alpha, score)
      if (beta <= alpha) break
    }
    return maxScore
  } else {
    let minScore = Infinity
    for (const col of validCols) {
      const score = minimax(dropInto(board, col, opponent), depth - 1, alpha, beta, true, aiPlayer)
      minScore = Math.min(minScore, score)
      beta = Math.min(beta, score)
      if (beta <= alpha) break
    }
    return minScore
  }
}

export function getComputerMove(board: Board, difficulty: Difficulty, aiPlayer: Player): number {
  const validCols = getValidCols(board)

  if (difficulty === 'easy') {
    return validCols[Math.floor(Math.random() * validCols.length)]
  }

  let bestScore = -Infinity
  let bestCol = validCols[Math.floor(validCols.length / 2)]

  for (const col of validCols) {
    const score = minimax(dropInto(board, col, aiPlayer), 5, -Infinity, Infinity, false, aiPlayer)
    if (score > bestScore) {
      bestScore = score
      bestCol = col
    }
  }

  return bestCol
}
