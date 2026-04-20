import { useEffect, useState } from 'react'
import './App.css'
import { ModeSelect } from './components/ModeSelect'
import { Game, type GameConfig } from './components/Game'
import { Header } from './components/Header'
import type { Mode, Difficulty } from './gameLogic'

type Theme = 'dark' | 'light'

function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">How to Play</h2>
        <div className="modal-content">
          <h3>Objective</h3>
          <p>Checkmate your opponent's king — put it under attack with no escape.</p>
          <h3>Pieces</h3>
          <ul>
            <li>King moves one square in any direction.</li>
            <li>Queen moves any number of squares in any direction.</li>
            <li>Rook moves any number of squares horizontally or vertically.</li>
            <li>Bishop moves any number of squares diagonally.</li>
            <li>Knight moves in an L-shape and can jump over pieces.</li>
            <li>Pawn moves forward one square, captures diagonally. Reach the back rank to promote.</li>
          </ul>
          <h3>Special Rules</h3>
          <ul>
            <li>Castling: king and rook swap if neither has moved and the path is clear.</li>
            <li>En passant: a pawn may capture an adjacent pawn that just moved two squares.</li>
            <li>Draw by stalemate, 3-fold repetition, or 50 moves without capture or pawn move.</li>
          </ul>
        </div>
        <div className="modal-actions">
          <button className="primary-btn" onClick={onClose}>Got it</button>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [config, setConfig] = useState<GameConfig | null>(null)
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('chess_theme') as Theme) || 'dark'
  )
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    document.body.classList.remove('dark-palette', 'light-palette')
    document.body.classList.add(theme === 'light' ? 'light-palette' : 'dark-palette')
    localStorage.setItem('chess_theme', theme)
  }, [theme])

  function toggleTheme() {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'))
  }

  function handleStart(mode: Mode, difficulty: Difficulty, playerColor: 'white' | 'black') {
    setConfig({ mode, difficulty, playerColor })
  }

  if (!config) {
    return (
      <div className="menu-wrap">
        <Header
          showBack={false}
          onBack={() => {}}
          theme={theme}
          onThemeToggle={toggleTheme}
          onHelp={() => setShowHelp(true)}
        />
        <div className="menu-body">
          <ModeSelect
            onStart={handleStart}
            onResume={() => {}}
            hasSavedGame={false}
            winsNormal={0}
            winsHard={0}
          />
        </div>
        {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      </div>
    )
  }

  return (
    <Game
      config={config}
      theme={theme}
      onThemeToggle={toggleTheme}
      onBackToMenu={() => setConfig(null)}
    />
  )
}

export default App
