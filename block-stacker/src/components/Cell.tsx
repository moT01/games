import './Cell.css';

interface CellProps {
  color: number;   // 0=empty, 1–12=piece color
  flash?: boolean;
  active?: boolean;
}

export default function Cell({ color, flash = false, active = false }: CellProps) {
  return (
    <div
      role="gridcell"
      aria-label={color === 0 ? 'empty' : active ? 'active' : `piece ${color}`}
      className={`cell${flash ? ' flash' : ''}`}
      data-color={color > 0 ? color : undefined}
      data-active={active ? 'true' : undefined}
    />
  );
}
