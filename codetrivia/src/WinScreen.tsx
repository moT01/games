import type { BestRecord } from './types';
import { DonateButton } from './DonateButton';
import './WinScreen.css';

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

interface Props {
  totalScore: number;
  totalElapsedMs: number;
  best: BestRecord | null;
  isNewBest: boolean;
  onPlayAgain: () => void;
}

export function WinScreen({ totalScore, totalElapsedMs, best, isNewBest, onPlayAgain }: Props) {
  return (
    <div className="win-screen">
      <div className="win-screen__badge">Campaign Complete!</div>

      {isNewBest && (
        <div className="win-screen__new-best">New Best Record!</div>
      )}

      <div className="win-screen__stats">
        <div className="win-stat">
          <span className="win-stat__label">Total Score</span>
          <span className="win-stat__value">{totalScore}</span>
        </div>
        <div className="win-stat__divider" />
        <div className="win-stat">
          <span className="win-stat__label">Total Time</span>
          <span className="win-stat__value">{formatTime(totalElapsedMs)}</span>
        </div>
      </div>

      {best && (
        <div className="win-screen__best-block">
          <p className="win-best__heading">Best Record</p>
          <div className="win-best__row">
            <span className="win-best__label">Score</span>
            <span className="win-best__value">{best.score}</span>
            <span className="win-best__sep">|</span>
            <span className="win-best__label">Time</span>
            <span className="win-best__value">{formatTime(best.timeMs)}</span>
          </div>
        </div>
      )}

      <div className="win-screen__actions">
        <button className="win-screen__btn" onClick={onPlayAgain} aria-label="Play Again">
          Play Again
        </button>
        <DonateButton />
      </div>
    </div>
  );
}
