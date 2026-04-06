import { useState } from 'react';
import type { Config, Difficulty } from '../gameLogic';
import './DifficultySelect.css';

type Preset = Exclude<Difficulty, 'custom'>;

const PRESETS: Record<Preset, Config> = {
  beginner:     { rows: 9,  cols: 9,  bombs: 10, difficulty: 'beginner' },
  intermediate: { rows: 16, cols: 16, bombs: 40, difficulty: 'intermediate' },
  expert:       { rows: 16, cols: 30, bombs: 99, difficulty: 'expert' },
};

type Props = { onStart: (config: Config) => void };

export function DifficultySelect({ onStart }: Props) {
  const [showCustom, setShowCustom] = useState(false);
  const [custom, setCustom] = useState({ rows: '9', cols: '9', bombs: '10' });
  const [error, setError] = useState('');

  function handlePreset(difficulty: Preset) {
    onStart(PRESETS[difficulty]);
  }

  function handleCustomStart() {
    const rows = parseInt(custom.rows, 10);
    const cols = parseInt(custom.cols, 10);
    const bombs = parseInt(custom.bombs, 10);
    if (!rows || !cols || !bombs || rows < 2 || cols < 2 || bombs < 1) {
      setError('Rows and cols must be ≥ 2, viruses ≥ 1.');
      return;
    }
    if (bombs >= rows * cols) {
      setError('Virus count must be less than total sectors.');
      return;
    }
    onStart({ rows, cols, bombs, difficulty: 'custom' });
  }

  return (
    <div className="difficulty-select">
      <h1 className="difficulty-select__title">Cyber Sweeper</h1>
      <p className="difficulty-select__subtitle">Select security level to initialize</p>
      <div className="difficulty-select__buttons">
        <button className="difficulty-select__btn" onClick={() => handlePreset('beginner')}>
          <span className="difficulty-select__btn-name">Protocol 1</span>
          <span className="difficulty-select__btn-desc">9×9 · 10 viruses</span>
        </button>
        <button className="difficulty-select__btn" onClick={() => handlePreset('intermediate')}>
          <span className="difficulty-select__btn-name">Protocol 2</span>
          <span className="difficulty-select__btn-desc">16×16 · 40 viruses</span>
        </button>
        <button className="difficulty-select__btn" onClick={() => handlePreset('expert')}>
          <span className="difficulty-select__btn-name">Protocol 3</span>
          <span className="difficulty-select__btn-desc">30×16 · 99 viruses</span>
        </button>
        <button
          className="difficulty-select__btn difficulty-select__btn--custom"
          onClick={() => setShowCustom(s => !s)}
        >
          <span className="difficulty-select__btn-name">Override</span>
          <span className="difficulty-select__btn-desc">Custom Parameters</span>
        </button>
      </div>
      {showCustom && (
        <div className="difficulty-select__custom">
          <label className="difficulty-select__label">
            Rows
            <input
              type="number"
              min={2}
              value={custom.rows}
              onChange={e => setCustom(s => ({ ...s, rows: e.target.value }))}
              className="difficulty-select__input"
            />
          </label>
          <label className="difficulty-select__label">
            Cols
            <input
              type="number"
              min={2}
              value={custom.cols}
              onChange={e => setCustom(s => ({ ...s, cols: e.target.value }))}
              className="difficulty-select__input"
            />
          </label>
          <label className="difficulty-select__label">
            Viruses
            <input
              type="number"
              min={1}
              value={custom.bombs}
              onChange={e => setCustom(s => ({ ...s, bombs: e.target.value }))}
              className="difficulty-select__input"
            />
          </label>
          {error && <p className="difficulty-select__error">{error}</p>}
          <button className="difficulty-select__btn" onClick={handleCustomStart}>
            Initialize Override
          </button>
        </div>
      )}
    </div>
  );
}
