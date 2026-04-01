import { useState } from 'react';
import './ModeSelect.css';
import type { GameConfig } from './Game';
import { ColorPicker } from './ColorPicker';

interface Props {
  onStart: (config: GameConfig) => void;
}

export function ModeSelect({ onStart }: Props) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  function handleLocalMultiplayer() {
    onStart({ mode: 'local', playerColor: 'white' });
  }

  function handleColorConfirm(color: 'white' | 'black' | 'random') {
    const playerColor: 'white' | 'black' =
      color === 'random' ? (Math.random() < 0.5 ? 'white' : 'black') : color;
    onStart({ mode: 'vs-computer', playerColor });
  }

  return (
    <div className="mode-select">
      <h1>Chess</h1>
      {!showColorPicker ? (
        <div className="mode-buttons">
          <button onClick={handleLocalMultiplayer}>Local Multiplayer</button>
          <button onClick={() => setShowColorPicker(true)}>vs Computer</button>
        </div>
      ) : (
        <ColorPicker onConfirm={handleColorConfirm} />
      )}
    </div>
  );
}
