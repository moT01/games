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

const SUIT_NAMES: Record<string, string> = {
  hearts: 'Hearts', diamonds: 'Diamonds', clubs: 'Clubs', spades: 'Spades',
}

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

export default function GameBoard({ state, dispatch, discardSelected, onDiscardCardClick, onConfirmDiscard, onShowHelp, onQuit, theme, onToggleTheme, donateUrl }: Props) {
  const { phase, humanHand, computerHand, crib, starterCard, humanScore, computerScore, humanPegs, computerPegs, dealer, pegging, show, countingMode, lastScoringEvent, lastComputerCard, handHistory } = state

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

  // Cards disabled during play
  const playDisabledIds = phase === 'play' && pegging.turn === 'human'
    ? humanHand.filter(c => cardValue(c) + pegging.currentCount > 31).map(c => c.id)
    : humanHand.map(c => c.id)

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

  // Derive computer status message from game state
  function getComputerStatus(): string | null {
    if (phase === 'discard' && humanHand.length === 4) return 'Computer is discarding...'
    if (phase === 'cut' && dealer === 'human') return 'Computer is cutting the deck...'
    if (phase === 'play' && pegging.turn === 'computer') return 'Computer is thinking...'
    if (phase === 'play' && lastComputerCard) {
      return `Computer played ${lastComputerCard.rank} of ${SUIT_NAMES[lastComputerCard.suit]}`
    }
    if (phase === 'show' && show.scorer === 'computer') return 'Computer is counting their hand...'
    if (phase === 'show' && show.scorer === 'crib' && dealer === 'computer') return 'Computer is counting the crib...'
    return null
  }

  const computerStatus = getComputerStatus()

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
          <div className="game-board__computer-header">
            <span className="game-board__zone-label">Computer</span>
            {computerStatus && (
              <span className="game-board__computer-status">{computerStatus}</span>
            )}
          </div>
          <div className="game-board__computer-cards">
            {computerHand.length > 0
              ? Array.from({ length: computerHand.length }).map((_, i) => (
                  <div key={i} className="card card--back game-board__computer-card" />
                ))
              : <span className="game-board__empty-label">—</span>
            }
          </div>
        </div>
        <div className="game-board__computer-right">
          <CribArea cribCount={crib.length} dealer={dealer} />
          {(phase === 'cut' || phase === 'play' || phase === 'show') && (
            <StarterCard
              starterCard={starterCard}
              phase={phase}
              dealer={dealer}
              onCut={() => dispatch({ type: 'CUT_STARTER' })}
            />
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

      {/* Center content */}
      <div className="game-board__content">
        {phase === 'dealing' && (
          <p className="game-board__status-text">Dealing...</p>
        )}

        {phase === 'discard' && (
          <div className="game-board__discard-ui">
            <div className="game-board__crib-label">
              {dealer === 'human' ? 'Your Crib' : "Computer's Crib"}
            </div>
            {humanHand.length === 6
              ? <p className="game-board__status-text">Select 2 cards to discard</p>
              : <p className="game-board__status-text game-board__status-text--waiting">Computer is discarding...</p>
            }
          </div>
        )}

        {phase === 'cut' && !starterCard && (
          <p className="game-board__status-text">
            {dealer === 'computer' ? 'Cut the deck to reveal the starter card' : 'Computer is cutting the deck...'}
          </p>
        )}

        {phase === 'play' && (
          <PlayArea pegging={pegging} lastScoringEvent={lastScoringEvent} lastComputerCard={lastComputerCard} />
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

      {/* Player hand */}
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

    </div>
  )
}
