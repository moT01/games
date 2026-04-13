import './Die.css'

// 3x3 grid positions (0–8): TL TC TR / ML MC MR / BL BC BR
const PIP_POSITIONS: Record<number, number[]> = {
  1: [4],
  2: [2, 6],
  3: [2, 4, 6],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}

interface Props {
  index: number
  value: number
  held: boolean
  rollCount: number
  rolling: boolean
  onToggleHold: (index: number) => void
}

export default function Die({ index, value, held, rollCount, rolling, onToggleHold }: Props) {
  const canHold = rollCount > 0
  const activePips = PIP_POSITIONS[value] ?? []

  const handleClick = () => {
    if (canHold) onToggleHold(index)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      if (canHold) onToggleHold(index)
    }
  }

  return (
    <div
      className={`die ${held ? 'die--held' : ''} ${rolling ? 'die--rolling' : ''} ${canHold ? 'die--holdable' : ''} ${rollCount === 0 ? 'die--unrolled' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKey}
      role="button"
      tabIndex={canHold ? 0 : -1}
      aria-label={`Die ${index + 1}: ${value}, ${held ? 'held' : 'not held'}`}
      aria-pressed={held}
    >
      <div className="die-face">
        {Array.from({ length: 9 }, (_, pos) => (
          <div
            key={pos}
            className={`pip ${activePips.includes(pos) ? 'pip--active' : ''}`}
          />
        ))}
      </div>
    </div>
  )
}
