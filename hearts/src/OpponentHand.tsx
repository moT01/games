import './OpponentHand.css'

type Position = 'north' | 'west' | 'east'

interface Props {
  position: Position
  cardCount: number
  playerName: string
  handPoints: number
}

export default function OpponentHand({ position, cardCount, playerName, handPoints }: Props) {
  const visible = Math.min(cardCount, 7)

  return (
    <div className={`opponent-hand opponent-hand--${position}`} aria-label={`${playerName} hand`}>
      <div className="opponent-hand__label">
        <span className="opponent-hand__name">{playerName}</span>
        {handPoints > 0 && (
          <span className="opponent-hand__pts" aria-label={`${handPoints} points this hand`}>
            {handPoints}pts
          </span>
        )}
      </div>
      <div className="opponent-hand__cards" aria-hidden="true">
        {Array.from({ length: visible }).map((_, i) => (
          <div key={i} className="playing-card playing-card--back" />
        ))}
        {cardCount === 0 && <div className="opponent-hand__empty">No cards</div>}
      </div>
      <div className="opponent-hand__count" aria-label={`${cardCount} cards`}>{cardCount}</div>
    </div>
  )
}
