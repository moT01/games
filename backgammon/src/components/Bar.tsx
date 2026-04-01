import './Bar.css'
import { Checker } from './Checker'
import type { Color } from '../gameLogic'

interface BarProps {
  bar: { white: number; black: number }
  currentPlayer: Color
  isBarSelected: boolean
  onBarClick: () => void
}

function BarSection({ color, count }: { color: Color; count: number }) {
  if (count === 0) return null

  // Show up to 2 checkers; beyond that show the first checker + a count badge
  const visibleCheckers = count > 2 ? 1 : count

  return (
    <div className="bar__section">
      {Array.from({ length: visibleCheckers }, (_, i) => (
        <Checker key={i} color={color} />
      ))}
      {count > 2 && (
        <div className={`bar__badge bar__badge--${color}`}>{count}</div>
      )}
    </div>
  )
}

export function Bar({ bar, currentPlayer, isBarSelected, onBarClick }: BarProps) {
  const isClickable = bar[currentPlayer] > 0

  return (
    <div
      className={[
        'bar',
        isBarSelected ? 'bar--selected' : '',
        isClickable ? 'bar--clickable' : '',
      ].filter(Boolean).join(' ')}
      onClick={isClickable ? onBarClick : undefined}
    >
      <BarSection color="black" count={bar.black} />
      <BarSection color="white" count={bar.white} />
    </div>
  )
}
