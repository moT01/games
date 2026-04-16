import { useRef } from 'react'
import './HelpModal.css'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { IconX } from './Icons'

interface Props {
  onClose: () => void
}

export default function HelpModal({ onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, onClose)

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Help and rules"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal-panel" ref={panelRef}>
        <button className="modal-close" onClick={onClose} aria-label="Close help"><IconX /></button>
        <h2>How to Play</h2>

        <section>
          <h3>Objective</h3>
          <p>Fill all 13 scoring categories in 13 rounds to get the highest total score. Beat your personal best.</p>
        </section>

        <section>
          <h3>Each Turn</h3>
          <ul>
            <li>Roll up to 3 times. Click dice to hold them between rolls.</li>
            <li>After at least one roll, click a category in the scorecard to record your score.</li>
            <li>Each category can only be scored once.</li>
          </ul>
        </section>

        <section>
          <h3>Upper Section (Ones - Sixes)</h3>
          <p>Score the sum of the matching dice face. Score 63 or more total to earn a 35-point bonus.</p>
        </section>

        <section>
          <h3>Lower Section</h3>
          <ul>
            <li><strong>Three of a Kind</strong> - Three same: sum all dice</li>
            <li><strong>Four of a Kind</strong> - Four same: sum all dice</li>
            <li><strong>Full House</strong> - Three of one, two of another: 25 pts</li>
            <li><strong>Small Straight</strong> - Four in sequence: 30 pts</li>
            <li><strong>Large Straight</strong> - Five in sequence: 40 pts</li>
            <li><strong>Five of a Kind</strong> - All five same: 50 pts (bonus 100 pts each extra)</li>
            <li><strong>Chance</strong> - Any dice: sum all dice</li>
          </ul>
        </section>

        <section>
          <h3>Strategy Tips</h3>
          <ul>
            <li>Aim for 63+ in the upper section for the 35-point bonus.</li>
            <li>Five of a Kind unlocks 100-point bonuses for each extra one rolled.</li>
            <li>Save Chance as a dump for bad rolls late in the game.</li>
            <li>Three of a Kind and Four of a Kind score sum of ALL dice - keep high values.</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
