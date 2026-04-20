import { useEffect, useState } from 'react'
import './App.css'
import { ModeSelect } from './components/ModeSelect'
import { Game, type GameConfig } from './components/Game'
import { Header } from './components/Header'
import type { Mode, Difficulty, GameState } from './gameLogic'

const SAVE_KEY = 'chess_state'

type Theme = 'dark' | 'light'
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
            <li>Knight moves in an L-shape, two squares in one direction and one square perpendicular, and can jump over pieces.</li>
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

function QuitModal({ onCancel, onQuit }: { onCancel: () => void; onQuit: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">Quit Game</h2>
        <div className="modal-content">
          <p>Return to the main menu? You can resume your game from there.</p>
        </div>
        <div className="modal-actions">
          <button className="secondary-btn" onClick={onCancel}>Cancel</button>
          <button className="primary-btn" onClick={onQuit}>Quit</button>
        </div>
      </div>
    </div>
  )
}

const bgPieces = [
  { x: '8%',  y: '5%',  symbol: '♔' },
  { x: '42%', y: '3%',  symbol: '♛' },
  { x: '78%', y: '6%',  symbol: '♞' },
  { x: '15%', y: '22%', symbol: '♗' },
  { x: '58%', y: '18%', symbol: '♜' },
  { x: '20%', y: '85%', symbol: '♗' },
  { x: '48%', y: '92%', symbol: '♙' },
  { x: '65%', y: '78%', symbol: '♟' },
  // pair — left mid
  { x: '3%',  y: '48%', symbol: '♙' },
  { x: '9%',  y: '58%', symbol: '♕' },
  // pair — bottom right
  { x: '82%', y: '72%', symbol: '♟' },
  { x: '88%', y: '81%', symbol: '♖' },
  // trio — right diagonal
  { x: '86%', y: '35%', symbol: '♘' },
  { x: '91%', y: '44%', symbol: '♝' },
  { x: '86%', y: '53%', symbol: '♚' },
  // trio — lower left diagonal
  { x: '6%',  y: '72%', symbol: '♙' },
  { x: '12%', y: '81%', symbol: '♖' },
  { x: '18%', y: '72%', symbol: '♗' },
]

function App() {
  const [config, setConfig] = useState<GameConfig | null>(null)
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('chess_theme') as Theme) || 'dark'
  )
  const [showHelp, setShowHelp] = useState(false)
  const [showQuitConfirm, setShowQuitConfirm] = useState(false)
  const [hasSavedGame, setHasSavedGame] = useState(() => loadSavedGame() !== null)
  const [resumeState, setResumeState] = useState<GameState | null>(null)
  const [gameStatus, setGameStatus] = useState({ text: '', cls: '' })
  const [winsNormal, setWinsNormal] = useState(
    () => parseInt(localStorage.getItem('chess_wins_normal') || '0')
  )
  const [winsHard, setWinsHard] = useState(
    () => parseInt(localStorage.getItem('chess_wins_hard') || '0')
  )

  useEffect(() => {
    document.body.classList.remove('dark-palette', 'light-palette')
    document.body.classList.add(theme === 'light' ? 'light-palette' : 'dark-palette')
    localStorage.setItem('chess_theme', theme)
  }, [theme])

  function toggleTheme() {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'))
  }

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

  function handleStart(mode: Mode, difficulty: Difficulty, playerColor: 'white' | 'black') {
    localStorage.removeItem(SAVE_KEY)
    setHasSavedGame(false)
    setResumeState(null)
    setGameStatus({ text: '', cls: '' })
    setConfig({ mode, difficulty, playerColor })
  }

  function handleResume() {
    const saved = loadSavedGame()
    if (!saved) return
    setResumeState(saved.gameState)
    setConfig(saved.config)
  }

  function handleBack() {
    if (config) setShowQuitConfirm(true)
  }

  function handleQuit() {
    setShowQuitConfirm(false)
    setConfig(null)
    setGameStatus({ text: '', cls: '' })
  }

  return (
    <div className="app">
      <div className="bg-pieces" aria-hidden="true">
        {bgPieces.map((p, i) => (
          <div key={i} className="bg-piece" style={{ left: p.x, top: p.y }}>
            {p.symbol}
          </div>
        ))}
      </div>
      <div className="game-card">
        <Header
          showBack={!!config}
          onBack={handleBack}
          theme={theme}
          onThemeToggle={toggleTheme}
          onHelp={() => setShowHelp(true)}
          statusText={config ? gameStatus.text : undefined}
          statusClass={config ? gameStatus.cls : undefined}
        />
        <div className="game-card__body">
          {!config && (
            <>
              <div className="game-card__title-section">
                <h1 className="game-title">Chess</h1>
                <p className="game-subtitle">A CLASSIC BOARD GAME</p>
              </div>
              <ModeSelect
                onStart={handleStart}
                onResume={handleResume}
                hasSavedGame={hasSavedGame}
                winsNormal={winsNormal}
                winsHard={winsHard}
              />
            </>
          )}
          {config && (
            <Game
              config={config}
              onBackToMenu={() => setConfig(null)}
              onWin={handleWin}
              initialState={resumeState ?? undefined}
              onSaveChange={setHasSavedGame}
              onStatusChange={setGameStatus}
            />
          )}
        </div>
      </div>
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showQuitConfirm && <QuitModal onCancel={() => setShowQuitConfirm(false)} onQuit={handleQuit} />}
    </div>
  )
}

export default App
