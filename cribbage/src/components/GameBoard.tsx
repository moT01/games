import type { GameState } from '../types'
import type { Action } from '../reducer'
import type { Card } from '../gameLogic'
import { cardValue } from '../gameLogic'
import PegBoard from './PegBoard'
import CribArea from './CribArea'
import StarterCard from './StarterCard'
import PlayArea from './PlayArea'
import ShowPanel from './ShowPanel'
import HandSummary from './HandSummary'
import CardView from './CardView'
import './GameBoard.css'

interface Props {
  state: GameState
  dispatch: (action: Action) => void
  discardSelected: string[]
  onDiscardCardClick: (card: Card) => void
  onConfirmDiscard: () => void
  onShowHelp: () => void
  onQuit: () => void
}

export default function GameBoard({ state, dispatch, discardSelected, onDiscardCardClick, onConfirmDiscard, onShowHelp, onQuit }: Props) {
  const { phase, humanHand, computerHand, crib, starterCard, humanScore, computerScore, humanPegs, computerPegs, dealer, pegging, show, countingMode, lastScoringEvent, handHistory } = state

  // Cards disabled during play — those that would exceed 31
  const playDisabledIds = phase === 'play' && pegging.turn === 'human'
    ? humanHand.filter(c => cardValue(c) + pegging.currentCount > 31).map(c => c.id)
    : humanHand.map(c => c.id) // disable all when not human's turn

  // Card click handler depends on phase
  function handleHandCardClick(card: Card) {
    if (phase === 'discard') {
      onDiscardCardClick(card)
    } else if (phase === 'play' && pegging.turn === 'human' && !pegging.isGo) {
      if (cardValue(card) + pegging.currentCount <= 31) {
        dispatch({ type: 'SELECT_PLAY_CARD', cardId: card.id })
      }
    }
  }

  // Selected card ids for hand display
  const handSelectedIds = phase === 'discard'
    ? discardSelected
    : phase === 'play' && pegging.selectedCardId
    ? [pegging.selectedCardId]
    : []

  return (
    <div className="game-board">

      {/* Top bar: header buttons */}
      <div className="game-board__topbar">
        <span className="game-board__title">Cribbage</span>
        <div className="game-board__topbar-actions">
          <button className="game-board__icon-btn" onClick={onShowHelp} aria-label="Help">?</button>
          <button className="game-board__icon-btn" onClick={onQuit} aria-label="Quit">✕</button>
        </div>
      </div>

      {/* Computer zone */}
      <div className="game-board__computer">
        <div className="game-board__computer-hand">
          <span className="game-board__zone-label">Computer</span>
          <div className="game-board__computer-cards">
            {computerHand.length > 0
              ? Array.from({ length: computerHand.length }).map((_, i) => (
                  <div key={i} className="card card--back game-board__computer-card" />
                ))
              : <span className="game-board__empty-label">—</span>
            }
          </div>
        </div>
        <div className="game-board__computer-meta">
          <CribArea cribCount={crib.length} dealer={dealer} />
          {starterCard && (
            <StarterCard starterCard={starterCard} phase={phase} dealer={dealer} onCut={() => dispatch({ type: 'CUT_STARTER' })} />
          )}
          {!starterCard && (phase === 'cut' || phase === 'play' || phase === 'show') && (
            <StarterCard starterCard={null} phase={phase} dealer={dealer} onCut={() => dispatch({ type: 'CUT_STARTER' })} />
          )}
        </div>
      </div>

      {/* Peg board — always visible */}
      <PegBoard
        humanPegs={humanPegs}
        computerPegs={computerPegs}
        humanScore={humanScore}
        computerScore={computerScore}
      />

      {/* Center content — phase-specific */}
      <div className="game-board__content">
        {phase === 'dealing' && (
          <p className="game-board__status">Dealing...</p>
        )}

        {phase === 'discard' && (
          <div className="game-board__discard-info">
            <p className="game-board__status">
              Select 2 cards to discard to <strong>{dealer === 'human' ? 'your' : "the computer's"} crib</strong>
            </p>
          </div>
        )}

        {(phase === 'cut' && !starterCard) && (
          <div className="game-board__status">
            {dealer === 'computer'
              ? 'Cut the deck to reveal the starter card'
              : 'Computer is cutting...'
            }
          </div>
        )}

        {phase === 'play' && (
          <PlayArea
            pegging={pegging}
            lastScoringEvent={lastScoringEvent}
          />
        )}

        {phase === 'show' && starterCard && (
          <ShowPanel
            show={show}
            humanHand={humanHand}
            computerHand={computerHand}
            crib={crib}
            starterCard={starterCard}
            countingMode={countingMode}
            dealer={dealer}
            onSelectCard={id => dispatch({ type: 'SHOW_SELECT_CARD', cardId: id })}
            onClaim={() => dispatch({ type: 'SHOW_CLAIM_COMBO' })}
            onDone={() => dispatch({ type: 'SHOW_DONE' })}
          />
        )}

        {phase === 'summary' && (
          <HandSummary
            handHistory={handHistory}
            humanScore={humanScore}
            computerScore={computerScore}
            onNextHand={() => dispatch({ type: 'NEXT_HAND' })}
          />
        )}
      </div>

      {/* Player hand — always at bottom */}
      <div className="game-board__hand">
        <div className="game-board__hand-cards">
          <span className="game-board__zone-label">Your Hand</span>
          <div className="game-board__hand-row">
            {humanHand.map(card => (
              <CardView
                key={card.id}
                card={card}
                selected={handSelectedIds.includes(card.id)}
                disabled={playDisabledIds.includes(card.id)}
                onClick={() => handleHandCardClick(card)}
              />
            ))}
            {humanHand.length === 0 && (
              <span className="game-board__empty-label">—</span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="game-board__hand-actions">
          {phase === 'discard' && (
            <button
              className="btn btn--primary"
              disabled={discardSelected.length !== 2}
              onClick={onConfirmDiscard}
            >
              Confirm Discard ({discardSelected.length}/2)
            </button>
          )}

          {phase === 'play' && pegging.turn === 'human' && (
            pegging.isGo
              ? <button className="btn btn--primary" onClick={() => dispatch({ type: 'DECLARE_GO' })}>Go</button>
              : <button className="btn btn--primary" disabled={!pegging.selectedCardId} onClick={() => dispatch({ type: 'PLAY_CARD' })}>Play Card</button>
          )}

          {phase === 'play' && pegging.turn === 'computer' && (
            <span className="game-board__status">Computer is thinking...</span>
          )}
        </div>
      </div>

    </div>
  )
}
