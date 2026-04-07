import { useEffect, useRef } from 'react';
import './ConfirmModal.css';

interface ConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ onConfirm, onCancel }: ConfirmModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onCancel();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="modal confirm-modal"
      >
        <h2 id="confirm-title" className="confirm-modal__title">Quit Game?</h2>
        <p className="confirm-modal__text">Your progress will be lost.</p>
        <div className="confirm-modal__actions">
          <button
            ref={cancelRef}
            className="btn btn--secondary"
            onClick={onCancel}
            aria-label="Cancel, continue playing"
          >
            Cancel
          </button>
          <button
            className="btn btn--danger"
            onClick={onConfirm}
            aria-label="Confirm quit"
          >
            Quit
          </button>
        </div>
      </div>
    </div>
  );
}
