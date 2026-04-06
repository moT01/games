interface ScoreBarProps {
  moves: number;
  elapsed: number;
}

function formatTime(seconds: number): string {
  const mm = Math.floor(seconds / 60).toString().padStart(2, '0');
  const ss = (seconds % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

export default function ScoreBar({ moves, elapsed }: ScoreBarProps) {
  return (
    <div className="score-bar">
      <div className="score-bar__item">
        <span className="score-bar__label">Moves</span>
        <span className="score-bar__value">{moves}</span>
      </div>
      <div className="score-bar__item">
        <span className="score-bar__label">Time</span>
        <span className="score-bar__value">{formatTime(elapsed)}</span>
      </div>
    </div>
  );
}
