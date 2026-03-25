import './WinScreen.css';
import type { SessionStats } from '../App';

type Props = {
  baseScore: number;
  timeBonus: number;
  sessionStats: SessionStats;
  onPlayAgain: () => void;
};

export function WinScreen({ baseScore, timeBonus, sessionStats, onPlayAgain }: Props) {
  const totalScore = baseScore + timeBonus;

  return (
    <div className="win-overlay">
      <div className="win-panel">
        <h2 className="win-title">You Win!</h2>
        <div className="win-scores">
          <div className="win-score-row">
            <span className="win-score-label">Base Score</span>
            <span className="win-score-value">{baseScore}</span>
          </div>
          <div className="win-score-row">
            <span className="win-score-label">Time Bonus</span>
            <span className="win-score-value">+{timeBonus}</span>
          </div>
          <div className="win-score-row win-score-total">
            <span className="win-score-label">Total</span>
            <span className="win-score-value">{totalScore}</span>
          </div>
        </div>
        <div className="win-session">
          W–L: {sessionStats.wins}–{sessionStats.losses}
        </div>
        <button className="btn btn-primary" onClick={onPlayAgain}>
          Play Again
        </button>
      </div>
    </div>
  );
}
