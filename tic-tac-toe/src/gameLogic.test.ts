import { checkWinner, checkDraw, getComputerMove, type Board } from './gameLogic'

const _ = null

// X O X
// O O X
// X X O  — a valid draw board used in multiple tests
const DRAW_BOARD: Board = ['X','O','X', 'O','O','X', 'X','X','O']

describe('checkWinner', () => {
  it('detects all three row wins', () => {
    expect(checkWinner(['X','X','X', _,_,_, _,_,_])).toBe('X')
    expect(checkWinner([_,_,_, 'O','O','O', _,_,_])).toBe('O')
    expect(checkWinner([_,_,_, _,_,_, 'X','X','X'])).toBe('X')
  })

  it('detects all three column wins', () => {
    expect(checkWinner(['X',_,_, 'X',_,_, 'X',_,_])).toBe('X')
    expect(checkWinner([_,'O',_, _,'O',_, _,'O',_])).toBe('O')
    expect(checkWinner([_,_,'X', _,_,'X', _,_,'X'])).toBe('X')
  })

  it('detects both diagonal wins', () => {
    expect(checkWinner(['X',_,_, _,'X',_, _,_,'X'])).toBe('X')
    expect(checkWinner([_,_,'O', _,'O',_, 'O',_,_])).toBe('O')
  })

  it('returns null for a partial board with no winner', () => {
    expect(checkWinner(['X','O',_, _,'X',_, _,_,'O'])).toBeNull()
    expect(checkWinner(Array(9).fill(null))).toBeNull()
  })

  it('returns null for a full board with no winner', () => {
    expect(checkWinner(DRAW_BOARD)).toBeNull()
  })
})

describe('checkDraw', () => {
  it('returns true when the board is full with no winner', () => {
    expect(checkDraw(DRAW_BOARD)).toBe(true)
  })

  it('returns false when the board has empty squares', () => {
    expect(checkDraw(Array(9).fill(null))).toBe(false)
    expect(checkDraw(['X','O',_, _,_,_, _,_,_])).toBe(false)
  })

  it('returns false when the board is full but there is a winner', () => {
    // X X X | O O X | O X O — full board, X wins top row
    expect(checkDraw(['X','X','X', 'O','O','X', 'O','X','O'])).toBe(false)
  })
})

describe('getComputerMove (easy)', () => {
  it('always returns an empty square index', () => {
    const board: Board = ['X','O',_, _,'X',_, _,_,'O']
    for (let i = 0; i < 20; i++) {
      const move = getComputerMove(board, 'easy')
      expect(board[move]).toBeNull()
    }
  })
})

describe('getComputerMove (hard)', () => {
  it('never loses against a random opponent', () => {
    function simulateGame(aiPlayer: 'X' | 'O'): 'X' | 'O' | 'draw' {
      const board: Board = Array(9).fill(null)
      let turn: 'X' | 'O' = 'X'

      while (true) {
        const winner = checkWinner(board)
        if (winner) return winner
        if (checkDraw(board)) return 'draw'

        const empty = board.reduce<number[]>((acc, sq, i) => {
          if (sq === null) acc.push(i)
          return acc
        }, [])

        const move = turn === aiPlayer
          ? getComputerMove(board, 'hard')
          : empty[Math.floor(Math.random() * empty.length)]

        board[move] = turn
        turn = turn === 'X' ? 'O' : 'X'
      }
    }

    for (let i = 0; i < 50; i++) {
      expect(simulateGame('X')).not.toBe('O')
      expect(simulateGame('O')).not.toBe('X')
    }
  })
})
