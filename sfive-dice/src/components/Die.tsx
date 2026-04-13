import './Die.css';
import type { Die as DieType } from '../gameLogic';

// 9-cell boolean map for a 3×3 pip grid (row-major: TL TC TR / ML MC MR / BL BC BR)
const PIP_MAPS: Record<number, boolean[]> = {
  1: [false, false, false, false, true,  false, false, false, false],
  2: [false, false, true,  false, false, false, true,  false, false],
  3: [false, false, true,  false, true,  false, true,  false, false],
  4: [true,  false, true,  false, false, false, true,  false, true ],
  5: [true,  false, true,  false, true,  false, true,  false, true ],
  6: [true,  false, true,  true,  false, true,  true,  false, true ],
};

type DieProps = {
  die: DieType;
  onToggleHold: (id: number) => void;
  disabled: boolean;
  rolling: boolean;
};

export function Die({ die, onToggleHold, disabled, rolling }: DieProps) {
  const pips = PIP_MAPS[die.value] ?? PIP_MAPS[1];

  return (
    <button
      className={`die${die.held ? ' die--held' : ''}${disabled ? ' die--disabled' : ''}${rolling ? ' die--rolling' : ''}`}
      onClick={() => onToggleHold(die.id)}
      disabled={disabled}
      aria-label={`Die ${die.id + 1}, value ${die.value}${die.held ? ', held' : ''}`}
    >
      <span className="die__pips">
        {pips.map((active, i) => (
          <span key={i} className={`die__pip${active ? ' die__pip--active' : ''}`} />
        ))}
      </span>
    </button>
  );
}
