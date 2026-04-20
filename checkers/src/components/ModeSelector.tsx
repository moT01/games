import { useState } from 'react'
import type { Difficulty, Mode, Player } from '../gameLogic'
import './ModeSelector.css'

interface Props {
  onStart: (mode: Mode, difficulty: Difficulty, playerSide: Player) => void
  onResume: () => void
  hasSavedGame: boolean
  winsNormal: number
  winsHard: number
}

export function ModeSelector({ onStart, onResume, hasSavedGame, winsNormal, winsHard }: Props) {
  const [mode, setMode] = useState<Mode>('vs-computer')
  const [hardMode, setHardMode] = useState(false)
  const [playerSide, setPlayerSide] = useState<Player>('Light')

  const difficulty: Difficulty = hardMode ? 'hard' : 'easy'

  return (
    <div className="home-body">
      <div className="mode-tabs">
        <button
          className={`tab-btn${mode === 'vs-computer' ? ' tab-btn--active' : ''}`}
          onClick={() => setMode('vs-computer')}
        >
          vs Computer
        </button>
        <button
          className={`tab-btn${mode === 'vs-player' ? ' tab-btn--active' : ''}`}
          onClick={() => setMode('vs-player')}
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
              className={`pill-btn${playerSide === 'Light' ? ' pill-btn--active' : ''}`}
              onClick={() => setPlayerSide('Light')}
            >
              Light <span className="goes-first">(goes first)</span>
            </button>
            <button
              className={`pill-btn${playerSide === 'Dark' ? ' pill-btn--active' : ''}`}
              onClick={() => setPlayerSide('Dark')}
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
        <button className="primary-btn" onClick={() => onStart(mode, difficulty, playerSide)}>
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
