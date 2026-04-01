import './OffArea.css'
import type { Color } from '../gameLogic'

interface OffAreaProps {
  color: Color
  count: number
  isValidDest: boolean
  onClick: () => void
}

export function OffArea({ color, count, isValidDest, onClick }: OffAreaProps) {
  return (
    <div
      className={[
        'off-area',
        `off-area--${color}`,
        isValidDest ? 'off-area--valid-dest' : '',
      ].filter(Boolean).join(' ')}
      onClick={isValidDest ? onClick : undefined}
    >
      <span className="off-area__count">{count}</span>
      <span className="off-area__label">off</span>
    </div>
  )
}
