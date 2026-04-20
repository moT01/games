import './Square.css';
import type { Piece as PieceType } from '../gameLogic';
import { Piece } from './Piece';

interface Props {
  piece: PieceType | null;
  isLight: boolean;
  isSelected: boolean;
  isLegalMove: boolean;
  isCaptureTarget: boolean;
  isInCheck: boolean;
  isLastMove: boolean;
  rankLabel?: string;
  fileLabel?: string;
  onClick: () => void;
}

export function Square({
  piece,
  isLight,
  isSelected,
  isLegalMove,
  isCaptureTarget,
  isInCheck,
  isLastMove,
  rankLabel,
  fileLabel,
  onClick,
}: Props) {
  const classes = [
    'square',
    isLight ? 'light' : 'dark',
    isSelected ? 'selected' : '',
    isCaptureTarget ? 'capture-target' : '',
    isInCheck ? 'in-check' : '',
    isLastMove ? 'last-move' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} onClick={onClick}>
      {rankLabel && <span className="rank-label">{rankLabel}</span>}
      {isLegalMove && <div className="move-dot" />}
      {piece && <Piece piece={piece} />}
      {isCaptureTarget && <div className="move-dot" />}
      {fileLabel && <span className="file-label">{fileLabel}</span>}
    </div>
  );
}
