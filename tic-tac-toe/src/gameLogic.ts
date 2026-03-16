export type Board = (string | null)[]
export type Player = 'X' | 'O'
export type Difficulty = 'easy' | 'hard'
export type Mode = 'vs-player' | 'vs-computer'

const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

export function checkWinner(board: Board): Player | null {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as Player
    }
  }
  return null
}

export function getWinningLine(board: Board): number[] | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return line
    }
  }
  return null
}

export function checkDraw(board: Board): boolean {
  return board.every(sq => sq !== null) && checkWinner(board) === null
}

function getCurrentPlayer(board: Board): Player {
  const xCount = board.filter(sq => sq === 'X').length
  const oCount = board.filter(sq => sq === 'O').length
  return xCount <= oCount ? 'X' : 'O'
}

function minimax(board: Board, isMaximizing: boolean, aiPlayer: Player): number {
  const opponent: Player = aiPlayer === 'X' ? 'O' : 'X'
  const winner = checkWinner(board)
  if (winner === aiPlayer) return 10
  if (winner === opponent) return -10
  if (board.every(sq => sq !== null)) return 0

  const scores: number[] = []
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      const next = [...board]
      next[i] = isMaximizing ? aiPlayer : opponent
      scores.push(minimax(next, !isMaximizing, aiPlayer))
    }
  }
  return isMaximizing ? Math.max(...scores) : Math.min(...scores)
}

export function getComputerMove(board: Board, difficulty: Difficulty): number {
  const empty = board.reduce<number[]>((acc, sq, i) => {
    if (sq === null) acc.push(i)
    return acc
  }, [])

  if (difficulty === 'easy') {
    return empty[Math.floor(Math.random() * empty.length)]
  }

  const aiPlayer = getCurrentPlayer(board)
  let bestScore = -Infinity
  let bestMove = empty[0]

  for (const i of empty) {
    const next = [...board]
    next[i] = aiPlayer
    const score = minimax(next, false, aiPlayer)
    if (score > bestScore) {
      bestScore = score
      bestMove = i
    }
  }
  return bestMove
}
