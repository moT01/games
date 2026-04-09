import type { HeartsRecord } from './gameLogic'
import './HomeScreen.css'

interface Props {
  record: HeartsRecord
  hasResume: boolean
  theme: 'dark' | 'light'
  onThemeToggle: () => void
  onStart: () => void
  onResume: () => void
}

export default function HomeScreen({ record, hasResume, theme, onThemeToggle, onStart, onResume }: Props) {
  return (
    <div className="home-screen">
      <div className="home-screen__topbar">
        <button className="btn btn--icon" onClick={onThemeToggle} aria-label="Toggle theme">
          {theme === 'dark' ? '☀' : '☽'}
        </button>
      </div>

      <div className="home-screen__card">
        <div className="home-screen__suits" aria-hidden="true">
          <span className="red">♥</span>
          <span className="black">♠</span>
          <span className="red">♦</span>
          <span className="black">♣</span>
        </div>
        <h1 className="home-screen__title">Hearts</h1>
        <p className="home-screen__subtitle">Avoid points. Shoot the moon.</p>

        <div className="home-screen__record" aria-label="Your record">
          <div className="home-screen__record-item">
            <span className="home-screen__record-val win">{record.wins}</span>
            <span className="home-screen__record-label">Wins</span>
          </div>
          <div className="home-screen__record-divider" aria-hidden="true" />
          <div className="home-screen__record-item">
            <span className="home-screen__record-val loss">{record.losses}</span>
            <span className="home-screen__record-label">Losses</span>
          </div>
          {record.bestScore !== null && (
            <>
              <div className="home-screen__record-divider" aria-hidden="true" />
              <div className="home-screen__record-item">
                <span className="home-screen__record-val accent">{record.bestScore}</span>
                <span className="home-screen__record-label">Best Score</span>
              </div>
            </>
          )}
        </div>

        <div className="home-screen__buttons">
          {hasResume && (
            <button className="btn btn--secondary" onClick={onResume}>Resume Game</button>
          )}
          <button className="btn btn--primary" onClick={onStart} data-testid="start-button">
            {hasResume ? 'New Game' : 'Start Game'}
          </button>
        </div>

        <a
          className="home-screen__donate"
          href="https://www.freecodecamp.org/donate"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Donate to freeCodeCamp"
        >
          Support freeCodeCamp
        </a>
      </div>
    </div>
  )
}
