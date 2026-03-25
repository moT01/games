import './GameOverScreen.css';
import type { Scores } from '../gameLogic';
import {
  getUpperSectionTotal, getUpperBonus,
  getLowerSectionTotal, getYahtzeeBonusTotal, getGrandTotal,
} from '../gameLogic';

const ALL_CATEGORIES: { category: keyof Scores; label: string }[] = [
  { category: 'ones', label: 'Ones' },
  { category: 'twos', label: 'Twos' },
  { category: 'threes', label: 'Threes' },
  { category: 'fours', label: 'Fours' },
  { category: 'fives', label: 'Fives' },
  { category: 'sixes', label: 'Sixes' },
  { category: 'threeOfAKind', label: '3 of a Kind' },
  { category: 'fourOfAKind', label: '4 of a Kind' },
  { category: 'fullHouse', label: 'Full House' },
  { category: 'smallStraight', label: 'Sm. Straight' },
  { category: 'largeStraight', label: 'Lg. Straight' },
  { category: 'yahtzee', label: 'YAHTZEE' },
  { category: 'chance', label: 'Chance' },
];

type GameOverScreenProps = {
  scores: Scores;
  yahtzeeBonusCount: number;
  onPlayAgain: () => void;
};

export function GameOverScreen({ scores, yahtzeeBonusCount, onPlayAgain }: GameOverScreenProps) {
  const upperTotal = getUpperSectionTotal(scores);
  const upperBonus = getUpperBonus(scores);
  const lowerTotal = getLowerSectionTotal(scores);
  const yahtzeeBonus = getYahtzeeBonusTotal(yahtzeeBonusCount);
  const grandTotal = getGrandTotal(scores, yahtzeeBonusCount);

  return (
    <div className="game-over-screen">
      <h1 className="game-over-screen__title">Game Over</h1>
      <table className="game-over-screen__table">
        <tbody>
          {ALL_CATEGORIES.map(({ category, label }) => (
            <tr key={category}>
              <td>{label}</td>
              <td>{scores[category] ?? 0}</td>
            </tr>
          ))}
          <tr className="game-over-screen__subtotal-row">
            <td>Upper Total</td>
            <td>{upperTotal}</td>
          </tr>
          <tr className="game-over-screen__subtotal-row">
            <td>Upper Bonus</td>
            <td>{upperBonus}</td>
          </tr>
          <tr className="game-over-screen__subtotal-row">
            <td>Lower Total</td>
            <td>{lowerTotal}</td>
          </tr>
          <tr className="game-over-screen__subtotal-row">
            <td>YAHTZEE Bonus</td>
            <td>{yahtzeeBonus}</td>
          </tr>
          <tr className="game-over-screen__grand-total">
            <td>Grand Total</td>
            <td>{grandTotal}</td>
          </tr>
        </tbody>
      </table>
      <button className="game-over-screen__play-again" onClick={onPlayAgain}>
        Play Again
      </button>
    </div>
  );
}
