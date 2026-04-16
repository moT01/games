import './HandSummary.css'

interface Props {
  handHistory: string[]
  humanScore: number
  computerScore: number
  onNextHand: () => void
}

export default function HandSummary({ handHistory, humanScore, computerScore, onNextHand }: Props) {
  return (
    <div className="hand-summary">
      <h2 className="hand-summary__title">Hand Summary</h2>

      <div className="hand-summary__scores">
        <span>You: <strong>{humanScore}</strong></span>
        <span>Opponent: <strong>{computerScore}</strong></span>
      </div>

      <ul className="hand-summary__history">
        {handHistory.map((event, i) => (
          <li key={i} className="hand-summary__event">{event}</li>
        ))}
        {handHistory.length === 0 && (
          <li className="hand-summary__event hand-summary__event--empty">No scoring events this hand.</li>
        )}
      </ul>

      <button className="btn btn--primary" onClick={onNextHand}>
        Next Hand
      </button>
    </div>
  )
}
