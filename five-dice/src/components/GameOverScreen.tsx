import './GameOverScreen.css'
import type { CategoryKey } from '../gameLogic'
import { calcGrandTotal } from '../gameLogic'

interface Props {
  scores: Partial<Record<CategoryKey, number>>
  fiveOfAKindBonus: number
  highScore: number | null
  isNewHighScore: boolean
  onPlayAgain: () => void
  onHome: () => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export default function GameOverScreen({
  scores, fiveOfAKindBonus, highScore, isNewHighScore,
  onPlayAgain, onHome, theme, onToggleTheme,
}: Props) {
  const total = calcGrandTotal(scores, fiveOfAKindBonus)

  return (
    <div className="gameover-screen">
      <div className="gameover-panel">
        <h2 className="gameover-title">Game Over</h2>

        <div className="gameover-score">
          <span className="gameover-score-label">Score</span>
          <span className="gameover-score-value">{total}</span>
        </div>

        {isNewHighScore && (
          <div className="gameover-new-best">New best!</div>
        )}

        {highScore !== null && !isNewHighScore && (
          <div className="gameover-best">
            <span className="gameover-best-label">Best</span>
            <span className="gameover-best-value">{highScore}</span>
          </div>
        )}

        <div className="gameover-actions">
          <button className="btn btn-primary" onClick={onPlayAgain}>Play Again</button>
          <button className="btn btn-secondary" onClick={onHome}>Home</button>
        </div>

        <div className="gameover-footer">
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
    </div>
  )
}
