import type { Card } from '../gameLogic'
import './CardView.css'

interface Props {
  card: Card
  faceDown?: boolean
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
  highlight?: boolean
}

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '\u2665',
  diamonds: '\u2666',
  clubs: '\u2663',
  spades: '\u2660',
}

export default function CardView({ card, faceDown, selected, disabled, onClick, highlight }: Props) {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds'
  const sym = SUIT_SYMBOLS[card.suit]

  if (faceDown) {
    return (
      <div className="card card--back" onClick={onClick} role={onClick ? 'button' : undefined} />
    )
  }

  return (
    <div
      className={[
        'card',
        isRed ? 'card--red' : 'card--black',
        selected ? 'card--selected' : '',
        disabled ? 'card--disabled' : '',
        highlight ? 'card--highlight' : '',
        onClick ? 'card--clickable' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={disabled ? undefined : onClick}
      role={onClick && !disabled ? 'button' : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      onKeyDown={
        onClick && !disabled
          ? e => {
              if (e.key === 'Enter' || e.key === ' ') onClick()
            }
          : undefined
      }
    >
      <span className="card__corner card__corner--top">
        <span className="card__rank">{card.rank}</span>
        <span className="card__suit">{sym}</span>
      </span>
      <span className="card__center">{sym}</span>
      <span className="card__corner card__corner--bottom">
        <span className="card__rank">{card.rank}</span>
        <span className="card__suit">{sym}</span>
      </span>
    </div>
  )
}
