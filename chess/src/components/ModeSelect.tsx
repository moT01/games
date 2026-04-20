import { useState } from 'react'
import type { Mode, Difficulty } from '../gameLogic'
import './ModeSelect.css'

interface Props {
  onStart: (mode: Mode, difficulty: Difficulty, playerColor: 'white' | 'black') => void
  onResume: () => void
  hasSavedGame: boolean
  winsNormal: number
  winsHard: number
}

export function ModeSelect({ onStart, onResume, hasSavedGame, winsNormal, winsHard }: Props) {
  const [mode, setMode] = useState<Mode>('vs-computer')
  const [hardMode, setHardMode] = useState(false)
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white')

  const difficulty: Difficulty = hardMode ? 'hard' : 'easy'

  return (
    <div className="home-body">
      <div className="game-card__title-section">
        <h1 className="game-title">Chess</h1>
        <p className="game-subtitle">A CLASSIC BOARD GAME</p>
      </div>

      <div className="mode-tabs">
        <button
          className={`tab-btn${mode === 'vs-computer' ? ' tab-btn--active' : ''}`}
          onClick={() => setMode('vs-computer')}
        >
          vs Computer
        </button>
        <button
          className={`tab-btn${mode === 'local' ? ' tab-btn--active' : ''}`}
          onClick={() => setMode('local')}
        >
          2 Players
        </button>
      </div>

      {mode === 'vs-computer' && (
        <div className="wins-display">
          <span className="wins-label">WINS</span>
          <div className="wins-rows">
            <div className="wins-row">
              <span className="wins-row-label">Normal</span>
              <span className="wins-num">{winsNormal}</span>
            </div>
            <div className="wins-row">
              <span className="wins-row-label">Hard</span>
              <span className="wins-num">{winsHard}</span>
            </div>
          </div>
        </div>
      )}

      {mode === 'vs-computer' && (
        <div className="option-row">
          <div className="pill-toggle">
            <button
              className={`pill-btn${playerColor === 'white' ? ' pill-btn--active' : ''}`}
              onClick={() => setPlayerColor('white')}
            >
              Light <span className="goes-first">(goes first)</span>
            </button>
            <button
              className={`pill-btn${playerColor === 'black' ? ' pill-btn--active' : ''}`}
              onClick={() => setPlayerColor('black')}
            >
              Dark
            </button>
          </div>
          <label className="hard-mode-label">
            <input
              type="checkbox"
              className="hard-mode-check"
              checked={hardMode}
              onChange={e => setHardMode(e.target.checked)}
            />
            <span className="hard-mode-text">Hard mode</span>
          </label>
        </div>
      )}

      <div className="home-actions">
        <button className="primary-btn" onClick={() => onStart(mode, difficulty, playerColor)}>
          New Game
        </button>
        {hasSavedGame && (
          <button className="secondary-btn" onClick={onResume}>
            Resume Game
          </button>
        )}
      </div>
    </div>
  )
}
