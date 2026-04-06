import './Board.css';
import { Tile } from './Tile';

type Props = {
  tiles: number[];
  size: number;
  validIndices: number[];
  onTileClick: (index: number) => void;
};

export function Board({ tiles, size, validIndices, onTileClick }: Props) {
  return (
    <div
      className="board"
      style={{ '--board-size': size } as React.CSSProperties}
    >
      {tiles.map((value, index) => (
        <Tile
          key={index}
          value={value}
          isValid={validIndices.includes(index)}
          onClick={() => onTileClick(index)}
        />
      ))}
    </div>
  );
}
