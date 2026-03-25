import type { Choice, RoundResult } from '../gameLogic';
import './RoundResultDisplay.css';

const icons: Record<Choice, string> = {
  rock: '✊',
  paper: '✋',
  scissors: '✌️',
};

const resultText: Record<RoundResult, string> = {
  win: 'You win!',
  loss: 'You lose!',
  draw: 'Draw!',
};

function beatText(player: Choice, computer: Choice, result: RoundResult): string {
  if (result === 'draw') return 'Same choice';
  const winner = result === 'win' ? player : computer;
  const loser = result === 'win' ? computer : player;
  return `${winner.charAt(0).toUpperCase() + winner.slice(1)} beats ${loser}`;
}

interface RoundResultDisplayProps {
  playerChoice: Choice;
  computerChoice: Choice;
  result: RoundResult;
}

export function RoundResultDisplay({ playerChoice, computerChoice, result }: RoundResultDisplayProps) {
  return (
    <div className="round-result">
      <div className={`round-result__outcome round-result__outcome--${result}`}>
        {resultText[result]}
      </div>
      <div className="round-result__choices">
        <div className="round-result__choice">
          <span className="round-result__icon">{icons[playerChoice]}</span>
          <span className="round-result__name">You</span>
        </div>
        <span className="round-result__vs">vs</span>
        <div className="round-result__choice">
          <span className="round-result__icon">{icons[computerChoice]}</span>
          <span className="round-result__name">Computer</span>
        </div>
      </div>
      <div className="round-result__detail">
        {beatText(playerChoice, computerChoice, result)}
      </div>
    </div>
  );
}
