import { useEffect, useState } from 'react'
import {
  checkDraw,
  checkWinner,
  getComputerMove,
  getWinningLine,
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
  const [board, setBoard] = useState<Board>(Array(9).fill(null))
  const [currentTurn, setCurrentTurn] = useState<Player>('X')
  const [mode, setMode] = useState<Mode>('vs-player')
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [playerSide, setPlayerSide] = useState<Player>('X')
  const [winner, setWinner] = useState<Player | null>(null)
  const [isDraw, setIsDraw] = useState(false)
  const [winningLine, setWinningLine] = useState<number[] | null>(null)

  function startGame(
    selectedMode: Mode,
    selectedDifficulty: Difficulty,
    selectedSide: Player,
  ) {
    setMode(selectedMode)
    setDifficulty(selectedDifficulty)
    setPlayerSide(selectedSide)
    setBoard(Array(9).fill(null))
    setCurrentTurn('X')
    setWinner(null)
    setIsDraw(false)
    setWinningLine(null)
    setPhase('playing')
  }

  function resetGame() {
    setPhase('setup')
  }

  function applyMove(b: Board, index: number, player: Player): void {
    const next = [...b]
    next[index] = player
    const win = checkWinner(next)
    const draw = checkDraw(next)
    setBoard(next)
    if (win) {
      setWinner(win)
      setWinningLine(getWinningLine(next))
      setPhase('over')
    } else if (draw) {
      setIsDraw(true)
      setPhase('over')
    } else {
      setCurrentTurn(player === 'X' ? 'O' : 'X')
    }
  }

  function handleSquareClick(index: number) {
    if (phase !== 'playing') return
    if (board[index]) return
    if (mode === 'vs-computer' && currentTurn !== playerSide) return
    applyMove(board, index, currentTurn)
  }

  useEffect(() => {
    if (phase !== 'playing') return
    if (mode !== 'vs-computer') return
    if (currentTurn === playerSide) return

    const index = getComputerMove(board, difficulty)
    applyMove(board, index, currentTurn)
  }, [currentTurn, phase])

  return (
    <div className="app">
      <h1 className="app__title">Tic-Tac-Toe</h1>
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
            onSquareClick={handleSquareClick}
            disabled={phase !== 'playing' || (mode === 'vs-computer' && currentTurn !== playerSide)}
            winningSquares={winningLine ?? []}
          />
        </>
      )}
    </div>
  )
}

export default App
