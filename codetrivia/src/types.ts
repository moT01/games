export type Category =
  | 'javascript'
  | 'python'
  | 'general-cs'
  | 'web'
  | 'git-cli'
  | 'algorithms'
  | 'bash'
  | 'databases';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type Format = 'multiple-choice' | 'true-false';
export type Phase = 'home' | 'level-intro' | 'playing' | 'level-result' | 'game-over' | 'win';

export interface Question {
  id: string;
  category: Category;
  difficulty: Difficulty;
  format: Format;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
}

export interface AnswerRecord {
  questionId: string;
  givenAnswer: string;
  correct: boolean;
  timeMs: number;
}

export interface GameState {
  phase: Phase;
  currentLevel: number;
  currentQuestionIndex: number;
  levelQuestions: Question[];
  answers: AnswerRecord[];
  usedIds: string[];
  totalScore: number;
  levelStartTime: number | null;
  totalElapsedMs: number;
}

export interface BestRecord {
  score: number;
  timeMs: number;
}

export interface LevelConfig {
  questionCount: number;
  threshold: number;
  difficultyPool: Difficulty[];
  flavorName: string;
}

export interface LevelResult {
  correct: number;
  total: number;
  passed: boolean;
  elapsedMs: number;
}
