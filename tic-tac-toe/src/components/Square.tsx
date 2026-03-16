import './Square.css'

interface Props {
  value: string | null
  onClick: () => void
  disabled: boolean
  isWinner: boolean
}

export function Square({ value, onClick, disabled, isWinner }: Props) {
  const classes = [
    'square',
    value ? `square--${value.toLowerCase()}` : '',
    isWinner ? 'square--winner' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={classes} onClick={onClick} disabled={disabled}>
      {value}
    </button>
  )
}
