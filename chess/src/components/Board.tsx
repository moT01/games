import './Board.css';
import type { Piece } from '../gameLogic';
import { Square } from './Square';

interface Props {
  board: (Piece | null)[];
  selectedSquare: number | null;
  legalHighlights: Set<number>;
  captureHighlights: Set<number>;
  checkKingIdx: number | null;
  lastMoveSet: Set<number>;
  onSquareClick: (index: number) => void;
  flipped: boolean;
}

export function Board({
  board,
  selectedSquare,
  legalHighlights,
  captureHighlights,
  checkKingIdx,
  lastMoveSet,
  onSquareClick,
  flipped,
}: Props) {
  const indices = Array.from({ length: 64 }, (_, i) => i);
  const displayOrder = flipped ? [...indices].reverse() : indices;

  return (
    <div className="board">
      {displayOrder.map((boardIdx, displayIdx) => {
        const row = Math.floor(boardIdx / 8);
        const col = boardIdx % 8;
        const isLight = (row + col) % 2 === 0;
        // Labels use actual board coordinates, not visual position
        const rank = String(8 - row);
        const file = 'abcdefgh'[col];
        const showRankLabel = displayIdx % 8 === 0;
        const showFileLabel = Math.floor(displayIdx / 8) === 7;
        return (
          <Square
            key={boardIdx}
            piece={board[boardIdx]}
            isLight={isLight}
            isSelected={selectedSquare === boardIdx}
            isLegalMove={legalHighlights.has(boardIdx)}
            isCaptureTarget={captureHighlights.has(boardIdx)}
            isInCheck={checkKingIdx === boardIdx}
            isLastMove={lastMoveSet.has(boardIdx)}
            rankLabel={showRankLabel ? rank : undefined}
            fileLabel={showFileLabel ? file : undefined}
            onClick={() => onSquareClick(boardIdx)}
          />
        );
      })}
    </div>
  );
}
