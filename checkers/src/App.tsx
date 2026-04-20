import { useEffect, useState } from 'react'
import {
  createInitialBoard,
  checkWinner,
  applyMove,
  getValidMovesForPiece,
  getComputerMove,
  type Board,
  type Difficulty,
  type Mode,
  type Move,
  type Player,
} from './gameLogic'
import { Board as GameBoard } from './components/Board'
import { GameStatus } from './components/GameStatus'
import { ModeSelector } from './components/ModeSelector'
import { Header } from './components/Header'
import './App.css'

type Phase = 'setup' | 'playing' | 'over'
type Theme = 'dark' | 'light'

const SAVE_KEY = 'checkers_state'

type SavedState = {
  board: Board
  currentTurn: Player
  mode: Mode
  difficulty: Difficulty
  playerSide: Player
}

function loadSavedGame(): SavedState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SavedState
  } catch {
    return null
  }
}

function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">How to Play</h2>
        <div className="modal-content">
          <h3>Objective</h3>
          <p>Capture all of your opponent's pieces, or leave them with no valid moves.</p>
          <h3>Rules</h3>
          <ul>
            <li>Light moves first. Players alternate turns.</li>
            <li>Pieces move diagonally forward one square at a time.</li>
            <li>Capture by jumping over an opponent's piece into the empty square behind it.</li>
            <li>If a jump is available you must take it. Chain jumps are required when possible.</li>
            <li>Reach your opponent's back row to become a King. Kings can move and capture in any diagonal direction.</li>
          </ul>
        </div>
        <div className="modal-actions">
          <button className="primary-btn" onClick={onClose}>Got it</button>
        </div>
      </div>
    </div>
  )
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

function App() {
  const [phase, setPhase] = useState<Phase>('setup')
  const [board, setBoard] = useState<Board>(createInitialBoard())
  const [currentTurn, setCurrentTurn] = useState<Player>('Light')
  const [mode, setMode] = useState<Mode>('vs-player')
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [playerSide, setPlayerSide] = useState<Player>('Light')
  const [winner, setWinner] = useState<Player | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [validMovesForSelected, setValidMovesForSelected] = useState<Move[]>([])
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('checkers_theme') as Theme) || 'dark'
  )
  const [showHelp, setShowHelp] = useState(false)
  const [showQuitConfirm, setShowQuitConfirm] = useState(false)
  const [hasSavedGame, setHasSavedGame] = useState(() => loadSavedGame() !== null)
  const [winsNormal, setWinsNormal] = useState(
    () => parseInt(localStorage.getItem('checkers_wins_normal') || '0')
  )
  const [winsHard, setWinsHard] = useState(
    () => parseInt(localStorage.getItem('checkers_wins_hard') || '0')
  )

  useEffect(() => {
    document.body.classList.remove('dark-palette', 'light-palette')
    document.body.classList.add(theme === 'light' ? 'light-palette' : 'dark-palette')
    localStorage.setItem('checkers_theme', theme)
  }, [theme])

  function toggleTheme() {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'))
  }

  function saveGame(b: Board, turn: Player, m: Mode, diff: Difficulty, side: Player) {
    const state: SavedState = { board: b, currentTurn: turn, mode: m, difficulty: diff, playerSide: side }
    localStorage.setItem(SAVE_KEY, JSON.stringify(state))
    setHasSavedGame(true)
  }

  function clearSavedGame() {
    localStorage.removeItem(SAVE_KEY)
    setHasSavedGame(false)
  }

  function startGame(selectedMode: Mode, selectedDifficulty: Difficulty, selectedSide: Player) {
    clearSavedGame()
    setMode(selectedMode)
    setDifficulty(selectedDifficulty)
    setPlayerSide(selectedSide)
    setBoard(createInitialBoard())
    setCurrentTurn('Light')
    setWinner(null)
    setSelectedIndex(null)
    setValidMovesForSelected([])
    setPhase('playing')
  }

  function resumeGame() {
    const saved = loadSavedGame()
    if (!saved) return
    setBoard(saved.board)
    setCurrentTurn(saved.currentTurn)
    setMode(saved.mode)
    setDifficulty(saved.difficulty)
    setPlayerSide(saved.playerSide)
    setWinner(null)
    setSelectedIndex(null)
    setValidMovesForSelected([])
    setPhase('playing')
  }

  function handleBack() {
    if (phase === 'playing') {
      setShowQuitConfirm(true)
    } else {
      setPhase('setup')
    }
  }

  function handleQuit() {
    setShowQuitConfirm(false)
    setPhase('setup')
  }

  function executeMove(b: Board, move: Move, player: Player) {
    const newBoard = applyMove(b, move)
    const nextPlayer: Player = player === 'Light' ? 'Dark' : 'Light'
    const win = checkWinner(newBoard, nextPlayer)
    setBoard(newBoard)
    setSelectedIndex(null)
    setValidMovesForSelected([])
    if (win) {
      setWinner(win)
      setPhase('over')
      clearSavedGame()
      if (mode === 'vs-computer' && win === playerSide) {
        if (difficulty === 'hard') {
          const next = winsHard + 1
          setWinsHard(next)
          localStorage.setItem('checkers_wins_hard', String(next))
        } else {
          const next = winsNormal + 1
          setWinsNormal(next)
          localStorage.setItem('checkers_wins_normal', String(next))
        }
      }
    } else {
      setCurrentTurn(nextPlayer)
      saveGame(newBoard, nextPlayer, mode, difficulty, playerSide)
    }
  }

  function handleSquareClick(index: number) {
    if (phase !== 'playing') return
    if (mode === 'vs-computer' && currentTurn !== playerSide) return

    if (selectedIndex !== null) {
      const move = validMovesForSelected.find(m => m.to === index)
      if (move) {
        executeMove(board, move, currentTurn)
        return
      }
    }

    const piece = board[index]
    if (!piece || piece.player !== currentTurn) {
      setSelectedIndex(null)
      setValidMovesForSelected([])
      return
    }

    const moves = getValidMovesForPiece(board, index, currentTurn)
    if (moves.length === 0) {
      setSelectedIndex(null)
      setValidMovesForSelected([])
      return
    }

    setSelectedIndex(index)
    setValidMovesForSelected(moves)
  }

  useEffect(() => {
    if (phase !== 'playing') return
    if (mode !== 'vs-computer') return
    if (currentTurn === playerSide) return

    const timer = setTimeout(() => {
      const move = getComputerMove(board, difficulty, currentTurn)
      executeMove(board, move, currentTurn)
    }, 400)

    return () => clearTimeout(timer)
  }, [currentTurn, phase])

  const isDisabled =
    phase !== 'playing' || (mode === 'vs-computer' && currentTurn !== playerSide)

  const validMoveDestinations = validMovesForSelected.map(m => m.to)
  const intermediateSquares = [...new Set(validMovesForSelected.flatMap(m => {
    if (m.captures.length <= 1) return []
    const squares: number[] = []
    let pos = m.from
    for (let i = 0; i < m.captures.length - 1; i++) {
      const land = 2 * m.captures[i] - pos
      squares.push(land)
      pos = land
    }
    return squares
  }))]

  return (
    <div className="app">
      <div className="game-card">
        <Header
          showBack={phase !== 'setup'}
          onBack={handleBack}
          theme={theme}
          onThemeToggle={toggleTheme}
          onHelp={() => setShowHelp(true)}
        />
        <div className="game-card__body">
          {phase === 'setup' && (
            <>
              <div className="game-card__title-section">
                <h1 className="game-title">Checkers</h1>
                <p className="game-subtitle">A CLASSIC BOARD GAME</p>
              </div>
              <ModeSelector
                onStart={startGame}
                onResume={resumeGame}
                hasSavedGame={hasSavedGame}
                winsNormal={winsNormal}
                winsHard={winsHard}
              />
            </>
          )}
          {phase !== 'setup' && (
            <>
              <GameStatus
                phase={phase}
                currentTurn={currentTurn}
                winner={winner}
                onPlayAgain={handleBack}
              />
              <GameBoard
                board={board}
                selectedIndex={selectedIndex}
                validMoveDestinations={validMoveDestinations}
                jumpDestinations={intermediateSquares}
                currentTurn={currentTurn}
                onSquareClick={handleSquareClick}
                disabled={isDisabled}
              />
            </>
          )}
        </div>
      </div>
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showQuitConfirm && <QuitModal onCancel={() => setShowQuitConfirm(false)} onQuit={handleQuit} />}
    </div>
  )
}

export default App
