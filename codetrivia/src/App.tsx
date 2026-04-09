import { useEffect, useReducer, useRef, useState } from 'react';
import {
  LEVEL_CONFIG,
  buildAnswerRecord,
  loadBest,
  loadState,
  newGameState,
  saveBest,
  saveState,
  selectQuestionsForLevel,
} from './gameLogic';
import type { AnswerRecord, GameState, BestRecord } from './types';
import allQuestions from './questions';
import { HomeScreen } from './HomeScreen';
import { LevelIntro } from './LevelIntro';
import { QuestionCard } from './QuestionCard';
import { LevelResult } from './LevelResult';
import { GameOver } from './GameOver';
import { WinScreen } from './WinScreen';
import { HelpModal } from './HelpModal';
import { ConfirmModal } from './ConfirmModal';
import './App.css';

type Action =
  | { type: 'start_campaign' }
  | { type: 'begin_level'; questions: ReturnType<typeof selectQuestionsForLevel> }
  | { type: 'record_answer'; record: AnswerRecord }
  | { type: 'next_question' }
  | { type: 'show_level_result'; elapsedMs: number }
  | { type: 'advance_to_next_level'; questions: ReturnType<typeof selectQuestionsForLevel> }
  | { type: 'go_game_over' }
  | { type: 'go_win' }
  | { type: 'quit_to_home' };

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'start_campaign':
      return {
        ...newGameState(),
        phase: 'level-intro',
        currentLevel: 1,
      };
    case 'begin_level':
      return {
        ...state,
        phase: 'playing',
        levelQuestions: action.questions,
        usedIds: [...state.usedIds, ...action.questions.map((q) => q.id)],
        currentQuestionIndex: 0,
        answers: [],
        levelStartTime: Date.now(),
      };
    case 'record_answer':
      return {
        ...state,
        answers: [...state.answers, action.record],
        totalScore: state.totalScore + (action.record.correct ? 1 : 0),
      };
    case 'next_question':
      return { ...state, currentQuestionIndex: state.currentQuestionIndex + 1 };
    case 'show_level_result':
      return {
        ...state,
        phase: 'level-result',
        totalElapsedMs: state.totalElapsedMs + action.elapsedMs,
        levelStartTime: null,
      };
    case 'advance_to_next_level':
      return {
        ...state,
        phase: 'playing',
        currentLevel: state.currentLevel + 1,
        levelQuestions: action.questions,
        usedIds: [...state.usedIds, ...action.questions.map((q) => q.id)],
        currentQuestionIndex: 0,
        answers: [],
        levelStartTime: Date.now(),
      };
    case 'go_game_over':
      return { ...state, phase: 'game-over' };
    case 'go_win':
      return { ...state, phase: 'win' };
    case 'quit_to_home':
      return { ...newGameState(), phase: 'home' };
    default:
      return state;
  }
}

function initState(): GameState {
  const saved = loadState();
  if (saved) return saved;
  return { ...newGameState(), phase: 'home' };
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, initState);
  const [best, setBest] = useState<BestRecord | null>(() => loadBest());
  const [showHelp, setShowHelp] = useState(false);
  const [showQuit, setShowQuit] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [levelElapsedMs, setLevelElapsedMs] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const questionStartTimeRef = useRef<number>(Date.now());
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);

  // Keep stateRef in sync
  useEffect(() => {
    stateRef.current = state;
  });

  // Persist on every state change
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Apply saved theme on mount
  useEffect(() => {
    const theme = localStorage.getItem('codetrivia-theme') ?? 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  // Reset per-question UI when question changes
  useEffect(() => {
    if (state.phase === 'playing') {
      questionStartTimeRef.current = Date.now();
      setSelectedAnswer(null);
      setShowFeedback(false);
    }
  }, [state.currentQuestionIndex, state.phase]);

  // Save best and flag when win screen shows
  useEffect(() => {
    if (state.phase === 'win') {
      const current = loadBest();
      const wasNew =
        !current ||
        state.totalScore > current.score ||
        (state.totalScore === current.score && state.totalElapsedMs < current.timeMs);
      saveBest(state.totalScore, state.totalElapsedMs);
      setBest(loadBest());
      setIsNewBest(wasNew);
    }
  }, [state.phase]);

  // Keyboard support during play
  useEffect(() => {
    if (state.phase !== 'playing' || showFeedback || selectedAnswer !== null) return;
    const question = state.levelQuestions[state.currentQuestionIndex];
    if (!question) return;

    function handleKey(e: KeyboardEvent) {
      if (showHelp || showQuit) return;
      if (e.key === 'Escape') { setShowQuit(true); return; }

      if (question.format === 'multiple-choice') {
        const idx = Number(e.key) - 1;
        if (idx >= 0 && idx < question.options.length) {
          doAnswer(question.options[idx]);
        }
      } else {
        if (e.key === 't' || e.key === 'T') doAnswer('True');
        if (e.key === 'f' || e.key === 'F') doAnswer('False');
      }
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  function doAnswer(answer: string) {
    if (selectedAnswer !== null || showFeedback) return;

    const question = state.levelQuestions[state.currentQuestionIndex];
    const record = buildAnswerRecord(question, answer, questionStartTimeRef.current);
    setSelectedAnswer(answer);
    setShowFeedback(true);
    dispatch({ type: 'record_answer', record });

    feedbackTimerRef.current = setTimeout(() => {
      setShowFeedback(false);
      setSelectedAnswer(null);

      const s = stateRef.current;
      const isLastQuestion = s.currentQuestionIndex + 1 >= s.levelQuestions.length;

      if (isLastQuestion) {
        const elapsed = s.levelStartTime ? Date.now() - s.levelStartTime : 0;
        setLevelElapsedMs(elapsed);
        dispatch({ type: 'show_level_result', elapsedMs: elapsed });
      } else {
        dispatch({ type: 'next_question' });
      }
    }, 1200);
  }

  function handleStartCampaign() {
    dispatch({ type: 'start_campaign' });
    const questions = selectQuestionsForLevel(1, [], allQuestions);
    dispatch({ type: 'begin_level', questions });
  }

  function handleBeginLevel() {
    const questions = selectQuestionsForLevel(
      state.currentLevel,
      state.usedIds,
      allQuestions,
    );
    dispatch({ type: 'begin_level', questions });
  }

  function handleLevelResultContinue() {
    const config = LEVEL_CONFIG[state.currentLevel - 1];
    const correct = state.answers.filter((a) => a.correct).length;
    const passed = correct >= config.threshold;

    if (!passed) {
      dispatch({ type: 'go_game_over' });
      return;
    }

    if (state.currentLevel >= 5) {
      dispatch({ type: 'go_win' });
      return;
    }

    const questions = selectQuestionsForLevel(
      state.currentLevel + 1,
      state.usedIds,
      allQuestions,
    );
    dispatch({ type: 'advance_to_next_level', questions });
  }

  function handleTryAgain() {
    dispatch({ type: 'start_campaign' });
    const questions = selectQuestionsForLevel(1, [], allQuestions);
    dispatch({ type: 'begin_level', questions });
  }

  function handleQuitConfirm() {
    setShowQuit(false);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setSelectedAnswer(null);
    setShowFeedback(false);
    dispatch({ type: 'quit_to_home' });
  }

  const question = state.levelQuestions[state.currentQuestionIndex];
  const levelCorrect = state.answers.filter((a) => a.correct).length;
  const config = LEVEL_CONFIG[state.currentLevel - 1];

  return (
    <div className="app">
      {state.phase === 'home' && (
        <HomeScreen best={best} onStart={handleStartCampaign} />
      )}

      {state.phase === 'level-intro' && (
        <LevelIntro level={state.currentLevel} onBegin={handleBeginLevel} />
      )}

      {state.phase === 'playing' && question && (
        <QuestionCard
          question={question}
          questionIndex={state.currentQuestionIndex}
          totalQuestions={state.levelQuestions.length}
          score={levelCorrect}
          levelStartTime={state.levelStartTime ?? Date.now()}
          selectedAnswer={selectedAnswer}
          onSelect={doAnswer}
          showFeedback={showFeedback}
          onHelp={() => setShowHelp(true)}
          onQuit={() => setShowQuit(true)}
        />
      )}

      {state.phase === 'level-result' && (
        <LevelResult
          correct={levelCorrect}
          total={state.answers.length}
          passed={levelCorrect >= config.threshold}
          levelElapsedMs={levelElapsedMs}
          totalElapsedMs={state.totalElapsedMs}
          level={state.currentLevel}
          onContinue={handleLevelResultContinue}
        />
      )}

      {state.phase === 'game-over' && (
        <GameOver
          level={state.currentLevel}
          totalScore={state.totalScore}
          totalElapsedMs={state.totalElapsedMs}
          best={best}
          onTryAgain={handleTryAgain}
        />
      )}

      {state.phase === 'win' && (
        <WinScreen
          totalScore={state.totalScore}
          totalElapsedMs={state.totalElapsedMs}
          best={best}
          isNewBest={isNewBest}
          onPlayAgain={handleTryAgain}
        />
      )}

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showQuit && (
        <ConfirmModal
          message="Quit to home? Your current run will be lost."
          onConfirm={handleQuitConfirm}
          onCancel={() => setShowQuit(false)}
        />
      )}
    </div>
  );
}
