import { useEffect, useState } from 'react'
import {
  checkDraw,
  checkWinner,
  dropPiece,
  getComputerMove,
  getWinningCells,
  isColumnFull,
  ROWS,
  COLS,
  type Board,
  type Difficulty,
  type Mode,
  type Player,
} from './gameLogic'
import { Board as GameBoard } from './components/Board'
import { GameStatus } from './components/GameStatus'
import { ModeSelector } from './components/ModeSelector'
import './App.css'

type Phase = 'setup' | 'playing' | 'over'

function App() {
  const [phase, setPhase] = useState<Phase>('setup')
  const [board, setBoard] = useState<Board>(Array(ROWS * COLS).fill(null))
  const [currentTurn, setCurrentTurn] = useState<Player>('Red')
  const [mode, setMode] = useState<Mode>('vs-player')
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [playerSide, setPlayerSide] = useState<Player>('Red')
  const [winner, setWinner] = useState<Player | null>(null)
  const [isDraw, setIsDraw] = useState(false)
  const [winningCells, setWinningCells] = useState<number[]>([])

  function startGame(selectedMode: Mode, selectedDifficulty: Difficulty, selectedSide: Player) {
    setMode(selectedMode)
    setDifficulty(selectedDifficulty)
    setPlayerSide(selectedSide)
    setBoard(Array(ROWS * COLS).fill(null))
    setCurrentTurn('Red')
    setWinner(null)
    setIsDraw(false)
    setWinningCells([])
    setPhase('playing')
  }

  function resetGame() {
    setPhase('setup')
  }

  function applyMove(b: Board, col: number, player: Player): void {
    const next = [...b]
    const idx = dropPiece(next, col, player)
    if (idx === null) return
    const win = checkWinner(next)
    const draw = checkDraw(next)
    setBoard(next)
    if (win) {
      setWinner(win)
      setWinningCells(getWinningCells(next) ?? [])
      setPhase('over')
    } else if (draw) {
      setIsDraw(true)
      setPhase('over')
    } else {
      setCurrentTurn(player === 'Red' ? 'Yellow' : 'Red')
    }
  }

  function handleColumnClick(col: number) {
    if (phase !== 'playing') return
    if (isColumnFull(board, col)) return
    if (mode === 'vs-computer' && currentTurn !== playerSide) return
    applyMove(board, col, currentTurn)
  }

  useEffect(() => {
    if (phase !== 'playing') return
    if (mode !== 'vs-computer') return
    if (currentTurn === playerSide) return

    const timer = setTimeout(() => {
      const col = getComputerMove(board, difficulty, currentTurn)
      applyMove(board, col, currentTurn)
    }, 400)

    return () => clearTimeout(timer)
  }, [currentTurn, phase])

  const boardDisabled =
    phase !== 'playing' || (mode === 'vs-computer' && currentTurn !== playerSide)

  return (
    <div className="app">
      <h1 className="app__title">Grid Connect</h1>
      {phase === 'setup' && <ModeSelector onStart={startGame} />}
      {phase !== 'setup' && (
        <>
          <GameStatus
            phase={phase}
            currentTurn={currentTurn}
            winner={winner}
            isDraw={isDraw}
            onPlayAgain={resetGame}
          />
          <GameBoard
            board={board}
            onColumnClick={handleColumnClick}
            disabled={boardDisabled}
            winningCells={winningCells}
            currentTurn={currentTurn}
          />
        </>
      )}
    </div>
  )
}

export default App
