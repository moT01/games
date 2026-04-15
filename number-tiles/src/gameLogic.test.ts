import { describe, it, expect } from 'vitest';
import {
  generateSolvedBoard,
  isSolvable,
  isSolved,
  moveTile,
  getValidMoves,
  shuffleBoard,
  arrowKeyToTileIndex,
} from './gameLogic';

describe('isSolvable', () => {
  it('returns true for the solved 4x4 board', () => {
    const board = generateSolvedBoard(4);
    expect(isSolvable(board, 4)).toBe(true);
  });

  it('returns true for a known-solvable 4x4 permutation', () => {
    // A configuration with the blank in bottom-right (row 4 from bottom = odd) and even inversions
    // Swap tiles 14 and 15 from solved: [1,2,3,4,5,6,7,8,9,10,11,12,13,15,14,0]
    // inversions = 1 (15 before 14), blank at index 15, row=3, rowFromBottom=1 (odd)
    // inversions odd + rowFromBottom even → not solvable by rule
    // Instead use a known-good: move blank one step from solved by swapping 15 and 0
    // [1,2,3,4,5,6,7,8,9,10,11,12,13,14,0,15]: blank at 14, rowFromBottom = 1 (odd), inversions = 1 (odd) → even row needed
    // Use a two-step away: swap 12 and blank from solved
    // solved has blank at 15; swap index 11 (tile=12) with blank → [1,2,3,4,5,6,7,8,9,10,11,0,13,14,15,12]
    // blank at index 11, row=2 (0-based), rowFromBottom = 4-2=2 (even)
    // inversions: 12 is at end, tiles before it > 12: 13,14,15 → 3 inversions (odd)
    // odd inversions + even rowFromBottom → solvable
    const board = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 13, 14, 15, 12];
    expect(isSolvable(board, 4)).toBe(true);
  });

  it('returns false for a known-unsolvable 4x4 permutation (tiles 1 and 2 swapped)', () => {
    // Solved: [1,2,3,...,15,0]. Swap 1 and 2 → [2,1,3,...,15,0]
    // blank at index 15, row=3, rowFromBottom=1 (odd)
    // inversions: one extra inversion (2 before 1)
    // odd inversions + odd rowFromBottom → unsolvable
    const board = [2, 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0];
    expect(isSolvable(board, 4)).toBe(false);
  });

  it('handles 3x3 odd-width rule correctly — solved board is solvable', () => {
    const board = generateSolvedBoard(3);
    expect(isSolvable(board, 3)).toBe(true);
  });

  it('handles 3x3 odd-width rule correctly — one swap is unsolvable', () => {
    // Solved: [1,2,3,4,5,6,7,8,0]. Swap 1 and 2 → [2,1,3,4,5,6,7,8,0]
    // inversions = 1 (odd) → unsolvable for 3x3
    const board = [2, 1, 3, 4, 5, 6, 7, 8, 0];
    expect(isSolvable(board, 3)).toBe(false);
  });

  it('handles 5x5 odd-width rule correctly — solved board is solvable', () => {
    const board = generateSolvedBoard(5);
    expect(isSolvable(board, 5)).toBe(true);
  });

  it('handles 5x5 odd-width rule correctly — one swap is unsolvable', () => {
    // Swap tiles 1 and 2 in solved 5x5 board → 1 inversion → unsolvable
    const board = generateSolvedBoard(5);
    [board[0], board[1]] = [board[1], board[0]];
    expect(isSolvable(board, 5)).toBe(false);
  });
});

describe('isSolved', () => {
  it('returns true for [1,2,…,n²-1,0] (4x4)', () => {
    const board = generateSolvedBoard(4);
    expect(isSolved(board)).toBe(true);
  });

  it('returns true for 3x3 solved board', () => {
    expect(isSolved([1, 2, 3, 4, 5, 6, 7, 8, 0])).toBe(true);
  });

  it('returns false for an unsolved board', () => {
    const board = [1, 2, 3, 4, 5, 6, 7, 0, 8];
    expect(isSolved(board)).toBe(false);
  });

  it('returns false when blank is not in last position', () => {
    const board = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    expect(isSolved(board)).toBe(false);
  });
});

describe('moveTile', () => {
  it('swaps tile and blank when move is valid', () => {
    // 3x3 solved: blank at index 8 (bottom-right). Tile at index 7 (value 8) can move right.
    const board = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    const result = moveTile(board, 7, 3);
    expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 0, 8]);
  });

  it('returns null for a non-adjacent tile', () => {
    const board = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    expect(moveTile(board, 0, 3)).toBeNull();
  });

  it('returns null when clicking the blank itself', () => {
    const board = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    expect(moveTile(board, 8, 3)).toBeNull();
  });

  it('does not allow wrapping across row boundaries', () => {
    // 3x3: blank at index 3 (row 1, col 0). Index 2 is row 0, col 2 — not adjacent.
    // [1,2,3,0,5,6,7,8,4] blank at 3
    const board = [1, 2, 3, 0, 5, 6, 7, 8, 4];
    // tile at index 2 (row 0, col 2) is NOT adjacent to blank at index 3 (row 1, col 0)
    expect(moveTile(board, 2, 3)).toBeNull();
  });
});

describe('getValidMoves', () => {
  it('returns correct adjacent indices for blank in corner (index 0)', () => {
    // blank at 0 (top-left): can move right (1) and down (3)
    const board = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    const valid = getValidMoves(board, 3);
    expect(valid.sort((a, b) => a - b)).toEqual([1, 3]);
  });

  it('returns correct adjacent indices for blank on edge (index 1)', () => {
    // blank at 1 (top-middle): can move left (0), right (2), down (4)
    const board = [1, 0, 2, 3, 4, 5, 6, 7, 8];
    const valid = getValidMoves(board, 3);
    expect(valid.sort((a, b) => a - b)).toEqual([0, 2, 4]);
  });

  it('returns correct adjacent indices for blank in center (index 4)', () => {
    // blank at 4 (center): can move up(1), down(7), left(3), right(5)
    const board = [1, 2, 3, 4, 0, 5, 6, 7, 8];
    const valid = getValidMoves(board, 3);
    expect(valid.sort((a, b) => a - b)).toEqual([1, 3, 5, 7]);
  });
});

describe('shuffleBoard', () => {
  it('returns a solvable board (run 10 iterations)', () => {
    const n = 4;
    const solved = generateSolvedBoard(n);
    for (let i = 0; i < 10; i++) {
      const shuffled = shuffleBoard(solved, n);
      expect(isSolvable(shuffled, n)).toBe(true);
    }
  });

  it('does not return the solved board', () => {
    const n = 4;
    const solved = generateSolvedBoard(n);
    for (let i = 0; i < 10; i++) {
      const shuffled = shuffleBoard(solved, n);
      expect(isSolved(shuffled)).toBe(false);
    }
  });
});

describe('arrowKeyToTileIndex', () => {
  // 3x3 board, blank at center (index 4):
  // [1,2,3,4,0,5,6,7,8]
  const board = [1, 2, 3, 4, 0, 5, 6, 7, 8];
  const n = 3;

  it('ArrowRight returns tile to the left of blank', () => {
    expect(arrowKeyToTileIndex(board, n, 'ArrowRight')).toBe(3);
  });

  it('ArrowLeft returns tile to the right of blank', () => {
    expect(arrowKeyToTileIndex(board, n, 'ArrowLeft')).toBe(5);
  });

  it('ArrowDown returns tile above blank', () => {
    expect(arrowKeyToTileIndex(board, n, 'ArrowDown')).toBe(1);
  });

  it('ArrowUp returns tile below blank', () => {
    expect(arrowKeyToTileIndex(board, n, 'ArrowUp')).toBe(7);
  });

  it('returns null when no tile exists in arrow direction (blank at corner)', () => {
    // blank at index 0 (top-left): ArrowDown returns tile above (none), ArrowRight returns tile to left (none)
    const cornerBoard = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    expect(arrowKeyToTileIndex(cornerBoard, n, 'ArrowDown')).toBeNull();
    expect(arrowKeyToTileIndex(cornerBoard, n, 'ArrowRight')).toBeNull();
  });
});
