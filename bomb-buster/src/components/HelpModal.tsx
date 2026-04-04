import './HelpModal.css';

type Props = { onClose: () => void };

export function HelpModal({ onClose }: Props) {
  return (
    <div className="help-modal__backdrop" onClick={onClose}>
      <div className="help-modal" onClick={e => e.stopPropagation()}>
        <button className="help-modal__close" onClick={onClose} title="Close">✕</button>
        <h2 className="help-modal__title">How to Play Bomb Buster</h2>

        <h3 className="help-modal__section">Rules</h3>
        <p>Left-click to reveal a cell. Right-click to place or remove a flag. Numbers show how many of the 8 surrounding cells contain bombs. Reveal every safe cell without triggering a bomb to win.</p>

        <h3 className="help-modal__section">Objective</h3>
        <p>Reveal every cell that does not contain a bomb. You do not need to flag all bombs — flagging is optional but helps you track your progress.</p>

        <h3 className="help-modal__section">Key Strategies</h3>
        <ul className="help-modal__list">
          <li>When a "1" cell touches only one unrevealed cell, that cell must be the bomb — flag it.</li>
          <li>If a number's adjacent flag count already matches the number, the remaining unrevealed neighbors are safe to click.</li>
          <li>Look for cells where the number equals all remaining unrevealed neighbors — every one of them is a bomb.</li>
          <li>Corners and edges reduce unknown neighbors, making them easier to reason about.</li>
          <li>When no safe deduction is possible, guess a corner or edge cell — statistically fewer bomb neighbors.</li>
        </ul>

        <h3 className="help-modal__section">Tips for Beginners</h3>
        <ul className="help-modal__list">
          <li>The first click is always safe — bombs are placed after you click.</li>
          <li>Start with Beginner (9×9, 10 bombs) to learn how numbers work before trying larger boards.</li>
          <li>Open corners first — they tend to cascade and expose large safe areas quickly.</li>
          <li>Beginner is usually solvable with pure logic. Expert almost always requires at least one guess.</li>
        </ul>

        <h3 className="help-modal__section">Common Mistakes</h3>
        <ul className="help-modal__list">
          <li>The mine counter can go negative if you over-flag — don't rely on it blindly.</li>
          <li>Don't try to flag every bomb before revealing safe cells — it slows you down.</li>
          <li>Slow down near numbers — left-clicking too fast can trigger a bomb you spotted a moment too late.</li>
        </ul>
      </div>
    </div>
  );
}
