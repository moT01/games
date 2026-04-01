import './DiceDisplay.css'

interface DiceDisplayProps {
  dice: number[]
  diceAnimKey: number
}

export function DiceDisplay({ dice, diceAnimKey }: DiceDisplayProps) {
  if (dice.length === 0) return <div className="dice-display dice-display--empty" />

  return (
    <div className="dice-display">
      {dice.map((value, i) => (
        <div key={`${diceAnimKey}-${i}`} className="die">
          {value}
        </div>
      ))}
    </div>
  )
}
