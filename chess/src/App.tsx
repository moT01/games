import { useState } from 'react'
import './App.css'
import { ModeSelect } from './components/ModeSelect'
import { Game, type GameConfig } from './components/Game'
import type { Mode, Difficulty } from './gameLogic'

function App() {
  const [config, setConfig] = useState<GameConfig | null>(null)

  function handleStart(mode: Mode, difficulty: Difficulty, playerColor: 'white' | 'black') {
    setConfig({ mode, difficulty, playerColor })
  }

  if (!config) {
    return (
      <div className="menu-wrap">
        <ModeSelect
          onStart={handleStart}
          onResume={() => {}}
          hasSavedGame={false}
          winsNormal={0}
          winsHard={0}
        />
      </div>
    )
  }

  return <Game config={config} onBackToMenu={() => setConfig(null)} />
}

export default App
