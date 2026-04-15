import './ConfirmModal.css';

interface ConfirmModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ message, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div className="modal-card confirm-modal" onClick={e => e.stopPropagation()}>
        <p className="confirm-modal__message">{message}</p>
        <div className="confirm-modal__actions">
          <button className="btn btn-primary" onClick={onConfirm}>
            Yes
          </button>
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
