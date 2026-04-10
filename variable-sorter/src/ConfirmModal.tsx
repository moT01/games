import './HelpModal.css'

interface Props {
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({ message, onConfirm, onCancel }: Props) {
  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onCancel()
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick} role="dialog" aria-modal="true" aria-label="Confirm">
      <div className="modal-box" style={{ maxWidth: '360px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Are you sure?</h2>
          <button className="modal-close" onClick={onCancel} aria-label="Cancel">&#215;</button>
        </div>
        <div className="confirm-content">
          <p className="confirm-message">{message}</p>
          <div className="confirm-actions">
            <button className="confirm-btn cancel" onClick={onCancel}>Keep playing</button>
            <button className="confirm-btn confirm" onClick={onConfirm}>Quit run</button>
          </div>
        </div>
      </div>
    </div>
  )
}
