import './App.css';
import './global.css';
import { useState, useRef } from 'react';
import {
  dealGame,
  applyMove,
  drawFromStock,
  resetStock,
  checkWin,
  calcTimeBonus,
  canMoveToFoundation,
} from './gameLogic';
import type { GameState, Move, Card } from './gameLogic';
import { SetupScreen } from './components/SetupScreen';
import { GameBoard } from './components/GameBoard';
import { ScoreBar } from './components/ScoreBar';
import { WinScreen } from './components/WinScreen';

export type SessionStats = {
  wins: number;
  losses: number;
};

type GameStatus = 'setup' | 'playing' | 'won';

function App() {
  const [gameStatus, setGameStatus] = useState<GameStatus>('setup');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStats>({ wins: 0, losses: 0 });
  const [startTime, setStartTime] = useState<number | null>(null);
  const [finalScores, setFinalScores] = useState<{ base: number; bonus: number } | null>(null);
  const autoCompleteRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleStart = (drawMode: 1 | 3) => {
    const newState = dealGame(drawMode);
    setGameState(newState);
    setGameStatus('playing');
    setStartTime(Date.now());
    setFinalScores(null);
  };

  const handleNewGame = () => {
    if (autoCompleteRef.current !== null) {
      clearInterval(autoCompleteRef.current);
      autoCompleteRef.current = null;
    }
    if (gameStatus === 'playing') {
      setSessionStats(prev => ({ ...prev, losses: prev.losses + 1 }));
    }
    setGameStatus('setup');
    setGameState(null);
    setStartTime(null);
  };

  const handleMove = (move: Move) => {
    if (!gameState) return;
    const newState = applyMove(gameState, move);
    setGameState(newState);

    if (checkWin(newState)) {
      const end = Date.now();
      const bonus = calcTimeBonus(startTime ?? end, end);
      setFinalScores({ base: newState.score, bonus });
      setSessionStats(prev => ({ ...prev, wins: prev.wins + 1 }));
      setGameStatus('won');
    }
  };

  const handleDraw = () => {
    if (!gameState) return;
    setGameState(drawFromStock(gameState));
  };

  const handleResetStock = () => {
    if (!gameState) return;
    setGameState(resetStock(gameState));
  };

  const handleAutoComplete = () => {
    if (!gameState) return;
    if (autoCompleteRef.current !== null) return;

    let current = gameState;

    autoCompleteRef.current = setInterval(() => {
      // Find the next card to move to a foundation
      // Try waste first, then tableau columns
      let moved = false;

      // Try waste top card
      if (current.waste.length > 0) {
        const wasteCard = current.waste[current.waste.length - 1];
        for (let fi = 0; fi < 4; fi++) {
          if (canMoveToFoundation(wasteCard, current.foundations[fi])) {
            const move: Move = { source: 'waste', sourceIndex: 0, target: 'foundation', targetIndex: fi };
            current = applyMove(current, move);
            moved = true;
            break;
          }
        }
      }

      if (!moved) {
        // Try tableau columns
        for (let ci = 0; ci < 7; ci++) {
          const col = current.tableau[ci];
          if (col.length === 0) continue;
          const card: Card = col[col.length - 1];
          if (!card.faceUp) continue;
          for (let fi = 0; fi < 4; fi++) {
            if (canMoveToFoundation(card, current.foundations[fi])) {
              const move: Move = {
                source: 'tableau',
                sourceIndex: ci,
                cardIndex: col.length - 1,
                target: 'foundation',
                targetIndex: fi,
              };
              current = applyMove(current, move);
              moved = true;
              break;
            }
          }
          if (moved) break;
        }
      }

      if (!moved) {
        // No more moves — stop
        if (autoCompleteRef.current !== null) {
          clearInterval(autoCompleteRef.current);
          autoCompleteRef.current = null;
        }
        setGameState(current);
        return;
      }

      setGameState({ ...current });

      if (checkWin(current)) {
        if (autoCompleteRef.current !== null) {
          clearInterval(autoCompleteRef.current);
          autoCompleteRef.current = null;
        }
        const end = Date.now();
        const bonus = calcTimeBonus(startTime ?? end, end);
        setFinalScores({ base: current.score, bonus });
        setSessionStats(prev => ({ ...prev, wins: prev.wins + 1 }));
        setGameStatus('won');
      }
    }, 50);
  };

  const handlePlayAgain = () => {
    if (autoCompleteRef.current !== null) {
      clearInterval(autoCompleteRef.current);
      autoCompleteRef.current = null;
    }
    setGameStatus('setup');
    setGameState(null);
    setStartTime(null);
    setFinalScores(null);
  };

  if (gameStatus === 'setup') {
    return <SetupScreen onStart={handleStart} />;
  }

  if (gameStatus === 'won' && finalScores) {
    return (
      <WinScreen
        baseScore={finalScores.base}
        timeBonus={finalScores.bonus}
        sessionStats={sessionStats}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  if (!gameState) return null;

  return (
    <div className="app-container">
      <ScoreBar
        score={gameState.score}
        drawMode={gameState.drawMode}
        sessionStats={sessionStats}
        onNewGame={handleNewGame}
      />
      <GameBoard
        gameState={gameState}
        onMove={handleMove}
        onDraw={handleDraw}
        onResetStock={handleResetStock}
        onAutoComplete={handleAutoComplete}
      />
    </div>
  );
}

export default App;
