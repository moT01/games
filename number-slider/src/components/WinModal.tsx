import './WinModal.css';
import type { BestScore } from '../App';

interface WinModalProps {
  moves: number;
  seconds: number;
  previousBest: BestScore | undefined;
  onPlayAgain: () => void;
  onHome: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function WinModal({ moves, seconds, previousBest, onPlayAgain, onHome }: WinModalProps) {
  const isNewBest =
    !previousBest ||
    moves < previousBest.moves ||
    (moves === previousBest.moves && seconds < previousBest.seconds);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Puzzle solved">
      <div className="modal-card win-modal">
        <h2 className="win-modal__title">Puzzle Solved!</h2>
        {isNewBest && <p className="win-modal__new-best">New best!</p>}
        <div className="win-modal__stats">
          <div className="win-modal__stat">
            <span className="win-modal__stat-label">Moves</span>
            <span className="win-modal__stat-value">{moves}</span>
          </div>
          <div className="win-modal__stat">
            <span className="win-modal__stat-label">Time</span>
            <span className="win-modal__stat-value">{formatTime(seconds)}</span>
          </div>
        </div>
        {previousBest && !isNewBest && (
          <div className="win-modal__best">
            <span className="win-modal__best-label">Best</span>
            <span className="win-modal__best-value">
              {previousBest.moves} moves · {formatTime(previousBest.seconds)}
            </span>
          </div>
        )}
        <div className="win-modal__actions">
          <button className="btn btn-primary" onClick={onPlayAgain}>
            Play Again
          </button>
          <button className="btn btn-secondary" onClick={onHome}>
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
