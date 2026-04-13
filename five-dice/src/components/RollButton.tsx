import './RollButton.css'

interface Props {
  rollCount: number
  onRoll: () => void
}

export default function RollButton({ rollCount, onRoll }: Props) {
  const disabled = rollCount >= 3
  const label = rollCount === 0 ? 'Roll' : `Roll (${rollCount}/3)`

  return (
    <button
      className="roll-btn"
      onClick={onRoll}
      disabled={disabled}
      aria-label={disabled ? 'Roll (must score first)' : label}
    >
      {label}
    </button>
  )
}
