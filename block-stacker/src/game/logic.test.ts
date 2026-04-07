import { describe, it, expect } from 'vitest';
import {
  createEmptyBoard,
  createStartingBoard,
  newBag,
  spawnPiece,
  isValidPosition,
  tryRotate,
  moveDown,
  hardDropPosition,
  hardDropDistance,
  lockPiece,
  findCompleteRows,
  clearRows,
  calcScore,
  calcLevel,
  gravityInterval,
  isTopOut,
  ALL_PIECE_TYPES,
  PIECES,
  getCells,
} from './logic';

describe('createEmptyBoard', () => {
  it('returns 20 rows of 12 zeros', () => {
    const board = createEmptyBoard();
    expect(board.length).toBe(20);
    for (const row of board) {
      expect(row.length).toBe(12);
      expect(row.every(c => c === 0)).toBe(true);
    }
  });
});

describe('createStartingBoard', () => {
  it('light fill: no complete rows, every filled row has at least one gap', () => {
    for (let i = 0; i < 5; i++) {
      const board = createStartingBoard('light');
      expect(board.length).toBe(20);
      for (const row of board) {
        const complete = row.every(c => c !== 0);
        expect(complete).toBe(false);
      }
    }
  });

  it('heavy fill: no complete rows, every filled row has at least one gap', () => {
    for (let i = 0; i < 5; i++) {
      const board = createStartingBoard('heavy');
      expect(board.length).toBe(20);
      for (const row of board) {
        const complete = row.every(c => c !== 0);
        expect(complete).toBe(false);
      }
    }
  });
});

describe('isValidPosition', () => {
  it('returns true for valid spawn on empty board', () => {
    const board = createEmptyBoard();
    const piece = spawnPiece('I');
    expect(isValidPosition(board, piece)).toBe(true);
  });

  it('returns false when piece cell is out of bounds left', () => {
    const board = createEmptyBoard();
    // Place piece at col=-1
    const piece = { type: 'I' as const, rotation: 0, row: 0, col: -1 };
    expect(isValidPosition(board, piece)).toBe(false);
  });

  it('returns false when piece cell is out of bounds right', () => {
    const board = createEmptyBoard();
    // I piece horizontal (rotation 1) spans 4 cells; at col 9: cols 9,10,11,12 — 12 > 11
    const piece = { type: 'I' as const, rotation: 1, row: 0, col: 9 };
    expect(isValidPosition(board, piece)).toBe(false);
  });

  it('returns false when piece cell is out of bounds bottom', () => {
    const board = createEmptyBoard();
    // I piece vertical spans rows 0–3; at row=17 cells reach row 20 which is out
    const piece = { type: 'I' as const, rotation: 0, row: 17, col: 0 };
    expect(isValidPosition(board, piece)).toBe(false);
  });

  it('returns false when piece overlaps occupied board cell', () => {
    const board = createEmptyBoard();
    // T base: [[0,1],[1,0],[1,1],[1,2]]; at row=0, col=4 → cells [0,5],[1,4],[1,5],[1,6]
    const testPiece = { type: 'T' as const, rotation: 0, row: 0, col: 4 };
    board[1][4] = 3;
    expect(isValidPosition(board, testPiece)).toBe(false);
  });
});

describe('tryRotate', () => {
  it('succeeds without kick on open board', () => {
    const board = createEmptyBoard();
    const piece = spawnPiece('T');
    const result = tryRotate(board, piece, 'cw');
    expect(result).not.toBeNull();
    expect(result!.rotation).toBe(1);
  });

  it('succeeds with kick offset when rotation would hit left wall', () => {
    const board = createEmptyBoard();
    // Place piece right at left edge
    const piece = { type: 'T' as const, rotation: 0, row: 5, col: 0 };
    // Rotation may need a kick rightward
    const result = tryRotate(board, piece, 'ccw');
    expect(result).not.toBeNull();
  });

  it('returns null when all kick positions are blocked', () => {
    const board = createEmptyBoard();
    const piece = { type: 'T' as const, rotation: 0, row: 5, col: 5 };
    // block all cells around the pivot
    for (let r = 3; r <= 8; r++) {
      for (let c = 3; c <= 9; c++) {
        if (!(r === 5 && (c === 4 || c === 5 || c === 6)) && !(c === 5 && (r === 4 || r === 6))) {
          board[r][c] = 1;
        }
      }
    }
    // Block the X cells themselves to force isValidPosition = false for all kicks
    // Since X is symmetric, block all positions the kicks would try
    // Force by filling the entire neighborhood
    for (let r = 4; r <= 7; r++) {
      for (let c = 3; c <= 9; c++) {
        board[r][c] = 1;
      }
    }
    const result = tryRotate(board, piece, 'cw');
    expect(result).toBeNull();
  });
});

describe('moveDown', () => {
  it('returns null when piece is at bottom row', () => {
    const board = createEmptyBoard();
    // I piece vertical: 4 cells tall; at row=17 cells reach row 20 which is out
    const piece = { type: 'I' as const, rotation: 0, row: 17, col: 0 };
    expect(moveDown(board, piece)).toBeNull();
  });

  it('returns null when cell directly below is occupied', () => {
    const board = createEmptyBoard();
    board[4][0] = 1; // block row 4 col 0
    // I piece vertical at row=0: cells [0,0],[1,0],[2,0],[3,0]
    // moveDown: row=1 → cells [1,0],[2,0],[3,0],[4,0] → [4,0] occupied
    const piece = { type: 'I' as const, rotation: 0, row: 0, col: 0 };
    expect(moveDown(board, piece)).toBeNull();
  });
});

describe('hardDropPosition', () => {
  it('returns piece at lowest valid row on empty board (I piece vertical)', () => {
    const board = createEmptyBoard();
    const piece = { type: 'I' as const, rotation: 0, row: 0, col: 0 };
    // I vertical: 4 cells tall, lowest valid row = 20-4 = 16
    const dropped = hardDropPosition(board, piece);
    expect(dropped.row).toBe(16);
  });
});

describe('hardDropDistance', () => {
  it('returns correct row count', () => {
    const board = createEmptyBoard();
    const piece = { type: 'I' as const, rotation: 0, row: 0, col: 0 };
    const dist = hardDropDistance(board, piece);
    expect(dist).toBe(16);
  });
});

describe('lockPiece', () => {
  it('stamps correct cells into board without mutating original', () => {
    const board = createEmptyBoard();
    // T base: [[0,1],[1,0],[1,1],[1,2]] at row=0, col=0
    const piece = { type: 'T' as const, rotation: 0, row: 0, col: 0 };
    const newBoard = lockPiece(board, piece);
    expect(newBoard[0][1]).toBe(PIECES['T'].color);
    expect(newBoard[1][0]).toBe(PIECES['T'].color);
    // Original board untouched
    expect(board[0][1]).toBe(0);
  });
});

describe('findCompleteRows', () => {
  it('returns correct row indices for fully filled rows', () => {
    const board = createEmptyBoard();
    board[19] = Array(12).fill(1);
    board[18] = Array(12).fill(2);
    const rows = findCompleteRows(board);
    expect(rows).toEqual([18, 19]);
  });

  it('returns empty array when no rows are complete', () => {
    const board = createEmptyBoard();
    board[19][0] = 0; // ensure gap
    expect(findCompleteRows(board)).toEqual([]);
  });
});

describe('clearRows', () => {
  it('removes specified rows and adds empty rows at top; board height stays 20', () => {
    const board = createEmptyBoard();
    board[19] = Array(12).fill(1);
    const cleared = clearRows(board, [19]);
    expect(cleared.length).toBe(20);
    expect(cleared[0].every(c => c === 0)).toBe(true);
    expect(cleared[19].every(c => c === 0)).toBe(true);
  });

  it('preserves row order correctly (top rows shift down)', () => {
    const board = createEmptyBoard();
    board[17] = Array(12).fill(3);
    board[19] = Array(12).fill(1);
    const cleared = clearRows(board, [17, 19]);
    expect(cleared.length).toBe(20);
    // row 17 (filled with 3) should be gone; row 18 (empty) becomes row 19 now
    expect(cleared[19].every(c => c === 0)).toBe(true);
    // No row should have value 3 or 1 in it
    const has3 = cleared.some(row => row.some(c => c === 3));
    const has1 = cleared.some(row => row.some(c => c === 1));
    expect(has3).toBe(false);
    expect(has1).toBe(false);
  });
});

describe('calcScore', () => {
  it('single line clear at level 1, no combo = baseline score', () => {
    // 100 * 1 * (1+1) + 0 = 200
    expect(calcScore(1, 1, 0, 0)).toBe(200);
  });

  it('5-line clear applies ×8 multiplier', () => {
    // 100 * 8 * (0+1) = 800
    expect(calcScore(5, 0, 0, 0)).toBe(800);
  });

  it('back-to-back combo (combo=2) applies ×1.5', () => {
    // 100 * 1 * (0+1) * 1.5 = 150
    expect(calcScore(1, 0, 2, 0)).toBe(150);
  });
});

describe('calcLevel', () => {
  it('returns level 0 at 0 lines', () => {
    expect(calcLevel(0, 'slow')).toBe(0);
  });

  it('returns level 1 at 10 lines', () => {
    expect(calcLevel(10, 'slow')).toBe(1);
  });

  it('returns level 5 at 50 lines', () => {
    expect(calcLevel(50, 'slow')).toBe(5);
  });
});

describe('gravityInterval', () => {
  it('decreases with each level', () => {
    const i0 = gravityInterval(0, false, 'slow');
    const i1 = gravityInterval(1, false, 'slow');
    const i5 = gravityInterval(5, false, 'slow');
    expect(i1).toBeLessThan(i0);
    expect(i5).toBeLessThan(i1);
  });

  it('soft drop returns 50ms', () => {
    expect(gravityInterval(0, true, 'slow')).toBe(50);
    expect(gravityInterval(5, true, 'fast')).toBe(50);
  });
});

describe('newBag', () => {
  it('contains exactly 7 unique piece types (standard Tetris tetrominoes)', () => {
    const bag = newBag();
    expect(bag.length).toBe(7);
    const sorted = [...bag].sort();
    expect(sorted).toEqual([...ALL_PIECE_TYPES].sort());
  });
});

describe('isTopOut', () => {
  it('returns true when spawn cells are occupied', () => {
    const board = createEmptyBoard();
    board[0] = Array(12).fill(1);
    const piece = spawnPiece('T');
    expect(isTopOut(board, piece)).toBe(true);
  });

  it('returns false on empty board', () => {
    const board = createEmptyBoard();
    const piece = spawnPiece('T');
    expect(isTopOut(board, piece)).toBe(false);
  });
});
