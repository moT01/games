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
import { CapturedPieces } from './CapturedPieces';
import { PromotionModal } from './PromotionModal';

export type GameConfig = {
  mode: Mode;
  playerColor: 'white' | 'black';
  difficulty: Difficulty;
};

const SAVE_KEY = 'chess_state'

interface Props {
  config: GameConfig;
  onBackToMenu: () => void;
  onWin?: (difficulty: Difficulty) => void;
  initialState?: GameState;
  onSaveChange?: (hasSave: boolean) => void;
  onStatusChange?: (status: { text: string; cls: string }) => void;
}

function GameOverModal({ status, winner, onPlayAgain, onBackToMenu }: {
  status: 'checkmate' | 'stalemate' | 'draw';
  winner: 'white' | 'black' | null;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}) {
  let message = ''
  let cls = ''
  if (status === 'checkmate' && winner) {
    const label = winner === 'white' ? 'Light' : 'Dark'
    cls = `game-header__status--${winner === 'white' ? 'light' : 'dark'}`
    message = `${label} wins by checkmate!`
  } else if (status === 'stalemate') {
    message = 'Stalemate — Draw!'
  } else {
    message = 'Draw!'
  }
  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ textAlign: 'center' }}>
        <h2 className={`modal-title ${cls}`}>{message}</h2>
        <div className="modal-actions" style={{ justifyContent: 'center' }}>
          <button className="secondary-btn" onClick={onBackToMenu}>Menu</button>
          <button className="primary-btn" onClick={onPlayAgain}>Play Again</button>
        </div>
      </div>
    </div>
  )
}

function getStatusInfo(gameState: GameState, isThinking: boolean): { text: string; cls: string } {
  const { status, turn, winner } = gameState;
  const turnLabel = turn === 'white' ? 'Light' : 'Dark';
  const turnCls = `game-header__status--${turn === 'white' ? 'light' : 'dark'}`;

  if (status === 'checkmate') {
    const winLabel = winner === 'white' ? 'Light' : 'Dark';
    return { text: `${winLabel} wins by checkmate`, cls: `game-header__status--${winner === 'white' ? 'light' : 'dark'}` };
  }
  if (status === 'stalemate') return { text: 'Stalemate — Draw', cls: '' };
  if (status === 'draw') return { text: 'Draw', cls: '' };
  if (isThinking) return { text: 'Thinking...', cls: '' };
  if (status === 'check') return { text: `${turnLabel} is in check`, cls: turnCls };
  return { text: `${turnLabel}'s turn`, cls: turnCls };
}

export function Game({ config, onBackToMenu, onWin, initialState, onSaveChange, onStatusChange }: Props) {
  const [gameState, setGameState] = useState<GameState>(() => initialState ?? initGameState());
  const [isThinking, setIsThinking] = useState(false);

  const isVsComputer = config.mode === 'vs-computer';
  const { playerColor, difficulty } = config;
  const aiDepth = difficulty === 'hard' ? 4 : 2;

  useEffect(() => {
    if (!isVsComputer) return;
    if (gameState.turn === playerColor) return;
    const { status } = gameState;
    if (status !== 'playing' && status !== 'check') return;
    if (gameState.pendingPromotion) return;

    setIsThinking(true);
    const id = setTimeout(() => {
      const move = getBestMove(gameState, aiDepth);
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

  useEffect(() => {
    if (gameState.status !== 'checkmate') return;
    if (!isVsComputer) return;
    if (gameState.winner === playerColor) onWin?.(difficulty);
  }, [gameState.status]);

  useEffect(() => {
    if (!gameState.lastMove) return;
    const { status } = gameState;
    if (status !== 'playing' && status !== 'check') {
      localStorage.removeItem(SAVE_KEY);
      onSaveChange?.(false);
      return;
    }
    const toSave = { gameState: { ...gameState, selectedSquare: null, legalMovesForSelected: [] }, config };
    localStorage.setItem(SAVE_KEY, JSON.stringify(toSave));
    onSaveChange?.(true);
  }, [gameState]);

  useEffect(() => {
    onStatusChange?.(getStatusInfo(gameState, isThinking));
  }, [gameState, isThinking]);

  function handleSquareClick(index: number) {
    if (isThinking) return;
    if (isVsComputer && gameState.turn !== playerColor) return;
    const { status, pendingPromotion } = gameState;
    if (status === 'checkmate' || status === 'stalemate' || status === 'draw') return;
    if (pendingPromotion) return;

    const { board, selectedSquare, legalMovesForSelected } = gameState;

    if (selectedSquare !== null && legalMovesForSelected.includes(index)) {
      setGameState(prev => applyMove(prev, selectedSquare, index));
      return;
    }

    const piece = board[index];
    if (piece && piece.color === gameState.turn) {
      const legal = getLegalMoves(board, index, gameState);
      setGameState(prev => ({ ...prev, selectedSquare: index, legalMovesForSelected: legal }));
      return;
    }

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
    <div className="game-body">
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
        <GameOverModal
          status={status as 'checkmate' | 'stalemate' | 'draw'}
          winner={winner}
          onPlayAgain={handlePlayAgain}
          onBackToMenu={onBackToMenu}
        />
      )}
    </div>
  );
}
