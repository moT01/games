import { useReducer, useEffect, useState } from 'react'
import { reducer, makeInitialState } from './reducer'
import type { Card } from './gameLogic'

import HomeScreen from './components/HomeScreen'
import GameBoard from './components/GameBoard'
import GameOverScreen from './components/GameOverScreen'
import HelpModal from './components/HelpModal'
import ConfirmModal from './components/ConfirmModal'

import './App.css'

const PLAY_PHASES = new Set(['cutForDeal', 'dealing', 'discard', 'cut', 'play', 'show', 'summary'])
const DONATE_URL = 'https://www.freecodecamp.org/donate'

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, makeInitialState)
  const [showHelp, setShowHelp] = useState(false)
  const [confirmQuit, setConfirmQuit] = useState(false)
  const [discardSelected, setDiscardSelected] = useState<string[]>([])
  const [theme, setTheme] = useState<'dark' | 'light'>(
    () => (localStorage.getItem('crib-theme') as 'dark' | 'light') ?? 'dark'
  )

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('crib-theme', theme)
  }, [theme])

  function toggleTheme() {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'))
  }

  useEffect(() => {
    setDiscardSelected([])
  }, [state.phase])

  useEffect(() => {
    if (state.phase === 'dealing') {
      dispatch({ type: 'DEAL_HANDS' })
    }
  }, [state.phase])

  // Auto-fire computer cut after human cuts in cutForDeal
  useEffect(() => {
    if (state.phase !== 'cutForDeal') return
    if (!state.cutForDeal?.humanCut || state.cutForDeal.computerCut) return
    const t = setTimeout(() => dispatch({ type: 'COMPUTER_CUT' }), 700)
    return () => clearTimeout(t)
  }, [state.phase, state.cutForDeal?.humanCut, state.cutForDeal?.computerCut])

  useEffect(() => {
    if (state.phase === 'cut' && state.dealer === 'human') {
      const t = setTimeout(() => dispatch({ type: 'CUT_STARTER' }), 800)
      return () => clearTimeout(t)
    }
  }, [state.phase, state.dealer])

  useEffect(() => {
    if (state.phase !== 'play' || state.pegging.turn !== 'computer') return
    const t = setTimeout(() => dispatch({ type: 'COMPUTER_PLAY_CARD' }), 400 + Math.random() * 400)
    return () => clearTimeout(t)
  }, [state.phase, state.pegging.turn, state.pegging.currentCount])

  useEffect(() => {
    if (state.phase !== 'show') return
    const { scorer } = state.show
    if (!scorer) return
    const isHumanManual = scorer === 'human' || (scorer === 'crib' && state.dealer === 'human')
    if (!isHumanManual) {
      const t = setTimeout(() => dispatch({ type: 'AUTO_SCORE_SHOW' }), 600 + Math.random() * 400)
      return () => clearTimeout(t)
    }
  }, [state.phase, state.show.scorer, state.dealer])

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
    setTimeout(() => dispatch({ type: 'COMPUTER_DISCARD' }), 400 + Math.random() * 400)
  }

  const isPlayPhase = PLAY_PHASES.has(state.phase)

  return (
    <div className="app">
      {state.phase === 'home' && (
        <div className="app-corner">
          <button className="app-corner__btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? '☀' : '☽'}
          </button>
          <a className="app-corner__btn" href={DONATE_URL} target="_blank" rel="noreferrer" aria-label="Donate">
            ♥
          </a>
        </div>
      )}

      {state.phase === 'home' && (
        <HomeScreen
          onStart={() => dispatch({ type: 'START_CUT_FOR_DEAL' })}
        />
      )}

      {isPlayPhase && (
        <GameBoard
          state={state}
          dispatch={dispatch}
          discardSelected={discardSelected}
          onDiscardCardClick={handleDiscardCardClick}
          onConfirmDiscard={handleConfirmDiscard}
          onShowHelp={() => setShowHelp(true)}
          onQuit={() => setConfirmQuit(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
          donateUrl={DONATE_URL}
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
