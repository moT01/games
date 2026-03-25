import './Scorecard.css';
import { ScoreRow } from './ScoreRow';
import type { ScoreCategory, Scores, Die } from '../gameLogic';
import { calculateScore, getUpperSectionTotal, getUpperBonus, getYahtzeeBonusTotal, getGrandTotal } from '../gameLogic';

const UPPER: { category: ScoreCategory; label: string }[] = [
  { category: 'ones', label: 'Ones' },
  { category: 'twos', label: 'Twos' },
  { category: 'threes', label: 'Threes' },
  { category: 'fours', label: 'Fours' },
  { category: 'fives', label: 'Fives' },
  { category: 'sixes', label: 'Sixes' },
];

const LOWER: { category: ScoreCategory; label: string }[] = [
  { category: 'threeOfAKind', label: '3 of a Kind' },
  { category: 'fourOfAKind', label: '4 of a Kind' },
  { category: 'fullHouse', label: 'Full House' },
  { category: 'smallStraight', label: 'Sm. Straight' },
  { category: 'largeStraight', label: 'Lg. Straight' },
  { category: 'yahtzee', label: 'YAHTZEE' },
  { category: 'chance', label: 'Chance' },
];

type ScorecardProps = {
  scores: Scores;
  dice: Die[];
  rollCount: number;
  yahtzeeBonusCount: number;
  onScore: (category: ScoreCategory) => void;
  gameOver: boolean;
};

export function Scorecard({ scores, dice, rollCount, yahtzeeBonusCount, onScore, gameOver }: ScorecardProps) {
  const upperTotal = getUpperSectionTotal(scores);
  const upperBonus = getUpperBonus(scores);
  const yahtzeeBonus = getYahtzeeBonusTotal(yahtzeeBonusCount);
  const grandTotal = getGrandTotal(scores, yahtzeeBonusCount);

  return (
    <div className="scorecard">
      <table className="scorecard__table">
        <tbody>
          <tr className="scorecard__section-header">
            <td colSpan={2}>Upper Section</td>
          </tr>
          {UPPER.map(({ category, label }) => (
            <ScoreRow
              key={category}
              label={label}
              score={scores[category]}
              previewScore={calculateScore(category, dice)}
              isLocked={scores[category] !== null}
              onScore={() => onScore(category)}
              canScore={rollCount >= 1 && scores[category] === null && !gameOver}
            />
          ))}
          <tr className="scorecard__bonus-row">
            <td>Bonus (63+)</td>
            <td>{upperBonus > 0 ? '+35' : `${upperTotal} / 63`}</td>
          </tr>
          <tr className="scorecard__section-header">
            <td colSpan={2}>Lower Section</td>
          </tr>
          {LOWER.map(({ category, label }) => (
            <ScoreRow
              key={category}
              label={label}
              score={scores[category]}
              previewScore={calculateScore(category, dice)}
              isLocked={scores[category] !== null}
              onScore={() => onScore(category)}
              canScore={rollCount >= 1 && scores[category] === null && !gameOver}
            />
          ))}
          <tr className="scorecard__bonus-row">
            <td>YAHTZEE Bonus</td>
            <td>{yahtzeeBonus > 0 ? `+${yahtzeeBonus}` : '0'}</td>
          </tr>
          <tr className="scorecard__total-row">
            <td>Grand Total</td>
            <td>{grandTotal}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
