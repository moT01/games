import './CapturedPieces.css';
import type { Color, Piece, PieceType } from '../gameLogic';
import { Piece as PieceDisplay } from './Piece';

interface Props {
  board: (Piece | null)[];
  side: 'light' | 'dark';
}

const PIECE_ORDER: PieceType[] = ['queen', 'rook', 'bishop', 'knight', 'pawn'];

const STARTING_COUNTS: Partial<Record<string, number>> = {
  'white-queen': 1, 'white-rook': 2, 'white-bishop': 2, 'white-knight': 2, 'white-pawn': 8,
  'black-queen': 1, 'black-rook': 2, 'black-bishop': 2, 'black-knight': 2, 'black-pawn': 8,
};

function getCaptured(board: (Piece | null)[], opponentColor: Color): { piece: Piece; count: number }[] {
  const onBoard: Partial<Record<string, number>> = {};
  for (const p of board) {
    if (!p) continue;
    const key = `${p.color}-${p.type}`;
    onBoard[key] = (onBoard[key] ?? 0) + 1;
  }

  return PIECE_ORDER.flatMap(type => {
    const key = `${opponentColor}-${type}`;
    const captured = (STARTING_COUNTS[key] ?? 0) - (onBoard[key] ?? 0);
    if (captured <= 0) return [];
    return [{ piece: { type, color: opponentColor } as Piece, count: captured }];
  });
}

export function CapturedPieces({ board, side }: Props) {
  // light side shows white pieces captured by dark (above board, near dark's area)
  // dark side shows black pieces captured by white (below board, near light's area)
  const opponentColor = side === 'light' ? 'white' : 'black';
  const pieces = getCaptured(board, opponentColor);

  return (
    <div className="captured-row">
      {pieces.flatMap(({ piece, count }) =>
        Array.from({ length: count }, (_, i) => (
          <PieceDisplay key={`${piece.type}-${i}`} piece={piece} />
        ))
      )}
    </div>
  );
}
