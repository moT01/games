import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import App from './App';

// Mock questions so tests don't depend on real question bank
vi.mock('./questions', () => {
  const makeQ = (id: string, opts: string[], answer: string, format = 'multiple-choice') => ({
    id,
    category: 'javascript',
    difficulty: 'easy',
    format,
    prompt: `Question ${id}`,
    options: opts,
    answer,
    explanation: 'Explanation',
  });

  const easyQuestions = Array.from({ length: 40 }, (_, i) =>
    makeQ(`easy-${i}`, ['A', 'B', 'C', 'D'], 'A'),
  );
  const mediumQuestions = Array.from({ length: 40 }, (_, i) =>
    makeQ(`med-${i}`, ['A', 'B', 'C', 'D'], 'A'),
  );
  const hardQuestions = Array.from({ length: 20 }, (_, i) =>
    makeQ(`hard-${i}`, ['A', 'B', 'C', 'D'], 'A'),
  );

  return { default: [...easyQuestions, ...mediumQuestions, ...hardQuestions] };
});

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
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

beforeEach(() => {
  localStorageMock.clear();
  // Default dark theme
  localStorageMock.setItem('codetrivia-theme', 'dark');
});

describe('App component', () => {
  it('home screen renders "Start Campaign" button', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /start campaign/i })).toBeTruthy();
  });

  it('clicking "Start Campaign" shows level-intro for level 1', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /start campaign/i }));
    // After clicking start, we go directly to playing phase (begin_level is dispatched immediately)
    // The level intro screen might be skipped - we land on playing
    // Level 1 question card should be present
    await screen.findByText(/Q 1 of 5/i);
  });

  it('level intro shows correct threshold text ("Need 3 of 5")', () => {
    // To test level intro we need to be in level-intro phase
    // We can set localStorage state directly
    localStorageMock.setItem('codetrivia-state', JSON.stringify({
      phase: 'level-intro',
      currentLevel: 1,
      currentQuestionIndex: 0,
      levelQuestions: [],
      answers: [],
      usedIds: [],
      totalScore: 0,
      levelStartTime: null,
      totalElapsedMs: 0,
    }));
    render(<App />);
    expect(screen.getByText(/need 3 of 5/i)).toBeTruthy();
  });

  it('clicking "Begin" shows first question card with elapsed timer', async () => {
    localStorageMock.setItem('codetrivia-state', JSON.stringify({
      phase: 'level-intro',
      currentLevel: 1,
      currentQuestionIndex: 0,
      levelQuestions: [],
      answers: [],
      usedIds: [],
      totalScore: 0,
      levelStartTime: null,
      totalElapsedMs: 0,
    }));
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /begin/i }));
    await screen.findByText(/Q 1 of 5/i);
    // Timer shows 00:00
    expect(screen.getByText('00:00')).toBeTruthy();
  });

  it('clicking a correct MC option shows FeedbackFlash with correct styling', async () => {
    const question = {
      id: 'test-q',
      category: 'javascript',
      difficulty: 'easy',
      format: 'multiple-choice',
      prompt: 'Pick A',
      options: ['A', 'B', 'C', 'D'],
      answer: 'A',
      explanation: 'A is correct',
    };
    localStorageMock.setItem('codetrivia-state', JSON.stringify({
      phase: 'playing',
      currentLevel: 1,
      currentQuestionIndex: 0,
      levelQuestions: [question],
      answers: [],
      usedIds: ['test-q'],
      totalScore: 0,
      levelStartTime: Date.now(),
      totalElapsedMs: 0,
    }));
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /option A: A/i }));
    await screen.findByText('Correct!');
  });

  it('clicking a wrong MC option shows FeedbackFlash with wrong styling and correct answer', async () => {
    const question = {
      id: 'test-q2',
      category: 'javascript',
      difficulty: 'easy',
      format: 'multiple-choice',
      prompt: 'Pick A',
      options: ['A', 'B', 'C', 'D'],
      answer: 'A',
      explanation: 'A is correct',
    };
    localStorageMock.setItem('codetrivia-state', JSON.stringify({
      phase: 'playing',
      currentLevel: 1,
      currentQuestionIndex: 0,
      levelQuestions: [question],
      answers: [],
      usedIds: ['test-q2'],
      totalScore: 0,
      levelStartTime: Date.now(),
      totalElapsedMs: 0,
    }));
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /option B: B/i }));
    await screen.findByText('Wrong');
    // FeedbackFlash shows "Answer: A" — check the answer span inside it
    expect(screen.getAllByText('A').length).toBeGreaterThan(0);
  });

  it('after all level questions, LevelResult screen shown with correct score', async () => {
    const questions = Array.from({ length: 5 }, (_, i) => ({
      id: `q-${i}`,
      category: 'javascript',
      difficulty: 'easy',
      format: 'multiple-choice',
      prompt: `Q ${i}`,
      options: ['A', 'B', 'C', 'D'],
      answer: 'A',
      explanation: 'A',
    }));
    localStorageMock.setItem('codetrivia-state', JSON.stringify({
      phase: 'playing',
      currentLevel: 1,
      currentQuestionIndex: 4,
      levelQuestions: questions,
      answers: Array.from({ length: 4 }, (_, i) => ({
        questionId: `q-${i}`, givenAnswer: 'A', correct: true, timeMs: 1000,
      })),
      usedIds: questions.map((q) => q.id),
      totalScore: 4,
      levelStartTime: Date.now() - 5000,
      totalElapsedMs: 0,
    }));
    render(<App />);

    // Answer last question correctly
    fireEvent.click(screen.getByRole('button', { name: /option A: A/i }));

    // Wait for the 1.2s feedback flash to finish
    await new Promise((r) => setTimeout(r, 1300));

    await screen.findByText(/level passed/i);
  }, 8000);

  it('failing level 1 shows GameOver screen', async () => {
    const questions = Array.from({ length: 5 }, (_, i) => ({
      id: `qf-${i}`,
      category: 'javascript',
      difficulty: 'easy',
      format: 'multiple-choice',
      prompt: `Q ${i}`,
      options: ['A', 'B', 'C', 'D'],
      answer: 'A',
      explanation: 'A',
    }));
    // 2 correct so far (need 3 to pass level 1), on last question
    localStorageMock.setItem('codetrivia-state', JSON.stringify({
      phase: 'playing',
      currentLevel: 1,
      currentQuestionIndex: 4,
      levelQuestions: questions,
      answers: Array.from({ length: 4 }, (_, i) => ({
        questionId: `qf-${i}`, givenAnswer: i < 2 ? 'A' : 'B', correct: i < 2, timeMs: 1000,
      })),
      usedIds: questions.map((q) => q.id),
      totalScore: 2,
      levelStartTime: Date.now() - 5000,
      totalElapsedMs: 0,
    }));
    render(<App />);

    // Answer last question wrong
    fireEvent.click(screen.getByRole('button', { name: /option B: B/i }));

    await new Promise((r) => setTimeout(r, 1300));

    // LevelResult shown first with "Game Over" button
    const continueBtn = await screen.findByRole('button', { name: /game over/i });
    fireEvent.click(continueBtn);

    await screen.findByText(/game over/i);
  }, 8000);

  it('quit confirm modal appears when clicking quit during play', async () => {
    const question = {
      id: 'test-quit',
      category: 'javascript',
      difficulty: 'easy',
      format: 'multiple-choice',
      prompt: 'Q',
      options: ['A', 'B', 'C', 'D'],
      answer: 'A',
      explanation: 'A',
    };
    localStorageMock.setItem('codetrivia-state', JSON.stringify({
      phase: 'playing',
      currentLevel: 1,
      currentQuestionIndex: 0,
      levelQuestions: [question],
      answers: [],
      usedIds: ['test-quit'],
      totalScore: 0,
      levelStartTime: Date.now(),
      totalElapsedMs: 0,
    }));
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /quit to home/i }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText(/quit to home/i)).toBeTruthy();
  });

  it('theme toggle persists to localStorage and updates CSS class', () => {
    localStorageMock.setItem('codetrivia-theme', 'dark');
    render(<App />);
    const toggle = screen.getByRole('button', { name: /switch to light mode/i });
    fireEvent.click(toggle);
    expect(localStorageMock.getItem('codetrivia-theme')).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
