import type { Board as BoardType } from '../gameLogic'
import { Square } from './Square'
import './Board.css'

interface Props {
  board: BoardType
  selectedIndex: number | null
  validMoveDestinations: number[]
  onSquareClick: (index: number) => void
  disabled: boolean
}

export function Board({ board, selectedIndex, validMoveDestinations, onSquareClick, disabled }: Props) {
  return (
    <div className={`board${disabled ? ' board--disabled' : ''}`}>
      {board.map((piece, index) => {
        const row = Math.floor(index / 8)
        const col = index % 8
        const isDark = (row + col) % 2 === 1
        return (
          <Square
            key={index}
            piece={piece}
            isDark={isDark}
            isSelected={index === selectedIndex}
            isValidDestination={validMoveDestinations.includes(index)}
            onClick={() => onSquareClick(index)}
            disabled={disabled}
          />
        )
      })}
    </div>
  )
}
