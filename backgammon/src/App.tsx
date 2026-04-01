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
import { StatusBar } from './components/StatusBar'
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
  const opponent: Color = s.currentPlayer === 'white' ? 'black' : 'white'
  return beginTurn({ ...s, currentPlayer: opponent })
}

const MODE_SELECT_STATE: GameState = {
  points: [],
  bar: { white: 0, black: 0 },
  off: { white: 0, black: 0 },
  currentPlayer: 'white',
  dice: [],
  diceRolled: false,
  phase: 'mode-select',
  winner: null,
  mode: null,
  selectedPoint: null,
  validMoves: [],
  forcedSkip: false,
}

export default function App() {
  const [state, setState] = useState<GameState>(MODE_SELECT_STATE)
  const [showHelp, setShowHelp] = useState(false)
  const [diceAnimKey, setDiceAnimKey] = useState(0)

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
      state.currentPlayer !== 'black' ||
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
    setState(beginTurn(initGame(mode)))
  }

  function handlePlayAgain() {
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
    if (state.mode === 'vs-ai' && state.currentPlayer === 'black') return

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
    if (state.mode === 'vs-ai' && state.currentPlayer === 'black') return
    if (state.bar[state.currentPlayer] === 0) return
    const moves = getValidMovesForChecker(state, 'bar')
    setState(s => ({ ...s, selectedPoint: -1, validMoves: moves }))
  }

  function handleOffClick() {
    if (state.phase !== 'playing') return
    if (state.mode === 'vs-ai' && state.currentPlayer === 'black') return
    const move = state.validMoves.find(m => m.to === 'off')
    if (move) executeMove(move)
  }

  if (state.phase === 'mode-select') {
    return <ModeSelect onSelect={handleModeSelect} />
  }

  return (
    <div className="app">
      <header className="app__header">
        <StatusBar
          currentPlayer={state.currentPlayer}
          forcedSkip={state.forcedSkip}
          phase={state.phase}
          winner={state.winner}
        />
        <button className="app__help-btn" onClick={() => setShowHelp(true)}>?</button>
      </header>

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
        <WinModal winner={state.winner} onPlayAgain={handlePlayAgain} />
      )}

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  )
}
