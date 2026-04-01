import './HelpModal.css'

interface HelpModalProps {
  onClose: () => void
}

export function HelpModal({ onClose }: HelpModalProps) {
  return (
    <div className="help-modal-overlay" onClick={onClose}>
      <div className="help-modal" onClick={e => e.stopPropagation()}>
        <button className="help-modal__close" onClick={onClose}>✕</button>

        <h2 className="help-modal__title">How to Play Backgammon</h2>

        <section className="help-modal__section">
          <h3>Objective</h3>
          <p>Bear off all 15 of your checkers before your opponent does.</p>
        </section>

        <section className="help-modal__section">
          <h3>Rules</h3>
          <ul>
            <li>Roll two dice each turn. Move your checkers forward by the shown values (one checker per die, or one checker twice).</li>
            <li>You may land on an empty point, your own checkers, or a single opponent checker (a <strong>blot</strong>).</li>
            <li>Landing on a blot sends that checker to the <strong>bar</strong>. Bar checkers must re-enter before any other move.</li>
            <li>A point with 2+ of your checkers is a <strong>made point</strong> — the opponent cannot land there.</li>
            <li>Doubles give you four moves instead of two.</li>
            <li>If only one die can be played, you must play the <strong>higher</strong> value.</li>
            <li>Once all your checkers are on your home board, you can <strong>bear off</strong>.</li>
          </ul>
        </section>

        <section className="help-modal__section">
          <h3>Bearing Off</h3>
          <ul>
            <li>Use a die equal to your checker's position to bear it off exactly.</li>
            <li>If the exact point is empty and the die is higher than all remaining checkers, bear off from the highest occupied point.</li>
            <li>You cannot bear off from a lower point if there are checkers on higher points for that die roll.</li>
          </ul>
        </section>

        <section className="help-modal__section">
          <h3>Key Strategies</h3>
          <ul>
            <li><strong>Make your 5-point</strong> — the most valuable point on the board.</li>
            <li><strong>Build a prime</strong> — consecutive made points trap opponent checkers.</li>
            <li><strong>Hit blots</strong> — sending a checker to the bar costs your opponent a turn.</li>
            <li><strong>Move back checkers early</strong> — your two checkers on the opponent's 1-point are hardest to bring home.</li>
            <li><strong>Count pips</strong> — if you're ahead in the race, avoid contact and run home.</li>
          </ul>
        </section>

        <section className="help-modal__section">
          <h3>Common Mistakes</h3>
          <ul>
            <li>Forgetting one checker outside your home board blocks bearing off entirely.</li>
            <li>Leaving blots near your opponent's back checkers — you will get hit.</li>
            <li>Not using doubles to maximum effect — four moves is powerful.</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
