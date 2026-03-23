import { describe, it, expect } from 'vitest'
import {
  dropPiece,
  checkWinner,
  checkDraw,
  getComputerMove,
  isColumnFull,
  ROWS,
  COLS,
  type Board,
  type Player,
} from './gameLogic'

function emptyBoard(): Board {
  return Array(ROWS * COLS).fill(null)
}

describe('dropPiece', () => {
  it('places piece in the lowest empty row', () => {
    const board = emptyBoard()
    const idx = dropPiece(board, 0, 'Red')
    expect(idx).toBe(5 * COLS + 0) // row 5, col 0
    expect(board[idx!]).toBe('Red')
  })

  it('stacks onto existing pieces', () => {
    const board = emptyBoard()
    dropPiece(board, 3, 'Red')
    const idx = dropPiece(board, 3, 'Yellow')
    expect(idx).toBe(4 * COLS + 3) // row 4, col 3
  })

  it('returns null when column is full', () => {
    const board = emptyBoard()
    for (let r = 0; r < ROWS; r++) dropPiece(board, 2, 'Red')
    expect(isColumnFull(board, 2)).toBe(true)
    expect(dropPiece(board, 2, 'Yellow')).toBeNull()
  })
})

describe('checkWinner', () => {
  it('detects horizontal wins', () => {
    const board = emptyBoard()
    // Red: 4 in a row at bottom row, cols 0–3
    for (let c = 0; c < 4; c++) board[5 * COLS + c] = 'Red'
    expect(checkWinner(board)).toBe('Red')
  })

  it('detects vertical wins', () => {
    const board = emptyBoard()
    // Yellow: 4 in a column at col 3, rows 2–5
    for (let r = 2; r < 6; r++) board[r * COLS + 3] = 'Yellow'
    expect(checkWinner(board)).toBe('Yellow')
  })

  it('detects down-right diagonal wins', () => {
    const board = emptyBoard()
    // Red: (0,0) (1,1) (2,2) (3,3)
    for (let i = 0; i < 4; i++) board[i * COLS + i] = 'Red'
    expect(checkWinner(board)).toBe('Red')
  })

  it('detects down-left diagonal wins', () => {
    const board = emptyBoard()
    // Yellow: (0,3) (1,2) (2,1) (3,0)
    for (let i = 0; i < 4; i++) board[i * COLS + (3 - i)] = 'Yellow'
    expect(checkWinner(board)).toBe('Yellow')
  })

  it('returns null for a partial board with no winner', () => {
    const board = emptyBoard()
    board[5 * COLS + 0] = 'Red'
    board[5 * COLS + 1] = 'Yellow'
    board[5 * COLS + 2] = 'Red'
    expect(checkWinner(board)).toBeNull()
  })

  it('returns null for an empty board', () => {
    expect(checkWinner(emptyBoard())).toBeNull()
  })
})

describe('checkDraw', () => {
  it('returns false when board has empty cells', () => {
    expect(checkDraw(emptyBoard())).toBe(false)
    const partial = emptyBoard()
    partial[0] = 'Red'
    expect(checkDraw(partial)).toBe(false)
  })

  it('returns false when board is full but there is a winner', () => {
    expect(checkDraw(Array(ROWS * COLS).fill('Red') as Board)).toBe(false)
  })

  it('returns true when board is full with no winner', () => {
    // Pattern verified to have no 4-in-a-row in any direction:
    //   even rows: R R Y Y R R Y
    //   odd  rows: Y Y R R Y Y R
    const board = emptyBoard()
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (r % 2 === 0) {
          board[r * COLS + c] = (c === 2 || c === 3 || c === 6) ? 'Yellow' : 'Red'
        } else {
          board[r * COLS + c] = (c === 0 || c === 1 || c === 4 || c === 5) ? 'Yellow' : 'Red'
        }
      }
    }
    expect(checkWinner(board)).toBeNull() // sanity check
    expect(checkDraw(board)).toBe(true)
  })
})

describe('getComputerMove', () => {
  it('easy — always returns a non-full column', () => {
    const board = emptyBoard()
    // Fill every column except col 3
    for (let c = 0; c < COLS; c++) {
      if (c === 3) continue
      for (let r = 0; r < ROWS; r++) dropPiece(board, c, 'Red')
    }
    for (let i = 0; i < 10; i++) {
      expect(getComputerMove(board, 'easy', 'Yellow')).toBe(3)
    }
  })

  it('hard — takes an immediate winning move', () => {
    const board = emptyBoard()
    // Red has 3 in a row at row 5, cols 0–2; col 3 completes the win
    board[5 * COLS + 0] = 'Red'
    board[5 * COLS + 1] = 'Red'
    board[5 * COLS + 2] = 'Red'
    expect(getComputerMove(board, 'hard', 'Red')).toBe(3)
  })

  it('hard — never loses against a deterministic weak opponent', () => {
    // AI plays Red (goes first); opponent always picks col 0 (or 1 if 0 is full)
    const board = emptyBoard()
    const aiPlayer: Player = 'Red'
    const opponent: Player = 'Yellow'
    let turn: Player = aiPlayer

    while (true) {
      const validCols: number[] = []
      for (let c = 0; c < COLS; c++) {
        if (!isColumnFull(board, c)) validCols.push(c)
      }
      if (validCols.length === 0) break

      const col =
        turn === aiPlayer
          ? getComputerMove(board, 'hard', aiPlayer)
          : (isColumnFull(board, 0) ? 1 : 0)

      dropPiece(board, col, turn)

      const winner = checkWinner(board)
      if (winner) {
        expect(winner).toBe(aiPlayer)
        return
      }
      if (checkDraw(board)) return // draw is acceptable

      turn = turn === aiPlayer ? opponent : aiPlayer
    }
  })
})
