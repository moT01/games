import { useEffect } from 'react';
import './RulesModal.css';

type RulesModalProps = {
  onClose: () => void;
};

export function RulesModal({ onClose }: RulesModalProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="rules-modal__overlay" onClick={onClose}>
      <div className="rules-modal" onClick={e => e.stopPropagation()}>
        <div className="rules-modal__header">
          <h2 className="rules-modal__title">How to Play</h2>
          <button className="rules-modal__close" onClick={onClose} aria-label="Close rules">✕</button>
        </div>

        <div className="rules-modal__body">
          <p className="rules-modal__intro">
            Roll five dice up to three times per turn, then score one category. All 13 categories must be filled before the game ends.
          </p>

          <h3 className="rules-modal__section">Upper Section</h3>
          <p className="rules-modal__note">Score the sum of the matching die face.</p>
          <table className="rules-modal__table">
            <tbody>
              <tr><td>Ones – Sixes</td><td>Sum of all dice showing that number</td></tr>
              <tr><td>Bonus</td><td>Score ≥ 63 in upper section → <strong>+35</strong></td></tr>
            </tbody>
          </table>

          <h3 className="rules-modal__section">Lower Section</h3>
          <table className="rules-modal__table">
            <tbody>
              <tr><td>3 of a Kind</td><td>Three dice the same → sum of <em>all</em> dice</td></tr>
              <tr><td>4 of a Kind</td><td>Four dice the same → sum of <em>all</em> dice</td></tr>
              <tr><td>Full House</td><td>Three of one, two of another → <strong>25</strong></td></tr>
              <tr><td>Sm. Straight</td><td>Four sequential dice → <strong>30</strong></td></tr>
              <tr><td>Lg. Straight</td><td>Five sequential dice → <strong>40</strong></td></tr>
              <tr><td>YAHTZEE</td><td>All five dice the same → <strong>50</strong></td></tr>
              <tr><td>Chance</td><td>Any roll → sum of all dice</td></tr>
              <tr><td>Yahtzee Bonus</td><td>Each extra Yahtzee after the first → <strong>+100</strong></td></tr>
            </tbody>
          </table>

          <h3 className="rules-modal__section">Gameplay</h3>
          <ul className="rules-modal__list">
            <li>Click a die after the first roll to hold it — held dice are not re-rolled.</li>
            <li>After your third roll you must score a category.</li>
            <li>You can score a category at 0 if no better option exists.</li>
            <li>The Yahtzee bonus only applies if you already scored 50 in the Yahtzee category.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
