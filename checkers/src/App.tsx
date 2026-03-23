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
import './App.css'

type Phase = 'setup' | 'playing' | 'over'

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

    // If a destination is clicked while a piece is selected, execute the move
    if (selectedIndex !== null) {
      const move = validMovesForSelected.find(m => m.to === index)
      if (move) {
        executeMove(board, move, currentTurn)
        return
      }
    }

    // Try to select the clicked piece
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
      <h1 className="app__title">Checkers</h1>
      {phase === 'setup' && <ModeSelector onStart={startGame} />}
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
  )
}

export default App
