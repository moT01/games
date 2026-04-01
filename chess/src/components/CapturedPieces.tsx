import './CapturedPieces.css';
import type { Color, Piece, PieceType } from '../gameLogic';
import { Piece as PieceDisplay } from './Piece';

interface Props {
  board: (Piece | null)[];
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

export function CapturedPieces({ board }: Props) {
  const capturedByWhite = getCaptured(board, 'black'); // white captured black pieces
  const capturedByBlack = getCaptured(board, 'white'); // black captured white pieces

  return (
    <div className="captured-pieces">
      <div className="captured-row">
        {capturedByWhite.flatMap(({ piece, count }) =>
          Array.from({ length: count }, (_, i) => (
            <PieceDisplay key={`${piece.type}-${i}`} piece={piece} />
          ))
        )}
      </div>
      <div className="captured-row">
        {capturedByBlack.flatMap(({ piece, count }) =>
          Array.from({ length: count }, (_, i) => (
            <PieceDisplay key={`${piece.type}-${i}`} piece={piece} />
          ))
        )}
      </div>
    </div>
  );
}
