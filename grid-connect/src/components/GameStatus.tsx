import type { Player } from '../gameLogic'
import './GameStatus.css'

interface Props {
  phase: 'playing' | 'over'
  currentTurn: Player
  winner: Player | null
  isDraw: boolean
  onPlayAgain: () => void
}

export function GameStatus({ phase, currentTurn, winner, isDraw, onPlayAgain }: Props) {
  if (phase === 'over') {
    const message = winner ? `${winner} wins!` : isDraw ? "It's a draw!" : ''
    return (
      <div className="game-status">
        <p className="game-status__message">{message}</p>
        <button className="game-status__play-again" onClick={onPlayAgain}>
          Play Again
        </button>
      </div>
    )
  }

  return (
    <div className="game-status">
      <p className={`game-status__turn game-status__turn--${currentTurn.toLowerCase()}`}>
        {currentTurn}&apos;s turn
      </p>
    </div>
  )
}
