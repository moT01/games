import './ConfirmModal.css';

interface Props {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ message, onConfirm, onCancel }: Props) {
  return (
    <div className="confirm-modal-overlay" role="dialog" aria-modal="true" aria-label="Confirm action">
      <div className="confirm-modal">
        <p className="confirm-modal__message">{message}</p>
        <div className="confirm-modal__actions">
          <button className="confirm-modal__btn confirm-modal__btn--cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="confirm-modal__btn confirm-modal__btn--confirm" onClick={onConfirm}>
            Quit
          </button>
        </div>
      </div>
    </div>
  );
}
