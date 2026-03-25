import type { Choice, GameMode, MatchResult, RoundResult } from '../gameLogic';
import { ChoiceButton } from './ChoiceButton';
import { RoundResultDisplay } from './RoundResultDisplay';
import { ScoreBoard } from './ScoreBoard';
import './GameScreen.css';

interface GameScreenProps {
  mode: GameMode;
  playerScore: number;
  computerScore: number;
  drawCount: number;
  lastPlayerChoice: Choice | null;
  lastComputerChoice: Choice | null;
  lastRoundResult: RoundResult | null;
  matchResult: MatchResult;
  isRevealing: boolean;
  onChoice: (choice: Choice) => void;
  onPlayAgain: () => void;
  onChangeMode: () => void;
  onResetScore: () => void;
}

const choices: Choice[] = ['rock', 'paper', 'scissors'];

export function GameScreen({
  mode,
  playerScore,
  computerScore,
  drawCount,
  lastPlayerChoice,
  lastComputerChoice,
  lastRoundResult,
  matchResult,
  isRevealing,
  onChoice,
  onPlayAgain,
  onChangeMode,
  onResetScore,
}: GameScreenProps) {
  return (
    <div className="game-screen">
      <ScoreBoard
        playerScore={playerScore}
        computerScore={computerScore}
        drawCount={drawCount}
        mode={mode}
      />

      {matchResult !== null ? (
        <div className="game-screen__banner">
          <div className="game-screen__banner-text">
            {matchResult === 'player' ? 'You win the match!' : 'Computer wins the match!'}
          </div>
          <div className="game-screen__banner-actions">
            <button onClick={onPlayAgain}>Play Again</button>
            <button onClick={onChangeMode}>Change Mode</button>
          </div>
        </div>
      ) : (
        <div className="game-screen__choices">
          {choices.map((c) => (
            <ChoiceButton key={c} choice={c} onClick={onChoice} disabled={isRevealing} />
          ))}
        </div>
      )}

      {lastPlayerChoice && lastComputerChoice && lastRoundResult && (
        <RoundResultDisplay
          playerChoice={lastPlayerChoice}
          computerChoice={lastComputerChoice}
          result={lastRoundResult}
        />
      )}

      <div className="game-screen__actions">
        {mode === 'free' && (
          <button onClick={onResetScore}>Reset Score</button>
        )}
        <button onClick={onChangeMode}>Change Mode</button>
      </div>
    </div>
  );
}
