import './HomeScreen.css'

interface Props {
  countingMode: 'manual' | 'auto'
  onStart: () => void
  onToggleMode: () => void
}

export default function HomeScreen({ countingMode, onStart, onToggleMode }: Props) {
  return (
    <div className="home-screen">
      <div className="home-box">
        <h1 className="home-title">Cribbage</h1>
        <p className="home-subtitle">Human vs Computer</p>

        <button className="btn btn--primary home-start" onClick={onStart}>
          Play
        </button>

        <div className="home-row">
          <span className="home-label">Counting</span>
          <div className="toggle-group">
            <button
              className={`toggle-btn ${countingMode === 'auto' ? 'toggle-btn--active' : ''}`}
              onClick={() => countingMode !== 'auto' && onToggleMode()}
            >
              Auto
            </button>
            <button
              className={`toggle-btn ${countingMode === 'manual' ? 'toggle-btn--active' : ''}`}
              onClick={() => countingMode !== 'manual' && onToggleMode()}
            >
              Manual
            </button>
          </div>
        </div>

        <p className="home-mode-hint">
          {countingMode === 'manual'
            ? 'You select each scoring combination during the show.'
            : 'Points are counted automatically during the show.'}
        </p>
      </div>
    </div>
  )
}
