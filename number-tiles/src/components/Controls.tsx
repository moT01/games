const SIZES = [3, 4, 5, 6] as const;

interface ControlsProps {
  size: number;
  onSizeChange: (size: number) => void;
  onNewGame: () => void;
}

export default function Controls({ size, onSizeChange, onNewGame }: ControlsProps) {
  return (
    <div className="controls">
      <div className="controls__sizes">
        {SIZES.map(s => (
          <button
            key={s}
            className={`controls__size-btn${s === size ? ' controls__size-btn--active' : ''}`}
            onClick={() => onSizeChange(s)}
          >
            {s}×{s}
          </button>
        ))}
      </div>
      <button className="controls__new-game" onClick={onNewGame}>
        New Game
      </button>
    </div>
  );
}
