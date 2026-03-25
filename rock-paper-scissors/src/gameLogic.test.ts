import { describe, it, expect } from 'vitest';
import {
  getComputerChoice,
  getRoundResult,
  getWinsRequired,
  getMatchResult,
} from './gameLogic';

describe('getRoundResult', () => {
  it('rock beats scissors', () => {
    expect(getRoundResult('rock', 'scissors')).toBe('win');
  });

  it('scissors beats paper', () => {
    expect(getRoundResult('scissors', 'paper')).toBe('win');
  });

  it('paper beats rock', () => {
    expect(getRoundResult('paper', 'rock')).toBe('win');
  });

  it('scissors loses to rock', () => {
    expect(getRoundResult('scissors', 'rock')).toBe('loss');
  });

  it('paper loses to scissors', () => {
    expect(getRoundResult('paper', 'scissors')).toBe('loss');
  });

  it('rock loses to paper', () => {
    expect(getRoundResult('rock', 'paper')).toBe('loss');
  });

  it('rock vs rock is a draw', () => {
    expect(getRoundResult('rock', 'rock')).toBe('draw');
  });

  it('paper vs paper is a draw', () => {
    expect(getRoundResult('paper', 'paper')).toBe('draw');
  });

  it('scissors vs scissors is a draw', () => {
    expect(getRoundResult('scissors', 'scissors')).toBe('draw');
  });
});

describe('getComputerChoice', () => {
  it('returns only valid choices', () => {
    const valid = new Set(['rock', 'paper', 'scissors']);
    for (let i = 0; i < 50; i++) {
      expect(valid.has(getComputerChoice())).toBe(true);
    }
  });
});

describe('getWinsRequired', () => {
  it('returns 2 for best-of-3', () => {
    expect(getWinsRequired('best-of-3')).toBe(2);
  });

  it('returns 3 for best-of-5', () => {
    expect(getWinsRequired('best-of-5')).toBe(3);
  });

  it('returns Infinity for free mode', () => {
    expect(getWinsRequired('free')).toBe(Infinity);
  });
});

describe('getMatchResult', () => {
  it('returns player when player reaches threshold', () => {
    expect(getMatchResult(2, 0, 'best-of-3')).toBe('player');
  });

  it('returns computer when computer reaches threshold', () => {
    expect(getMatchResult(0, 2, 'best-of-3')).toBe('computer');
  });

  it('returns null when neither has reached threshold', () => {
    expect(getMatchResult(1, 1, 'best-of-3')).toBeNull();
  });

  it('returns null in free mode regardless of scores', () => {
    expect(getMatchResult(100, 100, 'free')).toBeNull();
  });
});
