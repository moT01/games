import './LevelResult.css';

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

interface Props {
  correct: number;
  total: number;
  passed: boolean;
  levelElapsedMs: number;
  totalElapsedMs: number;
  level: number;
  onContinue: () => void;
}

export function LevelResult({ correct, total, passed, levelElapsedMs, totalElapsedMs, level, onContinue }: Props) {
  const isLastLevel = level === 5;
  const btnLabel = passed ? (isLastLevel ? 'See Results' : 'Next Level') : 'Game Over';

  return (
    <div className="level-result">
      <div className={`level-result__badge ${passed ? 'level-result__badge--pass' : 'level-result__badge--fail'}`}>
        {passed ? 'Level Passed' : 'Level Failed'}
      </div>

      <div className="level-result__score-display">
        <span className="level-result__fraction">{correct}<span className="level-result__sep">/</span>{total}</span>
        <span className="level-result__label">correct</span>
      </div>

      <p className={`level-result__message ${passed ? 'level-result__message--pass' : 'level-result__message--fail'}`}>
        {passed ? 'You cleared this level!' : `Need ${THRESHOLDS[level - 1]} to pass. Better luck next time.`}
      </p>

      <div className="level-result__times">
        <div className="time-stat">
          <span className="time-stat__label">Level Time</span>
          <span className="time-stat__value">{formatTime(levelElapsedMs)}</span>
        </div>
        <div className="time-stat__divider" />
        <div className="time-stat">
          <span className="time-stat__label">Total Time</span>
          <span className="time-stat__value">{formatTime(totalElapsedMs + levelElapsedMs)}</span>
        </div>
      </div>

      <button
        className={`level-result__btn ${passed ? 'level-result__btn--pass' : 'level-result__btn--fail'}`}
        onClick={onContinue}
        aria-label={btnLabel}
      >
        {btnLabel}
      </button>
    </div>
  );
}

const THRESHOLDS = [3, 4, 6, 7, 9];
