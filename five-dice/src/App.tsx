import { useState, useEffect, useCallback } from 'react'
import './App.css'
import type { GameState, CategoryKey } from './gameLogic'
import {
  rollDice, handleScoreCategory, calcGrandTotal,
  loadHighScore, saveHighScore,
  saveGameState, loadGameState, clearGameState,
} from './gameLogic'
import HomeScreen from './components/HomeScreen'
import PlayScreen from './components/PlayScreen'
import GameOverScreen from './components/GameOverScreen'

const INITIAL_DICE = Array.from({ length: 5 }, () => ({ value: 1, held: false }))

function makeInitialState(): GameState {
  return {
    dice: INITIAL_DICE,
    rollCount: 0,
    scores: {},
    fiveOfAKindBonus: 0,
    gamePhase: 'home',
  }
}

export default function App() {
  const [state, setState] = useState<GameState>(makeInitialState)
  const [highScore, setHighScore] = useState<number | null>(() => loadHighScore())
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('five-dice-theme') as 'light' | 'dark') ?? 'light'
  })
  const [helpOpen, setHelpOpen] = useState(false)
  const [confirmQuit, setConfirmQuit] = useState(false)
  const [isNewHighScore, setIsNewHighScore] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('five-dice-theme', theme)
  }, [theme])

  useEffect(() => {
    if (state.gamePhase === 'playing') {
      saveGameState(state)
    }
  }, [state])

  const startGame = useCallback((resume = false) => {
    if (resume) {
      const saved = loadGameState()
      if (saved) {
        setState({ ...saved, gamePhase: 'playing' })
        return
      }
    }
    clearGameState()
    setState({ ...makeInitialState(), gamePhase: 'playing' })
    setIsNewHighScore(false)
  }, [])

  const goHome = useCallback(() => {
    clearGameState()
    setState(makeInitialState())
    setIsNewHighScore(false)
  }, [])

  const handleRoll = useCallback(() => {
    setState(prev => {
      if (prev.rollCount >= 3) return prev
      return { ...prev, dice: rollDice(prev.dice), rollCount: prev.rollCount + 1 }
    })
  }, [])

  const handleToggleHold = useCallback((index: number) => {
    setState(prev => {
      if (prev.rollCount === 0) return prev
      const dice = prev.dice.map((d, i) => i === index ? { ...d, held: !d.held } : d)
      return { ...prev, dice }
    })
  }, [])

  const handleScore = useCallback((key: CategoryKey) => {
    setState(prev => {
      const next = handleScoreCategory(key, prev)
      if (next.gamePhase === 'gameOver') {
        const total = calcGrandTotal(next.scores, next.fiveOfAKindBonus)
        const currentHigh = loadHighScore()
        if (currentHigh === null || total > currentHigh) {
          saveHighScore(total)
          setHighScore(total)
          setIsNewHighScore(true)
        }
        clearGameState()
      }
      return next
    })
  }, [])

  const hasSavedGame = loadGameState() !== null

  return (
    <div className="app">
      {state.gamePhase === 'home' && (
        <HomeScreen
          highScore={highScore}
          onStart={() => startGame(false)}
          onResume={hasSavedGame ? () => startGame(true) : undefined}
          theme={theme}
          onToggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
          onHelp={() => setHelpOpen(true)}
          helpOpen={helpOpen}
          onCloseHelp={() => setHelpOpen(false)}
        />
      )}
      {state.gamePhase === 'playing' && (
        <PlayScreen
          state={state}
          onRoll={handleRoll}
          onToggleHold={handleToggleHold}
          onScore={handleScore}
          onQuit={() => setConfirmQuit(true)}
          confirmQuit={confirmQuit}
          onConfirmQuit={() => { setConfirmQuit(false); goHome() }}
          onCancelQuit={() => setConfirmQuit(false)}
          theme={theme}
          onToggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
          helpOpen={helpOpen}
          onHelp={() => setHelpOpen(true)}
          onCloseHelp={() => setHelpOpen(false)}
        />
      )}
      {state.gamePhase === 'gameOver' && (
        <GameOverScreen
          scores={state.scores}
          fiveOfAKindBonus={state.fiveOfAKindBonus}
          highScore={highScore}
          isNewHighScore={isNewHighScore}
          onPlayAgain={() => startGame(false)}
          onHome={goHome}
          theme={theme}
          onToggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
        />
      )}
    </div>
  )
}
