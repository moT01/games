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
            <li>Red moves first. Players alternate turns.</li>
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

function App() {
  const [phase, setPhase] = useState<Phase>('setup')
  const [board, setBoard] = useState<Board>(createInitialBoard())
  const [currentTurn, setCurrentTurn] = useState<Player>('Red')
  const [mode, setMode] = useState<Mode>('vs-player')
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [playerSide, setPlayerSide] = useState<Player>('Red')
  const [winner, setWinner] = useState<Player | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [validMovesForSelected, setValidMovesForSelected] = useState<Move[]>([])
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('checkers_theme') as Theme) || 'dark'
  )
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    document.body.classList.remove('dark-palette', 'light-palette')
    document.body.classList.add(theme === 'light' ? 'light-palette' : 'dark-palette')
    localStorage.setItem('checkers_theme', theme)
  }, [theme])

  function toggleTheme() {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'))
  }

  function startGame(selectedMode: Mode, selectedDifficulty: Difficulty, selectedSide: Player) {
    setMode(selectedMode)
    setDifficulty(selectedDifficulty)
    setPlayerSide(selectedSide)
    setBoard(createInitialBoard())
    setCurrentTurn('Red')
    setWinner(null)
    setSelectedIndex(null)
    setValidMovesForSelected([])
    setPhase('playing')
  }

  function resetGame() {
    setPhase('setup')
  }

  function executeMove(b: Board, move: Move, player: Player) {
    const newBoard = applyMove(b, move)
    const nextPlayer: Player = player === 'Red' ? 'Black' : 'Red'
    const win = checkWinner(newBoard, nextPlayer)
    setBoard(newBoard)
    setSelectedIndex(null)
    setValidMovesForSelected([])
    if (win) {
      setWinner(win)
      setPhase('over')
    } else {
      setCurrentTurn(nextPlayer)
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

  return (
    <div className="app">
      <div className="game-card">
        <Header
          showBack={phase !== 'setup'}
          onBack={resetGame}
          theme={theme}
          onThemeToggle={toggleTheme}
          onHelp={() => setShowHelp(true)}
        />
        <div className="game-card__body">
          {phase === 'setup' && (
            <>
              <div className="game-card__title-section">
                <h1 className="game-title">Checkers</h1>
              </div>
              <ModeSelector onStart={startGame} />
            </>
          )}
          {phase !== 'setup' && (
            <>
              <GameStatus
                phase={phase}
                currentTurn={currentTurn}
                winner={winner}
                onPlayAgain={resetGame}
              />
              <GameBoard
                board={board}
                selectedIndex={selectedIndex}
                validMoveDestinations={validMoveDestinations}
                onSquareClick={handleSquareClick}
                disabled={isDisabled}
              />
            </>
          )}
        </div>
      </div>
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  )
}

export default App
