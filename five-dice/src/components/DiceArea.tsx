import './DiceArea.css'
import DieComponent from './Die'
import type { Die } from '../gameLogic'

interface Props {
  dice: Die[]
  rollCount: number
  rolling: boolean
  onToggleHold: (index: number) => void
}

export default function DiceArea({ dice, rollCount, rolling, onToggleHold }: Props) {
  return (
    <div className="dice-area" role="group" aria-label="Dice">
      {dice.map((die, i) => (
        <DieComponent
          key={i}
          index={i}
          value={die.value}
          held={die.held}
          rollCount={rollCount}
          rolling={rolling && !die.held}
          onToggleHold={onToggleHold}
        />
      ))}
    </div>
  )
}
