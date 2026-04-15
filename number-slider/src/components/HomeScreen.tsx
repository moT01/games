import { useState } from 'react';
import './HomeScreen.css';
import type { Mode, BestScores } from '../App';
import { HelpModal } from './HelpModal';

interface HomeScreenProps {
  bestScores: BestScores;
  theme: 'dark' | 'light';
  hasSavedGame: boolean;
  savedGameMode: Mode | undefined;
  defaultMode: Mode;
  onPlay: (mode: Mode) => void;
  onResume: () => void;
  onToggleTheme: () => void;
}

const MODES: Mode[] = ['3x3', '4x4', '5x5'];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function HomeScreen({
  bestScores,
  theme,
  hasSavedGame,
  savedGameMode,
  defaultMode,
  onPlay,
  onResume,
  onToggleTheme,
}: HomeScreenProps) {
  const [selectedMode, setSelectedMode] = useState<Mode>(defaultMode);
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="home-screen">
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      <div className="home-screen__card">
      <div className="home-screen__top-bar">
        <button
          className="btn btn-secondary home-screen__icon-btn"
          onClick={() => setShowHelp(true)}
          aria-label="Help"
        >
          ?
        </button>
        <button
          className="btn btn-secondary home-screen__icon-btn"
          onClick={onToggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <a
          className="btn btn-secondary home-screen__icon-btn"
          href="https://www.freecodecamp.org/donate"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Donate"
        >
          ♥
        </a>
      </div>

      <h1 className="home-screen__title">Number Slider</h1>
      <p className="home-screen__subtitle">The sliding tile puzzle</p>

      <div className="home-screen__mode-select">
        <p className="home-screen__label">Select mode</p>
        <div className="home-screen__mode-buttons">
          {MODES.map(mode => (
            <button
              key={mode}
              className={`btn home-screen__mode-btn${selectedMode === mode ? ' home-screen__mode-btn--active' : ' btn-secondary'}`}
              onClick={() => setSelectedMode(mode)}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="home-screen__best-scores">
        <p className="home-screen__label">Best scores</p>
        <div className="home-screen__scores-grid">
          {MODES.map(mode => {
            const best = bestScores[mode];
            return (
              <div key={mode} className="home-screen__score-card">
                <span className="home-screen__score-mode">{mode}</span>
                <span className="home-screen__score-moves">
                  {best ? `${best.moves} moves` : '–'}
                </span>
                <span className="home-screen__score-time">
                  {best ? formatTime(best.seconds) : '–'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="home-screen__actions">
        <button className="btn btn-primary home-screen__play-btn" onClick={() => onPlay(selectedMode)}>
          Play
        </button>
        {hasSavedGame && (
          <button className="btn btn-secondary" onClick={onResume}>
            Resume {savedGameMode}
          </button>
        )}
      </div>
      </div>
    </div>
  );
}
