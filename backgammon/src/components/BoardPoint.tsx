import './BoardPoint.css'
import { Checker } from './Checker'
import type { Point, Color } from '../gameLogic'

interface BoardPointProps {
  index: number
  point: Point
  isSelected: boolean
  isValidDest: boolean
  isTopRow: boolean
  isHomePoint: boolean
  onClick: () => void
}

export function BoardPoint({ index, point, isSelected, isValidDest, isTopRow, isHomePoint, onClick }: BoardPointProps) {
  // Traditional point label (White's perspective): 24 - index
  const label = 24 - index

  return (
    <div
      className={[
        'board-point',
        `board-point--${isTopRow ? 'top' : 'bottom'}`,
        isHomePoint ? 'board-point--home' : '',
        isSelected ? 'board-point--selected' : '',
        isValidDest ? 'board-point--valid-dest' : '',
      ].filter(Boolean).join(' ')}
      onClick={onClick}
    >
      <span className="board-point__label">{label}</span>
      <div className="board-point__checkers">
        {point.count > 0 && Array.from({ length: point.count }, (_, i) => (
          <Checker key={i} color={point.color as Color} />
        ))}
      </div>
      {isValidDest && <div className="board-point__dest-dot" />}
    </div>
  )
}
