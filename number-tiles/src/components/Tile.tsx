import './Tile.css';

interface TileProps {
  value: number;
  isAdjacent: boolean;
  x: string;
  y: string;
  size: number;
  gap: number;
  onClick: () => void;
}

export default function Tile({ value, isAdjacent, x, y, size, gap, onClick }: TileProps) {
  const style: React.CSSProperties = {
    position: 'absolute',
    width: `calc((100% - ${gap * (size - 1)}px) / ${size})`,
    height: `calc((100% - ${gap * (size - 1)}px) / ${size})`,
    transform: `translate(${x}, ${y})`,
    transition: 'transform 150ms ease',
  };

  if (value === 0) {
    return <div className="tile tile--blank" style={style} />;
  }

  return (
    <div
      className={`tile${isAdjacent ? ' tile--adjacent' : ''}`}
      style={style}
      onClick={onClick}
    >
      {value}
    </div>
  );
}
