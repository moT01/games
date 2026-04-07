import { useMemo } from 'react';
import type { Board as BoardType, ActivePiece } from '../game/logic';
import { getCells, PIECES } from '../game/logic';
import Cell from './Cell';
import './Board.css';

interface BoardProps {
  board: BoardType;
  active: ActivePiece | null;
  flashRows: number[];
}

export default function Board({ board, active, flashRows }: BoardProps) {
  const activeCells = useMemo(() => {
    if (!active) return new Set<string>();
    const cells = getCells(active);
    return new Set(cells.map(([r, c]) => `${r},${c}`));
  }, [active]);

  const activeColor = active ? PIECES[active.type].color : 0;
  const flashSet = useMemo(() => new Set(flashRows), [flashRows]);

  const rows: React.ReactNode[] = [];
  for (let r = 0; r < 20; r++) {
    const cells: React.ReactNode[] = [];
    const isFlashRow = flashSet.has(r);
    for (let c = 0; c < 12; c++) {
      const key = `${r},${c}`;
      const isActive = activeCells.has(key);
      const color = isActive ? activeColor : board[r][c];
      cells.push(
        <Cell
          key={key}
          color={color}
          flash={isFlashRow}
          active={isActive}
        />
      );
    }
    rows.push(
      <div key={r} role="row" style={{ display: 'contents' }}>
        {cells}
      </div>
    );
  }

  return (
    <div
      role="grid"
      aria-label="Block Stacker board"
      className="board"
    >
      {rows}
    </div>
  );
}
