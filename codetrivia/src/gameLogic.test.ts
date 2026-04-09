import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  checkAnswer,
  computeLevelResult,
  selectQuestionsForLevel,
  advanceCampaign,
  saveBest,
  loadBest,
  LEVEL_CONFIG,
} from './gameLogic';
import type { Question, AnswerRecord, GameState } from './types';

// Minimal question factory
function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'test-q-1',
    category: 'javascript',
    difficulty: 'easy',
    format: 'multiple-choice',
    prompt: 'What is 1 + 1?',
    options: ['1', '2', '3', '4'],
    answer: '2',
    explanation: '1 + 1 equals 2',
    ...overrides,
  };
}

function makeAnswerRecord(correct: boolean, timeMs = 1000): AnswerRecord {
  return { questionId: 'q', givenAnswer: correct ? '2' : '1', correct, timeMs };
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    phase: 'playing',
    currentLevel: 1,
    currentQuestionIndex: 0,
    levelQuestions: [],
    answers: [],
    usedIds: [],
    totalScore: 0,
    levelStartTime: null,
    totalElapsedMs: 0,
    ...overrides,
  };
}

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('checkAnswer', () => {
  it('MC: matching answer returns true', () => {
    const q = makeQuestion({ answer: '2', options: ['1', '2', '3', '4'] });
    expect(checkAnswer(q, '2')).toBe(true);
  });

  it('MC: non-matching option returns false', () => {
    const q = makeQuestion({ answer: '2', options: ['1', '2', '3', '4'] });
    expect(checkAnswer(q, '3')).toBe(false);
  });

  it('TF: "True" correct when answer is "True"', () => {
    const q = makeQuestion({ format: 'true-false', answer: 'True', options: ['True', 'False'] });
    expect(checkAnswer(q, 'True')).toBe(true);
  });

  it('TF: "False" correct when answer is "False"', () => {
    const q = makeQuestion({ format: 'true-false', answer: 'False', options: ['True', 'False'] });
    expect(checkAnswer(q, 'False')).toBe(true);
  });
});

describe('computeLevelResult', () => {
  it('3 correct of 5 on level 1 returns passed: true', () => {
    const answers = [
      makeAnswerRecord(true), makeAnswerRecord(true), makeAnswerRecord(true),
      makeAnswerRecord(false), makeAnswerRecord(false),
    ];
    const result = computeLevelResult(answers, 1);
    expect(result.passed).toBe(true);
    expect(result.correct).toBe(3);
    expect(result.total).toBe(5);
  });

  it('2 correct of 5 on level 1 returns passed: false', () => {
    const answers = [
      makeAnswerRecord(true), makeAnswerRecord(true),
      makeAnswerRecord(false), makeAnswerRecord(false), makeAnswerRecord(false),
    ];
    expect(computeLevelResult(answers, 1).passed).toBe(false);
  });

  it('9 correct of 10 on level 5 returns passed: true', () => {
    const answers = [
      ...Array(9).fill(null).map(() => makeAnswerRecord(true)),
      makeAnswerRecord(false),
    ];
    expect(computeLevelResult(answers, 5).passed).toBe(true);
  });

  it('8 correct of 10 on level 5 returns passed: false', () => {
    const answers = [
      ...Array(8).fill(null).map(() => makeAnswerRecord(true)),
      makeAnswerRecord(false), makeAnswerRecord(false),
    ];
    expect(computeLevelResult(answers, 5).passed).toBe(false);
  });

  it('7 correct of 8 on level 4 returns passed: true', () => {
    const answers = [
      ...Array(7).fill(null).map(() => makeAnswerRecord(true)),
      makeAnswerRecord(false),
    ];
    expect(computeLevelResult(answers, 4).passed).toBe(true);
  });

  it('6 correct of 8 on level 4 returns passed: false', () => {
    const answers = [
      ...Array(6).fill(null).map(() => makeAnswerRecord(true)),
      makeAnswerRecord(false), makeAnswerRecord(false),
    ];
    expect(computeLevelResult(answers, 4).passed).toBe(false);
  });
});

describe('selectQuestionsForLevel', () => {
  function makePool(count: number, difficulty: Question['difficulty'], idPrefix: string): Question[] {
    return Array.from({ length: count }, (_, i) => makeQuestion({ id: `${idPrefix}-${i}`, difficulty }));
  }

  it('returns exactly questionCount questions for a level', () => {
    const pool = makePool(30, 'easy', 'easy');
    const selected = selectQuestionsForLevel(1, [], pool);
    expect(selected.length).toBe(LEVEL_CONFIG[0].questionCount);
  });

  it('no returned question ID appears in usedIds', () => {
    const pool = makePool(30, 'easy', 'easy');
    const usedIds = ['easy-0', 'easy-1', 'easy-2'];
    const selected = selectQuestionsForLevel(1, usedIds, pool);
    const ids = selected.map((q) => q.id);
    usedIds.forEach((id) => expect(ids).not.toContain(id));
  });

  it('fills to questionCount using adjacent difficulty when pool is short', () => {
    // Level 1 uses easy only; provide only 3 easy (need 5), fill with medium
    const easyPool = makePool(3, 'easy', 'easy');
    const mediumPool = makePool(20, 'medium', 'medium');
    const selected = selectQuestionsForLevel(1, [], [...easyPool, ...mediumPool]);
    expect(selected.length).toBe(LEVEL_CONFIG[0].questionCount);
  });
});

describe('advanceCampaign', () => {
  it('passing level 3 sets currentLevel = 4 and phase = level-intro', () => {
    const answers = Array(LEVEL_CONFIG[2].threshold).fill(null).map(() => makeAnswerRecord(true));
    const state = makeState({ currentLevel: 3, answers });
    const next = advanceCampaign(state, 5000);
    expect(next.currentLevel).toBe(4);
    expect(next.phase).toBe('level-intro');
  });

  it('passing level 5 sets phase = win', () => {
    const answers = Array(LEVEL_CONFIG[4].threshold).fill(null).map(() => makeAnswerRecord(true));
    const state = makeState({ currentLevel: 5, answers });
    const next = advanceCampaign(state, 5000);
    expect(next.phase).toBe('win');
  });

  it('failing any level sets phase = game-over', () => {
    const answers = [makeAnswerRecord(false), makeAnswerRecord(false)]; // 0 correct, level 1 needs 3
    const state = makeState({ currentLevel: 1, answers });
    const next = advanceCampaign(state, 5000);
    expect(next.phase).toBe('game-over');
  });
});

describe('saveBest / loadBest', () => {
  beforeEach(() => localStorageMock.clear());

  it('saves and loads a best record', () => {
    saveBest(30, 60000);
    const best = loadBest();
    expect(best?.score).toBe(30);
    expect(best?.timeMs).toBe(60000);
  });

  it('updates when new score is higher', () => {
    saveBest(20, 60000);
    saveBest(25, 90000);
    expect(loadBest()?.score).toBe(25);
  });

  it('updates when same score but lower time', () => {
    saveBest(25, 90000);
    saveBest(25, 50000);
    expect(loadBest()?.timeMs).toBe(50000);
  });

  it('does not update when score is lower', () => {
    saveBest(30, 60000);
    saveBest(20, 30000);
    expect(loadBest()?.score).toBe(30);
  });
});
