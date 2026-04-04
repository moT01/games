import { describe, it, expect } from 'vitest';
import {
  createEmptyBoard,
  getNeighborIndices,
  placeBombs,
  calculateAdjacentCounts,
  revealCells,
  toggleFlag,
  checkWin,
  countFlags,
} from './gameLogic';
import type { Cell } from './gameLogic';

// Helper: 3×3 board with a bomb at the given index
function boardWithBombAt(index: number): Cell[] {
  const cells = createEmptyBoard(3, 3);
  cells[index] = { ...cells[index], isBomb: true };
  return calculateAdjacentCounts(cells, 3, 3);
}

describe('createEmptyBoard', () => {
  it('returns correct length array with all cells in default state', () => {
    const board = createEmptyBoard(5, 4);
    expect(board).toHaveLength(20);
    for (const cell of board) {
      expect(cell.isBomb).toBe(false);
      expect(cell.isRevealed).toBe(false);
      expect(cell.isFlagged).toBe(false);
      expect(cell.adjacentCount).toBe(0);
    }
  });
});

describe('getNeighborIndices', () => {
  // 3×3 grid: 0 1 2 / 3 4 5 / 6 7 8
  it('returns 8 neighbors for a center cell', () => {
    expect(getNeighborIndices(4, 3, 3)).toEqual([0, 1, 2, 3, 5, 6, 7, 8]);
  });

  it('returns 3 neighbors for a corner cell', () => {
    expect(getNeighborIndices(0, 3, 3)).toEqual([1, 3, 4]);
  });

  it('returns 5 neighbors for a top-edge cell', () => {
    expect(getNeighborIndices(1, 3, 3)).toEqual([0, 2, 3, 4, 5]);
  });
});

describe('placeBombs', () => {
  it('places exactly the requested number of bombs', () => {
    const cells = createEmptyBoard(5, 5);
    const result = placeBombs(cells, 5, 5, 5, 12);
    expect(result.filter(c => c.isBomb)).toHaveLength(5);
  });

  it('never places a bomb at safeIndex', () => {
    const cells = createEmptyBoard(5, 5);
    for (let run = 0; run < 20; run++) {
      const result = placeBombs(cells, 5, 5, 5, 12);
      expect(result[12].isBomb).toBe(false);
    }
  });
});

describe('calculateAdjacentCounts', () => {
  it('correctly counts adjacent bombs for a manually constructed board', () => {
    // 3×3 with bomb at center (index 4)
    const cells = createEmptyBoard(3, 3);
    cells[4] = { ...cells[4], isBomb: true };
    const result = calculateAdjacentCounts(cells, 3, 3);

    // All 8 surrounding cells adjacent to center bomb
    for (const i of [0, 1, 2, 3, 5, 6, 7, 8]) {
      expect(result[i].adjacentCount).toBe(1);
    }
    // Bomb cell itself stays at 0
    expect(result[4].adjacentCount).toBe(0);
  });
});

describe('revealCells', () => {
  it('cascades through all reachable 0-cells and their numbered borders', () => {
    // 3×3 with no bombs — all adjacentCount=0, one click reveals everything
    const board = calculateAdjacentCounts(createEmptyBoard(3, 3), 3, 3);
    const result = revealCells(board, 0, 3, 3);
    expect(result.every(c => c.isRevealed)).toBe(true);
  });

  it('does not cascade through flagged cells', () => {
    // 3×3 bomb at 0; flag cell 5 (a 0-cell between the cascade and cells 1,2)
    // Without flag: clicking cell 8 cascades through 5 and reaches 1,2
    // With flag at 5: cells 1 and 2 stay unrevealed
    const board = boardWithBombAt(0);
    board[5] = { ...board[5], isFlagged: true };
    const result = revealCells(board, 8, 3, 3);
    expect(result[5].isRevealed).toBe(false); // flagged cell stays unrevealed
    expect(result[1].isRevealed).toBe(false); // blocked by flagged 5
    expect(result[2].isRevealed).toBe(false); // blocked by flagged 5
  });

  it('on a numbered cell reveals only that cell (no cascade)', () => {
    // Cell 1 (top-edge) is adjacent to bomb at 0 → adjacentCount=1
    const board = boardWithBombAt(0);
    const result = revealCells(board, 1, 3, 3);
    expect(result[1].isRevealed).toBe(true);
    const revealedCount = result.filter(c => c.isRevealed).length;
    expect(revealedCount).toBe(1);
  });

  it('on a bomb cell reveals it', () => {
    const board = boardWithBombAt(0);
    const result = revealCells(board, 0, 3, 3);
    expect(result[0].isRevealed).toBe(true);
  });
});

describe('toggleFlag', () => {
  it('flags an unrevealed cell', () => {
    const board = createEmptyBoard(3, 3);
    const result = toggleFlag(board, 4);
    expect(result[4].isFlagged).toBe(true);
  });

  it('removes the flag when called again on a flagged cell', () => {
    const board = createEmptyBoard(3, 3);
    const flagged = toggleFlag(board, 4);
    const unflagged = toggleFlag(flagged, 4);
    expect(unflagged[4].isFlagged).toBe(false);
  });

  it('does nothing on a revealed cell', () => {
    const board = createEmptyBoard(3, 3);
    board[4] = { ...board[4], isRevealed: true };
    const result = toggleFlag(board, 4);
    expect(result[4].isFlagged).toBe(false);
    expect(result).toBe(board); // same reference returned
  });
});

describe('checkWin', () => {
  it('returns false when safe cells are still unrevealed', () => {
    const board = createEmptyBoard(3, 3);
    board[0] = { ...board[0], isBomb: true };
    // No safe cells revealed yet
    expect(checkWin(board)).toBe(false);
  });

  it('returns true when all non-bomb cells are revealed', () => {
    const board = createEmptyBoard(3, 3);
    board[0] = { ...board[0], isBomb: true };
    // Reveal all safe cells
    for (let i = 1; i < 9; i++) {
      board[i] = { ...board[i], isRevealed: true };
    }
    expect(checkWin(board)).toBe(true);
  });
});

describe('countFlags', () => {
  it('returns the correct number of flagged cells', () => {
    const board = createEmptyBoard(3, 3);
    board[1] = { ...board[1], isFlagged: true };
    board[4] = { ...board[4], isFlagged: true };
    board[7] = { ...board[7], isFlagged: true };
    expect(countFlags(board)).toBe(3);
  });
});
