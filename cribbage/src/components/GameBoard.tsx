import { useState, useEffect, useRef } from 'react'
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
import './CutForDeal.css'

interface Props {
  state: GameState
  dispatch: (action: Action) => void
  discardSelected: string[]
  onDiscardCardClick: (card: Card) => void
  onConfirmDiscard: () => void
  onShowHelp: () => void
  onQuit: () => void
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  donateUrl: string
}

const RESULT_LABELS: Record<string, string> = {
  'human-deals': 'You deal first',
  'computer-deals': 'Opponent deals first',
  tie: 'Tie, cut again',
}

export default function GameBoard({ state, dispatch, discardSelected, onDiscardCardClick, onConfirmDiscard, onShowHelp, onQuit, theme, onToggleTheme, donateUrl }: Props) {
  const { phase, humanHand, computerHand, crib, starterCard, humanScore, computerScore, humanPegs, computerPegs, dealer, pegging, show, handHistory, cutForDeal, eventMessage } = state

  // Drag-to-rearrange hand order
  const [handOrder, setHandOrder] = useState<string[]>(() => humanHand.map(c => c.id))
  const dragSrcRef = useRef<number | null>(null)

  useEffect(() => {
    setHandOrder(humanHand.map(c => c.id))
  }, [humanHand])

  const displayHand = handOrder
    .map(id => humanHand.find(c => c.id === id))
    .filter((c): c is Card => c !== undefined)

  function handleDragStart(idx: number) { dragSrcRef.current = idx }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    const src = dragSrcRef.current
    if (src === null || src === idx) return
    setHandOrder(prev => {
      const next = [...prev]
      const [moved] = next.splice(src, 1)
      next.splice(idx, 0, moved)
      return next
    })
    dragSrcRef.current = idx
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    dragSrcRef.current = null
  }

  // Cards disabled during play when they'd bust 31
  const playDisabledIds = phase === 'play' && pegging.turn === 'human'
    ? humanHand.filter(c => cardValue(c) + pegging.currentCount > 31).map(c => c.id)
    : []

  function handleHandCardClick(card: Card) {
    if (phase === 'discard') {
      onDiscardCardClick(card)
    } else if (phase === 'play' && pegging.turn === 'human' && !pegging.isGo) {
      if (cardValue(card) + pegging.currentCount <= 31) {
        dispatch({ type: 'SELECT_PLAY_CARD', cardId: card.id })
      }
    }
  }

  const handSelectedIds = phase === 'discard'
    ? discardSelected
    : phase === 'play' && pegging.selectedCardId
    ? [pegging.selectedCardId]
    : []

  // Show deck stack after cutForDeal resolves
  const showDeckStack = phase !== 'cutForDeal'

  // Event strip rendering
  function renderEventStrip() {
    if (!eventMessage) return <div className="game-board__event-strip game-board__event-strip--empty" />
    const isGold = eventMessage.type === 'gold'
    const isMuted = eventMessage.type === 'muted'
    return (
      <div className={[
        'game-board__event-strip',
        isGold ? 'game-board__event-strip--gold' : '',
        isMuted ? 'game-board__event-strip--muted' : '',
      ].filter(Boolean).join(' ')}>
        <span className="game-board__event-text">{eventMessage.text}</span>
        {isGold && eventMessage.points != null && (
          <span className="game-board__event-badge">[+{eventMessage.points}]</span>
        )}
      </div>
    )
  }

  return (
    <div className="game-board">

      {/* Top bar */}
      <div className="game-board__topbar">
        <span className="game-board__title">Cribbage</span>
        <div className="game-board__topbar-actions">
          <button className="game-board__icon-btn" onClick={onShowHelp} aria-label="Help">?</button>
          <button className="game-board__icon-btn" onClick={onQuit} aria-label="Quit to home">✕</button>
          <a className="game-board__icon-btn" href={donateUrl} target="_blank" rel="noreferrer" aria-label="Donate">♥</a>
          <button className="game-board__icon-btn" onClick={onToggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? '☀' : '☽'}
          </button>
        </div>
      </div>

      {/* Computer zone */}
      <div className="game-board__computer">
        <div className="game-board__computer-left">
          <span className="game-board__zone-label">Opponent</span>
          <div className="game-board__computer-cards">
            {phase === 'cutForDeal'
              ? <span className="game-board__empty-label">—</span>
              : computerHand.length > 0
                ? Array.from({ length: computerHand.length }).map((_, i) => (
                    <div key={i} className="card card--back game-board__computer-card" />
                  ))
                : <span className="game-board__empty-label">—</span>
            }
          </div>
        </div>
        <div className="game-board__computer-right">
          {phase !== 'cutForDeal' && (
            <CribArea cribCount={crib.length} dealer={dealer} />
          )}
          {showDeckStack && (
            <div className="game-board__deck-area">
              <div className="game-board__deck-stack" />
              {(phase === 'cut' || phase === 'play' || phase === 'show' || phase === 'summary') && (
                <StarterCard
                  starterCard={starterCard}
                  phase={phase}
                  dealer={dealer}
                  onCut={() => dispatch({ type: 'CUT_STARTER' })}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Peg board */}
      <PegBoard
        humanPegs={humanPegs}
        computerPegs={computerPegs}
        humanScore={humanScore}
        computerScore={computerScore}
      />

      {/* Event strip */}
      {renderEventStrip()}

      {/* Center content */}
      <div className="game-board__content">

        {/* cutForDeal spread */}
        {phase === 'cutForDeal' && cutForDeal && (() => {
          const { deck, humanCut, computerCut, result } = cutForDeal
          const canClick = !humanCut
          return (
            <div className="game-board__cut-area">
              <h2 className="game-board__cut-title">Cut for Deal</h2>
              <p className="game-board__cut-hint">
                {!humanCut ? 'Click a card to cut. Low card deals first.' : ''}
              </p>
              <div className="cut-spread">
                {deck.map((card, i) => {
                  const isHuman = humanCut?.id === card.id
                  const isComputer = computerCut?.id === card.id
                  const isRevealed = isHuman || isComputer
                  return (
                    <div
                      key={card.id}
                      className={[
                        'cut-card',
                        isRevealed ? 'cut-card--revealed' : '',
                        isHuman ? 'cut-card--human' : '',
                        isComputer ? 'cut-card--computer' : '',
                        canClick && !isRevealed ? 'cut-card--clickable' : '',
                      ].filter(Boolean).join(' ')}
                      style={{ zIndex: isRevealed ? 100 : i }}
                      onClick={canClick && !isRevealed ? () => dispatch({ type: 'HUMAN_CUT', cardIndex: i }) : undefined}
                    >
                      {isRevealed ? (
                        <CardView card={card} />
                      ) : (
                        <div className="card card--back cut-card__back" />
                      )}
                      {isRevealed && (
                        <span className="cut-card__label">
                          {isHuman ? 'You' : 'Opponent'}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
              {result !== 'pending' && humanCut && computerCut && (
                <div className="cut-continue">
                  <p className="cut-continue__label">{RESULT_LABELS[result]}</p>
                  <button className="btn btn--primary" onClick={() => dispatch({ type: 'FINISH_CUT_FOR_DEAL' })}>
                    {result === 'tie' ? 'Cut Again' : 'Continue'}
                  </button>
                </div>
              )}
            </div>
          )
        })()}

        {phase === 'dealing' && (
          <p className="game-board__status-text">Dealing...</p>
        )}

        {phase === 'discard' && (
          <div className="game-board__discard-ui">
            <div className="game-board__crib-label">
              {dealer === 'human' ? 'Your Crib' : "Opponent's Crib"}
            </div>
            {humanHand.length === 6
              ? <p className="game-board__status-text">Select 2 cards to discard</p>
              : <p className="game-board__status-text game-board__status-text--waiting">Opponent is discarding...</p>
            }
          </div>
        )}

        {phase === 'cut' && !starterCard && (
          <p className="game-board__status-text">
            {dealer === 'computer' ? 'Cut the deck to reveal the starter card' : 'Opponent is cutting the deck...'}
          </p>
        )}

        {phase === 'play' && (
          <PlayArea pegging={pegging} lastScoringEvent={state.lastScoringEvent} lastComputerCard={state.lastComputerCard} />
        )}

        {phase === 'show' && starterCard && (
          <ShowPanel
            show={show}
            humanHand={humanHand}
            computerHand={computerHand}
            crib={crib}
            starterCard={starterCard}
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

      {/* Player hand */}
      {phase !== 'cutForDeal' && (
        <div className="game-board__hand">
          <div className="game-board__hand-cards">
            <span className="game-board__zone-label">Your Hand</span>
            <div className="game-board__hand-row">
              {displayHand.map((card, idx) => (
                <div
                  key={card.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={e => handleDragOver(e, idx)}
                  onDrop={handleDrop}
                  className="game-board__hand-card-wrapper"
                >
                  <CardView
                    card={card}
                    selected={handSelectedIds.includes(card.id)}
                    disabled={playDisabledIds.includes(card.id)}
                    onClick={() => handleHandCardClick(card)}
                  />
                </div>
              ))}
              {humanHand.length === 0 && (
                <span className="game-board__empty-label">—</span>
              )}
            </div>
          </div>

          <div className="game-board__hand-actions">
            {phase === 'discard' && humanHand.length === 6 && (
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
          </div>
        </div>
      )}

    </div>
  )
}
