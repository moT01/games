import { useEffect, useRef } from 'react';
import './HelpModal.css';

interface HelpModalProps {
  onClose: () => void;
}

export function HelpModal({ onClose }: HelpModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  return (
    <div
      className="modal-overlay help-modal-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Help"
    >
      <div className="modal-card help-modal">
        <div className="help-modal__header">
          <h2 className="help-modal__title">How to Play</h2>
          <button className="help-modal__close btn btn-secondary" onClick={onClose} aria-label="Close help">
            ✕
          </button>
        </div>
        <div className="help-modal__body">
          <section className="help-modal__section">
            <h3>Goal</h3>
            <p>
              Slide the numbered tiles into order — 1 through the last number, left-to-right
              and top-to-bottom — with the empty space in the bottom-right corner.
            </p>
          </section>

          <section className="help-modal__section">
            <h3>Controls</h3>
            <ul>
              <li><strong>Click / tap</strong> a tile to slide it into the empty space (only adjacent tiles move).</li>
              <li><strong>Arrow keys</strong> slide the tile in that direction into the empty space.</li>
            </ul>
          </section>

          <section className="help-modal__section">
            <h3>Modes</h3>
            <ul>
              <li><strong>3×3</strong> — 8 tiles, great for learning.</li>
              <li><strong>4×4</strong> — 15 tiles, the classic puzzle.</li>
              <li><strong>5×5</strong> — 24 tiles, a serious challenge.</li>
            </ul>
          </section>

          <section className="help-modal__section">
            <h3>Strategy</h3>
            <ul>
              <li><strong>Solve row by row</strong> — lock the top row, then the second, then handle the last two rows together.</li>
              <li><strong>Insert technique</strong> — place the last two tiles of a row together using a temporary loop rather than placing them one at a time.</li>
              <li><strong>Track the blank</strong> — every move is really a blank move. Plan where you need the blank to go before committing.</li>
              <li><strong>Last 2×2 block</strong> — requires a rotation technique, not the row-by-row approach.</li>
            </ul>
          </section>

          <section className="help-modal__section">
            <h3>Common Mistakes</h3>
            <ul>
              <li>Placing a tile in its correct spot too early, then having to disturb it later.</li>
              <li>Trying to swap tiles at the end of one row with tiles at the start of the next — they are <em>not</em> adjacent.</li>
              <li>Cycling the blank endlessly without a plan, running up your move count.</li>
            </ul>
          </section>

          <section className="help-modal__section">
            <h3>Tips</h3>
            <ul>
              <li>Start with 3×3 to learn the mechanics.</li>
              <li>Use arrow keys for faster, more precise play.</li>
              <li>Your best score (moves + time) is saved per mode — try to beat it!</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
