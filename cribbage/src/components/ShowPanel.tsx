import type { Card } from '../gameLogic'
import type { ShowState } from '../types'
import CardView from './CardView'
import './ShowPanel.css'

interface Props {
  show: ShowState
  humanHand: Card[]
  computerHand: Card[]
  crib: Card[]
  starterCard: Card
  countingMode: 'manual' | 'auto'
  dealer: 'human' | 'computer'
  onSelectCard: (cardId: string) => void
  onClaim: () => void
  onDone: () => void
}

export default function ShowPanel({
  show,
  humanHand,
  computerHand,
  crib,
  starterCard,
  countingMode,
  dealer,
  onSelectCard,
  onClaim,
  onDone,
}: Props) {
  const { scorer, claimedCombos, allCombos, selectedCardIds, manualError } = show

  if (!scorer) return null

  const hand =
    scorer === 'crib' ? crib : scorer === 'human' ? humanHand : computerHand
  const scorerLabel =
    scorer === 'human'
      ? 'Your Hand'
      : scorer === 'computer'
        ? "Computer's Hand"
        : dealer === 'human'
          ? 'Your Crib'
          : "Computer's Crib"

  const isHumanManual =
    countingMode === 'manual' &&
    (scorer === 'human' || (scorer === 'crib' && dealer === 'human'))

  const claimedTotal = claimedCombos.reduce((s, c) => s + c.points, 0)
  const allTotal = allCombos.reduce((s, c) => s + c.points, 0)
  const remaining = allTotal - claimedTotal

  const allCards = [...hand, starterCard]

  const selectedCount = selectedCardIds.length
  const claimDisabled = selectedCount === 0

  return (
    <div className="show-panel">
      <h3 className="show-panel__title">{scorerLabel}</h3>

      {isHumanManual ? (
        <div className="show-panel__manual">
          <div className="show-panel__cards">
            {allCards.map(card => (
              <CardView
                key={card.id}
                card={card}
                selected={selectedCardIds.includes(card.id)}
                highlight={card.id === starterCard.id}
                onClick={() => onSelectCard(card.id)}
              />
            ))}
          </div>

          <div className="show-panel__right">
            <div className="show-panel__remaining">
              {remaining > 0 ? (
                <span className="show-panel__remaining--nonzero">{remaining} points remaining</span>
              ) : (
                <span className="show-panel__remaining--zero">All points found!</span>
              )}
            </div>

            <button
              className="btn btn--primary"
              disabled={claimDisabled}
              onClick={onClaim}
            >
              Claim
            </button>

            {manualError && (
              <p className="show-panel__error">{manualError}</p>
            )}

            <div className="show-panel__claimed">
              {claimedCombos.map((combo, i) => (
                <div key={i} className="show-panel__combo">
                  <span className="show-panel__combo-check">+</span>
                  <span>{combo.label}</span>
                  <span className="show-panel__combo-pts">+{combo.points}</span>
                </div>
              ))}
            </div>

            <button
              className="btn btn--secondary"
              disabled={remaining > 0}
              onClick={onDone}
            >
              Done ({claimedTotal} pts)
            </button>
          </div>
        </div>
      ) : (
        <div className="show-panel__auto">
          <div className="show-panel__cards">
            {allCards.map(card => (
              <CardView
                key={card.id}
                card={card}
                highlight={card.id === starterCard.id}
              />
            ))}
          </div>
          <p className="show-panel__auto-msg">Counting automatically...</p>
        </div>
      )}
    </div>
  )
}
