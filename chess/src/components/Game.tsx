import { useState, useEffect } from 'react';
import './Game.css';
import type { GameState, PieceType, Mode, Difficulty } from '../gameLogic';
import {
  initGameState,
  getLegalMoves,
  applyMove,
  applyPromotion,
  getBestMove,
} from '../gameLogic';
import { Board } from './Board';
import { StatusBar } from './StatusBar';
import { CapturedPieces } from './CapturedPieces';
import { PromotionModal } from './PromotionModal';

export type GameConfig = {
  mode: Mode;
  playerColor: 'white' | 'black';
  difficulty: Difficulty;
};

interface Props {
  config: GameConfig;
  onBackToMenu: () => void;
}

export function Game({ config, onBackToMenu }: Props) {
  const [gameState, setGameState] = useState<GameState>(() => initGameState());
  const [isThinking, setIsThinking] = useState(false);

  const isVsComputer = config.mode === 'vs-computer';
  const { playerColor } = config;

  // Trigger AI move when it's the computer's turn
  useEffect(() => {
    if (!isVsComputer) return;
    if (gameState.turn === playerColor) return;
    const { status } = gameState;
    if (status !== 'playing' && status !== 'check') return;
    if (gameState.pendingPromotion) return;

    setIsThinking(true);
    const id = setTimeout(() => {
      const move = getBestMove(gameState);
      if (move) {
        setGameState(prev => {
          let next = applyMove(prev, move.from, move.to);
          if (next.pendingPromotion) next = applyPromotion(next, 'queen');
          return next;
        });
      }
      setIsThinking(false);
    }, 0);

    return () => clearTimeout(id);
  }, [gameState, isVsComputer, playerColor]);

  function handleSquareClick(index: number) {
    if (isThinking) return;
    if (isVsComputer && gameState.turn !== playerColor) return;
    const { status, pendingPromotion } = gameState;
    if (status === 'checkmate' || status === 'stalemate' || status === 'draw') return;
    if (pendingPromotion) return;

    const { board, selectedSquare, legalMovesForSelected } = gameState;

    // Execute move if destination is legal
    if (selectedSquare !== null && legalMovesForSelected.includes(index)) {
      setGameState(prev => applyMove(prev, selectedSquare, index));
      return;
    }

    // Select a piece of the current player's color
    const piece = board[index];
    if (piece && piece.color === gameState.turn) {
      const legal = getLegalMoves(board, index, gameState);
      setGameState(prev => ({ ...prev, selectedSquare: index, legalMovesForSelected: legal }));
      return;
    }

    // Deselect
    setGameState(prev => ({ ...prev, selectedSquare: null, legalMovesForSelected: [] }));
  }

  function handlePromotion(pieceType: PieceType) {
    setGameState(prev => applyPromotion(prev, pieceType));
  }

  function handlePlayAgain() {
    setGameState(initGameState());
  }

  const { board, selectedSquare, legalMovesForSelected, status, lastMove, turn, winner } = gameState;

  const legalHighlights = new Set(legalMovesForSelected.filter(i => board[i] === null));
  const captureHighlights = new Set(legalMovesForSelected.filter(i => board[i] !== null));

  let checkKingIdx: number | null = null;
  if (status === 'check' || status === 'checkmate') {
    for (let i = 0; i < 64; i++) {
      const p = board[i];
      if (p && p.type === 'king' && p.color === turn) { checkKingIdx = i; break; }
    }
  }

  const lastMoveSet = lastMove ? new Set([lastMove.from, lastMove.to]) : new Set<number>();
  const isGameOver = status === 'checkmate' || status === 'stalemate' || status === 'draw';

  return (
    <div className="game">
      <StatusBar gameState={gameState} isThinking={isThinking} />
      <Board
        board={board}
        selectedSquare={selectedSquare}
        legalHighlights={legalHighlights}
        captureHighlights={captureHighlights}
        checkKingIdx={checkKingIdx}
        lastMoveSet={lastMoveSet}
        onSquareClick={handleSquareClick}
        flipped={isVsComputer && playerColor === 'black'}
      />
      <CapturedPieces board={board} />
      {gameState.pendingPromotion && (
        <PromotionModal color={gameState.turn} onChoose={handlePromotion} />
      )}
      {isGameOver && (
        <div className="game-over-overlay">
          <div className="game-over-content">
            {status === 'checkmate' && (
              <p>{winner === 'white' ? 'White' : 'Black'} wins by checkmate!</p>
            )}
            {status === 'stalemate' && <p>Stalemate — Draw!</p>}
            {status === 'draw' && <p>Draw!</p>}
            <button onClick={handlePlayAgain}>Play Again</button>
            <button onClick={onBackToMenu}>Back to Menu</button>
          </div>
        </div>
      )}
    </div>
  );
}
