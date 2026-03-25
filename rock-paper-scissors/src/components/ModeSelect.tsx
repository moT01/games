import type { GameMode } from '../gameLogic';
import './ModeSelect.css';

interface ModeSelectProps {
  onSelect: (mode: GameMode) => void;
}

export function ModeSelect({ onSelect }: ModeSelectProps) {
  return (
    <div className="mode-select">
      <h2>Choose a Mode</h2>
      <div className="mode-select__buttons">
        <button onClick={() => onSelect('free')}>Free Play</button>
        <button onClick={() => onSelect('best-of-3')}>Best of 3</button>
        <button onClick={() => onSelect('best-of-5')}>Best of 5</button>
      </div>
    </div>
  );
}
