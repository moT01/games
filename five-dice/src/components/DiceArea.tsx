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
};

function getRollLabel(rollCount: number): string {
  if (rollCount === 0) return '1st Roll';
  if (rollCount === 1) return '2nd Roll';
  if (rollCount === 2) return '3rd Roll (last)';
  return 'Score a category';
}

export function DiceArea({ dice, rollCount, turn, onRoll, onToggleHold, gameOver }: DiceAreaProps) {
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
        <button className="dice-area__rules-button" onClick={() => setShowRules(true)}>Rules</button>
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
      >
        {getRollLabel(rollCount)}
      </button>
    </div>
  );
}
