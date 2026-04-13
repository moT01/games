import { useEffect } from 'react';
import './ConfirmModal.css';

type ConfirmModalProps = {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({ message, onConfirm, onCancel }: ConfirmModalProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  return (
    <div
      className="confirm-modal__overlay"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label="Confirm action"
    >
      <div className="confirm-modal" onClick={e => e.stopPropagation()}>
        <p className="confirm-modal__message">{message}</p>
        <div className="confirm-modal__actions">
          <button className="confirm-modal__btn confirm-modal__btn--cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="confirm-modal__btn confirm-modal__btn--confirm" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
