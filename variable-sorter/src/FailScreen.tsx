import './WinScreen.css'
import type { FailedDrop } from './gameLogic'
import { formatTime } from './gameLogic'

interface Props {
  failedDrop: FailedDrop
  endTime: number
  startTime: number
  onTryAgain: () => void
  onChangeSettings: () => void
}

export default function FailScreen({ failedDrop, endTime, startTime, onTryAgain, onChangeSettings }: Props) {
  const elapsed = endTime - startTime

  return (
    <div className="fail-screen" role="main" aria-label="Wrong type">
      <div className="result-card fail-card">
        <div className="result-icon">&#10007;</div>
        <h2 className="result-title">Wrong type!</h2>

        <div className="result-time">
          <span className="time-label">Time elapsed</span>
          <span className="time-value">{formatTime(elapsed)}</span>
        </div>

        <div className="fail-details">
          <code className="fail-var">{failedDrop.variable.declaration}</code>
          <div className="fail-comparison">
            <div className="fail-wrong">
              <span className="fail-comparison-label">You chose</span>
              <span className="fail-type">{failedDrop.droppedType}</span>
            </div>
            <div className="fail-correct">
              <span className="fail-comparison-label">Correct</span>
              <span className="fail-type">{failedDrop.correctType}</span>
            </div>
          </div>
        </div>

        <div className="result-actions">
          <button className="result-btn primary" onClick={onTryAgain}>
            Try Again
          </button>
          <button className="result-btn secondary" onClick={onChangeSettings}>
            Change Settings
          </button>
        </div>
      </div>
    </div>
  )
}
