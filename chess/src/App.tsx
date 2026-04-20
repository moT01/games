import { useEffect, useState } from 'react'
import './App.css'
import { ModeSelect } from './components/ModeSelect'
import { Game, type GameConfig } from './components/Game'
import { Header } from './components/Header'
import type { Mode, Difficulty, GameState } from './gameLogic'

const SAVE_KEY = 'chess_state'

type SavedGame = { gameState: GameState; config: GameConfig }

function loadSavedGame(): SavedGame | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SavedGame
  } catch {
    return null
  }
}

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
  const [hasSavedGame, setHasSavedGame] = useState(() => loadSavedGame() !== null)
  const [resumeState, setResumeState] = useState<GameState | null>(null)
  const [winsNormal, setWinsNormal] = useState(
    () => parseInt(localStorage.getItem('chess_wins_normal') || '0')
  )
  const [winsHard, setWinsHard] = useState(
    () => parseInt(localStorage.getItem('chess_wins_hard') || '0')
  )

  function handleWin(difficulty: Difficulty) {
    if (difficulty === 'hard') {
      const next = winsHard + 1
      setWinsHard(next)
      localStorage.setItem('chess_wins_hard', String(next))
    } else {
      const next = winsNormal + 1
      setWinsNormal(next)
      localStorage.setItem('chess_wins_normal', String(next))
    }
  }

  useEffect(() => {
    document.body.classList.remove('dark-palette', 'light-palette')
    document.body.classList.add(theme === 'light' ? 'light-palette' : 'dark-palette')
    localStorage.setItem('chess_theme', theme)
  }, [theme])

  function toggleTheme() {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'))
  }

  function handleStart(mode: Mode, difficulty: Difficulty, playerColor: 'white' | 'black') {
    localStorage.removeItem(SAVE_KEY)
    setHasSavedGame(false)
    setResumeState(null)
    setConfig({ mode, difficulty, playerColor })
  }

  function handleResume() {
    const saved = loadSavedGame()
    if (!saved) return
    setResumeState(saved.gameState)
    setConfig(saved.config)
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
            onResume={handleResume}
            hasSavedGame={hasSavedGame}
            winsNormal={winsNormal}
            winsHard={winsHard}
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
      onWin={handleWin}
      initialState={resumeState ?? undefined}
      onSaveChange={setHasSavedGame}
    />
  )
}

export default App
