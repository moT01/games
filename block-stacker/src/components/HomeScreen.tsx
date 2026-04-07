import type { StartSpeed, StartFill } from '../game/logic';
import './HomeScreen.css';

interface HomeScreenProps {
  bestScore: number;
  startSpeed: StartSpeed;
  startFill: StartFill;
  onSpeedChange: (s: StartSpeed) => void;
  onFillChange: (f: StartFill) => void;
  onStart: () => void;
}

export default function HomeScreen({
  bestScore, startSpeed, startFill, onSpeedChange, onFillChange, onStart,
}: HomeScreenProps) {
  return (
    <div className="home">
      <h1 className="home__title">Block Stacker</h1>
      <p className="home__best">Best score: <span>{bestScore}</span></p>

      <div className="home__options">
        <div className="home__option">
          <label htmlFor="speed-select">Starting Speed</label>
          <select
            id="speed-select"
            className="home__select"
            value={startSpeed}
            onChange={e => onSpeedChange(e.target.value as StartSpeed)}
            aria-label="Starting speed"
          >
            <option value="slow">Slow</option>
            <option value="medium">Medium</option>
            <option value="fast">Fast</option>
          </select>
        </div>

        <div className="home__option">
          <label htmlFor="fill-select">Starting Board</label>
          <select
            id="fill-select"
            className="home__select"
            value={startFill}
            onChange={e => onFillChange(e.target.value as StartFill)}
            aria-label="Starting board fill"
          >
            <option value="empty">Empty</option>
            <option value="light">Light fill (~25%)</option>
            <option value="medium">Medium fill (~50%)</option>
            <option value="heavy">Heavy fill (~75%)</option>
          </select>
        </div>
      </div>

      <div className="home__actions">
        <button className="btn--primary" onClick={onStart} aria-label="Start game">
          Start
        </button>
        <a
          className="btn--donate"
          href="https://www.freecodecamp.org/donate"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Donate to freeCodeCamp"
        >
          Donate to freeCodeCamp ♥
        </a>
      </div>
    </div>
  );
}
