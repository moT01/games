import type { BestRecord } from './types';
import { LEVEL_CONFIG } from './gameLogic';
import { DonateButton } from './DonateButton';
import './GameOver.css';

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const PHRASES: Record<number, string> = {
  1: 'Made it to Boot Camp.',
  2: 'Made it to Junior Dev!',
  3: 'Made it to Mid-Level!',
  4: 'Made it to Senior Dev!',
  5: 'Almost a Principal!',
};

interface Props {
  level: number;
  totalScore: number;
  totalElapsedMs: number;
  best: BestRecord | null;
  onTryAgain: () => void;
}

export function GameOver({ level, totalScore, totalElapsedMs, best, onTryAgain }: Props) {
  const flavorName = LEVEL_CONFIG[level - 1].flavorName;

  return (
    <div className="game-over">
      <div className="game-over__badge">Game Over</div>

      <p className="game-over__phrase">{PHRASES[level] ?? `Reached Level ${level}`}</p>

      <div className="game-over__level-pill">
        Level {level} — {flavorName}
      </div>

      <div className="game-over__stats">
        <div className="go-stat">
          <span className="go-stat__label">Score</span>
          <span className="go-stat__value">{totalScore}</span>
        </div>
        <div className="go-stat__divider" />
        <div className="go-stat">
          <span className="go-stat__label">Time</span>
          <span className="go-stat__value">{formatTime(totalElapsedMs)}</span>
        </div>
      </div>

      {best && (
        <div className="game-over__best">
          <span className="go-best__label">Best Score</span>
          <span className="go-best__value">{best.score}</span>
          <span className="go-best__sep">|</span>
          <span className="go-best__label">Best Time</span>
          <span className="go-best__value">{formatTime(best.timeMs)}</span>
        </div>
      )}

      <div className="game-over__actions">
        <button className="game-over__btn" onClick={onTryAgain} aria-label="Try Again">
          Try Again
        </button>
        <DonateButton />
      </div>
    </div>
  );
}
