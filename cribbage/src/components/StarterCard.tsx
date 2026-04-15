import type { Card } from '../gameLogic'
import CardView from './CardView'
import './StarterCard.css'

interface Props {
  starterCard: Card | null
  phase: string
  dealer: 'human' | 'computer'
  onCut: () => void
}

export default function StarterCard({ starterCard, phase, dealer, onCut }: Props) {
  // Non-dealer cuts: if human is non-dealer, show button
  const humanIsNonDealer = dealer === 'computer'

  return (
    <div className="starter-card">
      <span className="starter-card__label">Starter</span>
      {starterCard ? (
        <CardView card={starterCard} />
      ) : humanIsNonDealer && phase === 'cut' ? (
        <div className="starter-card__placeholder">
          <button className="btn btn--primary" onClick={onCut}>
            Cut
          </button>
        </div>
      ) : (
        <div className="starter-card__placeholder starter-card__placeholder--waiting">
          <span className="card card--back" style={{ width: 60, height: 84, display: 'block', borderRadius: 4 }} />
        </div>
      )}
    </div>
  )
}
