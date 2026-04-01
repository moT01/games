import { useState } from 'react';
import './App.css';
import { ModeSelect } from './components/ModeSelect';
import { Game, type GameConfig } from './components/Game';

function App() {
  const [config, setConfig] = useState<GameConfig | null>(null);

  if (!config) {
    return <ModeSelect onStart={setConfig} />;
  }
  return <Game config={config} onBackToMenu={() => setConfig(null)} />;
}

export default App;
