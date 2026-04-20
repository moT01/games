import type { Piece as PieceType } from '../gameLogic'
import { Piece } from './Piece'
import './Square.css'

interface Props {
  piece: PieceType | null
  isDark: boolean
  isSelected: boolean
  isValidDestination: boolean
  isJumpDestination: boolean
  onClick: () => void
  disabled: boolean
}

export function Square({ piece, isDark, isSelected, isValidDestination, isJumpDestination, onClick, disabled }: Props) {
  const isInteractable = isDark && !disabled

  const classes = [
    'square',
    isDark ? 'square--dark' : 'square--light',
    isSelected ? 'square--selected' : '',
    isValidDestination ? 'square--valid-destination' : '',
  ].filter(Boolean).join(' ')

  return (
    <div
      className={classes}
      onClick={isInteractable ? onClick : undefined}
    >
      {piece && <Piece piece={piece} />}
      {isValidDestination && <div className="square__highlight" />}
      {isJumpDestination && <div className="square__capture-ring" />}
    </div>
  )
}
