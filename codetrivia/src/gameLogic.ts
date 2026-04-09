import type { Question, AnswerRecord, GameState, LevelConfig, LevelResult, BestRecord, Difficulty } from './types';

export const LEVEL_CONFIG: LevelConfig[] = [
  { questionCount: 5,  threshold: 3, difficultyPool: ['easy'],            flavorName: 'Boot Camp'   },
  { questionCount: 6,  threshold: 4, difficultyPool: ['easy', 'medium'],  flavorName: 'Junior Dev'  },
  { questionCount: 8,  threshold: 6, difficultyPool: ['medium'],          flavorName: 'Mid-Level'   },
  { questionCount: 8,  threshold: 7, difficultyPool: ['medium', 'hard'],  flavorName: 'Senior Dev'  },
  { questionCount: 10, threshold: 9, difficultyPool: ['hard'],            flavorName: 'Principal'   },
];

const ADJACENT: Record<Difficulty, Difficulty[]> = {
  easy:   ['medium'],
  medium: ['easy', 'hard'],
  hard:   ['medium'],
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function selectQuestionsForLevel(
  level: number,
  usedIds: string[],
  allQuestions: Question[],
): Question[] {
  const config = LEVEL_CONFIG[level - 1];
  const usedSet = new Set(usedIds);
  const pool = config.difficultyPool;

  const primary = allQuestions.filter(
    (q) => pool.includes(q.difficulty) && !usedSet.has(q.id),
  );

  let selected = shuffle(primary).slice(0, config.questionCount);

  if (selected.length < config.questionCount) {
    const needed = config.questionCount - selected.length;
    const usedNow = new Set([...usedSet, ...selected.map((q) => q.id)]);

    const adjacentDifficulties = new Set<Difficulty>(
      pool.flatMap((d) => ADJACENT[d]),
    );
    pool.forEach((d) => adjacentDifficulties.delete(d));

    const fallback = allQuestions.filter(
      (q) => adjacentDifficulties.has(q.difficulty) && !usedNow.has(q.id),
    );

    if (fallback.length < needed) {
      console.warn(`[codetrivia] Level ${level}: not enough fallback questions. Needed ${needed}, found ${fallback.length}.`);
    }

    selected = [...selected, ...shuffle(fallback).slice(0, needed)];
  }

  return selected;
}

export function checkAnswer(question: Question, givenAnswer: string): boolean {
  return givenAnswer === question.answer;
}

export function buildAnswerRecord(
  question: Question,
  givenAnswer: string,
  questionStartTime: number,
): AnswerRecord {
  return {
    questionId: question.id,
    givenAnswer,
    correct: checkAnswer(question, givenAnswer),
    timeMs: Date.now() - questionStartTime,
  };
}

export function computeLevelResult(answers: AnswerRecord[], level: number): LevelResult {
  const config = LEVEL_CONFIG[level - 1];
  const correct = answers.filter((a) => a.correct).length;
  const total = answers.length;
  const elapsedMs = answers.reduce((sum, a) => sum + a.timeMs, 0);
  return {
    correct,
    total,
    passed: correct >= config.threshold,
    elapsedMs,
  };
}

export function advanceCampaign(state: GameState, levelElapsedMs: number): GameState {
  const result = computeLevelResult(state.answers, state.currentLevel);
  const newTotalElapsedMs = state.totalElapsedMs + levelElapsedMs;

  if (!result.passed) {
    return {
      ...state,
      phase: 'game-over',
      totalElapsedMs: newTotalElapsedMs,
    };
  }

  if (state.currentLevel >= 5) {
    return {
      ...state,
      phase: 'win',
      totalElapsedMs: newTotalElapsedMs,
    };
  }

  return {
    ...state,
    phase: 'level-intro',
    currentLevel: state.currentLevel + 1,
    totalElapsedMs: newTotalElapsedMs,
    answers: [],
    levelStartTime: null,
  };
}

const STATE_KEY = 'codetrivia-state';
const BEST_KEY = 'codetrivia-best';

export function saveState(state: GameState): void {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

export function loadState(): GameState | null {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    return raw ? (JSON.parse(raw) as GameState) : null;
  } catch {
    return null;
  }
}

export function saveBest(score: number, timeMs: number): void {
  const current = loadBest();
  if (!current || score > current.score || (score === current.score && timeMs < current.timeMs)) {
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify({ score, timeMs }));
    } catch {
      // ignore
    }
  }
}

export function loadBest(): BestRecord | null {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    return raw ? (JSON.parse(raw) as BestRecord) : null;
  } catch {
    return null;
  }
}

export function newGameState(): GameState {
  return {
    phase: 'level-intro',
    currentLevel: 1,
    currentQuestionIndex: 0,
    levelQuestions: [],
    answers: [],
    usedIds: [],
    totalScore: 0,
    levelStartTime: null,
    totalElapsedMs: 0,
  };
}
