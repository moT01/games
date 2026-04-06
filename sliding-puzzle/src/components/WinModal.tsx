import './WinModal.css';

type Props = {
  moves: number;
  elapsed: number;
  onPlayAgain: () => void;
  onChangeSize: () => void;
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function WinModal({ moves, elapsed, onPlayAgain, onChangeSize }: Props) {
  return (
    <div className="win-overlay">
      <div className="win-modal">
        <h2 className="win-title">Puzzle Solved!</h2>
        <div className="win-stats">
          <div className="win-stat">
            <span className="win-stat-label">Moves</span>
            <span className="win-stat-value">{moves}</span>
          </div>
          <div className="win-stat">
            <span className="win-stat-label">Time</span>
            <span className="win-stat-value">{formatTime(elapsed)}</span>
          </div>
        </div>
        <div className="win-buttons">
          <button className="win-btn win-btn--primary" onClick={onPlayAgain}>
            Play Again
          </button>
          <button className="win-btn win-btn--secondary" onClick={onChangeSize}>
            Change Size
          </button>
        </div>
      </div>
    </div>
  );
}
