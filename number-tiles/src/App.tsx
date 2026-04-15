import { useState, useEffect, useCallback } from 'react';
import './App.css';
import './global.css';
import { HomeScreen } from './components/HomeScreen';
import { PlayScreen } from './components/PlayScreen';
import { generateSolvedBoard, shuffleBoard } from './gameLogic';

export type Mode = '3x3' | '4x4' | '5x5';

export interface GameState {
  mode: Mode;
  tiles: number[];
  moves: number;
  elapsedSeconds: number;
  timerActive: boolean;
  won: boolean;
  startTime: number | null;
}

export interface BestScore {
  moves: number;
  seconds: number;
}

export type BestScores = Partial<Record<Mode, BestScore>>;

const BEST_SCORES_KEY = 'number-tiles:best-scores';
const SAVED_GAME_KEY = 'number-tiles:saved-game';

function modeToN(mode: Mode): number {
  return parseInt(mode[0], 10);
}

function loadBestScores(): BestScores {
  try {
    const raw = localStorage.getItem(BEST_SCORES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveBestScores(scores: BestScores): void {
  localStorage.setItem(BEST_SCORES_KEY, JSON.stringify(scores));
}

function loadSavedGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVED_GAME_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveGame(state: GameState): void {
  // Pause the timer before saving — store elapsed up to now
  if (state.timerActive && state.startTime !== null) {
    const extra = Math.floor((Date.now() - state.startTime) / 1000);
    const toSave: GameState = {
      ...state,
      elapsedSeconds: state.elapsedSeconds + extra,
      timerActive: false,
      startTime: null,
    };
    localStorage.setItem(SAVED_GAME_KEY, JSON.stringify(toSave));
  } else {
    localStorage.setItem(SAVED_GAME_KEY, JSON.stringify(state));
  }
}

function clearSavedGame(): void {
  localStorage.removeItem(SAVED_GAME_KEY);
}

function loadTheme(): 'dark' | 'light' {
  return (localStorage.getItem('number-tiles:theme') as 'dark' | 'light') || 'dark';
}

function newGame(mode: Mode): GameState {
  const n = modeToN(mode);
  const solved = generateSolvedBoard(n);
  const tiles = shuffleBoard(solved, n);
  return {
    mode,
    tiles,
    moves: 0,
    elapsedSeconds: 0,
    timerActive: false,
    won: false,
    startTime: null,
  };
}

export default function App() {
  const [screen, setScreen] = useState<'home' | 'play'>('home');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [bestScores, setBestScores] = useState<BestScores>(loadBestScores);
  const [theme, setTheme] = useState<'dark' | 'light'>(loadTheme);
  const [savedGame, setSavedGame] = useState<GameState | null>(loadSavedGame);
  const [lastMode, setLastMode] = useState<Mode>(loadSavedGame()?.mode ?? '4x4');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('number-tiles:theme', theme);
  }, [theme]);

  useEffect(() => {
    if (gameState && !gameState.won) {
      saveGame(gameState);
    }
  }, [gameState]);

  const handlePlay = useCallback((mode: Mode) => {
    setLastMode(mode);
    const state = newGame(mode);
    setGameState(state);
    setScreen('play');
  }, []);

  const handleResume = useCallback(() => {
    if (!savedGame) return;
    setLastMode(savedGame.mode);
    const resumed: GameState = {
      ...savedGame,
      timerActive: savedGame.moves > 0,
      startTime: savedGame.moves > 0 ? Date.now() : null,
    };
    setGameState(resumed);
    setScreen('play');
  }, [savedGame]);

  const handleNewGame = useCallback((mode: Mode) => {
    const state = newGame(mode);
    setGameState(state);
    clearSavedGame();
    setSavedGame(null);
  }, []);

  const handleGoHome = useCallback(() => {
    if (gameState && !gameState.won) {
      saveGame(gameState);
      setSavedGame(loadSavedGame());
    } else {
      clearSavedGame();
      setSavedGame(null);
    }
    setScreen('home');
    setGameState(null);
  }, [gameState]);

  const handleWin = useCallback((state: GameState) => {
    clearSavedGame();
    setSavedGame(null);
    // Update best scores
    setBestScores(prev => {
      const current = prev[state.mode];
      const isNewBest =
        !current ||
        state.moves < current.moves ||
        (state.moves === current.moves && state.elapsedSeconds < current.seconds);
      if (isNewBest) {
        const updated: BestScores = {
          ...prev,
          [state.mode]: { moves: state.moves, seconds: state.elapsedSeconds },
        };
        saveBestScores(updated);
        return updated;
      }
      return prev;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <div className="app">
      {screen === 'home' ? (
        <HomeScreen
          bestScores={bestScores}
          theme={theme}
          hasSavedGame={!!savedGame}
          savedGameMode={savedGame?.mode}
          defaultMode={lastMode}
          onPlay={handlePlay}
          onResume={handleResume}
          onToggleTheme={toggleTheme}
        />
      ) : gameState ? (
        <PlayScreen
          gameState={gameState}
          bestScores={bestScores}
          theme={theme}
          onStateChange={setGameState}
          onNewGame={handleNewGame}
          onGoHome={handleGoHome}
          onWin={handleWin}
          onToggleTheme={toggleTheme}
        />
      ) : null}
    </div>
  );
}
