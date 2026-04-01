import './StatusBar.css';
import type { GameState } from '../gameLogic';

interface Props {
  gameState: GameState;
  isThinking: boolean;
}

export function StatusBar({ gameState, isThinking }: Props) {
  const { status, turn, winner } = gameState;

  let message: string;
  let isCheckMsg = false;

  if (status === 'checkmate') {
    message = `${winner === 'white' ? 'White' : 'Black'} wins by checkmate!`;
  } else if (status === 'stalemate') {
    message = 'Stalemate — Draw';
  } else if (status === 'draw') {
    message = 'Draw';
  } else if (isThinking) {
    message = 'Thinking...';
  } else if (status === 'check') {
    message = `${turn === 'white' ? 'White' : 'Black'} is in check!`;
    isCheckMsg = true;
  } else {
    message = `${turn === 'white' ? 'White' : 'Black'}'s turn`;
  }

  return (
    <div className="status-bar">
      <span className={isCheckMsg ? 'check-warning' : ''}>{message}</span>
    </div>
  );
}
