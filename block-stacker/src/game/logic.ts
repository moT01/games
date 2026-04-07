// Block Stacker — game logic (pentomino Tetris variant)

export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
export type StartSpeed = 'slow' | 'medium' | 'fast';
export type StartFill = 'empty' | 'light' | 'medium' | 'heavy';

export interface PieceDef {
  type: PieceType;
  base: [number, number][]; // rotation-0 shape; all other rotations computed
  color: number; // 1–12
}

export interface ActivePiece {
  type: PieceType;
  rotation: number; // 0–3
  row: number;
  col: number;
}

export type Board = number[][]; // [row][col], 0=empty, 1–12=locked piece color

const COLS = 12;
const ROWS = 20;

// Standard Tetris tetrominoes — base (rotation-0) shape only.
// All other rotations are computed mathematically.
export const PIECES: Record<PieceType, PieceDef> = {
  I: { type: 'I', color: 1, base: [[0,0],[1,0],[2,0],[3,0]] },   // vertical bar
  O: { type: 'O', color: 2, base: [[0,0],[0,1],[1,0],[1,1]] },   // square
  T: { type: 'T', color: 3, base: [[0,1],[1,0],[1,1],[1,2]] },   // T-shape
  S: { type: 'S', color: 4, base: [[0,1],[0,2],[1,0],[1,1]] },   // S-shape
  Z: { type: 'Z', color: 5, base: [[0,0],[0,1],[1,1],[1,2]] },   // Z-shape
  J: { type: 'J', color: 6, base: [[0,0],[1,0],[1,1],[1,2]] },   // J-shape
  L: { type: 'L', color: 7, base: [[0,2],[1,0],[1,1],[1,2]] },   // L-shape
};

export const ALL_PIECE_TYPES: PieceType[] = ['I','O','T','S','Z','J','L'];

export function createEmptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

export function createStartingBoard(fill: StartFill): Board {
  if (fill === 'empty') return createEmptyBoard();
  const board = createEmptyBoard();
  // fillRatio = fraction of rows to partially fill
  const rowRatios: Record<Exclude<StartFill, 'empty'>, number> = {
    light: 0.25,
    medium: 0.50,
    heavy: 0.75,
  };
  const ratio = rowRatios[fill as Exclude<StartFill, 'empty'>];
  const filledRowCount = Math.round(ROWS * ratio);
  // Fill from the bottom up
  for (let i = 0; i < filledRowCount; i++) {
    const rowIdx = ROWS - 1 - i;
    // Randomly fill cells, guaranteeing at least one gap
    const gapCol = Math.floor(Math.random() * COLS);
    for (let c = 0; c < COLS; c++) {
      if (c === gapCol) {
        board[rowIdx][c] = 0;
      } else {
        // ~70% chance of fill per cell
        board[rowIdx][c] = Math.random() < 0.7 ? (Math.floor(Math.random() * 12) + 1) : 0;
      }
    }
    // Ensure the row is not accidentally complete (all filled)
    const complete = board[rowIdx].every(v => v !== 0);
    if (complete) {
      board[rowIdx][gapCol] = 0;
    }
  }
  return board;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function newBag(): PieceType[] {
  return shuffleArray([...ALL_PIECE_TYPES]);
}

// Rotate a set of cells 90° clockwise: (r, c) → (c, -r), then normalize to origin.
function rotateCellsCW(cells: [number, number][]): [number, number][] {
  const rotated: [number, number][] = cells.map(([r, c]) => [c, -r]);
  const minR = Math.min(...rotated.map(([r]) => r));
  const minC = Math.min(...rotated.map(([, c]) => c));
  return rotated.map(([r, c]) => [r - minR, c - minC]);
}

function getBaseCells(type: PieceType, rotation: number): [number, number][] {
  let cells: [number, number][] = PIECES[type].base;
  for (let i = 0; i < rotation; i++) cells = rotateCellsCW(cells);
  return cells;
}

export function spawnPiece(type: PieceType): ActivePiece {
  const cells = getBaseCells(type, 0);
  const maxCol = Math.max(...cells.map(([, c]) => c));
  const col = Math.floor((COLS - maxCol - 1) / 2);
  return { type, rotation: 0, row: 0, col };
}

export function getCells(piece: ActivePiece): [number, number][] {
  return getBaseCells(piece.type, piece.rotation).map(
    ([dr, dc]) => [piece.row + dr, piece.col + dc]
  );
}

export function isValidPosition(board: Board, piece: ActivePiece): boolean {
  for (const [r, c] of getCells(piece)) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
    if (board[r][c] !== 0) return false;
  }
  return true;
}

export function rotate(piece: ActivePiece, dir: 'cw' | 'ccw'): ActivePiece {
  const newRot = dir === 'cw'
    ? (piece.rotation + 1) % 4
    : (piece.rotation + 3) % 4;
  return { ...piece, rotation: newRot };
}

const KICK_OFFSETS: [number, number][] = [
  [0, 0], [0, -1], [0, 1], [0, -2], [0, 2], [-1, 0], [1, 0],
];

export function tryRotate(board: Board, piece: ActivePiece, dir: 'cw' | 'ccw'): ActivePiece | null {
  const rotated = rotate(piece, dir);
  for (const [dr, dc] of KICK_OFFSETS) {
    const candidate = { ...rotated, row: rotated.row + dr, col: rotated.col + dc };
    if (isValidPosition(board, candidate)) return candidate;
  }
  return null;
}

export function moveLeft(board: Board, piece: ActivePiece): ActivePiece | null {
  const moved = { ...piece, col: piece.col - 1 };
  return isValidPosition(board, moved) ? moved : null;
}

export function moveRight(board: Board, piece: ActivePiece): ActivePiece | null {
  const moved = { ...piece, col: piece.col + 1 };
  return isValidPosition(board, moved) ? moved : null;
}

export function moveDown(board: Board, piece: ActivePiece): ActivePiece | null {
  const moved = { ...piece, row: piece.row + 1 };
  return isValidPosition(board, moved) ? moved : null;
}

export function hardDropPosition(board: Board, piece: ActivePiece): ActivePiece {
  let current = piece;
  let next = moveDown(board, current);
  while (next !== null) {
    current = next;
    next = moveDown(board, current);
  }
  return current;
}

export function hardDropDistance(board: Board, piece: ActivePiece): number {
  const dropped = hardDropPosition(board, piece);
  return dropped.row - piece.row;
}

export function lockPiece(board: Board, piece: ActivePiece): Board {
  const newBoard = board.map(row => [...row]);
  const color = PIECES[piece.type].color;
  for (const [r, c] of getCells(piece)) {
    newBoard[r][c] = color;
  }
  return newBoard;
}

export function findCompleteRows(board: Board): number[] {
  const rows: number[] = [];
  for (let r = 0; r < ROWS; r++) {
    if (board[r].every(cell => cell !== 0)) rows.push(r);
  }
  return rows;
}

export function clearRows(board: Board, rows: number[]): Board {
  if (rows.length === 0) return board;
  const rowSet = new Set(rows);
  const remaining = board.filter((_, r) => !rowSet.has(r));
  const empty = Array.from({ length: rows.length }, () => Array(COLS).fill(0));
  return [...empty, ...remaining];
}

const LINE_MULTIPLIERS = [0, 1, 2, 3, 5, 8];

export function calcScore(
  lineCount: number,
  level: number,
  combo: number,
  dropBonus: number,
): number {
  if (lineCount === 0) return dropBonus;
  const mult = LINE_MULTIPLIERS[Math.min(lineCount, 5)];
  let score = 100 * mult * (level + 1);
  if (combo >= 2) score = Math.round(score * 1.5);
  return score + dropBonus;
}

const BASE_INTERVALS: Record<StartSpeed, number> = {
  slow: 800,
  medium: 500,
  fast: 300,
};

export function calcLevel(totalLines: number, _startSpeed: StartSpeed): number {
  return Math.floor(totalLines / 10);
}

export function gravityInterval(level: number, softDrop: boolean, startSpeed: StartSpeed): number {
  if (softDrop) return 50;
  const base = BASE_INTERVALS[startSpeed];
  return Math.max(100, base - level * 50);
}

export function isTopOut(board: Board, piece: ActivePiece): boolean {
  return !isValidPosition(board, piece);
}
