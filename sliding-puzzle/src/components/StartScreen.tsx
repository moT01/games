import './StartScreen.css';

type Props = {
  size: number;
  rowShift: boolean;
  onSizeChange: (size: number) => void;
  onRowShiftChange: (val: boolean) => void;
  onNewGame: () => void;
};

export function StartScreen({ size, rowShift, onSizeChange, onRowShiftChange, onNewGame }: Props) {
  return (
    <div className="start-screen">
      <h1 className="start-title">Sliding Puzzle</h1>

      <div className="start-setting">
        <label className="start-label">Grid Size</label>
        <div className="size-buttons">
          {([3, 4, 5] as const).map((s) => (
            <button
              key={s}
              className={`size-btn${size === s ? ' size-btn--active' : ''}`}
              onClick={() => onSizeChange(s)}
            >
              {s}×{s}
            </button>
          ))}
        </div>
      </div>

      <div className="start-setting">
        <label className="start-label">
          <input
            type="checkbox"
            checked={rowShift}
            onChange={(e) => onRowShiftChange(e.target.checked)}
          />
          Row/Column Shift
        </label>
        <p className="start-hint">Click any tile in the same row or column as the blank to slide the whole line.</p>
      </div>

      <button className="new-game-btn" onClick={onNewGame}>
        New Game
      </button>
    </div>
  );
}
