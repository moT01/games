import type { PeggingState } from '../types'
import type { Card } from '../gameLogic'
import CardView from './CardView'
import './PlayArea.css'

const SUIT_NAMES: Record<string, string> = {
  hearts: 'Hearts', diamonds: 'Diamonds', clubs: 'Clubs', spades: 'Spades',
}

interface Props {
  pegging: PeggingState
  lastScoringEvent: string | null
  lastComputerCard: Card | null
}

export default function PlayArea({ pegging, lastScoringEvent, lastComputerCard }: Props) {
  const { currentSequence, currentCount } = pegging

  let statusMsg: string | null = null
  if (lastComputerCard) {
    statusMsg = `Opponent played ${lastComputerCard.rank} of ${SUIT_NAMES[lastComputerCard.suit]}`
    if (lastScoringEvent) statusMsg += ` — ${lastScoringEvent}`
  } else if (lastScoringEvent) {
    statusMsg = lastScoringEvent
  }

  return (
    <div className="play-area">
      <div className="play-area__count-block">
        <div className="play-area__count">{currentCount}</div>
        <div className="play-area__count-label">running count</div>
      </div>

      {statusMsg && (
        <div className="play-area__status">{statusMsg}</div>
      )}

      <div className="play-area__sequence">
        {currentSequence.length === 0
          ? <span className="play-area__empty">No cards played yet</span>
          : currentSequence.map(card => (
              <CardView key={card.id} card={card} />
            ))
        }
      </div>
    </div>
  )
}
