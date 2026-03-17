import { useState } from 'react'
import type { Difficulty, Mode, Player } from '../gameLogic'
import './ModeSelector.css'

interface Props {
  onStart: (mode: Mode, difficulty: Difficulty, playerSide: Player) => void
}

export function ModeSelector({ onStart }: Props) {
  const [mode, setMode] = useState<Mode>('vs-player')
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [playerSide, setPlayerSide] = useState<Player>('Red')

  return (
    <div className="mode-selector">
      <div className="mode-selector__group">
        <button
          className={`mode-selector__btn ${mode === 'vs-player' ? 'mode-selector__btn--active' : ''}`}
          onClick={() => setMode('vs-player')}
        >
          vs Player
        </button>
        <button
          className={`mode-selector__btn ${mode === 'vs-computer' ? 'mode-selector__btn--active' : ''}`}
          onClick={() => setMode('vs-computer')}
        >
          vs Computer
        </button>
      </div>

      {mode === 'vs-computer' && (
        <>
          <div className="mode-selector__group">
            <button
              className={`mode-selector__btn ${difficulty === 'easy' ? 'mode-selector__btn--active' : ''}`}
              onClick={() => setDifficulty('easy')}
            >
              Easy
            </button>
            <button
              className={`mode-selector__btn ${difficulty === 'hard' ? 'mode-selector__btn--active' : ''}`}
              onClick={() => setDifficulty('hard')}
            >
              Hard
            </button>
          </div>

          <div className="mode-selector__group">
            <button
              className={`mode-selector__btn ${playerSide === 'Red' ? 'mode-selector__btn--active mode-selector__btn--active-red' : ''}`}
              onClick={() => setPlayerSide('Red')}
            >
              Play as Red
            </button>
            <button
              className={`mode-selector__btn ${playerSide === 'Yellow' ? 'mode-selector__btn--active mode-selector__btn--active-yellow' : ''}`}
              onClick={() => setPlayerSide('Yellow')}
            >
              Play as Yellow
            </button>
          </div>
        </>
      )}

      <button
        className="mode-selector__start"
        onClick={() => onStart(mode, difficulty, playerSide)}
      >
        Start Game
      </button>
    </div>
  )
}
