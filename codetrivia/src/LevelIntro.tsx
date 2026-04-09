import { LEVEL_CONFIG } from './gameLogic';
import './LevelIntro.css';

interface Props {
  level: number;
  onBegin: () => void;
}

export function LevelIntro({ level, onBegin }: Props) {
  const config = LEVEL_CONFIG[level - 1];

  return (
    <div className="level-intro">
      <div className="level-intro__badge">Level {level}</div>
      <h2 className="level-intro__name">{config.flavorName}</h2>

      <div className="level-intro__stats">
        <div className="level-stat">
          <span className="level-stat__value">{config.questionCount}</span>
          <span className="level-stat__label">Questions</span>
        </div>
        <div className="level-stat__divider" />
        <div className="level-stat">
          <span className="level-stat__value">{config.threshold}</span>
          <span className="level-stat__label">To Pass</span>
        </div>
      </div>

      <p className="level-intro__threshold">
        Need {config.threshold} of {config.questionCount} correct to advance
      </p>

      <button className="level-intro__begin-btn" onClick={onBegin} aria-label="Begin level">
        Begin
      </button>
    </div>
  );
}
