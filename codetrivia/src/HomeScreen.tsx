import type { BestRecord } from './types';
import { ThemeToggle } from './ThemeToggle';
import { DonateButton } from './DonateButton';
import './HomeScreen.css';

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

interface Props {
  best: BestRecord | null;
  onStart: () => void;
}

export function HomeScreen({ best, onStart }: Props) {
  return (
    <div className="home-screen">
      <div className="home-screen__toolbar">
        <ThemeToggle />
        <DonateButton />
      </div>

      <div className="home-screen__hero">
        <p className="home-screen__subtitle">freeCodeCamp</p>
        <h1 className="home-screen__title">Code Trivia</h1>
        <p className="home-screen__tagline">Test your programming knowledge across 5 levels</p>
      </div>

      {best ? (
        <div className="home-screen__best">
          <div className="best-stat">
            <span className="best-stat__label">Best Score</span>
            <span className="best-stat__value">{best.score}</span>
          </div>
          <div className="best-stat__divider" />
          <div className="best-stat">
            <span className="best-stat__label">Best Time</span>
            <span className="best-stat__value">{formatTime(best.timeMs)}</span>
          </div>
        </div>
      ) : (
        <div className="home-screen__best home-screen__best--empty">
          <span className="best-empty">No records yet. Play to set a score!</span>
        </div>
      )}

      <button className="home-screen__start-btn" onClick={onStart} aria-label="Start Campaign">
        Start Campaign
      </button>
    </div>
  );
}
