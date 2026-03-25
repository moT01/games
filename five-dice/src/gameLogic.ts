export type Die = { id: number; value: number; held: boolean };

export type ScoreCategory =
  | 'ones' | 'twos' | 'threes' | 'fours' | 'fives' | 'sixes'
  | 'threeOfAKind' | 'fourOfAKind' | 'fullHouse'
  | 'smallStraight' | 'largeStraight'
  | 'yahtzee' | 'chance';

export type Scores = Record<ScoreCategory, number | null>;

export function initialDice(): Die[] {
  return [0, 1, 2, 3, 4].map(id => ({ id, value: 1, held: false }));
}

export function rollDice(dice: Die[]): Die[] {
  return dice.map(die =>
    die.held ? die : { ...die, value: Math.floor(Math.random() * 6) + 1 }
  );
}

export function toggleHold(dice: Die[], id: number): Die[] {
  return dice.map(die => die.id === id ? { ...die, held: !die.held } : die);
}

function diceSum(dice: Die[]): number {
  return dice.reduce((acc, d) => acc + d.value, 0);
}

function valueCounts(dice: Die[]): number[] {
  const c = new Array(7).fill(0);
  dice.forEach(d => c[d.value]++);
  return c;
}

export function scoreOnes(dice: Die[]): number {
  return dice.filter(d => d.value === 1).length;
}

export function scoreTwos(dice: Die[]): number {
  return dice.filter(d => d.value === 2).length * 2;
}

export function scoreThrees(dice: Die[]): number {
  return dice.filter(d => d.value === 3).length * 3;
}

export function scoreFours(dice: Die[]): number {
  return dice.filter(d => d.value === 4).length * 4;
}

export function scoreFives(dice: Die[]): number {
  return dice.filter(d => d.value === 5).length * 5;
}

export function scoreSixes(dice: Die[]): number {
  return dice.filter(d => d.value === 6).length * 6;
}

export function scoreThreeOfAKind(dice: Die[]): number {
  const c = valueCounts(dice);
  return c.some(n => n >= 3) ? diceSum(dice) : 0;
}

export function scoreFourOfAKind(dice: Die[]): number {
  const c = valueCounts(dice);
  return c.some(n => n >= 4) ? diceSum(dice) : 0;
}

export function scoreFullHouse(dice: Die[]): number {
  // Five-of-a-kind does NOT count as full house (standard Yahtzee rules)
  const nonZeroCounts = valueCounts(dice).filter(n => n > 0);
  const hasThree = nonZeroCounts.includes(3);
  const hasTwo = nonZeroCounts.includes(2);
  return hasThree && hasTwo ? 25 : 0;
}

export function scoreSmallStraight(dice: Die[]): number {
  const unique = [...new Set(dice.map(d => d.value))];
  const straights = [[1,2,3,4], [2,3,4,5], [3,4,5,6]];
  for (const straight of straights) {
    if (straight.every(v => unique.includes(v))) return 30;
  }
  return 0;
}

export function scoreLargeStraight(dice: Die[]): number {
  const sorted = [...new Set(dice.map(d => d.value))].sort((a, b) => a - b);
  if (sorted.length !== 5) return 0;
  const isLarge =
    JSON.stringify(sorted) === JSON.stringify([1,2,3,4,5]) ||
    JSON.stringify(sorted) === JSON.stringify([2,3,4,5,6]);
  return isLarge ? 40 : 0;
}

export function scoreYahtzee(dice: Die[]): number {
  const c = valueCounts(dice);
  return c.some(n => n === 5) ? 50 : 0;
}

export function scoreChance(dice: Die[]): number {
  return diceSum(dice);
}

export function calculateScore(category: ScoreCategory, dice: Die[]): number {
  switch (category) {
    case 'ones': return scoreOnes(dice);
    case 'twos': return scoreTwos(dice);
    case 'threes': return scoreThrees(dice);
    case 'fours': return scoreFours(dice);
    case 'fives': return scoreFives(dice);
    case 'sixes': return scoreSixes(dice);
    case 'threeOfAKind': return scoreThreeOfAKind(dice);
    case 'fourOfAKind': return scoreFourOfAKind(dice);
    case 'fullHouse': return scoreFullHouse(dice);
    case 'smallStraight': return scoreSmallStraight(dice);
    case 'largeStraight': return scoreLargeStraight(dice);
    case 'yahtzee': return scoreYahtzee(dice);
    case 'chance': return scoreChance(dice);
  }
}

const UPPER_CATEGORIES: ScoreCategory[] = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];
const LOWER_CATEGORIES: ScoreCategory[] = ['threeOfAKind', 'fourOfAKind', 'fullHouse', 'smallStraight', 'largeStraight', 'yahtzee', 'chance'];

export function getUpperSectionTotal(scores: Scores): number {
  return UPPER_CATEGORIES.reduce((acc, cat) => acc + (scores[cat] ?? 0), 0);
}

export function getUpperBonus(scores: Scores): number {
  return getUpperSectionTotal(scores) >= 63 ? 35 : 0;
}

export function getLowerSectionTotal(scores: Scores): number {
  return LOWER_CATEGORIES.reduce((acc, cat) => acc + (scores[cat] ?? 0), 0);
}

export function getYahtzeeBonusTotal(bonusCount: number): number {
  return bonusCount * 100;
}

export function getGrandTotal(scores: Scores, bonusCount: number): number {
  return (
    getUpperSectionTotal(scores) +
    getUpperBonus(scores) +
    getLowerSectionTotal(scores) +
    getYahtzeeBonusTotal(bonusCount)
  );
}

export function isGameOver(turn: number): boolean {
  return turn > 13;
}
