import './FeedbackFlash.css';

interface Props {
  correct: boolean;
  correctAnswer: string;
  explanation: string;
}

export function FeedbackFlash({ correct, correctAnswer, explanation }: Props) {
  return (
    <div className={`feedback-flash ${correct ? 'feedback-flash--correct' : 'feedback-flash--wrong'}`}>
      <div className="feedback-flash__panel">
        <div className="feedback-flash__icon">{correct ? '✓' : '✗'}</div>
        <p className="feedback-flash__label">{correct ? 'Correct!' : 'Wrong'}</p>
        {!correct && (
          <p className="feedback-flash__answer">
            Answer: <span>{correctAnswer}</span>
          </p>
        )}
        <p className="feedback-flash__explanation">{explanation}</p>
      </div>
    </div>
  );
}
