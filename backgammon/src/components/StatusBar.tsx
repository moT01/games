import './StatusBar.css'
import type { Color } from '../gameLogic'

interface StatusBarProps {
  currentPlayer: Color
  forcedSkip: boolean
  phase: 'mode-select' | 'playing' | 'game-over'
  winner: Color | null
}

export function StatusBar({ currentPlayer, forcedSkip, phase, winner }: StatusBarProps) {
  if (phase === 'game-over' && winner) {
    return (
      <div className="status-bar">
        <span className={`status-bar__player status-bar__player--${winner}`}>
          {winner === 'white' ? 'White' : 'Black'} wins!
        </span>
      </div>
    )
  }

  const playerLabel = currentPlayer === 'white' ? 'White' : 'Black'

  return (
    <div className="status-bar">
      <span className={`status-bar__player status-bar__player--${currentPlayer}`}>
        {playerLabel}
      </span>
      <span className="status-bar__message">
        {forcedSkip ? ' — No legal moves' : "'s turn"}
      </span>
    </div>
  )
}
