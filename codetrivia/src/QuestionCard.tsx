import { useEffect, useRef } from 'react';
import type { Question } from './types';
import { ElapsedTimer } from './ElapsedTimer';
import { FeedbackFlash } from './FeedbackFlash';
import './QuestionCard.css';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

interface Props {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  score: number;
  levelStartTime: number;
  selectedAnswer: string | null;
  onSelect: (answer: string) => void;
  showFeedback: boolean;
  onHelp: () => void;
  onQuit: () => void;
}

export function QuestionCard({
  question,
  questionIndex,
  totalQuestions,
  score,
  levelStartTime,
  selectedAnswer,
  onSelect,
  showFeedback,
  onHelp,
  onQuit,
}: Props) {
  const isTF = question.format === 'true-false';
  const locked = selectedAnswer !== null;
  const scoreRef = useRef<HTMLSpanElement>(null);
  const prevScore = useRef(score);

  useEffect(() => {
    if (score > prevScore.current && scoreRef.current) {
      scoreRef.current.classList.remove('score-pop');
      void scoreRef.current.offsetWidth;
      scoreRef.current.classList.add('score-pop');
    }
    prevScore.current = score;
  }, [score]);

  function getOptionState(opt: string): string {
    if (!locked) return '';
    if (opt === question.answer) return 'correct';
    if (opt === selectedAnswer) return 'wrong';
    return 'dim';
  }

  function renderPrompt(text: string) {
    const parts = text.split(/(`[^`]+`)/g);
    return parts.map((part, i) =>
      part.startsWith('`') && part.endsWith('`')
        ? <code key={i} className="inline-code">{part.slice(1, -1)}</code>
        : <span key={i}>{part}</span>
    );
  }

  return (
    <div className="question-card">
      <div className="question-card__topbar">
        <span className={`category-badge category-badge--${question.category}`}>
          {question.category.replace('-', ' ')}
        </span>
        <div className="question-card__actions">
          <button className="action-btn" onClick={onHelp} aria-label="Help">?</button>
          <button className="action-btn action-btn--quit" onClick={onQuit} aria-label="Quit to home">
            Quit
          </button>
        </div>
      </div>

      <div className="question-card__meta">
        <span className="meta-label">Q {questionIndex + 1} of {totalQuestions}</span>
        <span className="meta-label">
          Score: <span ref={scoreRef} className="meta-score">{score}</span>
        </span>
        <span className="meta-label timer-label">
          <ElapsedTimer startTime={levelStartTime} />
        </span>
      </div>

      <p className="question-card__prompt">{renderPrompt(question.prompt)}</p>

      <div className={`question-card__options ${isTF ? 'question-card__options--tf' : ''}`}>
        {question.options.map((opt, i) => {
          const label = isTF ? opt : `${OPTION_LABELS[i]}`;
          const state = getOptionState(opt);
          return (
            <button
              key={opt}
              className={`option-btn ${state ? `option-btn--${state}` : ''}`}
              onClick={() => !locked && onSelect(opt)}
              disabled={locked}
              aria-label={isTF ? opt : `Option ${label}: ${opt}`}
              aria-pressed={selectedAnswer === opt}
            >
              <span className="option-btn__label">{label}</span>
              <span className="option-btn__text">{renderPrompt(opt)}</span>
            </button>
          );
        })}
      </div>

      {showFeedback && selectedAnswer !== null && (
        <FeedbackFlash
          correct={selectedAnswer === question.answer}
          correctAnswer={question.answer}
          explanation={question.explanation}
        />
      )}
    </div>
  );
}
