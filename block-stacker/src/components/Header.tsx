import './Header.css';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onHelp: () => void;
  onQuit?: () => void; // only shown on play screen
}

export default function Header({ theme, onToggleTheme, onHelp, onQuit }: HeaderProps) {
  return (
    <header className="header">
      <span className="header__title">Block Stacker</span>
      <div className="header__actions">
        <button
          className="header__btn"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
        <button
          className="header__btn"
          onClick={onHelp}
          aria-label="Help"
        >
          ?
        </button>
        {onQuit && (
          <button
            className="header__btn header__btn--quit"
            onClick={onQuit}
            aria-label="Quit game"
          >
            Quit
          </button>
        )}
      </div>
    </header>
  );
}
