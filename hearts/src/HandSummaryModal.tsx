import type { HandSummaryData, PlayerId } from './gameLogic'
import './HandSummaryModal.css'

const PLAYER_NAMES = ['You', 'West', 'North', 'East']

interface Props {
  data: HandSummaryData
  onNextHand: () => void
}

export default function HandSummaryModal({ data, onNextHand }: Props) {
  const { handPoints, cumulativeAfter, moonShooter } = data

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Hand summary">
      <div className="modal-box hand-summary">
        {moonShooter !== null && (
          <div className="hand-summary__moon">
            {PLAYER_NAMES[moonShooter]} shot the moon! All others +26
          </div>
        )}
        <h2 className="hand-summary__title">Hand Summary</h2>
        <table className="hand-summary__table" aria-label="Hand scores">
          <thead>
            <tr>
              <th>Player</th>
              <th>This Hand</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {([0, 1, 2, 3] as PlayerId[]).map(id => (
              <tr key={id} className={id === 0 ? 'hand-summary__row--you' : ''}>
                <td>{PLAYER_NAMES[id]}</td>
                <td className="hand-summary__pts">
                  {moonShooter !== null
                    ? id === moonShooter ? 0 : '+26'
                    : handPoints[id] || '-'}
                </td>
                <td className="hand-summary__total">{cumulativeAfter[id]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="btn btn--primary hand-summary__btn" onClick={onNextHand}>
          Next Hand
        </button>
      </div>
    </div>
  )
}
