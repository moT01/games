import type { Piece as PieceType } from '../gameLogic'
import './Piece.css'

interface Props {
  piece: PieceType
}

export function Piece({ piece }: Props) {
  const classes = [
    'piece',
    `piece--${piece.player.toLowerCase()}`,
    piece.type === 'king' ? 'piece--king' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      {piece.type === 'king' && <span className="piece__crown">★</span>}
    </div>
  )
}
