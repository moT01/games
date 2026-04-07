import { useEffect, useRef } from 'react';
import './HelpModal.css';

interface HelpModalProps {
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

export default function HelpModal({ onClose, triggerRef }: HelpModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleClose = () => {
    onClose();
    triggerRef?.current?.focus();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        className="modal"
      >
        <button
          ref={closeRef}
          className="modal__close"
          onClick={handleClose}
          aria-label="Close help"
        >
          ✕
        </button>
        <h2 id="help-title" className="modal__title">Help</h2>

        <div className="modal__section">
          <h3>Controls</h3>
          <table className="modal__table">
            <thead>
              <tr><th>Key</th><th>Action</th></tr>
            </thead>
            <tbody>
              <tr><td>← →</td><td>Move left / right</td></tr>
              <tr><td>↓</td><td>Soft drop (hold)</td></tr>
              <tr><td>Space</td><td>Hard drop</td></tr>
              <tr><td>X / ↑</td><td>Rotate clockwise</td></tr>
              <tr><td>Z / Ctrl</td><td>Rotate counter-clockwise</td></tr>
            </tbody>
          </table>
        </div>

        <div className="modal__section">
          <h3>Scoring</h3>
          <p className="modal__text">Base = 100 × line multiplier × (level + 1)</p>
          <table className="modal__table">
            <thead>
              <tr><th>Lines cleared</th><th>Multiplier</th></tr>
            </thead>
            <tbody>
              <tr><td>1</td><td>×1</td></tr>
              <tr><td>2</td><td>×2</td></tr>
              <tr><td>3</td><td>×3</td></tr>
              <tr><td>4</td><td>×5</td></tr>
              <tr><td>5</td><td>×8</td></tr>
            </tbody>
          </table>
          <p className="modal__text" style={{ marginTop: '8px' }}>
            Back-to-back combo (consecutive locks that clear lines): ×1.5 bonus.<br />
            Soft drop: +1 per row. Hard drop: +2 per row.
          </p>
        </div>

        <div className="modal__section">
          <h3>Pieces</h3>
          <p className="modal__text">
            Block Stacker uses the 12 free pentominoes (F, I, L, N, P, T, U, V, W, X, Y, Z) — 5-cell pieces.
            J and S are not included; rotation covers those orientations.
          </p>
        </div>

        <div className="modal__section">
          <h3>Tips</h3>
          <p className="modal__text">Keep the stack flat. Pentominoes are wider and more irregular than standard Tetris pieces — holes are easy to create.</p>
          <p className="modal__text">The I and X pieces are most versatile. Save I for vertical columns.</p>
        </div>
      </div>
    </div>
  );
}
