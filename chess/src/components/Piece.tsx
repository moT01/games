import type { Piece as PieceType } from '../gameLogic';

const SYMBOLS: Record<string, string> = {
  'white-king':   '♚',
  'white-queen':  '♛',
  'white-rook':   '♜',
  'white-bishop': '♝',
  'white-knight': '♞',
  'white-pawn':   '♟',
  'black-king':   '♚',
  'black-queen':  '♛',
  'black-rook':   '♜',
  'black-bishop': '♝',
  'black-knight': '♞',
  'black-pawn':   '♟',
};

interface Props {
  piece: PieceType;
}

export function Piece({ piece }: Props) {
  const symbol = SYMBOLS[`${piece.color}-${piece.type}`];
  return <span className={`piece piece-${piece.color}`}>{symbol}</span>;
}
