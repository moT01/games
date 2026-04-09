import type { Card, PassDirection } from './gameLogic'
import { sortHand, rankLabel, suitSymbol, isRedSuit, cardEquals } from './gameLogic'
import './PlayerHand.css'

interface Props {
  hand: Card[]
  phase: 'passing' | 'playing'
  passDirection: PassDirection
  passSelections: Card[]
  legalCards: Card[]
  onCardToggle: (card: Card) => void
  onCardPlay: (card: Card) => void
  onPass: () => void
  isMyTurn: boolean
}

const DIRECTION_LABEL: Record<PassDirection, string> = {
  left: 'Pass Left',
  right: 'Pass Right',
  across: 'Pass Across',
  none: 'Keep All',
}

export default function PlayerHand({
  hand,
  phase,
  passDirection,
  passSelections,
  legalCards,
  onCardToggle,
  onCardPlay,
  onPass,
  isMyTurn,
}: Props) {
  const sorted = sortHand(hand)
  const canPass = phase === 'passing' && passSelections.length === 3

  function isSelected(card: Card): boolean {
    return passSelections.some(c => cardEquals(c, card))
  }

  function isLegal(card: Card): boolean {
    if (phase === 'passing') return true
    return legalCards.some(c => cardEquals(c, card))
  }

  function handleCardAction(card: Card) {
    if (phase === 'passing') {
      onCardToggle(card)
    } else if (isMyTurn && isLegal(card)) {
      onCardPlay(card)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent, card: Card) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleCardAction(card)
    }
  }

  return (
    <div className="player-hand" aria-label="Your hand">
      {phase === 'passing' && (
        <div className="player-hand__pass-info">
          <span className="player-hand__direction">{DIRECTION_LABEL[passDirection]}</span>
          <span className="player-hand__count">{passSelections.length}/3 selected</span>
        </div>
      )}

      <div className="player-hand__cards" role="group" aria-label="Cards in hand">
        {sorted.map((card, i) => {
          const selected = isSelected(card)
          const legal = isLegal(card)
          const clickable = phase === 'passing' ? true : isMyTurn && legal
          const red = isRedSuit(card.suit)

          return (
            <div
              key={`${card.suit}-${card.rank}`}
              className={[
                'playing-card',
                'player-card',
                red ? 'red' : 'black',
                selected ? 'selected' : '',
                !legal && phase === 'playing' ? 'illegal' : '',
                clickable ? 'clickable' : '',
              ].filter(Boolean).join(' ')}
              style={{ '--i': i } as React.CSSProperties}
              onClick={() => handleCardAction(card)}
              onKeyDown={e => handleKeyDown(e, card)}
              tabIndex={clickable ? 0 : -1}
              role="button"
              aria-label={`${rankLabel(card.rank)} of ${card.suit}${selected ? ', selected' : ''}${!legal && phase === 'playing' ? ', not playable' : ''}`}
              aria-pressed={phase === 'passing' ? selected : undefined}
              aria-disabled={!clickable}
            >
              <span className="playing-card__rank">{rankLabel(card.rank)}</span>
              <span className="playing-card__suit">{suitSymbol(card.suit)}</span>
              <span className="playing-card__rank-bottom">{rankLabel(card.rank)}</span>
            </div>
          )
        })}
      </div>

      {phase === 'passing' && (
        <button
          className="btn btn--primary player-hand__pass-btn"
          onClick={onPass}
          disabled={!canPass}
          aria-label={canPass ? 'Pass selected cards' : 'Select 3 cards to pass'}
          data-testid="pass-button"
        >
          Pass Cards
        </button>
      )}

      {phase === 'playing' && !isMyTurn && (
        <div className="player-hand__waiting" aria-live="polite">Waiting...</div>
      )}
    </div>
  )
}
