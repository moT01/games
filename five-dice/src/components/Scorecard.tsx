import './ScoreCard.css'
import ScoreRow from './ScoreRow'
import type { Die, CategoryKey } from '../gameLogic'
import {
  UPPER_CATEGORIES, LOWER_CATEGORIES, ALL_CATEGORIES,
  getPotentialScore, calcUpperTotal, calcGrandTotal,
} from '../gameLogic'

interface Props {
  scores: Partial<Record<CategoryKey, number>>
  dice: Die[]
  rollCount: number
  fiveOfAKindBonus: number
  onScore: (key: CategoryKey) => void
}

export default function ScoreCard({ scores, dice, rollCount, fiveOfAKindBonus, onScore }: Props) {
  const upperTotal = calcUpperTotal(scores)
  const grandTotal = calcGrandTotal(scores, fiveOfAKindBonus)
  const bonusReached = upperTotal >= 63

  // Find the best unscored category to subtly highlight
  let bestKey: CategoryKey | null = null
  if (rollCount > 0) {
    let bestScore = -1
    for (const key of ALL_CATEGORIES) {
      const p = getPotentialScore(key, dice, scores)
      if (p !== null && p > bestScore) {
        bestScore = p
        bestKey = key
      }
    }
  }

  return (
    <div className="scorecard">
      <div className="scorecard-grid">
        <div className="scorecard-section scorecard-section--upper">
          <div className="scorecard-section-header">Upper Section</div>
          {UPPER_CATEGORIES.map(key => (
            <ScoreRow
              key={key}
              categoryKey={key}
              score={scores[key]}
              potentialScore={getPotentialScore(key, dice, scores)}
              rollCount={rollCount}
              isBest={bestKey === key}
              onScore={onScore}
            />
          ))}
          <div className={`scorecard-bonus-row ${bonusReached ? 'scorecard-bonus-row--reached' : ''}`}>
            <span>Upper Bonus</span>
            <span className="scorecard-bonus-progress">
              {bonusReached
                ? '+35'
                : `${upperTotal}/63`
              }
            </span>
          </div>
        </div>

        <div className="scorecard-section scorecard-section--lower">
          <div className="scorecard-section-header">Lower Section</div>
          {LOWER_CATEGORIES.map(key => (
            <ScoreRow
              key={key}
              categoryKey={key}
              score={scores[key]}
              potentialScore={getPotentialScore(key, dice, scores)}
              rollCount={rollCount}
              isBest={bestKey === key}
              onScore={onScore}
            />
          ))}
          {fiveOfAKindBonus > 0 && (
            <div className="scorecard-foakbonus-row">
              <span>Five of a Kind Bonus</span>
              <span>+{fiveOfAKindBonus}</span>
            </div>
          )}
        </div>
      </div>

      <div className="scorecard-total-row">
        <span>Total Score</span>
        <span>{grandTotal}</span>
      </div>
    </div>
  )
}
