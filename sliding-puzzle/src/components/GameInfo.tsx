import './GameInfo.css';

type Props = {
  moves: number;
  elapsed: number;
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function GameInfo({ moves, elapsed }: Props) {
  return (
    <div className="game-info">
      <div className="game-info-item">
        <span className="game-info-label">Moves</span>
        <span className="game-info-value">{moves}</span>
      </div>
      <div className="game-info-item">
        <span className="game-info-label">Time</span>
        <span className="game-info-value">{formatTime(elapsed)}</span>
      </div>
    </div>
  );
}
