import type { Color } from '../gameLogic'

interface WinModalProps {
  winner: Color
  onPlayAgain: () => void
  onMainMenu: () => void
}

export function WinModal({ winner, onPlayAgain, onMainMenu }: WinModalProps) {
  const label = winner === 'light' ? 'Light' : 'Dark'

  return (
    <div className="modal-backdrop" onClick={onMainMenu}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">{label} wins!</h2>
        <div className="modal-actions">
          <button className="secondary-btn" onClick={onMainMenu}>Main Menu</button>
          <button className="primary-btn" onClick={onPlayAgain}>Play Again</button>
        </div>
      </div>
    </div>
  )
}
