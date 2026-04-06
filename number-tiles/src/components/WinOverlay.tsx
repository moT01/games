import './WinOverlay.css';

interface WinOverlayProps {
  moves: number;
  elapsed: number;
  onPlayAgain: () => void;
}

function formatTime(seconds: number): string {
  const mm = Math.floor(seconds / 60).toString().padStart(2, '0');
  const ss = (seconds % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

export default function WinOverlay({ moves, elapsed, onPlayAgain }: WinOverlayProps) {
  return (
    <div className="win-overlay">
      <div className="win-overlay__card">
        <h2 className="win-overlay__title">Solved!</h2>
        <p className="win-overlay__stat">Moves: <strong>{moves}</strong></p>
        <p className="win-overlay__stat">Time: <strong>{formatTime(elapsed)}</strong></p>
        <button className="win-overlay__btn" onClick={onPlayAgain}>
          Play Again
        </button>
      </div>
    </div>
  );
}
