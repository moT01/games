import './HomeScreen.css';

type HomeScreenProps = {
  bestScore: number;
  hasSavedGame: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onNew: () => void;
  onResume: () => void;
};

export function HomeScreen({ bestScore, hasSavedGame, theme, onToggleTheme, onNew, onResume }: HomeScreenProps) {
  return (
    <div className="home-screen">
      <div className="home-screen__utility">
        <a
          className="home-screen__util-btn"
          href="https://www.freecodecamp.org/donate"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Donate to freeCodeCamp"
        >
          Donate
        </a>
        <button
          className="home-screen__util-btn"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme === 'dark' ? '☀' : '🌙'}
        </button>
      </div>

      <div className="home-screen__card">
        <h1 className="home-screen__title">Five Dice</h1>
        <p className="home-screen__subtitle">A Yahtzee-style dice game</p>

        {bestScore > 0 && (
          <p className="home-screen__best">Best score: <span>{bestScore}</span></p>
        )}

        <div className="home-screen__buttons">
          {hasSavedGame && (
            <button
              className="home-screen__btn home-screen__btn--primary"
              onClick={onResume}
              aria-label="Resume saved game"
            >
              Resume Game
            </button>
          )}
          <button
            className={`home-screen__btn ${hasSavedGame ? 'home-screen__btn--secondary' : 'home-screen__btn--primary'}`}
            onClick={onNew}
            aria-label="Start a new game"
          >
            New Game
          </button>
        </div>
      </div>
    </div>
  );
}
