import './HomeScreen.css'
import HelpModal from './HelpModal'

interface Props {
  highScore: number | null
  onStart: () => void
  onResume?: () => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onHelp: () => void
  helpOpen: boolean
  onCloseHelp: () => void
}

export default function HomeScreen({
  highScore, onStart, onResume,
  theme, onToggleTheme,
  onHelp, helpOpen, onCloseHelp,
}: Props) {
  return (
    <div className="home-screen">
      <div className="home-menu">
        <h1 className="home-title">Five Dice</h1>

        <div className="home-highscore">
          {highScore !== null
            ? <><span className="home-highscore-label">High Score</span><span className="home-highscore-value">{highScore}</span></>
            : <span className="home-highscore-label">No high score yet</span>
          }
        </div>

        <div className="home-actions">
          {onResume && (
            <button className="btn btn-secondary" onClick={onResume}>
              Resume Game
            </button>
          )}
          <button className="btn btn-primary" onClick={onStart}>
            {onResume ? 'New Game' : 'Play'}
          </button>
        </div>

        <div className="home-footer">
          <button className="btn-icon" onClick={onHelp} aria-label="Help and rules">?</button>
          <button className="btn-icon" onClick={onToggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? '☾' : '☀'}
          </button>
          <a
            className="btn-icon"
            href="https://www.freecodecamp.org/donate"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Donate"
          >
            ♥
          </a>
        </div>
      </div>

      {helpOpen && <HelpModal onClose={onCloseHelp} />}
    </div>
  )
}
