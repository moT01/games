import './Board.css';
import Tile from './Tile';
import { getAdjacentToBlank } from '../game/logic';

interface BoardProps {
  tiles: number[];
  size: number;
  onTileClick: (index: number) => void;
}

const GAP = 8; // px, matches --space-2

export default function Board({ tiles, size, onTileClick }: BoardProps) {
  const adjacent = getAdjacentToBlank(tiles, size);

  return (
    <div className="board">
      {tiles.map((value, index) => {
        const row = Math.floor(index / size);
        const col = index % size;
        // Each tile step = tileWidth + gap = (100% - gap*(size-1)) / size + gap
        // = 100%/size - gap*(size-1)/size + gap = 100%/size + gap/size = (100% + gap) / size
        // So position of col = col * ((100% + gap) / size) — but simpler:
        // x = col * (tileWidth + gap) = col * calc((100% - gap*(size-1)) / size + gap)
        const step = `calc((100% - ${GAP * (size - 1)}px) / ${size} + ${GAP}px)`;
        const x = `calc(${col} * ${step})`;
        const y = `calc(${row} * ${step})`;

        return (
          <Tile
            key={value === 0 ? 'blank' : value}
            value={value}
            isAdjacent={adjacent.includes(index)}
            x={x}
            y={y}
            size={size}
            gap={GAP}
            onClick={() => onTileClick(index)}
          />
        );
      })}
    </div>
  );
}
