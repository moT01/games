import type { Board as BoardType } from '../gameLogic'
import { Square } from './Square'
import './Board.css'

interface Props {
  board: BoardType
  onSquareClick: (index: number) => void
  disabled: boolean
  winningSquares: number[]
}

export function Board({ board, onSquareClick, disabled, winningSquares }: Props) {
  return (
    <div className="board">
      {board.map((value, i) => (
        <Square
          key={i}
          value={value}
          onClick={() => onSquareClick(i)}
          disabled={disabled || value !== null}
          isWinner={winningSquares.includes(i)}
        />
      ))}
    </div>
  )
}
