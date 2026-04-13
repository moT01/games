import { useState } from 'react';
import './DiceArea.css';
import { Die as DieComponent } from './Die';
import { RulesModal } from './RulesModal';
import type { Die } from '../gameLogic';

type DiceAreaProps = {
  dice: Die[];
  rollCount: number;
  turn: number;
  onRoll: () => void;
  onToggleHold: (id: number) => void;
  gameOver: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onNewGame: () => void;
  onQuit: () => void;
};

function getRollLabel(rollCount: number): string {
  if (rollCount === 0) return '1st Roll';
  if (rollCount === 1) return '2nd Roll';
  if (rollCount === 2) return '3rd Roll (last)';
  return 'Score a category';
}

export function DiceArea({ dice, rollCount, turn, onRoll, onToggleHold, gameOver, theme, onToggleTheme, onNewGame, onQuit }: DiceAreaProps) {
  const [rolling, setRolling] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const rollDisabled = rollCount >= 3 || gameOver;
  const dieDisabled = rollCount === 0 || rollCount >= 3 || gameOver;

  function handleRoll() {
    setRolling(true);
    setTimeout(() => setRolling(false), 350);
    onRoll();
  }

  return (
    <div className="dice-area">
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}

      <div className="dice-area__header">
        <p className="dice-area__turn-info">Turn {turn} of 13</p>
        <div className="dice-area__actions">
          <button
            className="dice-area__action-btn"
            onClick={() => setShowRules(true)}
            aria-label="View rules"
          >
            Rules
          </button>
          <button
            className="dice-area__action-btn"
            onClick={onNewGame}
            aria-label="Start new game"
          >
            New
          </button>
          <button
            className="dice-area__action-btn"
            onClick={onQuit}
            aria-label="Quit to home"
          >
            Quit
          </button>
          <button
            className="dice-area__action-btn"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? '☀' : '🌙'}
          </button>
          <a
            className="dice-area__action-btn"
            href="https://www.freecodecamp.org/donate"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Donate to freeCodeCamp"
          >
            Donate
          </a>
        </div>
      </div>

      <div className="dice-area__row">
        {dice.map(die => (
          <DieComponent
            key={die.id}
            die={die}
            onToggleHold={onToggleHold}
            disabled={dieDisabled}
            rolling={rolling && !die.held}
          />
        ))}
      </div>

      <button
        className="dice-area__roll-button"
        onClick={handleRoll}
        disabled={rollDisabled}
        aria-label={getRollLabel(rollCount)}
      >
        {getRollLabel(rollCount)}
      </button>
    </div>
  );
}
