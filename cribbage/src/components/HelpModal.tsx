import { useState } from 'react'
import './Modal.css'
import './HelpModal.css'

interface Props {
  onClose: () => void
}

type Tab = 'rules' | 'scoring' | 'strategy'

export default function HelpModal({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('rules')

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box help-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">x</button>
        <h2 className="modal-title">Help</h2>

        <div className="help-tabs">
          <button className={`help-tab ${tab === 'rules' ? 'help-tab--active' : ''}`} onClick={() => setTab('rules')}>Rules</button>
          <button className={`help-tab ${tab === 'scoring' ? 'help-tab--active' : ''}`} onClick={() => setTab('scoring')}>Scoring</button>
          <button className={`help-tab ${tab === 'strategy' ? 'help-tab--active' : ''}`} onClick={() => setTab('strategy')}>Strategy</button>
        </div>

        <div className="help-content">
          {tab === 'rules' && (
            <div>
              <p>First to 121 points wins.</p>
              <ul>
                <li>Dealer deals 6 cards each. Both players discard 2 to the crib (dealer's bonus hand).</li>
                <li>Non-dealer cuts the deck; the top card is the starter. If it's a Jack, dealer scores 2 (nibs).</li>
                <li>Play phase: take turns playing cards; running count can't exceed 31. Score for 15, 31, pairs, and runs.</li>
                <li>Show phase: count your 4-card hand plus the starter. Dealer counts the crib last.</li>
                <li>If you can't play without exceeding 31, click Go to pass.</li>
              </ul>
            </div>
          )}

          {tab === 'scoring' && (
            <div>
              <ul>
                <li><strong>Fifteen (2 pts):</strong> any cards summing to 15</li>
                <li><strong>Pair (2 pts):</strong> two cards of the same rank</li>
                <li><strong>Three of a kind (6 pts):</strong> three of the same rank</li>
                <li><strong>Four of a kind (12 pts):</strong> four of the same rank</li>
                <li><strong>Run:</strong> 3 consecutive ranks = 3 pts, 4 = 4 pts, 5 = 5 pts</li>
                <li><strong>Flush:</strong> 4 hand cards same suit = 4 pts; all 5 = 5 pts (crib: all 5 only)</li>
                <li><strong>Nobs (1 pt):</strong> Jack in hand matching starter's suit</li>
                <li><strong>Nibs (2 pts):</strong> starter card is a Jack (dealer scores)</li>
                <li><strong>Fifteen in pegging (2 pts):</strong> running count hits 15</li>
                <li><strong>Thirty-one (2 pts):</strong> running count hits 31</li>
                <li><strong>Go (1 pt):</strong> last card in a sequence</li>
              </ul>
            </div>
          )}

          {tab === 'strategy' && (
            <div>
              <ul>
                <li>Keep cards that work well together: pairs, runs, or cards summing to 5.</li>
                <li>When not the dealer, give the crib bad cards with spread ranks and different suits.</li>
                <li>When dealer, put scoring cards in the crib: pairs or cards summing to 15.</li>
                <li>Don't lead with a 5 during play - opponent can score 15 with any 10-value card.</li>
                <li>Aim for 31 when the count is in the 20s.</li>
                <li>Don't forget nobs - 1 free point often missed.</li>
                <li>Count fifteens first, then pairs, then runs, then flush, then nobs.</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
