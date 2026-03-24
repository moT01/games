import { describe, it, expect } from 'vitest'
import {
  createInitialBoard,
  getValidMoves,
  applyMove,
  checkWinner,
  type Board,
} from './gameLogic'

describe('createInitialBoard', () => {
  it('places 12 Black pieces on rows 0–2 and 12 Red pieces on rows 5–7, all on dark squares', () => {
    const board = createInitialBoard()
    let blackCount = 0, redCount = 0

    for (let i = 0; i < 64; i++) {
      const piece = board[i]
      if (!piece) continue
      const row = Math.floor(i / 8), col = i % 8
      expect((row + col) % 2).toBe(1) // must be on a dark square
      if (piece.player === 'Black') {
        blackCount++
        expect(row).toBeLessThanOrEqual(2)
        expect(piece.type).toBe('man')
      } else {
        redCount++
        expect(row).toBeGreaterThanOrEqual(5)
        expect(piece.type).toBe('man')
      }
    }

    expect(blackCount).toBe(12)
    expect(redCount).toBe(12)
  })
})

describe('getValidMoves', () => {
  it('regular piece can only move forward diagonally', () => {
    const board: Board = Array(64).fill(null)
    // Black man at row 2, col 1 (index 17) — moves forward (increasing row)
    board[17] = { player: 'Black', type: 'man' }
    const moves = getValidMoves(board, 'Black')
    const tos = moves.map(m => m.to).sort((a, b) => a - b)
    // Can reach (3,0)=24 and (3,2)=26 — both forward, no backward moves
    expect(tos).toEqual([24, 26])
    expect(moves.every(m => m.to > 17)).toBe(true)
  })

  it('king can move in all four diagonal directions', () => {
    const board: Board = Array(64).fill(null)
    // Red king at row 4, col 3 (index 35) — centre-ish, all 4 diagonals clear
    board[35] = { player: 'Red', type: 'king' }
    const moves = getValidMoves(board, 'Red')
    const tos = moves.map(m => m.to).sort((a, b) => a - b)
    // (3,2)=26  (3,4)=28  (5,2)=42  (5,4)=44
    expect(tos).toEqual([26, 28, 42, 44])
  })

  it('mandatory capture: only captures returned when any exist', () => {
    const board: Board = Array(64).fill(null)
    // Black man at row 2, col 3 (index 19)
    // Red man at row 3, col 2 (index 26) — capturable, lands at row 4, col 1 (index 33)
    // Simple move to (3,4)=28 is also possible but must be suppressed
    board[19] = { player: 'Black', type: 'man' }
    board[26] = { player: 'Red', type: 'man' }
    const moves = getValidMoves(board, 'Black')
    expect(moves).toHaveLength(1)
    expect(moves[0].from).toBe(19)
    expect(moves[0].to).toBe(33)
    expect(moves[0].captures).toEqual([26])
  })

  it('multi-jump: full capture sequence is returned as a single move', () => {
    const board: Board = Array(64).fill(null)
    // Black man at row 0, col 1 (index 1)
    // Red at row 1, col 2 (index 10) — first capture, lands at row 2, col 3 (index 19)
    // Red at row 3, col 4 (index 28) — second capture, lands at row 4, col 5 (index 37)
    board[1] = { player: 'Black', type: 'man' }
    board[10] = { player: 'Red', type: 'man' }
    board[28] = { player: 'Red', type: 'man' }
    const moves = getValidMoves(board, 'Black')
    expect(moves).toHaveLength(1)
    expect(moves[0].from).toBe(1)
    expect(moves[0].to).toBe(37)
    expect(moves[0].captures).toEqual([10, 28])
  })
})

describe('applyMove', () => {
  it('moves piece to destination and removes the captured piece', () => {
    const board: Board = Array(64).fill(null)
    board[19] = { player: 'Black', type: 'man' }
    board[26] = { player: 'Red', type: 'man' }
    const result = applyMove(board, { from: 19, to: 33, captures: [26] })
    expect(result[19]).toBeNull()         // piece left origin
    expect(result[26]).toBeNull()         // captured piece removed
    expect(result[33]?.player).toBe('Black')
    expect(result[33]?.type).toBe('man')
  })

  it('promotes piece to king when reaching the back row', () => {
    const board: Board = Array(64).fill(null)
    // Red man at row 1, col 2 (index 10) moves to row 0, col 1 (index 1) — Red's back row
    board[10] = { player: 'Red', type: 'man' }
    const result = applyMove(board, { from: 10, to: 1, captures: [] })
    expect(result[1]?.player).toBe('Red')
    expect(result[1]?.type).toBe('king')
  })

  it('multi-jump stops at the back row even when further captures would be possible for a king', () => {
    const board: Board = Array(64).fill(null)
    // Black man at row 5, col 2 (index 42)
    // Red at row 6, col 3 (index 51) — captured, lands at row 7, col 4 (index 60) — Black's back row
    // Red at row 6, col 5 (index 53) — a king at (7,4) could jump this, but promotion ends the sequence
    board[42] = { player: 'Black', type: 'man' }
    board[51] = { player: 'Red', type: 'man' }
    board[53] = { player: 'Red', type: 'man' }
    const moves = getValidMoves(board, 'Black')
    expect(moves).toHaveLength(1)
    expect(moves[0].to).toBe(60)
    expect(moves[0].captures).toEqual([51])
    // Applying the move should promote to king
    const result = applyMove(board, moves[0])
    expect(result[60]?.type).toBe('king')
  })
})

describe('checkWinner', () => {
  it('returns the opposing player when the current player has no legal moves', () => {
    const board: Board = Array(64).fill(null)
    // Black man at row 3, col 2 (index 26) — completely trapped
    // Red at (4,1)=33 and (4,3)=35 blocks both forward squares
    // Red at (5,0)=40 and (5,4)=44 blocks both capture landings
    board[26] = { player: 'Black', type: 'man' }
    board[33] = { player: 'Red', type: 'man' }
    board[35] = { player: 'Red', type: 'man' }
    board[40] = { player: 'Red', type: 'man' }
    board[44] = { player: 'Red', type: 'man' }
    expect(checkWinner(board, 'Black')).toBe('Red')
  })

  it('returns null during normal play', () => {
    const board = createInitialBoard()
    expect(checkWinner(board, 'Red')).toBeNull()
    expect(checkWinner(board, 'Black')).toBeNull()
  })
})
