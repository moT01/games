export type Color = 'white' | 'black';
export type Mode = 'local' | 'vs-computer';
export type Difficulty = 'easy' | 'hard';
export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
export type Piece = { type: PieceType; color: Color };

export type CastlingRights = {
  whiteKingside: boolean;
  whiteQueenside: boolean;
  blackKingside: boolean;
  blackQueenside: boolean;
};

export type GameStatus = 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw';

export type GameState = {
  board: (Piece | null)[];
  turn: Color;
  castlingRights: CastlingRights;
  enPassantTarget: number | null;
  halfMoveClock: number;
  fullMoveNumber: number;
  positionHistory: string[];
  status: GameStatus;
  winner: Color | null;
  pendingPromotion: { from: number; to: number } | null;
  lastMove: { from: number; to: number } | null;
  selectedSquare: number | null;
  legalMovesForSelected: number[];
};

// ─── Board indexing ───────────────────────────────────────────────────────────
// Index 0 = a8 (rank 8, black's back rank), index 63 = h1 (rank 1, white's back rank)
// row = Math.floor(index / 8), col = index % 8

const KNIGHT_DELTAS: [number, number][] = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
const KING_DELTAS: [number, number][] = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
const BISHOP_DIRS: [number, number][] = [[-1,-1],[-1,1],[1,-1],[1,1]];
const ROOK_DIRS: [number, number][] = [[-1,0],[1,0],[0,-1],[0,1]];
const QUEEN_DIRS: [number, number][] = [...BISHOP_DIRS, ...ROOK_DIRS];

function rc(index: number): [number, number] {
  return [Math.floor(index / 8), index % 8];
}

function idx(row: number, col: number): number {
  return row * 8 + col;
}

function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

// ─── Piece-square tables (centipawns, white perspective, row 0 = rank 1) ─────

const PAWN_PST = [
   0,  0,  0,  0,  0,  0,  0,  0,
   5, 10, 10,-20,-20, 10, 10,  5,
   5, -5,-10,  0,  0,-10, -5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5,  5, 10, 25, 25, 10,  5,  5,
  10, 10, 20, 30, 30, 20, 10, 10,
  50, 50, 50, 50, 50, 50, 50, 50,
   0,  0,  0,  0,  0,  0,  0,  0,
];

const KNIGHT_PST = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50,
];

const BISHOP_PST = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20,
];

const PIECE_VALUES: Record<PieceType, number> = {
  king: 0, queen: 9, rook: 5, bishop: 3, knight: 3, pawn: 1,
};

function pstBonus(piece: Piece, boardIdx: number): number {
  // tableIdx: row 0 = own back rank, row 7 = opponent back rank
  const tableIdx = piece.color === 'white'
    ? (7 - Math.floor(boardIdx / 8)) * 8 + (boardIdx % 8)
    : Math.floor(boardIdx / 8) * 8 + (boardIdx % 8);

  switch (piece.type) {
    case 'pawn':   return PAWN_PST[tableIdx] / 100;
    case 'knight': return KNIGHT_PST[tableIdx] / 100;
    case 'bishop': return BISHOP_PST[tableIdx] / 100;
    default:       return 0;
  }
}

// ─── Core logic ──────────────────────────────────────────────────────────────

export function initBoard(): (Piece | null)[] {
  const board: (Piece | null)[] = new Array(64).fill(null);
  const backRank: PieceType[] = ['rook','knight','bishop','queen','king','bishop','knight','rook'];
  backRank.forEach((type, col) => {
    board[col]      = { type, color: 'black' }; // row 0
    board[56 + col] = { type, color: 'white' }; // row 7
  });
  for (let col = 0; col < 8; col++) {
    board[8  + col] = { type: 'pawn', color: 'black' }; // row 1
    board[48 + col] = { type: 'pawn', color: 'white' }; // row 6
  }
  return board;
}

export function initGameState(): GameState {
  const board = initBoard();
  const state: GameState = {
    board,
    turn: 'white',
    castlingRights: { whiteKingside: true, whiteQueenside: true, blackKingside: true, blackQueenside: true },
    enPassantTarget: null,
    halfMoveClock: 0,
    fullMoveNumber: 1,
    positionHistory: [],
    status: 'playing',
    winner: null,
    pendingPromotion: null,
    lastMove: null,
    selectedSquare: null,
    legalMovesForSelected: [],
  };
  state.positionHistory = [serializePosition(state)];
  return state;
}

export function getAttackedSquares(board: (Piece | null)[], color: Color): Set<number> {
  const attacked = new Set<number>();
  for (let i = 0; i < 64; i++) {
    const piece = board[i];
    if (!piece || piece.color !== color) continue;
    const [row, col] = rc(i);

    if (piece.type === 'pawn') {
      const dir = color === 'white' ? -1 : 1;
      for (const dc of [-1, 1]) {
        const nr = row + dir, nc = col + dc;
        if (inBounds(nr, nc)) attacked.add(idx(nr, nc));
      }
    } else if (piece.type === 'knight') {
      for (const [dr, dc] of KNIGHT_DELTAS) {
        const nr = row + dr, nc = col + dc;
        if (inBounds(nr, nc)) attacked.add(idx(nr, nc));
      }
    } else if (piece.type === 'king') {
      for (const [dr, dc] of KING_DELTAS) {
        const nr = row + dr, nc = col + dc;
        if (inBounds(nr, nc)) attacked.add(idx(nr, nc));
      }
    } else {
      const dirs =
        piece.type === 'bishop' ? BISHOP_DIRS :
        piece.type === 'rook'   ? ROOK_DIRS   : QUEEN_DIRS;
      for (const [dr, dc] of dirs) {
        let nr = row + dr, nc = col + dc;
        while (inBounds(nr, nc)) {
          attacked.add(idx(nr, nc));
          if (board[idx(nr, nc)]) break;
          nr += dr; nc += dc;
        }
      }
    }
  }
  return attacked;
}

export function isInCheck(board: (Piece | null)[], color: Color): boolean {
  let kingIdx = -1;
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (p && p.type === 'king' && p.color === color) { kingIdx = i; break; }
  }
  if (kingIdx === -1) return false;
  const opp: Color = color === 'white' ? 'black' : 'white';
  return getAttackedSquares(board, opp).has(kingIdx);
}

export function getPseudoLegalMoves(
  board: (Piece | null)[],
  square: number,
  gameState: Pick<GameState, 'castlingRights' | 'enPassantTarget'>
): number[] {
  const piece = board[square];
  if (!piece) return [];
  const [row, col] = rc(square);
  const moves: number[] = [];

  switch (piece.type) {
    case 'pawn': {
      const dir = piece.color === 'white' ? -1 : 1;
      const startRow = piece.color === 'white' ? 6 : 1;
      const nr1 = row + dir;
      if (inBounds(nr1, col) && !board[idx(nr1, col)]) {
        moves.push(idx(nr1, col));
        if (row === startRow) {
          const nr2 = row + 2 * dir;
          if (!board[idx(nr2, col)]) moves.push(idx(nr2, col));
        }
      }
      for (const dc of [-1, 1]) {
        const nr = row + dir, nc = col + dc;
        if (inBounds(nr, nc)) {
          const destIdx = idx(nr, nc);
          const target = board[destIdx];
          if ((target && target.color !== piece.color) || destIdx === gameState.enPassantTarget) {
            moves.push(destIdx);
          }
        }
      }
      break;
    }
    case 'knight': {
      for (const [dr, dc] of KNIGHT_DELTAS) {
        const nr = row + dr, nc = col + dc;
        if (inBounds(nr, nc)) {
          const target = board[idx(nr, nc)];
          if (!target || target.color !== piece.color) moves.push(idx(nr, nc));
        }
      }
      break;
    }
    case 'bishop':
    case 'rook':
    case 'queen': {
      const dirs =
        piece.type === 'bishop' ? BISHOP_DIRS :
        piece.type === 'rook'   ? ROOK_DIRS   : QUEEN_DIRS;
      for (const [dr, dc] of dirs) {
        let nr = row + dr, nc = col + dc;
        while (inBounds(nr, nc)) {
          const target = board[idx(nr, nc)];
          if (target) {
            if (target.color !== piece.color) moves.push(idx(nr, nc));
            break;
          }
          moves.push(idx(nr, nc));
          nr += dr; nc += dc;
        }
      }
      break;
    }
    case 'king': {
      for (const [dr, dc] of KING_DELTAS) {
        const nr = row + dr, nc = col + dc;
        if (inBounds(nr, nc)) {
          const target = board[idx(nr, nc)];
          if (!target || target.color !== piece.color) moves.push(idx(nr, nc));
        }
      }
      const { castlingRights: cr } = gameState;
      if (piece.color === 'white' && row === 7 && col === 4) {
        if (cr.whiteKingside  && !board[61] && !board[62]) moves.push(62);
        if (cr.whiteQueenside && !board[59] && !board[58] && !board[57]) moves.push(58);
      }
      if (piece.color === 'black' && row === 0 && col === 4) {
        if (cr.blackKingside  && !board[5] && !board[6]) moves.push(6);
        if (cr.blackQueenside && !board[3] && !board[2] && !board[1]) moves.push(2);
      }
      break;
    }
  }
  return moves;
}

// Applies move on board only (no full state update) — used for legality checks
function applyMoveToBoard(
  board: (Piece | null)[],
  from: number,
  to: number,
  enPassantTarget: number | null
): (Piece | null)[] {
  const b = [...board];
  const piece = b[from]!;

  // En passant capture
  if (piece.type === 'pawn' && to === enPassantTarget) {
    const capturedRow = piece.color === 'white'
      ? Math.floor(to / 8) + 1
      : Math.floor(to / 8) - 1;
    b[capturedRow * 8 + (to % 8)] = null;
  }

  // Castling — move the rook
  if (piece.type === 'king' && Math.abs((to % 8) - (from % 8)) === 2) {
    const r = Math.floor(from / 8);
    if (to % 8 === 6) { b[r * 8 + 5] = b[r * 8 + 7]; b[r * 8 + 7] = null; }
    else               { b[r * 8 + 3] = b[r * 8 + 0]; b[r * 8 + 0] = null; }
  }

  b[to] = piece;
  b[from] = null;
  return b;
}

export function getLegalMoves(
  board: (Piece | null)[],
  square: number,
  gameState: Pick<GameState, 'castlingRights' | 'enPassantTarget'>
): number[] {
  const piece = board[square];
  if (!piece) return [];
  const pseudo = getPseudoLegalMoves(board, square, gameState);
  const legal: number[] = [];

  for (const to of pseudo) {
    // Extra castling checks: king must not be in check, must not pass through check
    if (piece.type === 'king' && Math.abs((to % 8) - (square % 8)) === 2) {
      if (isInCheck(board, piece.color)) continue;
      const dir = to % 8 > square % 8 ? 1 : -1;
      const intermIdx = Math.floor(square / 8) * 8 + (square % 8) + dir;
      const intermBoard = [...board];
      intermBoard[intermIdx] = board[square];
      intermBoard[square] = null;
      if (isInCheck(intermBoard, piece.color)) continue;
    }

    const newBoard = applyMoveToBoard(board, square, to, gameState.enPassantTarget);
    if (!isInCheck(newBoard, piece.color)) legal.push(to);
  }
  return legal;
}

export function getAllLegalMoves(
  board: (Piece | null)[],
  color: Color,
  gameState: Pick<GameState, 'castlingRights' | 'enPassantTarget'>
): { from: number; to: number }[] {
  const moves: { from: number; to: number }[] = [];
  for (let i = 0; i < 64; i++) {
    const piece = board[i];
    if (!piece || piece.color !== color) continue;
    for (const to of getLegalMoves(board, i, gameState)) {
      moves.push({ from: i, to });
    }
  }
  return moves;
}

export function serializePosition(gameState: Pick<GameState, 'board' | 'turn' | 'castlingRights' | 'enPassantTarget'>): string {
  const { board, turn, castlingRights: cr, enPassantTarget } = gameState;
  const boardStr = board.map(p => {
    if (!p) return '.';
    const ch = p.type === 'knight' ? 'n' : p.type[0];
    return p.color === 'white' ? ch.toUpperCase() : ch;
  }).join('');
  let castle = '';
  if (cr.whiteKingside)  castle += 'K';
  if (cr.whiteQueenside) castle += 'Q';
  if (cr.blackKingside)  castle += 'k';
  if (cr.blackQueenside) castle += 'q';
  return `${boardStr}|${turn}|${castle || '-'}|${enPassantTarget ?? '-'}`;
}

export function hasInsufficientMaterial(board: (Piece | null)[]): boolean {
  const pieces = board.filter((p): p is Piece => p !== null);
  if (pieces.length === 2) return true; // K vs K

  if (pieces.length === 3) {
    const nonKings = pieces.filter(p => p.type !== 'king');
    if (nonKings.length === 1 && (nonKings[0].type === 'bishop' || nonKings[0].type === 'knight')) return true;
  }

  if (pieces.length === 4) {
    const wb = pieces.filter(p => p.color === 'white' && p.type === 'bishop');
    const bb = pieces.filter(p => p.color === 'black' && p.type === 'bishop');
    if (wb.length === 1 && bb.length === 1) {
      const wIdx = board.indexOf(wb[0]);
      const bIdx = board.indexOf(bb[0]);
      const wColor = (Math.floor(wIdx / 8) + wIdx % 8) % 2;
      const bColor = (Math.floor(bIdx / 8) + bIdx % 8) % 2;
      if (wColor === bColor) return true; // same-colored bishops
    }
  }

  return false;
}

export function detectGameStatus(gameState: GameState): { status: GameStatus; winner: Color | null } {
  const { board, turn, halfMoveClock, positionHistory } = gameState;

  if (hasInsufficientMaterial(board)) return { status: 'draw', winner: null };
  if (halfMoveClock >= 100) return { status: 'draw', winner: null };

  const currentPos = serializePosition(gameState);
  if (positionHistory.filter(p => p === currentPos).length >= 3) return { status: 'draw', winner: null };

  const allMoves = getAllLegalMoves(board, turn, gameState);
  if (allMoves.length === 0) {
    if (isInCheck(board, turn)) {
      const winner: Color = turn === 'white' ? 'black' : 'white';
      return { status: 'checkmate', winner };
    }
    return { status: 'stalemate', winner: null };
  }

  if (isInCheck(board, turn)) return { status: 'check', winner: null };
  return { status: 'playing', winner: null };
}

export function applyMove(gameState: GameState, from: number, to: number): GameState {
  const board = [...gameState.board];
  const piece = board[from]!;
  const target = board[to];
  const isEnPassant = piece.type === 'pawn' && to === gameState.enPassantTarget;
  const isCapture = target !== null || isEnPassant;
  const isPawn = piece.type === 'pawn';

  // En passant — remove the captured pawn
  if (isEnPassant) {
    const capRow = piece.color === 'white' ? Math.floor(to / 8) + 1 : Math.floor(to / 8) - 1;
    board[capRow * 8 + (to % 8)] = null;
  }

  // Castling — move the rook
  if (piece.type === 'king' && Math.abs((to % 8) - (from % 8)) === 2) {
    const r = Math.floor(from / 8);
    if (to % 8 === 6) { board[r * 8 + 5] = board[r * 8 + 7]; board[r * 8 + 7] = null; }
    else               { board[r * 8 + 3] = board[r * 8 + 0]; board[r * 8 + 0] = null; }
  }

  board[to] = piece;
  board[from] = null;

  // Castling rights
  let cr = { ...gameState.castlingRights };
  if (piece.type === 'king') {
    if (piece.color === 'white') { cr.whiteKingside = false; cr.whiteQueenside = false; }
    else                         { cr.blackKingside = false; cr.blackQueenside = false; }
  }
  if (piece.type === 'rook') {
    if (from === 63) cr.whiteKingside  = false;
    if (from === 56) cr.whiteQueenside = false;
    if (from === 7)  cr.blackKingside  = false;
    if (from === 0)  cr.blackQueenside = false;
  }
  // Rook captured on its starting square
  if (to === 63) cr.whiteKingside  = false;
  if (to === 56) cr.whiteQueenside = false;
  if (to === 7)  cr.blackKingside  = false;
  if (to === 0)  cr.blackQueenside = false;

  // En passant target for next move
  let enPassantTarget: number | null = null;
  if (isPawn && Math.abs(Math.floor(to / 8) - Math.floor(from / 8)) === 2) {
    enPassantTarget = ((Math.floor(from / 8) + Math.floor(to / 8)) / 2) * 8 + (from % 8);
  }

  const halfMoveClock = (isPawn || isCapture) ? 0 : gameState.halfMoveClock + 1;
  const fullMoveNumber = gameState.turn === 'black' ? gameState.fullMoveNumber + 1 : gameState.fullMoveNumber;

  // Pawn promotion — hold turn until resolved
  const toRow = Math.floor(to / 8);
  const pendingPromotion = (isPawn && (toRow === 0 || toRow === 7))
    ? { from, to } : null;

  const nextTurn: Color = pendingPromotion
    ? gameState.turn
    : (gameState.turn === 'white' ? 'black' : 'white');

  const newState: GameState = {
    board,
    turn: nextTurn,
    castlingRights: cr,
    enPassantTarget,
    halfMoveClock,
    fullMoveNumber,
    positionHistory: gameState.positionHistory,
    status: gameState.status,
    winner: gameState.winner,
    pendingPromotion,
    lastMove: { from, to },
    selectedSquare: null,
    legalMovesForSelected: [],
  };

  if (!pendingPromotion) {
    const serialized = serializePosition(newState);
    newState.positionHistory = [...gameState.positionHistory, serialized];
    const { status, winner } = detectGameStatus(newState);
    newState.status = status;
    newState.winner = winner;
  }

  return newState;
}

export function applyPromotion(gameState: GameState, pieceType: PieceType): GameState {
  const { pendingPromotion } = gameState;
  if (!pendingPromotion) return gameState;

  const board = [...gameState.board];
  const pawn = board[pendingPromotion.to]!;
  board[pendingPromotion.to] = { type: pieceType, color: pawn.color };

  const nextTurn: Color = gameState.turn === 'white' ? 'black' : 'white';

  const newState: GameState = {
    ...gameState,
    board,
    turn: nextTurn,
    pendingPromotion: null,
    selectedSquare: null,
    legalMovesForSelected: [],
  };

  const serialized = serializePosition(newState);
  newState.positionHistory = [...gameState.positionHistory, serialized];
  const { status, winner } = detectGameStatus(newState);
  newState.status = status;
  newState.winner = winner;

  return newState;
}

// ─── AI ──────────────────────────────────────────────────────────────────────

export function evaluateBoard(board: (Piece | null)[], color: Color): number {
  let score = 0;
  for (let i = 0; i < 64; i++) {
    const piece = board[i];
    if (!piece) continue;
    const val = PIECE_VALUES[piece.type] + pstBonus(piece, i);
    score += piece.color === color ? val : -val;
  }
  return score;
}

function minimax(
  gameState: GameState,
  depth: number,
  alpha: number,
  beta: number,
  aiColor: Color
): number {
  const { status } = gameState;
  if (status === 'checkmate') return gameState.turn === aiColor ? -1000000 : 1000000;
  if (status === 'stalemate' || status === 'draw') return 0;
  if (depth === 0) return evaluateBoard(gameState.board, aiColor);

  const moves = getAllLegalMoves(gameState.board, gameState.turn, gameState);
  if (moves.length === 0) return 0;

  const maximizing = gameState.turn === aiColor;

  if (maximizing) {
    let best = -Infinity;
    for (const move of moves) {
      let next = applyMove(gameState, move.from, move.to);
      if (next.pendingPromotion) next = applyPromotion(next, 'queen');
      const score = minimax(next, depth - 1, alpha, beta, aiColor);
      best = Math.max(best, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      let next = applyMove(gameState, move.from, move.to);
      if (next.pendingPromotion) next = applyPromotion(next, 'queen');
      const score = minimax(next, depth - 1, alpha, beta, aiColor);
      best = Math.min(best, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return best;
  }
}

export function getBestMove(gameState: GameState): { from: number; to: number } | null {
  const moves = getAllLegalMoves(gameState.board, gameState.turn, gameState);
  if (moves.length === 0) return null;

  let bestMove = moves[0];
  let bestScore = -Infinity;

  for (const move of moves) {
    let next = applyMove(gameState, move.from, move.to);
    if (next.pendingPromotion) next = applyPromotion(next, 'queen');
    const score = minimax(next, 2, -Infinity, Infinity, gameState.turn);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}
