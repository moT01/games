import { useState, useEffect } from 'react'
import './App.css'
import {
  type GameState,
  type Color,
  type ValidMove,
  initGame,
  rollDice,
  getAllValidMoves,
  getValidMovesForChecker,
  applyMove,
  checkWinner,
  getAIMove,
} from './gameLogic'
import { ModeSelect } from './components/ModeSelect'
import { Board } from './components/Board'
import { DiceDisplay } from './components/DiceDisplay'
import { Header } from './components/Header'
import { WinModal } from './components/WinModal'
import { HelpModal } from './components/HelpModal'

// Roll dice for the current player and detect forced skip.
function beginTurn(s: GameState): GameState {
  const dice = rollDice()
  const next = { ...s, dice, diceRolled: true, selectedPoint: null, validMoves: [], forcedSkip: false }
  const moves = getAllValidMoves(next)
  return moves.length === 0 ? { ...next, forcedSkip: true } : next
}

// Switch to the other player and begin their turn.
function advanceTurn(s: GameState): GameState {
  const opponent: Color = s.currentPlayer === 'light' ? 'dark' : 'light'
  return beginTurn({ ...s, currentPlayer: opponent })
}

function getStatus(s: GameState): { text: string; cls: string } {
  if (s.phase === 'game-over' && s.winner) {
    const label = s.winner === 'light' ? 'Light' : 'Dark'
    return { text: `${label} wins!`, cls: `game-header__status--${s.winner}` }
  }
  const label = s.currentPlayer === 'light' ? 'Light' : 'Dark'
  const msg = s.forcedSkip ? ' — No legal moves' : "'s turn"
  return { text: `${label}${msg}`, cls: `game-header__status--${s.currentPlayer}` }
}

const MODE_SELECT_STATE: GameState = {
  points: [],
  bar: { light: 0, dark: 0 },
  off: { light: 0, dark: 0 },
  currentPlayer: 'light',
  dice: [],
  diceRolled: false,
  phase: 'mode-select',
  winner: null,
  mode: null,
  selectedPoint: null,
  validMoves: [],
  forcedSkip: false,
}

const SAVE_KEY = 'backgammon_save'

function loadSavedGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as GameState
  } catch {
    return null
  }
}

function QuitModal({ onCancel, onQuit }: { onCancel: () => void; onQuit: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">Quit Game</h2>
        <div className="modal-content">
          <p>Return to the main menu? You can resume your game from there.</p>
        </div>
        <div className="modal-actions">
          <button className="secondary-btn" onClick={onCancel}>Cancel</button>
          <button className="primary-btn" onClick={onQuit}>Quit</button>
        </div>
      </div>
    </div>
  )
}

type Theme = 'dark' | 'light'

export default function App() {
  const [state, setState] = useState<GameState>(MODE_SELECT_STATE)
  const [showHelp, setShowHelp] = useState(false)
  const [diceAnimKey, setDiceAnimKey] = useState(0)
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('backgammon_theme') as Theme) || 'dark'
  )
  const [winsVsAi, setWinsVsAi] = useState(
    () => parseInt(localStorage.getItem('backgammon_wins') || '0')
  )
  const [hasSavedGame, setHasSavedGame] = useState(() => loadSavedGame() !== null)
  const [showQuitConfirm, setShowQuitConfirm] = useState(false)

  useEffect(() => {
    document.body.classList.remove('dark-palette', 'light-palette')
    document.body.classList.add(theme === 'light' ? 'light-palette' : 'dark-palette')
    localStorage.setItem('backgammon_theme', theme)
  }, [theme])

  function toggleTheme() {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'))
  }

  // Save game state to localStorage while playing; clear it otherwise.
  useEffect(() => {
    if (state.phase === 'playing') {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state))
      setHasSavedGame(true)
    } else {
      localStorage.removeItem(SAVE_KEY)
      setHasSavedGame(false)
    }
  }, [state])

  // Track wins vs AI for the human player (white).
  useEffect(() => {
    if (state.phase !== 'game-over' || !state.winner) return
    if (state.mode === 'vs-ai' && state.winner === 'light') {
      setWinsVsAi(w => {
        const next = w + 1
        localStorage.setItem('backgammon_wins', String(next))
        return next
      })
    }
  }, [state.phase, state.winner, state.mode])

  // Increment diceAnimKey each time dice are rolled so @keyframes replays.
  useEffect(() => {
    if (state.diceRolled) setDiceAnimKey(k => k + 1)
  }, [state.diceRolled, state.currentPlayer])

  // Auto-advance when no legal moves (forced skip).
  useEffect(() => {
    if (state.phase !== 'playing' || !state.forcedSkip) return
    const t = setTimeout(() => setState(curr => advanceTurn(curr)), 1500)
    return () => clearTimeout(t)
  }, [state.phase, state.forcedSkip])

  // AI turn: compute and execute the move sequence with delays.
  // Deps cover exactly the conditions that signal "AI's turn just started".
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (
      state.phase !== 'playing' ||
      state.mode !== 'vs-ai' ||
      state.currentPlayer !== 'dark' ||
      state.forcedSkip ||
      !state.diceRolled
    ) return

    const sequence = getAIMove(state)
    const timers: ReturnType<typeof setTimeout>[] = []

    if (sequence.length === 0) {
      const t = setTimeout(() => setState(curr => advanceTurn(curr)), 600)
      timers.push(t)
    } else {
      sequence.forEach((move, i) => {
        const t = setTimeout(() => {
          setState(curr => {
            const next = applyMove(curr, move)
            const winner = checkWinner(next)
            if (winner) return { ...next, phase: 'game-over', winner }
            if (i === sequence.length - 1) {
              const remaining = getAllValidMoves(next)
              if (next.dice.length === 0 || remaining.length === 0) return advanceTurn(next)
            }
            return next
          })
        }, 600 * (i + 1))
        timers.push(t)
      })
    }

    return () => timers.forEach(clearTimeout)
  }, [state.phase, state.mode, state.currentPlayer, state.diceRolled, state.forcedSkip]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleModeSelect(mode: 'vs-ai' | 'two-player') {
    localStorage.removeItem(SAVE_KEY)
    setHasSavedGame(false)
    setState(beginTurn(initGame(mode)))
  }

  function handleResume() {
    const saved = loadSavedGame()
    if (saved) setState(saved)
  }

  function handlePlayAgain() {
    setState(MODE_SELECT_STATE)
  }

  function handleClose() {
    if (state.phase === 'playing') {
      setShowQuitConfirm(true)
    } else {
      setState(MODE_SELECT_STATE)
    }
  }

  function handleQuit() {
    setShowQuitConfirm(false)
    setState(MODE_SELECT_STATE)
  }

  function executeMove(move: ValidMove) {
    setState(curr => {
      const next = applyMove(curr, move)
      const winner = checkWinner(next)
      if (winner) return { ...next, phase: 'game-over', winner }
      const remaining = getAllValidMoves(next)
      if (next.dice.length === 0 || remaining.length === 0) return advanceTurn(next)
      return next
    })
  }

  function handlePointClick(index: number) {
    if (state.phase !== 'playing') return
    if (state.mode === 'vs-ai' && state.currentPlayer === 'dark') return

    // If bar has checkers, only allow clicking valid bar-entry destinations.
    if (state.bar[state.currentPlayer] > 0) {
      const move = state.validMoves.find(m => m.to === index)
      if (move) executeMove(move)
      return
    }

    // Valid destination click — execute the move.
    const destMove = state.validMoves.find(m => m.to === index)
    if (destMove) {
      executeMove(destMove)
      return
    }

    // Checker selection.
    if (state.points[index]?.color === state.currentPlayer && state.points[index].count > 0) {
      const moves = getValidMovesForChecker(state, index)
      setState(s => ({ ...s, selectedPoint: moves.length > 0 ? index : null, validMoves: moves }))
    } else {
      setState(s => ({ ...s, selectedPoint: null, validMoves: [] }))
    }
  }

  function handleBarClick() {
    if (state.phase !== 'playing') return
    if (state.mode === 'vs-ai' && state.currentPlayer === 'dark') return
    if (state.bar[state.currentPlayer] === 0) return
    const moves = getValidMovesForChecker(state, 'bar')
    setState(s => ({ ...s, selectedPoint: -1, validMoves: moves }))
  }

  function handleOffClick() {
    if (state.phase !== 'playing') return
    if (state.mode === 'vs-ai' && state.currentPlayer === 'dark') return
    const move = state.validMoves.find(m => m.to === 'off')
    if (move) executeMove(move)
  }

  if (state.phase === 'mode-select') {
    return (
      <div className="app">
        <ModeSelect
          onSelect={handleModeSelect}
          onResume={handleResume}
          hasSavedGame={hasSavedGame}
          winsVsAi={winsVsAi}
          theme={theme}
          onThemeToggle={toggleTheme}
          onHelp={() => setShowHelp(true)}
        />
        {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      </div>
    )
  }

  const status = getStatus(state)

  return (
    <div className="app app--game">
      <Header
        showClose={true}
        onClose={handleClose}
        theme={theme}
        onThemeToggle={toggleTheme}
        onHelp={() => setShowHelp(true)}
        statusText={status.text}
        statusClass={status.cls}
      />

      <main className="app__main">
        <Board
          state={state}
          onPointClick={handlePointClick}
          onBarClick={handleBarClick}
          onOffClick={handleOffClick}
        />
        <DiceDisplay dice={state.dice} diceAnimKey={diceAnimKey} />
      </main>

      {state.phase === 'game-over' && state.winner && (
        <WinModal winner={state.winner} onPlayAgain={handlePlayAgain} onMainMenu={() => setState(MODE_SELECT_STATE)} />
      )}

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showQuitConfirm && <QuitModal onCancel={() => setShowQuitConfirm(false)} onQuit={handleQuit} />}
    </div>
  )
}
