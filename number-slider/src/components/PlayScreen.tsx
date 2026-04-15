import { useState, useEffect, useCallback, useRef } from 'react';
import './PlayScreen.css';
import type { GameState, BestScores, Mode } from '../App';
import { Board } from './Board';
import { WinModal } from './WinModal';
import { HelpModal } from './HelpModal';
import { ConfirmModal } from './ConfirmModal';
import { getValidMoves, moveTile, isSolved, arrowKeyToTileIndex } from '../gameLogic';

interface PlayScreenProps {
  gameState: GameState;
  bestScores: BestScores;
  theme: 'dark' | 'light';
  onStateChange: (state: GameState) => void;
  onNewGame: (mode: Mode) => void;
  onGoHome: () => void;
  onWin: (state: GameState) => void;
  onToggleTheme: () => void;
}

function modeToN(mode: Mode): number {
  return parseInt(mode[0], 10);
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function PlayScreen({
  gameState,
  bestScores,
  theme,
  onStateChange,
  onNewGame,
  onGoHome,
  onWin,
  onToggleTheme,
}: PlayScreenProps) {
  const [showHelp, setShowHelp] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'home' | 'newgame' | null>(null);
  const [displaySeconds, setDisplaySeconds] = useState(gameState.elapsedSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef(gameState);
  stateRef.current = gameState;

  const n = modeToN(gameState.mode);

  // Tick the timer
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (gameState.timerActive && gameState.startTime !== null) {
      const tick = () => {
        const s = stateRef.current;
        if (s.startTime !== null) {
          const extra = Math.floor((Date.now() - s.startTime) / 1000);
          setDisplaySeconds(s.elapsedSeconds + extra);
        }
      };
      tick();
      intervalRef.current = setInterval(tick, 1000);
    } else {
      setDisplaySeconds(gameState.elapsedSeconds);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [gameState.timerActive, gameState.startTime, gameState.elapsedSeconds]);

  const handleTileClick = useCallback((index: number) => {
    const s = stateRef.current;
    if (s.won) return;

    const newTiles = moveTile(s.tiles, index, modeToN(s.mode));
    if (!newTiles) return;

    const now = Date.now();
    const newElapsed = s.timerActive && s.startTime !== null
      ? s.elapsedSeconds + Math.floor((now - s.startTime) / 1000)
      : s.elapsedSeconds;

    const solved = isSolved(newTiles);

    const newState: GameState = {
      ...s,
      tiles: newTiles,
      moves: s.moves + 1,
      elapsedSeconds: solved ? newElapsed : s.elapsedSeconds,
      timerActive: !solved,
      startTime: solved ? null : (s.startTime ?? now),
      won: solved,
    };

    onStateChange(newState);

    if (solved) {
      onWin(newState);
    }
  }, [onStateChange, onWin]);

  // Keyboard handler
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const s = stateRef.current;
      if (s.won) return;
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      e.preventDefault();
      const tileIndex = arrowKeyToTileIndex(s.tiles, modeToN(s.mode), e.key);
      if (tileIndex === null) return;
      handleTileClick(tileIndex);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleTileClick]);

  function handleNewGameRequest() {
    if (gameState.moves > 0 && !gameState.won) {
      setConfirmAction('newgame');
    } else {
      onNewGame(gameState.mode);
    }
  }

  function handleHomeRequest() {
    if (gameState.moves > 0 && !gameState.won) {
      setConfirmAction('home');
    } else {
      onGoHome();
    }
  }

  function handleConfirm() {
    if (confirmAction === 'home') {
      onGoHome();
    } else if (confirmAction === 'newgame') {
      onNewGame(gameState.mode);
    }
    setConfirmAction(null);
  }

  function handleCancel() {
    setConfirmAction(null);
  }

  const validMoveIndices = gameState.won ? [] : getValidMoves(gameState.tiles, n);

  return (
    <div className="play-screen">
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {confirmAction && (
        <ConfirmModal
          message={
            confirmAction === 'home'
              ? 'Go back to the menu? Your progress will be saved.'
              : 'Start a new game? Your current progress will be lost.'
          }
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
      {gameState.won && (
        <WinModal
          moves={gameState.moves}
          seconds={gameState.elapsedSeconds}
          previousBest={bestScores[gameState.mode]}
          onPlayAgain={() => onNewGame(gameState.mode)}
          onHome={onGoHome}
        />
      )}

      <div className="play-screen__top-bar">
        <button className="btn btn-secondary play-screen__icon-btn" onClick={handleHomeRequest} aria-label="Close">
          ✕
        </button>
        <span className="play-screen__mode">{gameState.mode}</span>
        <div className="play-screen__top-actions">
          <button className="btn btn-secondary play-screen__icon-btn" onClick={() => setShowHelp(true)} aria-label="Help">
            ?
          </button>
          <button className="btn btn-secondary play-screen__icon-btn" onClick={onToggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <a
            className="btn btn-secondary play-screen__icon-btn"
            href="https://www.freecodecamp.org/donate"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Donate"
          >
            ♥
          </a>
        </div>
      </div>

      <div className="play-screen__status">
        <div className="play-screen__stat">
          <span className="play-screen__stat-label">Moves</span>
          <span
            key={gameState.moves}
            className="play-screen__stat-value play-screen__stat-value--pulse"
          >
            {gameState.moves}
          </span>
        </div>
        <div className="play-screen__stat">
          <span className="play-screen__stat-label">Time</span>
          <span className="play-screen__stat-value">{formatTime(displaySeconds)}</span>
        </div>
      </div>

      <Board
        tiles={gameState.tiles}
        n={n}
        validMoveIndices={validMoveIndices}
        onTileClick={handleTileClick}
      />

      <button className="btn btn-secondary play-screen__new-btn" onClick={handleNewGameRequest}>
        New Game
      </button>
    </div>
  );
}
