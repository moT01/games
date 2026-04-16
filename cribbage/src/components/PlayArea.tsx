import type { PeggingState } from '../types'
import CardView from './CardView'
import './PlayArea.css'

interface Props {
  pegging: PeggingState
  lastScoringEvent: string | null
  lastComputerCard: import('../gameLogic').Card | null
}

export default function PlayArea({ pegging }: Props) {
  const { currentSequence, currentCount } = pegging

  return (
    <div className="play-area">
      <div className="play-area__count-block">
        <div className="play-area__count">{currentCount}</div>
        <div className="play-area__count-label">running count</div>
      </div>

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
