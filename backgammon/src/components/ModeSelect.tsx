import './ModeSelect.css'

interface ModeSelectProps {
  onSelect: (mode: 'vs-ai' | 'two-player') => void
}

export function ModeSelect({ onSelect }: ModeSelectProps) {
  return (
    <div className="mode-select">
      <h1 className="mode-select__title">Backgammon</h1>
      <div className="mode-select__buttons">
        <button className="mode-select__btn" onClick={() => onSelect('vs-ai')}>
          vs AI
        </button>
        <button className="mode-select__btn" onClick={() => onSelect('two-player')}>
          2 Players
        </button>
      </div>
    </div>
  )
}
