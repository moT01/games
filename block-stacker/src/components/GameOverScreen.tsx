import { useEffect, useRef } from 'react';
import './GameOverScreen.css';

interface GameOverScreenProps {
  score: number;
  bestScore: number;
  onPlayAgain: () => void;
  onHome: () => void;
}

export default function GameOverScreen({ score, bestScore, onPlayAgain, onHome }: GameOverScreenProps) {
  const playAgainRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    playAgainRef.current?.focus();
  }, []);

  const isNewBest = score >= bestScore && score > 0;

  return (
    <div className="gameover">
      <h2 className="gameover__title">Game Over</h2>
      <div className="gameover__scores">
        <div className="gameover__score-item">
          <span className="gameover__label">Score</span>
          <span className="gameover__value">{score}</span>
          {isNewBest && <span className="gameover__best">New best!</span>}
        </div>
        <div className="gameover__score-item">
          <span className="gameover__label">Best</span>
          <span className="gameover__value">{bestScore}</span>
        </div>
      </div>
      <div className="gameover__actions">
        <button
          ref={playAgainRef}
          className="btn--primary"
          onClick={onPlayAgain}
          aria-label="Play again"
        >
          Play Again
        </button>
        <button
          className="btn btn--secondary"
          onClick={onHome}
          aria-label="Go to home screen"
          style={{ width: '100%' }}
        >
          Home
        </button>
      </div>
    </div>
  );
}
