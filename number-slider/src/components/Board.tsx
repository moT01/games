import './Board.css';
import { Tile } from './Tile';

interface BoardProps {
  tiles: number[];
  n: number;
  validMoveIndices: number[];
  onTileClick: (index: number) => void;
}

export function Board({ tiles, n, validMoveIndices, onTileClick }: BoardProps) {
  return (
    <div
      className="board"
      style={{ '--board-n': n } as React.CSSProperties}
      aria-label="Puzzle board"
    >
      {tiles.map((value, index) => (
        <Tile
          key={index}
          value={value}
          isBlank={value === 0}
          isMovable={validMoveIndices.includes(index)}
          onClick={() => onTileClick(index)}
        />
      ))}
    </div>
  );
}
