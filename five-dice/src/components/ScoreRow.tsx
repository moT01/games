import './ScoreRow.css'
import type { CategoryKey } from '../gameLogic'

// eslint-disable-next-line react-refresh/only-export-components
export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  ones: 'Ones',
  twos: 'Twos',
  threes: 'Threes',
  fours: 'Fours',
  fives: 'Fives',
  sixes: 'Sixes',
  threeOfAKind: 'Three of a Kind',
  fourOfAKind: 'Four of a Kind',
  fullHouse: 'Full House',
  smallStraight: 'Small Straight',
  largeStraight: 'Large Straight',
  fiveOfAKind: 'Five of a Kind',
  chance: 'Chance',
}

interface Props {
  categoryKey: CategoryKey
  score?: number
  potentialScore: number | null
  rollCount: number
  isBest?: boolean
  onScore: (key: CategoryKey) => void
}

export default function ScoreRow({ categoryKey, score, potentialScore, rollCount, isBest, onScore }: Props) {
  const locked = score !== undefined
  const clickable = !locked && rollCount > 0

  const handleClick = () => {
    if (clickable) onScore(categoryKey)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && clickable) onScore(categoryKey)
  }

  const displayScore = locked
    ? score
    : (rollCount > 0 && potentialScore !== null ? potentialScore : null)

  const ariaLabel = `${CATEGORY_LABELS[categoryKey]}: ${
    locked ? score : potentialScore !== null ? `potential ${potentialScore}` : 'not scored'
  }`

  return (
    <div
      className={`score-row ${locked ? 'score-row--locked' : ''} ${clickable ? 'score-row--clickable' : ''} ${isBest && clickable ? 'score-row--best' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKey}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : -1}
      aria-label={ariaLabel}
      aria-disabled={locked}
    >
      <span className="score-row-name">{CATEGORY_LABELS[categoryKey]}</span>
      <span className={`score-row-value ${!locked && rollCount > 0 ? 'score-row-value--potential' : ''} ${displayScore === null ? 'score-row-value--empty' : ''}`}>
        {displayScore !== null ? displayScore : '—'}
      </span>
    </div>
  )
}
