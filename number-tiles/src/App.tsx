import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import Header from './components/Header';
import ScoreBar from './components/ScoreBar';
import Controls from './components/Controls';
import Board from './components/Board';
import WinOverlay from './components/WinOverlay';
import HelpModal from './components/HelpModal';
import { shuffle, getAdjacentToBlank, slideTile, isSolved } from './game/logic';

type Status = 'idle' | 'playing' | 'won';

export default function App() {
  const [size, setSize] = useState(4);
  const [tiles, setTiles] = useState(() => shuffle(4));
  const [moves, setMoves] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState<Status>('idle');
  const [helpOpen, setHelpOpen] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startNewGame = useCallback((newSize: number) => {
    clearTimer();
    setSize(newSize);
    setTiles(shuffle(newSize));
    setMoves(0);
    setElapsed(0);
    setStatus('idle');
  }, [clearTimer]);

  const handleSizeChange = useCallback((newSize: number) => {
    startNewGame(newSize);
  }, [startNewGame]);

  const handleNewGame = useCallback(() => {
    startNewGame(size);
  }, [startNewGame, size]);

  const handleTileClick = useCallback((index: number) => {
    setTiles(prev => {
      if (status === 'won') return prev;
      const adjacent = getAdjacentToBlank(prev, size);
      if (!adjacent.includes(index)) return prev;

      const next = slideTile(prev, index);
      const nextMoves = moves + 1;
      setMoves(nextMoves);

      if (isSolved(next)) {
        clearTimer();
        setStatus('won');
      } else if (status === 'idle') {
        setStatus('playing');
        intervalRef.current = setInterval(() => {
          setElapsed(e => e + 1);
        }, 1000);
      }

      return next;
    });
  }, [status, size, moves, clearTimer]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return (
    <div className="app">
      <Header onHelp={() => setHelpOpen(true)} />
      <ScoreBar moves={moves} elapsed={elapsed} />
      <Controls size={size} onSizeChange={handleSizeChange} onNewGame={handleNewGame} />
      <Board tiles={tiles} size={size} onTileClick={handleTileClick} />
      {status === 'won' && (
        <WinOverlay moves={moves} elapsed={elapsed} onPlayAgain={handleNewGame} />
      )}
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
    </div>
  );
}
