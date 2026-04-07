import './ScorePanel.css';

interface ScorePanelProps {
  score: number;
  level: number;
  linesCleared: number;
  levelUp?: boolean;
}

export default function ScorePanel({ score, level, linesCleared, levelUp = false }: ScorePanelProps) {
  return (
    <div className="score-panel">
      <div className="score-panel__item">
        <span className="score-panel__label">Score</span>
        <span className="score-panel__value" aria-live="polite" aria-atomic="true">{score}</span>
      </div>
      <div className="score-panel__item">
        <span className="score-panel__label">Level</span>
        <span className={`score-panel__value${levelUp ? ' level-up' : ''}`} aria-live="polite" aria-atomic="true">{level}</span>
      </div>
      <div className="score-panel__item">
        <span className="score-panel__label">Lines</span>
        <span className="score-panel__value" aria-live="polite" aria-atomic="true">{linesCleared}</span>
      </div>
    </div>
  );
}
