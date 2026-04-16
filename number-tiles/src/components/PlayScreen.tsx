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
  const [tickSeconds, setTickSeconds] = useState(gameState.elapsedSeconds);
  const displaySeconds = gameState.timerActive ? tickSeconds : gameState.elapsedSeconds;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef(gameState);
  useEffect(() => { stateRef.current = gameState; });

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
          setTickSeconds(s.elapsedSeconds + extra);
        }
      };
      tick();
      intervalRef.current = setInterval(tick, 1000);
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

      <div className="play-screen__card">
        <div className="play-screen__top-bar">
          <button className="btn btn-secondary icon-btn" onClick={handleHomeRequest} aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M376.6 84.5c11.3-13.6 9.5-33.8-4.1-45.1s-33.8-9.5-45.1 4.1L192 206 56.6 43.5C45.3 29.9 25.1 28.1 11.5 39.4S-3.9 70.9 7.4 84.5L150.3 256 7.4 427.5c-11.3 13.6-9.5 33.8 4.1 45.1s33.8 9.5 45.1-4.1L192 306 327.4 468.5c11.3 13.6 31.5 15.4 45.1 4.1s15.4-31.5 4.1-45.1L233.7 256 376.6 84.5z"/></svg>
          </button>
          <span className="play-screen__mode">{gameState.mode}</span>
          <div className="play-screen__top-actions">
            <button className="btn btn-secondary icon-btn" onClick={() => setShowHelp(true)} aria-label="Help">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M64 160c0-53 43-96 96-96s96 43 96 96c0 42.7-27.9 78.9-66.5 91.4-28.4 9.2-61.5 35.3-61.5 76.6l0 24c0 17.7 14.3 32 32 32s32-14.3 32-32l0-24c0-1.7 .6-4.1 3.5-7.3 3-3.3 7.9-6.5 13.7-8.4 64.3-20.7 110.8-81 110.8-152.3 0-88.4-71.6-160-160-160S0 71.6 0 160c0 17.7 14.3 32 32 32s32-14.3 32-32zm96 352c22.1 0 40-17.9 40-40s-17.9-40-40-40-40 17.9-40 40 17.9 40 40 40z"/></svg>
            </button>
            <button className="btn btn-secondary icon-btn" onClick={onToggleTheme} aria-label="Toggle theme">
              {theme === 'dark'
                ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M288-32c8.4 0 16.3 4.4 20.6 11.7L364.1 72.3 468.9 46c8.2-2 16.9 .4 22.8 6.3S500 67 498 75.1l-26.3 104.7 92.7 55.5c7.2 4.3 11.7 12.2 11.7 20.6s-4.4 16.3-11.7 20.6L471.7 332.1 498 436.8c2 8.2-.4 16.9-6.3 22.8S477 468 468.9 466l-104.7-26.3-55.5 92.7c-4.3 7.2-12.2 11.7-20.6 11.7s-16.3-4.4-20.6-11.7L211.9 439.7 107.2 466c-8.2 2-16.8-.4-22.8-6.3S76 445 78 436.8l26.2-104.7-92.6-55.5C4.4 272.2 0 264.4 0 256s4.4-16.3 11.7-20.6L104.3 179.9 78 75.1c-2-8.2 .3-16.8 6.3-22.8S99 44 107.2 46l104.7 26.2 55.5-92.6 1.8-2.6c4.5-5.7 11.4-9.1 18.8-9.1zm0 144a144 144 0 1 0 0 288 144 144 0 1 0 0-288zm0 240a96 96 0 1 1 0-192 96 96 0 1 1 0 192z"/></svg>
                : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 0C114.6 0 0 114.6 0 256S114.6 512 256 512c68.8 0 131.3-27.2 177.3-71.4 7.3-7 9.4-17.9 5.3-27.1s-13.7-14.9-23.8-14.1c-4.9 .4-9.8 .6-14.8 .6-101.6 0-184-82.4-184-184 0-72.1 41.5-134.6 102.1-164.8 9.1-4.5 14.3-14.3 13.1-24.4S322.6 8.5 312.7 6.3C294.4 2.2 275.4 0 256 0z"/></svg>
              }
            </button>
            <a
              className="btn btn-secondary icon-btn"
              href="https://www.freecodecamp.org/donate"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Donate"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M241 87.1l15 20.7 15-20.7C296 52.5 336.2 32 378.9 32 452.4 32 512 91.6 512 165.1l0 2.6c0 112.2-139.9 242.5-212.9 298.2-12.4 9.4-27.6 14.1-43.1 14.1s-30.8-4.6-43.1-14.1C139.9 410.2 0 279.9 0 167.7l0-2.6C0 91.6 59.6 32 133.1 32 175.8 32 216 52.5 241 87.1z"/></svg>
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
    </div>
  );
}
