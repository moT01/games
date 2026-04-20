import { describe, it, expect } from 'vitest'
import {
  createInitialBoard,
  getValidMoves,
  applyMove,
  checkWinner,
  type Board,
} from './gameLogic'

describe('createInitialBoard', () => {
  it('places 12 Dark pieces on rows 0-2 and 12 Light pieces on rows 5-7, all on dark squares', () => {
    const board = createInitialBoard()
    let darkCount = 0
    let lightCount = 0

    for (let i = 0; i < 64; i++) {
      const piece = board[i]
      if (!piece) continue

      const row = Math.floor(i / 8)
      const col = i % 8
      expect((row + col) % 2).toBe(1)

      if (piece.player === 'Dark') {
        darkCount++
        expect(row).toBeLessThanOrEqual(2)
      } else {
        lightCount++
        expect(row).toBeGreaterThanOrEqual(5)
      }

      expect(piece.type).toBe('man')
    }

    expect(darkCount).toBe(12)
    expect(lightCount).toBe(12)
  })
})

describe('getValidMoves', () => {
  it('regular piece can only move forward diagonally', () => {
    const board: Board = Array(64).fill(null)
    board[17] = { player: 'Dark', type: 'man' }

    const moves = getValidMoves(board, 'Dark')
    const tos = moves.map(m => m.to).sort((a, b) => a - b)

    expect(tos).toEqual([24, 26])
    expect(moves.every(m => m.to > 17)).toBe(true)
  })

  it('king can move in all four diagonal directions', () => {
    const board: Board = Array(64).fill(null)
    board[35] = { player: 'Light', type: 'king' }

    const moves = getValidMoves(board, 'Light')
    const tos = moves.map(m => m.to).sort((a, b) => a - b)

    expect(tos).toEqual([26, 28, 42, 44])
  })

  it('mandatory capture only returns captures when any exist', () => {
    const board: Board = Array(64).fill(null)
    board[19] = { player: 'Dark', type: 'man' }
    board[26] = { player: 'Light', type: 'man' }

    const moves = getValidMoves(board, 'Dark')

    expect(moves).toHaveLength(1)
    expect(moves[0]).toEqual({ from: 19, to: 33, captures: [26] })
  })

  it('multi-jump returns the full capture sequence as a single move', () => {
    const board: Board = Array(64).fill(null)
    board[1] = { player: 'Dark', type: 'man' }
    board[10] = { player: 'Light', type: 'man' }
    board[28] = { player: 'Light', type: 'man' }

    const moves = getValidMoves(board, 'Dark')

    expect(moves).toHaveLength(1)
    expect(moves[0]).toEqual({ from: 1, to: 37, captures: [10, 28] })
  })
})

describe('applyMove', () => {
  it('moves a piece to its destination and removes captured pieces', () => {
    const board: Board = Array(64).fill(null)
    board[19] = { player: 'Dark', type: 'man' }
    board[26] = { player: 'Light', type: 'man' }

    const result = applyMove(board, { from: 19, to: 33, captures: [26] })

    expect(result[19]).toBeNull()
    expect(result[26]).toBeNull()
    expect(result[33]).toEqual({ player: 'Dark', type: 'man' })
  })

  it('promotes a Light piece to king when reaching row 0', () => {
    const board: Board = Array(64).fill(null)
    board[10] = { player: 'Light', type: 'man' }

    const result = applyMove(board, { from: 10, to: 1, captures: [] })

    expect(result[1]).toEqual({ player: 'Light', type: 'king' })
  })

  it('promotes a Dark piece to king when reaching row 7', () => {
    const board: Board = Array(64).fill(null)
    board[49] = { player: 'Dark', type: 'man' }

    const result = applyMove(board, { from: 49, to: 56, captures: [] })

    expect(result[56]).toEqual({ player: 'Dark', type: 'king' })
  })

  it('promotion after a capture still ends the turn at the back row', () => {
    const board: Board = Array(64).fill(null)
    board[42] = { player: 'Dark', type: 'man' }
    board[51] = { player: 'Light', type: 'man' }
    board[53] = { player: 'Light', type: 'man' }

    const moves = getValidMoves(board, 'Dark')

    expect(moves).toHaveLength(1)
    expect(moves[0]).toEqual({ from: 42, to: 60, captures: [51] })

    const result = applyMove(board, moves[0])
    expect(result[60]).toEqual({ player: 'Dark', type: 'king' })
    expect(result[53]).toEqual({ player: 'Light', type: 'man' })
  })
})

describe('checkWinner', () => {
  it('returns the opposing player when the current player has no legal moves', () => {
    const board: Board = Array(64).fill(null)
    board[26] = { player: 'Dark', type: 'man' }
    board[33] = { player: 'Light', type: 'man' }
    board[35] = { player: 'Light', type: 'man' }
    board[40] = { player: 'Light', type: 'man' }
    board[44] = { player: 'Light', type: 'man' }

    expect(checkWinner(board, 'Dark')).toBe('Light')
  })

  it('returns null during normal play', () => {
    const board = createInitialBoard()

    expect(checkWinner(board, 'Light')).toBeNull()
    expect(checkWinner(board, 'Dark')).toBeNull()
  })
})
