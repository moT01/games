import type { GameMode } from '../gameLogic';
import { getWinsRequired } from '../gameLogic';
import './ScoreBoard.css';

interface ScoreBoardProps {
  playerScore: number;
  computerScore: number;
  drawCount: number;
  mode: GameMode;
}

export function ScoreBoard({ playerScore, computerScore, drawCount, mode }: ScoreBoardProps) {
  const threshold = getWinsRequired(mode);
  const showProgress = mode !== 'free';

  return (
    <div className="score-board">
      <div className="score-board__scores">
        <div className="score-board__item">
          <span className="score-board__label">You</span>
          <span className="score-board__value">{playerScore}</span>
        </div>
        <div className="score-board__item">
          <span className="score-board__label">Draws</span>
          <span className="score-board__value">{drawCount}</span>
        </div>
        <div className="score-board__item">
          <span className="score-board__label">Computer</span>
          <span className="score-board__value">{computerScore}</span>
        </div>
      </div>
      {showProgress && (
        <div className="score-board__progress">
          First to {threshold} wins
        </div>
      )}
    </div>
  );
}
