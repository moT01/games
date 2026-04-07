import { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';
import './global.css';
import {
  createEmptyBoard,
  createStartingBoard,
  newBag,
  spawnPiece,
  tryRotate,
  moveLeft,
  moveRight,
  moveDown,
  hardDropPosition,
  hardDropDistance,
  lockPiece,
  findCompleteRows,
  clearRows,
  calcScore,
  calcLevel,
  gravityInterval,
  isTopOut,
  type Board,
  type ActivePiece,
  type PieceType,
  type StartSpeed,
  type StartFill,
} from './game/logic';
import Header from './components/Header';
import HomeScreen from './components/HomeScreen';
import GameOverScreen from './components/GameOverScreen';
import BoardComponent from './components/Board';
import NextPiece from './components/NextPiece';
import ScorePanel from './components/ScorePanel';
import Controls from './components/Controls';
import HelpModal from './components/HelpModal';
import ConfirmModal from './components/ConfirmModal';

// ── Local storage ────────────────────────────────────────────────────────────

interface StoredData {
  bestScore: number;
  lastStartSpeed: StartSpeed;
  lastStartFill: StartFill;
  theme: 'light' | 'dark';
  savedGame: SavedGameState | null;
}

interface SavedGameState {
  board: Board;
  active: ActivePiece | null;
  next: PieceType;
  bag: PieceType[];
  score: number;
  level: number;
  linesCleared: number;
  combo: number;
  startSpeed: StartSpeed;
  startFill: StartFill;
}

function loadStored(): StoredData {
  try {
    const raw = localStorage.getItem('block-stacker');
    if (raw) return JSON.parse(raw) as StoredData;
  } catch { /* ignore */ }
  return { bestScore: 0, lastStartSpeed: 'slow', lastStartFill: 'empty', theme: 'dark', savedGame: null };
}

function saveStored(data: Partial<StoredData>) {
  try {
    const current = loadStored();
    localStorage.setItem('block-stacker', JSON.stringify({ ...current, ...data }));
  } catch { /* ignore */ }
}

// ── Game state ───────────────────────────────────────────────────────────────

type GameStatus = 'idle' | 'playing' | 'gameover';

interface GameState {
  board: Board;
  active: ActivePiece | null;
  next: PieceType;
  bag: PieceType[];
  score: number;
  level: number;
  linesCleared: number;
  combo: number;
  status: GameStatus;
  flashRows: number[];
  lockDelayActive: boolean;
  lockDelayStart: number | null;
  startSpeed: StartSpeed;
  startFill: StartFill;
}

function drawFromBag(bag: PieceType[]): { type: PieceType; bag: PieceType[] } {
  if (bag.length === 0) {
    const freshBag = newBag();
    return { type: freshBag[0], bag: freshBag.slice(1) };
  }
  return { type: bag[0], bag: bag.slice(1) };
}

function buildInitialState(
  startSpeed: StartSpeed,
  startFill: StartFill,
  saved?: SavedGameState | null,
): GameState {
  if (saved) {
    return {
      board: saved.board,
      active: saved.active,
      next: saved.next,
      bag: saved.bag,
      score: saved.score,
      level: saved.level,
      linesCleared: saved.linesCleared,
      combo: saved.combo,
      status: 'playing',
      flashRows: [],
      lockDelayActive: false,
      lockDelayStart: null,
      startSpeed: saved.startSpeed,
      startFill: saved.startFill,
    };
  }
  const bag = newBag();
  const { type: firstType, bag: bag1 } = drawFromBag(bag);
  const { type: nextType, bag: bag2 } = drawFromBag(bag1);
  const board = createStartingBoard(startFill);
  return {
    board,
    active: spawnPiece(firstType),
    next: nextType,
    bag: bag2,
    score: 0,
    level: 0,
    linesCleared: 0,
    combo: 0,
    status: 'playing',
    flashRows: [],
    lockDelayActive: false,
    lockDelayStart: null,
    startSpeed,
    startFill,
  };
}

// ── DAS (Delayed Auto Shift) ─────────────────────────────────────────────────
const DAS_DELAY = 160;
const DAS_REPEAT = 50;

// ── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const stored = loadStored();

  const [theme, setTheme] = useState<'light' | 'dark'>(stored.theme);
  const [bestScore, setBestScore] = useState(stored.bestScore);
  const [startSpeed, setStartSpeed] = useState<StartSpeed>(stored.lastStartSpeed);
  const [startFill, setStartFill] = useState<StartFill>(stored.lastStartFill);

  const [gs, setGs] = useState<GameState>(() => {
    const s = loadStored();
    if (s.savedGame) return buildInitialState(s.lastStartSpeed, s.lastStartFill, s.savedGame);
    return {
      board: createEmptyBoard(),
      active: null,
      next: 'I',
      bag: [],
      score: 0,
      level: 0,
      linesCleared: 0,
      combo: 0,
      status: 'idle',
      flashRows: [],
      lockDelayActive: false,
      lockDelayStart: null,
      startSpeed: s.lastStartSpeed,
      startFill: s.lastStartFill,
    };
  });

  const [showHelp, setShowHelp] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [prevLevel, setPrevLevel] = useState(0);

  const helpBtnRef = useRef<HTMLButtonElement>(null);
  const gsRef = useRef(gs);
  useEffect(() => { gsRef.current = gs; });

  // ── Theme ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    saveStored({ theme });
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  // ── Gravity tick ───────────────────────────────────────────────────────────
  const softDropRef = useRef(false);
  const tickRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleTickRef = useRef<() => void>(() => {});

  const persistGame = (state: GameState) => {
    if (state.status !== 'playing' || !state.active) return;
    const saved: SavedGameState = {
      board: state.board,
      active: state.active,
      next: state.next,
      bag: state.bag,
      score: state.score,
      level: state.level,
      linesCleared: state.linesCleared,
      combo: state.combo,
      startSpeed: state.startSpeed,
      startFill: state.startFill,
    };
    saveStored({ savedGame: saved });
  };

  const lockPieceAndAdvance = useCallback((state: GameState): GameState => {
    if (!state.active) return state;
    const locked = lockPiece(state.board, state.active);
    const completeRows = findCompleteRows(locked);

    if (completeRows.length > 0) {
      // Flash rows briefly, then clear
      return { ...state, board: locked, active: null, flashRows: completeRows, lockDelayActive: false, lockDelayStart: null };
    }

    // No rows to clear — spawn next piece
    const { type: nextType, bag: newBagArr } = drawFromBag(state.bag);
    const spawnedPiece = spawnPiece(state.next);

    if (isTopOut(locked, spawnedPiece)) {
      const newScore = state.score;
      const newBest = Math.max(bestScore, newScore);
      if (newBest > bestScore) {
        setBestScore(newBest);
        saveStored({ bestScore: newBest, savedGame: null });
      } else {
        saveStored({ savedGame: null });
      }
      return { ...state, board: locked, active: null, flashRows: [], status: 'gameover', lockDelayActive: false, lockDelayStart: null };
    }

    const newState: GameState = {
      ...state,
      board: locked,
      active: spawnedPiece,
      next: nextType,
      bag: newBagArr,
      combo: 0,
      flashRows: [],
      lockDelayActive: false,
      lockDelayStart: null,
    };
    persistGame(newState);
    return newState;
  }, [bestScore]);

  // Flash timeout: after flash, actually clear rows
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (gs.flashRows.length === 0) return;
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => {
      setGs(prev => {
        if (prev.flashRows.length === 0) return prev;
        const cleared = clearRows(prev.board, prev.flashRows);
        const lineCount = prev.flashRows.length;
        const newTotalLines = prev.linesCleared + lineCount;
        const newLevel = calcLevel(newTotalLines, prev.startSpeed);
        const newCombo = prev.combo + 1;
        const dropBonus = 0;
        const scoreGain = calcScore(lineCount, newLevel, newCombo, dropBonus);
        const newScore = prev.score + scoreGain;

        // Update best score in real time
        const newBest = Math.max(bestScore, newScore);
        if (newBest > bestScore) {
          setBestScore(newBest);
          saveStored({ bestScore: newBest });
        }

        if (newLevel > prev.level) setPrevLevel(prev.level);

        const { type: nextType, bag: newBagArr } = drawFromBag(prev.bag);
        const spawnedPiece = spawnPiece(prev.next);

        if (isTopOut(cleared, spawnedPiece)) {
          saveStored({ savedGame: null });
          return { ...prev, board: cleared, active: null, flashRows: [], status: 'gameover', score: newScore, linesCleared: newTotalLines, level: newLevel, combo: newCombo, lockDelayActive: false, lockDelayStart: null };
        }

        const newState: GameState = {
          ...prev,
          board: cleared,
          active: spawnedPiece,
          next: nextType,
          bag: newBagArr,
          score: newScore,
          level: newLevel,
          linesCleared: newTotalLines,
          combo: newCombo,
          flashRows: [],
          lockDelayActive: false,
          lockDelayStart: null,
        };
        persistGame(newState);
        return newState;
      });
    }, 200);
    return () => { if (flashTimerRef.current) clearTimeout(flashTimerRef.current); };
  }, [gs.flashRows, bestScore]);

  // Lock delay timer
  const lockDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!gs.lockDelayActive || gs.status !== 'playing') return;
    if (lockDelayTimerRef.current) clearTimeout(lockDelayTimerRef.current);
    lockDelayTimerRef.current = setTimeout(() => {
      setGs(prev => {
        if (!prev.lockDelayActive || !prev.active) return prev;
        // Check again: can it still not move down?
        if (moveDown(prev.board, prev.active) !== null) {
          return { ...prev, lockDelayActive: false, lockDelayStart: null };
        }
        return lockPieceAndAdvance(prev);
      });
    }, 300);
    return () => { if (lockDelayTimerRef.current) clearTimeout(lockDelayTimerRef.current); };
  }, [gs.lockDelayActive, gs.status, lockPieceAndAdvance]);

  // Gravity tick
  const scheduleTick = useCallback(() => {
    if (tickRef.current) clearTimeout(tickRef.current);
    const state = gsRef.current;
    if (state.status !== 'playing' || state.flashRows.length > 0 || state.lockDelayActive) return;
    const interval = gravityInterval(state.level, softDropRef.current, state.startSpeed);
    tickRef.current = setTimeout(() => {
      setGs(prev => {
        if (prev.status !== 'playing' || prev.flashRows.length > 0 || !prev.active) return prev;
        const moved = moveDown(prev.board, prev.active);
        if (moved) {
          const softBonus = softDropRef.current ? 1 : 0;
          return { ...prev, active: moved, score: prev.score + softBonus };
        }
        // Can't move down — start lock delay
        if (prev.lockDelayActive) return prev;
        return { ...prev, lockDelayActive: true, lockDelayStart: Date.now() };
      });
      scheduleTickRef.current();
    }, interval);
  }, []);
  useEffect(() => { scheduleTickRef.current = scheduleTick; });

  useEffect(() => {
    if (gs.status === 'playing' && gs.flashRows.length === 0 && !gs.lockDelayActive) {
      scheduleTick();
    }
    return () => { if (tickRef.current) clearTimeout(tickRef.current); };
  }, [gs.status, gs.flashRows.length, gs.lockDelayActive, scheduleTick]);

  // ── Keyboard input ─────────────────────────────────────────────────────────
  const dasRef = useRef<{ dir: 'left' | 'right' | null; timer: ReturnType<typeof setTimeout> | null; interval: ReturnType<typeof setInterval> | null }>({
    dir: null, timer: null, interval: null,
  });

  const stopDAS = () => {
    if (dasRef.current.timer) clearTimeout(dasRef.current.timer);
    if (dasRef.current.interval) clearInterval(dasRef.current.interval);
    dasRef.current = { dir: null, timer: null, interval: null };
  };

  const applyMove = useCallback((dir: 'left' | 'right') => {
    setGs(prev => {
      if (prev.status !== 'playing' || !prev.active || prev.flashRows.length > 0) return prev;
      const moved = dir === 'left' ? moveLeft(prev.board, prev.active) : moveRight(prev.board, prev.active);
      if (!moved) return prev;
      // Reset lock delay if active (slide extends it)
      return { ...prev, active: moved, lockDelayActive: false, lockDelayStart: null };
    });
  }, []);

  const startDAS = useCallback((dir: 'left' | 'right') => {
    stopDAS();
    applyMove(dir);
    dasRef.current.dir = dir;
    dasRef.current.timer = setTimeout(() => {
      dasRef.current.interval = setInterval(() => applyMove(dir), DAS_REPEAT);
    }, DAS_DELAY);
  }, [applyMove]);

  const doRotate = useCallback((dir: 'cw' | 'ccw') => {
    setGs(prev => {
      if (prev.status !== 'playing' || !prev.active || prev.flashRows.length > 0) return prev;
      const rotated = tryRotate(prev.board, prev.active, dir);
      if (!rotated) return prev;
      return { ...prev, active: rotated, lockDelayActive: false, lockDelayStart: null };
    });
  }, []);

  const doHardDrop = useCallback(() => {
    setGs(prev => {
      if (prev.status !== 'playing' || !prev.active || prev.flashRows.length > 0) return prev;
      const dist = hardDropDistance(prev.board, prev.active);
      const dropped = hardDropPosition(prev.board, prev.active);
      const hardBonus = dist * 2;
      const withDrop = { ...prev, active: dropped, score: prev.score + hardBonus };
      return lockPieceAndAdvance(withDrop);
    });
  }, [lockPieceAndAdvance]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gsRef.current.status !== 'playing') return;
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          if (!e.repeat) startDAS('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (!e.repeat) startDAS('right');
          break;
        case 'ArrowDown':
          e.preventDefault();
          softDropRef.current = true;
          scheduleTick();
          break;
        case 'ArrowUp':
        case 'x':
        case 'X':
          e.preventDefault();
          doRotate('cw');
          break;
        case 'z':
        case 'Z':
        case 'Control':
          e.preventDefault();
          doRotate('ccw');
          break;
        case ' ':
          e.preventDefault();
          doHardDrop();
          break;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') stopDAS();
      if (e.key === 'ArrowDown') { softDropRef.current = false; scheduleTick(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [startDAS, doRotate, doHardDrop, scheduleTick]);

  // ── Game control ───────────────────────────────────────────────────────────
  const startGame = () => {
    const newGs = buildInitialState(startSpeed, startFill, null);
    setGs(newGs);
    setPrevLevel(0);
    saveStored({ lastStartSpeed: startSpeed, lastStartFill: startFill });
  };

  const confirmQuit = () => {
    setShowConfirm(false);
    saveStored({ savedGame: null });
    setGs(prev => ({ ...prev, status: 'idle', active: null, board: createEmptyBoard() }));
  };

  const playAgain = () => {
    const newGs = buildInitialState(gs.startSpeed, gs.startFill, null);
    setGs(newGs);
    setPrevLevel(0);
  };

  const goHome = () => {
    saveStored({ savedGame: null });
    setGs(prev => ({ ...prev, status: 'idle', active: null, board: createEmptyBoard(), flashRows: [] }));
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const levelUp = gs.level > prevLevel;

  if (gs.status === 'idle') {
    return (
      <div data-theme={theme}>
        <Header theme={theme} onToggleTheme={toggleTheme} onHelp={() => setShowHelp(true)} />
        <HomeScreen
          bestScore={bestScore}
          startSpeed={startSpeed}
          startFill={startFill}
          onSpeedChange={s => { setStartSpeed(s); saveStored({ lastStartSpeed: s }); }}
          onFillChange={f => { setStartFill(f); saveStored({ lastStartFill: f }); }}
          onStart={startGame}
        />
        {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      </div>
    );
  }

  if (gs.status === 'gameover') {
    return (
      <div data-theme={theme}>
        <Header theme={theme} onToggleTheme={toggleTheme} onHelp={() => setShowHelp(true)} />
        <GameOverScreen
          score={gs.score}
          bestScore={bestScore}
          onPlayAgain={playAgain}
          onHome={goHome}
        />
        {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      </div>
    );
  }

  // Playing
  return (
    <div data-theme={theme}>
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onHelp={() => setShowHelp(true)}
        onQuit={() => setShowConfirm(true)}
      />
      <div className="play-layout">
        <div className="board-wrapper">
          <BoardComponent board={gs.board} active={gs.active} flashRows={gs.flashRows} />
          <div className="side-panel">
            <NextPiece type={gs.next} />
            <ScorePanel
              score={gs.score}
              level={gs.level}
              linesCleared={gs.linesCleared}
              levelUp={levelUp}
            />
          </div>
        </div>
        <Controls
          onLeft={() => applyMove('left')}
          onRight={() => applyMove('right')}
          onRotateCW={() => doRotate('cw')}
          onRotateCCW={() => doRotate('ccw')}
          onSoftDrop={() => {
            setGs(prev => {
              if (!prev.active) return prev;
              const moved = moveDown(prev.board, prev.active);
              return moved ? { ...prev, active: moved, score: prev.score + 1 } : prev;
            });
          }}
          onHardDrop={doHardDrop}
        />
      </div>
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} triggerRef={helpBtnRef} />}
      {showConfirm && <ConfirmModal onConfirm={confirmQuit} onCancel={() => setShowConfirm(false)} />}
    </div>
  );
}
