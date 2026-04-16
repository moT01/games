import type { Card } from '../gameLogic'
import CardView from './CardView'
import './PlayerHand.css'

interface Props {
  humanHand: Card[]
  computerHandCount: number
  selectedIds?: string[]
  disabledIds?: string[]
  onCardClick?: (card: Card) => void
  label?: string
}

export default function PlayerHand({
  humanHand,
  computerHandCount,
  selectedIds = [],
  disabledIds = [],
  onCardClick,
  label,
}: Props) {
  return (
    <div className="player-hand">
      <div className="player-hand__section player-hand__section--computer">
        <span className="player-hand__label">Opponent ({computerHandCount} cards)</span>
        <div className="player-hand__cards">
          {Array.from({ length: computerHandCount }).map((_, i) => (
            <div key={i} className="card card--back" style={{ width: 60, height: 84, borderRadius: 4 }} />
          ))}
        </div>
      </div>

      <div className="player-hand__section player-hand__section--human">
        <span className="player-hand__label">{label ?? 'Your Hand'}</span>
        <div className="player-hand__cards">
          {humanHand.map(card => (
            <CardView
              key={card.id}
              card={card}
              selected={selectedIds.includes(card.id)}
              disabled={disabledIds.includes(card.id)}
              onClick={onCardClick ? () => onCardClick(card) : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
