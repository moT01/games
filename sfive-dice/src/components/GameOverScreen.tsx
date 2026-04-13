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
  bestScore: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onPlayAgain: () => void;
  onQuit: () => void;
};

export function GameOverScreen({ scores, yahtzeeBonusCount, bestScore, theme, onToggleTheme, onPlayAgain, onQuit }: GameOverScreenProps) {
  const upperTotal = getUpperSectionTotal(scores);
  const upperBonus = getUpperBonus(scores);
  const lowerTotal = getLowerSectionTotal(scores);
  const yahtzeeBonus = getYahtzeeBonusTotal(yahtzeeBonusCount);
  const grandTotal = getGrandTotal(scores, yahtzeeBonusCount);
  const isNewBest = grandTotal >= bestScore;

  return (
    <div className="game-over-screen">
      <div className="game-over-screen__utility">
        <a
          className="game-over-screen__util-btn"
          href="https://www.freecodecamp.org/donate"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Donate to freeCodeCamp"
        >
          Donate
        </a>
        <button
          className="game-over-screen__util-btn"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme === 'dark' ? '☀' : '🌙'}
        </button>
      </div>

      <h1 className="game-over-screen__title">Game Over</h1>

      {bestScore > 0 && (
        <p className="game-over-screen__best">
          {isNewBest ? 'New best score!' : `Best: ${bestScore}`}
        </p>
      )}

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

      <div className="game-over-screen__buttons">
        <button className="game-over-screen__play-again" onClick={onPlayAgain} aria-label="Play again">
          Play Again
        </button>
        <button className="game-over-screen__quit" onClick={onQuit} aria-label="Quit to home">
          Home
        </button>
      </div>
    </div>
  );
}
