import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  rollDice, toggleHold,
  scoreOnes, scoreTwos, scoreThrees, scoreFours, scoreFives, scoreSixes,
  scoreThreeOfAKind, scoreFourOfAKind, scoreFullHouse,
  scoreSmallStraight, scoreLargeStraight, scoreYahtzee, scoreChance,
  getUpperSectionTotal, getUpperBonus, getYahtzeeBonusTotal, getGrandTotal,
} from './gameLogic';
import type { Die, Scores } from './gameLogic';

function d(values: number[], heldAt: number[] = []): Die[] {
  return values.map((value, id) => ({ id, value, held: heldAt.includes(id) }));
}

const nullScores: Scores = {
  ones: null, twos: null, threes: null, fours: null, fives: null, sixes: null,
  threeOfAKind: null, fourOfAKind: null, fullHouse: null,
  smallStraight: null, largeStraight: null, yahtzee: null, chance: null,
};

describe('rollDice', () => {
  afterEach(() => vi.restoreAllMocks());

  it('held dice keep their values', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0); // always rolls 1
    const dice = d([3, 5, 2, 6, 1], [1, 3]);
    const result = rollDice(dice);
    expect(result[1].value).toBe(5); // held
    expect(result[3].value).toBe(6); // held
  });

  it('unheld dice are re-rolled', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9); // always rolls 6
    const dice = d([1, 1, 1, 1, 1], [4]); // hold last die
    const result = rollDice(dice);
    expect(result[0].value).toBe(6);
    expect(result[4].value).toBe(1); // held, unchanged
  });
});

describe('toggleHold', () => {
  it('flips held to true on the target die', () => {
    expect(toggleHold(d([1, 2, 3, 4, 5]), 2)[2].held).toBe(true);
  });

  it('flips held to false on an already-held die', () => {
    expect(toggleHold(d([1, 2, 3, 4, 5], [2]), 2)[2].held).toBe(false);
  });

  it('leaves other dice unchanged', () => {
    const result = toggleHold(d([1, 2, 3, 4, 5]), 0);
    expect(result[1].held).toBe(false);
    expect(result[4].held).toBe(false);
  });
});

describe('upper section scorers', () => {
  it('scoreOnes sums dice showing 1', () => {
    expect(scoreOnes(d([1, 1, 2, 3, 4]))).toBe(2);
    expect(scoreOnes(d([2, 3, 4, 5, 6]))).toBe(0);
    expect(scoreOnes(d([1, 1, 1, 1, 1]))).toBe(5);
  });

  it('scoreTwos sums dice showing 2', () => {
    expect(scoreTwos(d([2, 2, 1, 3, 4]))).toBe(4);
    expect(scoreTwos(d([1, 3, 4, 5, 6]))).toBe(0);
  });

  it('scoreThrees sums dice showing 3', () => {
    expect(scoreThrees(d([3, 3, 3, 1, 2]))).toBe(9);
    expect(scoreThrees(d([1, 2, 4, 5, 6]))).toBe(0);
  });

  it('scoreFours sums dice showing 4', () => {
    expect(scoreFours(d([4, 4, 1, 2, 3]))).toBe(8);
    expect(scoreFours(d([1, 2, 3, 5, 6]))).toBe(0);
  });

  it('scoreFives sums dice showing 5', () => {
    expect(scoreFives(d([5, 5, 5, 1, 2]))).toBe(15);
    expect(scoreFives(d([1, 2, 3, 4, 6]))).toBe(0);
  });

  it('scoreSixes sums dice showing 6', () => {
    expect(scoreSixes(d([6, 6, 6, 6, 1]))).toBe(24);
    expect(scoreSixes(d([1, 2, 3, 4, 5]))).toBe(0);
  });
});

describe('scoreThreeOfAKind', () => {
  it('returns sum of all dice when 3+ share a value', () => {
    expect(scoreThreeOfAKind(d([3, 3, 3, 1, 2]))).toBe(12);
    expect(scoreThreeOfAKind(d([4, 4, 4, 4, 1]))).toBe(17);
    expect(scoreThreeOfAKind(d([5, 5, 5, 5, 5]))).toBe(25);
  });

  it('returns 0 when no 3+ match', () => {
    expect(scoreThreeOfAKind(d([1, 2, 3, 4, 5]))).toBe(0);
    expect(scoreThreeOfAKind(d([1, 1, 2, 2, 3]))).toBe(0);
  });
});

describe('scoreFourOfAKind', () => {
  it('returns sum of all dice when 4+ share a value', () => {
    expect(scoreFourOfAKind(d([3, 3, 3, 3, 2]))).toBe(14);
    expect(scoreFourOfAKind(d([5, 5, 5, 5, 5]))).toBe(25);
  });

  it('returns 0 when fewer than 4 match', () => {
    expect(scoreFourOfAKind(d([3, 3, 3, 1, 2]))).toBe(0);
    expect(scoreFourOfAKind(d([1, 2, 3, 4, 5]))).toBe(0);
  });
});

describe('scoreFullHouse', () => {
  it('returns 25 for three of a kind plus a pair', () => {
    expect(scoreFullHouse(d([2, 2, 2, 5, 5]))).toBe(25);
    expect(scoreFullHouse(d([1, 1, 3, 3, 3]))).toBe(25);
  });

  it('returns 0 for five of a kind (not a full house)', () => {
    expect(scoreFullHouse(d([4, 4, 4, 4, 4]))).toBe(0);
  });

  it('returns 0 for non full house', () => {
    expect(scoreFullHouse(d([1, 2, 3, 4, 5]))).toBe(0);
    expect(scoreFullHouse(d([1, 1, 2, 3, 4]))).toBe(0);
  });
});

describe('scoreSmallStraight', () => {
  it('returns 30 for a run of 4 sequential values', () => {
    expect(scoreSmallStraight(d([1, 2, 3, 4, 6]))).toBe(30); // 1-2-3-4
    expect(scoreSmallStraight(d([2, 3, 4, 5, 1]))).toBe(30); // 2-3-4-5
    expect(scoreSmallStraight(d([3, 4, 5, 6, 2]))).toBe(30); // 3-4-5-6
  });

  it('returns 30 when duplicates are present alongside the run', () => {
    expect(scoreSmallStraight(d([1, 2, 3, 4, 4]))).toBe(30);
  });

  it('returns 0 when no 4-run exists', () => {
    expect(scoreSmallStraight(d([1, 2, 4, 5, 6]))).toBe(0); // missing 3
    expect(scoreSmallStraight(d([1, 1, 1, 2, 2]))).toBe(0);
  });
});

describe('scoreLargeStraight', () => {
  it('returns 40 for 1-2-3-4-5', () => {
    expect(scoreLargeStraight(d([1, 2, 3, 4, 5]))).toBe(40);
  });

  it('returns 40 for 2-3-4-5-6 in any order', () => {
    expect(scoreLargeStraight(d([6, 5, 4, 3, 2]))).toBe(40);
  });

  it('returns 0 when there are duplicates', () => {
    expect(scoreLargeStraight(d([1, 2, 3, 4, 4]))).toBe(0);
  });

  it('returns 0 for a gap', () => {
    expect(scoreLargeStraight(d([1, 2, 4, 5, 6]))).toBe(0);
  });
});

describe('scoreYahtzee', () => {
  it('returns 50 for five of a kind', () => {
    expect(scoreYahtzee(d([3, 3, 3, 3, 3]))).toBe(50);
    expect(scoreYahtzee(d([6, 6, 6, 6, 6]))).toBe(50);
  });

  it('returns 0 otherwise', () => {
    expect(scoreYahtzee(d([1, 1, 1, 1, 2]))).toBe(0);
    expect(scoreYahtzee(d([1, 2, 3, 4, 5]))).toBe(0);
  });
});

describe('scoreChance', () => {
  it('always returns the sum of all five dice', () => {
    expect(scoreChance(d([1, 2, 3, 4, 5]))).toBe(15);
    expect(scoreChance(d([6, 6, 6, 6, 6]))).toBe(30);
    expect(scoreChance(d([1, 1, 1, 1, 1]))).toBe(5);
  });
});

describe('getUpperSectionTotal', () => {
  it('sums only non-null upper scores', () => {
    const scores: Scores = { ...nullScores, ones: 3, threes: 9, fives: 10, sixes: 18 };
    expect(getUpperSectionTotal(scores)).toBe(40);
  });

  it('returns 0 when all upper scores are null', () => {
    expect(getUpperSectionTotal(nullScores)).toBe(0);
  });
});

describe('getUpperBonus', () => {
  it('returns 35 when upper total is exactly 63', () => {
    const scores: Scores = { ...nullScores, ones: 3, twos: 6, threes: 9, fours: 12, fives: 15, sixes: 18 };
    expect(getUpperBonus(scores)).toBe(35);
  });

  it('returns 35 when upper total exceeds 63', () => {
    const scores: Scores = { ...nullScores, ones: 5, twos: 6, threes: 9, fours: 12, fives: 15, sixes: 18 };
    expect(getUpperBonus(scores)).toBe(35);
  });

  it('returns 0 when upper total is below 63', () => {
    const scores: Scores = { ...nullScores, ones: 3, twos: 6, threes: 9, fours: 12, fives: 15, sixes: 17 };
    expect(getUpperBonus(scores)).toBe(0);
  });
});

describe('getYahtzeeBonusTotal', () => {
  it('returns 0 for 0 bonuses', () => expect(getYahtzeeBonusTotal(0)).toBe(0));
  it('returns 100 for 1 bonus', () => expect(getYahtzeeBonusTotal(1)).toBe(100));
  it('returns 200 for 2 bonuses', () => expect(getYahtzeeBonusTotal(2)).toBe(200));
});

describe('getGrandTotal', () => {
  it('combines upper total, upper bonus, lower total, and yahtzee bonus', () => {
    const scores: Scores = {
      ones: 3, twos: 6, threes: 9, fours: 12, fives: 15, sixes: 18, // upper: 63, bonus: 35
      threeOfAKind: 20, fourOfAKind: 0, fullHouse: 25,
      smallStraight: 30, largeStraight: 40, yahtzee: 50, chance: 18, // lower: 183
    };
    // 63 + 35 + 183 + 100 = 381
    expect(getGrandTotal(scores, 1)).toBe(381);
  });
});
