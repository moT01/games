import { useState, useEffect } from 'react';
import './App.css';
import {
  createEmptyBoard,
  placeBombs,
  revealCells,
  toggleFlag,
  checkWin,
  countFlags,
  revealAllBombs,
} from './gameLogic';
import type { Cell, Config, GameStatus } from './gameLogic';
import { DifficultySelect } from './components/DifficultySelect';
import { GameBoard } from './components/GameBoard';

export default function App() {
  const [config, setConfig] = useState<Config | null>(null);
  const [cells, setCells] = useState<Cell[]>([]);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [detonatedIndex, setDetonatedIndex] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (status !== 'playing') return;
    const id = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  function handleStart(cfg: Config) {
    setConfig(cfg);
    setCells(createEmptyBoard(cfg.rows, cfg.cols));
    setStatus('idle');
    setElapsedSeconds(0);
    setDetonatedIndex(null);
  }

  function handleReset() {
    if (!config) return;
    setCells(createEmptyBoard(config.rows, config.cols));
    setStatus('idle');
    setElapsedSeconds(0);
    setDetonatedIndex(null);
  }

  function handleChangeDifficulty() {
    setConfig(null);
    setCells([]);
    setStatus('idle');
    setElapsedSeconds(0);
    setDetonatedIndex(null);
  }

  function handleCellClick(index: number) {
    if (!config) return;
    if (status === 'won' || status === 'lost') return;
    if (cells[index].isFlagged || cells[index].isRevealed) return;

    let nextCells = cells;
    let nextStatus = status;

    if (status === 'idle') {
      nextCells = placeBombs(cells, config.rows, config.cols, config.bombs, index);
      nextStatus = 'playing';
    }

    if (nextCells[index].isBomb) {
      nextCells = revealAllBombs(nextCells);
      setDetonatedIndex(index);
      setCells(nextCells);
      setStatus('lost');
      return;
    }

    nextCells = revealCells(nextCells, index, config.rows, config.cols);

    if (checkWin(nextCells)) {
      // Auto-flag all un-flagged bombs on win
      nextCells = nextCells.map(c =>
        c.isBomb && !c.isFlagged ? { ...c, isFlagged: true } : c
      );
      setCells(nextCells);
      setStatus('won');
    } else {
      setCells(nextCells);
      setStatus(nextStatus);
    }
  }

  function handleCellRightClick(index: number) {
    if (status === 'won' || status === 'lost') return;
    if (cells[index].isRevealed) return;
    setCells(prev => toggleFlag(prev, index));
  }

  if (!config) {
    return <DifficultySelect onStart={handleStart} />;
  }

  return (
    <GameBoard
      cells={cells}
      config={config}
      status={status}
      flagCount={countFlags(cells)}
      elapsedSeconds={elapsedSeconds}
      detonatedIndex={detonatedIndex}
      showHelp={showHelp}
      onCellClick={handleCellClick}
      onCellRightClick={handleCellRightClick}
      onReset={handleReset}
      onChangeDifficulty={handleChangeDifficulty}
      onToggleHelp={() => setShowHelp(h => !h)}
    />
  );
}
