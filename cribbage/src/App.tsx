import { useReducer, useEffect, useState } from 'react'
import { reducer, makeInitialState } from './reducer'
import type { Card } from './gameLogic'

import HomeScreen from './components/HomeScreen'
import CutForDeal from './components/CutForDeal'
import GameBoard from './components/GameBoard'
import GameOverScreen from './components/GameOverScreen'
import ScoringToast from './components/ScoringToast'
import HelpModal from './components/HelpModal'
import ConfirmModal from './components/ConfirmModal'

import './App.css'

const PLAY_PHASES = new Set(['dealing', 'discard', 'cut', 'play', 'show', 'summary'])

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, makeInitialState)
  const [showHelp, setShowHelp] = useState(false)
  const [confirmQuit, setConfirmQuit] = useState(false)
  const [discardSelected, setDiscardSelected] = useState<string[]>([])

  useEffect(() => {
    setDiscardSelected([])
  }, [state.phase])

  // Auto-deal when entering dealing phase
  useEffect(() => {
    if (state.phase === 'dealing') {
      dispatch({ type: 'DEAL_HANDS' })
    }
  }, [state.phase])

  // Auto-cut starter when computer is non-dealer
  useEffect(() => {
    if (state.phase === 'cut' && state.dealer === 'human') {
      const t = setTimeout(() => {
        dispatch({ type: 'CUT_STARTER' })
      }, 800)
      return () => clearTimeout(t)
    }
  }, [state.phase, state.dealer])

  // Computer plays a card
  useEffect(() => {
    if (state.phase !== 'play') return
    if (state.pegging.turn !== 'computer') return
    const t = setTimeout(() => {
      dispatch({ type: 'COMPUTER_PLAY_CARD' })
    }, 400 + Math.random() * 400)
    return () => clearTimeout(t)
  }, [state.phase, state.pegging.turn, state.pegging.currentCount])

  // Auto show scoring for computer turns or auto mode
  useEffect(() => {
    if (state.phase !== 'show') return
    const { scorer } = state.show
    if (!scorer) return
    const isHumanManual =
      state.countingMode === 'manual' &&
      (scorer === 'human' || (scorer === 'crib' && state.dealer === 'human'))
    if (!isHumanManual) {
      const t = setTimeout(() => {
        dispatch({ type: 'AUTO_SCORE_SHOW' })
      }, 600 + Math.random() * 400)
      return () => clearTimeout(t)
    }
  }, [state.phase, state.show.scorer, state.countingMode, state.dealer])

  function handleDiscardCardClick(card: Card) {
    setDiscardSelected(prev => {
      if (prev.includes(card.id)) return prev.filter(id => id !== card.id)
      if (prev.length >= 2) return prev
      return [...prev, card.id]
    })
  }

  function handleConfirmDiscard() {
    if (discardSelected.length !== 2) return
    const [id1, id2] = discardSelected
    const c1 = state.humanHand.find(c => c.id === id1)!
    const c2 = state.humanHand.find(c => c.id === id2)!
    dispatch({ type: 'HUMAN_DISCARD', cards: [c1, c2] })
    setTimeout(() => {
      dispatch({ type: 'COMPUTER_DISCARD' })
    }, 400 + Math.random() * 400)
  }

  return (
    <div className="app">
      {state.phase === 'home' && (
        <HomeScreen
          countingMode={state.countingMode}
          onStart={() => dispatch({ type: 'START_CUT_FOR_DEAL' })}
          onToggleMode={() =>
            dispatch({
              type: 'SET_COUNTING_MODE',
              mode: state.countingMode === 'auto' ? 'manual' : 'auto',
            })
          }
        />
      )}

      {state.phase === 'cutForDeal' && state.cutForDeal && (
        <CutForDeal
          deck={state.cutForDeal.deck}
          humanCut={state.cutForDeal.humanCut}
          computerCut={state.cutForDeal.computerCut}
          result={state.cutForDeal.result}
          onHumanCut={idx => dispatch({ type: 'HUMAN_CUT', cardIndex: idx })}
          onComputerCut={() => dispatch({ type: 'COMPUTER_CUT' })}
          onContinue={() => dispatch({ type: 'FINISH_CUT_FOR_DEAL' })}
        />
      )}

      {PLAY_PHASES.has(state.phase) && (
        <GameBoard
          state={state}
          dispatch={dispatch}
          discardSelected={discardSelected}
          onDiscardCardClick={handleDiscardCardClick}
          onConfirmDiscard={handleConfirmDiscard}
          onShowHelp={() => setShowHelp(true)}
          onQuit={() => setConfirmQuit(true)}
        />
      )}

      {state.phase === 'gameover' && state.winner && (
        <GameOverScreen
          winner={state.winner}
          humanScore={state.humanScore}
          computerScore={state.computerScore}
          onPlayAgain={() => dispatch({ type: 'PLAY_AGAIN' })}
        />
      )}

      <ScoringToast
        message={state.lastScoringEvent}
        onDone={() => dispatch({ type: 'CLEAR_SCORING_EVENT' })}
      />

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      {confirmQuit && (
        <ConfirmModal
          message="Quit to home? Your game progress will be lost."
          onConfirm={() => { dispatch({ type: 'PLAY_AGAIN' }); setConfirmQuit(false) }}
          onCancel={() => setConfirmQuit(false)}
        />
      )}
    </div>
  )
}
