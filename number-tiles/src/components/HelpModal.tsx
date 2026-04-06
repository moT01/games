import './HelpModal.css';

interface HelpModalProps {
  onClose: () => void;
}

export default function HelpModal({ onClose }: HelpModalProps) {
  return (
    <div className="help-modal" onClick={onClose}>
      <div className="help-modal__card" onClick={e => e.stopPropagation()}>
        <button className="help-modal__close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2 className="help-modal__title">How to Play</h2>
        <ul className="help-modal__list">
          <li>Click a numbered tile next to the blank space to slide it into the blank.</li>
          <li>Arrange all tiles in order from 1 to N²−1, left to right, top to bottom, with the blank in the bottom-right corner.</li>
          <li>Work row by row from the top; the last two rows require special techniques.</li>
          <li>Don't just chase the blank — plan tile sequences.</li>
          <li>Larger grids (5×5, 6×6) are significantly harder; start with 3×3 to learn.</li>
        </ul>
      </div>
    </div>
  );
}
