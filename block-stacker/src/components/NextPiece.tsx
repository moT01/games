import type { PieceType } from '../game/logic';
import { PIECES } from '../game/logic';
import './NextPiece.css';

interface NextPieceProps {
  type: PieceType;
}

export default function NextPiece({ type }: NextPieceProps) {
  const def = PIECES[type];
  const cells = def.base;
  const maxRow = Math.max(...cells.map(([r]) => r));
  const maxCol = Math.max(...cells.map(([, c]) => c));
  const rows = maxRow + 1;
  const cols = maxCol + 1;
  const color = def.color;

  const filled = new Set(cells.map(([r, c]) => `${r},${c}`));

  const grid: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r},${c}`;
      const cellColor = filled.has(key) ? color : 0;
      grid.push(
        <div
          key={key}
          className="next-piece__cell"
          data-color={cellColor > 0 ? cellColor : undefined}
        />
      );
    }
  }

  return (
    <div className="next-piece">
      <span className="next-piece__label">Next</span>
      <div
        className="next-piece__grid"
        style={{ gridTemplateColumns: `repeat(${cols}, 18px)` }}
        aria-label={`Next piece: ${type}`}
      >
        {grid}
      </div>
    </div>
  );
}
