import { useEffect, useReducer, useCallback, useState } from 'react';
import './App.css';
import './global.css';
import { StartScreen } from './components/StartScreen';
import { Board } from './components/Board';
import { GameInfo } from './components/GameInfo';
import { WinModal } from './components/WinModal';
import { HelpModal } from './components/HelpModal';
import {
  generateSolvedTiles,
  shuffle,
  getValidMoveIndices,
  moveTile,
  shiftLine,
  getTileIndexByDirection,
  isSolved,
} from './gameLogic';

type GameState = {
  tiles: number[];
  size: number;
  moves: number;
  elapsed: number;
  status: 'idle' | 'playing' | 'won';
  timerActive: boolean;
  rowShift: boolean;
};

type Action =
  | { type: 'NEW_GAME'; size: number; rowShift: boolean }
  | { type: 'RESTART' }
  | { type: 'TILE_CLICK'; index: number }
  | { type: 'TICK' }
  | { type: 'SET_SIZE'; size: number }
  | { type: 'SET_ROW_SHIFT'; val: boolean }
  | { type: 'GO_TO_START' };

function makeInitialState(): GameState {
  return {
    tiles: [],
    size: 4,
    moves: 0,
    elapsed: 0,
    status: 'idle',
    timerActive: false,
    rowShift: false,
  };
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'NEW_GAME': {
      const size = action.size;
      const solved = generateSolvedTiles(size);
      const tiles = shuffle(solved, size);
      return {
        ...state,
        tiles,
        size,
        moves: 0,
        elapsed: 0,
        status: 'playing',
        timerActive: false,
        rowShift: action.rowShift,
      };
    }

    case 'RESTART': {
      const solved = generateSolvedTiles(state.size);
      const tiles = shuffle(solved, state.size);
      return {
        ...state,
        tiles,
        moves: 0,
        elapsed: 0,
        status: 'playing',
        timerActive: false,
      };
    }

    case 'TILE_CLICK': {
      if (state.status !== 'playing') return state;

      const { tiles, size, rowShift } = state;
      let next: number[] | null = moveTile(tiles, action.index, size);

      if (next === null && rowShift) {
        next = shiftLine(tiles, action.index, size);
      }

      if (next === null) return state;

      const won = isSolved(next, size);
      return {
        ...state,
        tiles: next,
        moves: state.moves + 1,
        status: won ? 'won' : 'playing',
        timerActive: won ? false : true,
      };
    }

    case 'TICK': {
      if (!state.timerActive) return state;
      return { ...state, elapsed: state.elapsed + 1 };
    }

    case 'SET_SIZE':
      return { ...state, size: action.size };

    case 'SET_ROW_SHIFT':
      return { ...state, rowShift: action.val };

    case 'GO_TO_START':
      return { ...state, status: 'idle', timerActive: false };

    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, makeInitialState);
  const { tiles, size, moves, elapsed, status, timerActive, rowShift } = state;

  // Timer
  useEffect(() => {
    if (!timerActive) return;
    const id = setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => clearInterval(id);
  }, [timerActive]);

  // Start timer on first move (timerActive becomes true after first tile click)
  // It's already handled in reducer: timerActive = true after TILE_CLICK when playing

  const [helpOpen, setHelpOpen] = useState(false);

  const validIndices =
    status === 'playing' ? getValidMoveIndices(tiles, size) : [];

  const handleTileClick = useCallback(
    (index: number) => {
      dispatch({ type: 'TILE_CLICK', index });
    },
    []
  );

  // Keyboard support
  useEffect(() => {
    if (status !== 'playing') return;
    const handler = (e: KeyboardEvent) => {
      const dir = keyToDir(e.key);
      if (!dir) return;
      e.preventDefault();
      const tileIdx = getTileIndexByDirection(tiles, size, dir);
      if (tileIdx !== null) dispatch({ type: 'TILE_CLICK', index: tileIdx });
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [status, tiles, size]);

  if (status === 'idle') {
    return (
      <div className="app">
        <StartScreen
          size={size}
          rowShift={rowShift}
          onSizeChange={(s) => dispatch({ type: 'SET_SIZE', size: s })}
          onRowShiftChange={(val) => dispatch({ type: 'SET_ROW_SHIFT', val })}
          onNewGame={() => dispatch({ type: 'NEW_GAME', size, rowShift })}
        />
      </div>
    );
  }

  return (
    <div className="app">
      <div className="game-screen">
        <GameInfo moves={moves} elapsed={elapsed} />
        <Board
          tiles={tiles}
          size={size}
          validIndices={validIndices}
          onTileClick={handleTileClick}
        />
        <div className="game-actions">
          <button className="action-btn" onClick={() => dispatch({ type: 'RESTART' })}>
            Restart
          </button>
          <button className="action-btn" onClick={() => dispatch({ type: 'NEW_GAME', size, rowShift })}>
            New Game
          </button>
          <button className="action-btn action-btn--help" onClick={() => setHelpOpen(true)} aria-label="Help">
            ?
          </button>
        </div>
      </div>

      {status === 'won' && (
        <WinModal
          moves={moves}
          elapsed={elapsed}
          onPlayAgain={() => dispatch({ type: 'NEW_GAME', size, rowShift })}
          onChangeSize={() => dispatch({ type: 'GO_TO_START' })}
        />
      )}

      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
    </div>
  );
}

function keyToDir(key: string): 'up' | 'down' | 'left' | 'right' | null {
  switch (key) {
    case 'ArrowUp': return 'up';
    case 'ArrowDown': return 'down';
    case 'ArrowLeft': return 'left';
    case 'ArrowRight': return 'right';
    default: return null;
  }
}
