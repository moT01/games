import './HelpModal.css';

type Props = {
  onClose: () => void;
};

export function HelpModal({ onClose }: Props) {
  return (
    <div className="help-overlay" onClick={onClose}>
      <div className="help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="help-header">
          <h2 className="help-title">How to Play</h2>
          <button className="help-close" onClick={onClose} aria-label="Close help">✕</button>
        </div>

        <div className="help-body">
          <h3>Rules</h3>
          <p>
            Slide numbered tiles into the empty space to arrange them in order — 1, 2, 3 … left-to-right,
            top-to-bottom — with the blank in the bottom-right corner.
          </p>

          <h3>How to Move</h3>
          <ul>
            <li>Click any tile that is directly adjacent (up, down, left, right) to the blank space to slide it.</li>
            <li>With <strong>Row/Column Shift</strong> enabled, clicking any tile in the same row or column as the blank slides all tiles between it and the blank at once.</li>
            <li>Use the <strong>arrow keys</strong> to slide tiles with the keyboard.</li>
          </ul>

          <h3>Strategy Tips</h3>
          <ul>
            <li>Start with the 3×3 puzzle — it teaches the core moves.</li>
            <li>Solve row by row from the top, then column by column for the last two rows.</li>
            <li>Place tiles 1 and 2 in the top row together using the "row insert" technique to avoid displacing them later.</li>
            <li>The bottom-right 2×2 corner (last two tiles + blank) is solved as a group using a 3-tile rotation.</li>
            <li>Avoid trapping the blank in a corner — it takes many moves to free it.</li>
          </ul>

          <h3>Solved State</h3>
          <p>
            The goal for a 4×4 puzzle:<br />
            <code>1  2  3  4</code><br />
            <code>5  6  7  8</code><br />
            <code>9 10 11 12</code><br />
            <code>13 14 15 __</code>
          </p>
        </div>
      </div>
    </div>
  );
}
