import { useState } from 'react'
import './ModeSelect.css'
import { Header } from './Header'

const bgPieces = [
  { x: '5%',  y: '8%',  symbol: '⚄' },
  { x: '42%', y: '4%',  symbol: '⬤' },
  { x: '80%', y: '7%',  symbol: '⚂' },
  { x: '12%', y: '25%', symbol: '⬤' },
  { x: '65%', y: '20%', symbol: '⚅' },
  { x: '88%', y: '30%', symbol: '⬤' },
  { x: '3%',  y: '55%', symbol: '⚁' },
  { x: '22%', y: '70%', symbol: '⬤' },
  { x: '50%', y: '88%', symbol: '⚃' },
  { x: '72%', y: '75%', symbol: '⬤' },
  { x: '90%', y: '60%', symbol: '⚀' },
  { x: '35%', y: '45%', symbol: '⬤' },
]

interface Props {
  onSelect: (mode: 'vs-ai' | 'two-player') => void
  onResume: () => void
  hasSavedGame: boolean
  winsVsAi: number
  theme: 'dark' | 'light'
  onThemeToggle: () => void
  onHelp: () => void
}

export function ModeSelect({ onSelect, onResume, hasSavedGame, winsVsAi, theme, onThemeToggle, onHelp }: Props) {
  const [mode, setMode] = useState<'vs-ai' | 'two-player'>('vs-ai')

  return (
    <>
      <div className="bg-pieces" aria-hidden="true">
        {bgPieces.map((p, i) => (
          <div key={i} className="bg-piece" style={{ left: p.x, top: p.y }}>{p.symbol}</div>
        ))}
      </div>
      <div className="game-card">
        <Header
          showClose={false}
          onClose={() => {}}
          theme={theme}
          onThemeToggle={onThemeToggle}
          onHelp={onHelp}
        />
        <div className="game-card__body">
          <div className="game-card__title-section">
            <h1 className="game-title">Backgammon</h1>
            <p className="game-subtitle">BEAR OFF TO WIN</p>
          </div>

          <div className="mode-tabs">
            <button
              className={`tab-btn${mode === 'vs-ai' ? ' tab-btn--active' : ''}`}
              onClick={() => setMode('vs-ai')}
            >
              vs AI
            </button>
            <button
              className={`tab-btn${mode === 'two-player' ? ' tab-btn--active' : ''}`}
              onClick={() => setMode('two-player')}
            >
              2 Players
            </button>
          </div>

          {mode === 'vs-ai' && (
            <div className="wins-display">
              <span className="wins-label">WINS</span>
              <span className="wins-num">{winsVsAi}</span>
            </div>
          )}

          <div className="home-actions">
            <button className="primary-btn" onClick={() => onSelect(mode)}>
              New Game
            </button>
            {hasSavedGame && (
              <button className="secondary-btn" onClick={onResume}>
                Resume Game
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
