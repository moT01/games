import { useState } from 'react'
import type { Board as BoardType, Player } from '../gameLogic'
import { ROWS, COLS, isColumnFull } from '../gameLogic'
import { Cell } from './Cell'
import './Board.css'

interface Props {
  board: BoardType
  onColumnClick: (col: number) => void
  disabled: boolean
  winningCells: number[]
  currentTurn: Player
}

export function Board({ board, onColumnClick, disabled, winningCells, currentTurn }: Props) {
  const [hoveredCol, setHoveredCol] = useState<number | null>(null)

  return (
    <div className="board" onMouseLeave={() => setHoveredCol(null)}>
      {Array.from({ length: ROWS }, (_, r) =>
        Array.from({ length: COLS }, (_, c) => {
          const idx = r * COLS + c
          const colFull = isColumnFull(board, c)
          const isPreview = r === 0 && hoveredCol === c && board[idx] === null && !disabled
          return (
            <Cell
              key={idx}
              value={board[idx]}
              isWinner={winningCells.includes(idx)}
              isPreview={isPreview}
              previewPlayer={currentTurn}
              onClick={() => onColumnClick(c)}
              onMouseEnter={() => setHoveredCol(c)}
              isInteractable={!disabled && !colFull}
            />
          )
        })
      ).flat()}
    </div>
  )
}
