import { useState, useRef, useEffect, useCallback } from 'react'
import './App.css'
import type { GameState, Language, VarType, PersonalBests, Difficulty } from './gameLogic'
import {
  makeInitialPersonalBests,
  generateQueue,
  advanceQueue,
  recordWin,
  recordFail,
  checkDrop,
  DIFFICULTY_COUNT,
} from './gameLogic'
import HomeScreen from './HomeScreen'
import PlayScreen from './PlayScreen'
import WinScreen from './WinScreen'
import FailScreen from './FailScreen'
import HelpModal from './HelpModal'
import ConfirmModal from './ConfirmModal'

function loadPersonalBests(): PersonalBests {
  try {
    const raw = localStorage.getItem('vs_personal_bests')
    if (raw) return JSON.parse(raw) as PersonalBests
  } catch {}
  return makeInitialPersonalBests()
}

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('vs_theme') as 'light' | 'dark') ?? 'dark'
  })

  const [showHelp, setShowHelp] = useState(false)
  const [showQuitConfirm, setShowQuitConfirm] = useState(false)

  const [state, setState] = useState<GameState>(() => {
    const personalBests = loadPersonalBests()
    const language = (localStorage.getItem('vs_last_language') as Language | null) ?? 'javascript'
    const rawDifficulty = localStorage.getItem('vs_last_difficulty')
    const difficulty: Difficulty = (['easy', 'medium', 'hard'] as const).includes(rawDifficulty as Difficulty)
      ? (rawDifficulty as Difficulty)
      : 'easy'
    return {
      phase: 'home',
      language,
      difficulty,
      queue: [],
      current: null,
      next: null,
      sorted: 0,
      startTime: null,
      endTime: null,
      failedDrop: null,
      dragging: false,
      personalBests,
    }
  })

  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('vs_theme', next)
  }

  function setLanguage(language: Language) {
    setState(s => ({ ...s, language }))
    localStorage.setItem('vs_last_language', language)
  }

  function setDifficulty(difficulty: Difficulty) {
    setState(s => ({ ...s, difficulty }))
    localStorage.setItem('vs_last_difficulty', difficulty)
  }

  function startGame() {
    const s = stateRef.current
    const queue = generateQueue(s.language, s.difficulty)
    const current = queue[0] ?? null
    const next = queue[1] ?? null
    const remaining = queue.slice(2)
    setState(prev => ({
      ...prev,
      phase: 'playing',
      queue: remaining,
      current,
      next,
      sorted: 0,
      startTime: Date.now(),
      endTime: null,
      failedDrop: null,
      dragging: false,
    }))
  }

  const handleDrop = useCallback((bucketType: VarType): 'correct' | 'wrong' => {
    const s = stateRef.current
    if (!s.current || s.failedDrop !== null) return 'wrong'

    const isCorrect = checkDrop(bucketType, s.current)

    if (isCorrect) {
      const newSorted = s.sorted + 1
      if (newSorted === DIFFICULTY_COUNT[s.difficulty]) {
        const winPatch = recordWin({ ...s, sorted: newSorted })
        const newBests = winPatch.personalBests!
        localStorage.setItem('vs_personal_bests', JSON.stringify(newBests))
        setState(prev => ({ ...prev, ...winPatch, sorted: newSorted }))
      } else {
        setState(prev => {
          const advance = advanceQueue(prev)
          return { ...prev, ...advance, sorted: prev.sorted + 1 }
        })
      }
      return 'correct'
    } else {
      // Set failedDrop immediately to guard against double-drops, delay phase change for flash
      const failPatch = recordFail(s, bucketType)
      setState(prev => ({ ...prev, failedDrop: failPatch.failedDrop! }))
      setTimeout(() => {
        setState(prev => ({ ...prev, ...failPatch }))
      }, 150)
      return 'wrong'
    }
  }, [])

  function goHome() {
    setState(s => ({
      ...s,
      phase: 'home',
      queue: [],
      current: null,
      next: null,
      sorted: 0,
      startTime: null,
      endTime: null,
      failedDrop: null,
      dragging: false,
    }))
    setShowQuitConfirm(false)
  }

  function retryGame() {
    setState(s => ({
      ...s,
      failedDrop: null,
    }))
    startGame()
  }

  function handleQuitRequest() {
    setShowQuitConfirm(true)
  }

  return (
    <div className="app">
      {state.phase === 'home' && (
        <HomeScreen
          language={state.language}
          difficulty={state.difficulty}
          personalBests={state.personalBests}
          theme={theme}
          onLanguageChange={setLanguage}
          onDifficultyChange={setDifficulty}
          onStart={startGame}
          onToggleTheme={toggleTheme}
          onShowHelp={() => setShowHelp(true)}
        />
      )}
      {state.phase === 'playing' && (
        <PlayScreen
          state={state}
          onDrop={handleDrop}
          onQuit={handleQuitRequest}
          onShowHelp={() => setShowHelp(true)}
        />
      )}
      {state.phase === 'win' && (
        <WinScreen
          language={state.language}
          difficulty={state.difficulty}
          endTime={state.endTime!}
          startTime={state.startTime!}
          personalBests={state.personalBests}
          onPlayAgain={retryGame}
          onChangeSettings={goHome}
        />
      )}
      {state.phase === 'fail' && (
        <FailScreen
          failedDrop={state.failedDrop!}
          endTime={state.endTime!}
          startTime={state.startTime!}
          onTryAgain={retryGame}
          onChangeSettings={goHome}
        />
      )}
      {showHelp && (
        <HelpModal
          language={state.language}
          onClose={() => setShowHelp(false)}
        />
      )}
      {showQuitConfirm && (
        <ConfirmModal
          message="Quit this run?"
          onConfirm={goHome}
          onCancel={() => setShowQuitConfirm(false)}
        />
      )}
    </div>
  )
}

export default App
