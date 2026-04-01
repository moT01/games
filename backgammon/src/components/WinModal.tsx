import './WinModal.css'
import type { Color } from '../gameLogic'

interface WinModalProps {
  winner: Color
  onPlayAgain: () => void
}

export function WinModal({ winner, onPlayAgain }: WinModalProps) {
  const label = winner === 'white' ? 'White' : 'Black'

  return (
    <div className="win-modal-overlay">
      <div className="win-modal">
        <h2 className={`win-modal__title win-modal__title--${winner}`}>
          {label} wins!
        </h2>
        <button className="win-modal__btn" onClick={onPlayAgain}>
          Play Again
        </button>
      </div>
    </div>
  )
}
