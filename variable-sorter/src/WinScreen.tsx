import './WinScreen.css'
import type { Language, PersonalBests } from './gameLogic'
import { formatTime } from './gameLogic'

interface Props {
  language: Language
  variableCount: 10 | 20 | 30
  endTime: number
  startTime: number
  personalBests: PersonalBests
  onPlayAgain: () => void
  onChangeSettings: () => void
}

const LANG_LABELS: Record<Language, string> = { javascript: 'JavaScript', python: 'Python' }

export default function WinScreen({
  language,
  variableCount,
  endTime,
  startTime,
  personalBests,
  onPlayAgain,
  onChangeSettings,
}: Props) {
  const elapsed = endTime - startTime
  const best = personalBests[language][variableCount]
  const isNewBest = best !== null && best === elapsed

  return (
    <div className="win-screen" role="main" aria-label="Run complete">
      <div className="result-card win-card">
        <div className="result-icon">&#10003;</div>
        <h2 className="result-title">Run complete!</h2>
        <p className="result-sub">{variableCount} {LANG_LABELS[language]} variables</p>

        <div className="result-time">
          <span className="time-value">{formatTime(elapsed)}</span>
        </div>

        {isNewBest ? (
          <p className="best-badge new-best">New best!</p>
        ) : best !== null ? (
          <p className="best-badge">Best: {formatTime(best)}</p>
        ) : null}

        <div className="result-actions">
          <button className="result-btn primary" onClick={onPlayAgain}>
            Play Again
          </button>
          <button className="result-btn secondary" onClick={onChangeSettings}>
            Change Settings
          </button>
        </div>
      </div>
    </div>
  )
}
