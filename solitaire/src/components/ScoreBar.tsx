import './ScoreBar.css';
import type { SessionStats } from '../App';

type Props = {
  score: number;
  drawMode: 1 | 3;
  sessionStats: SessionStats;
  onNewGame: () => void;
};

export function ScoreBar({ score, drawMode, sessionStats, onNewGame }: Props) {
  return (
    <div className="score-bar">
      <span className="score-bar-item">
        <span className="score-bar-label">Score</span>
        <span className="score-bar-value">{score}</span>
      </span>
      <span className="score-bar-item">
        <span className="score-bar-label">Mode</span>
        <span className="score-bar-value">Draw {drawMode}</span>
      </span>
      <span className="score-bar-item">
        <span className="score-bar-label">W–L</span>
        <span className="score-bar-value">{sessionStats.wins}–{sessionStats.losses}</span>
      </span>
      <button className="btn btn-secondary score-bar-btn" onClick={onNewGame}>
        New Game
      </button>
    </div>
  );
}
