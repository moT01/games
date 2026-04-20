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
import { Header } from './Header';

export type GameConfig = {
  mode: Mode;
  playerColor: 'white' | 'black';
  difficulty: Difficulty;
};

const SAVE_KEY = 'chess_state'

interface Props {
  config: GameConfig;
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
  onBackToMenu: () => void;
  onWin?: (difficulty: Difficulty) => void;
  initialState?: GameState;
  onSaveChange?: (hasSave: boolean) => void;
}

function QuitModal({ onCancel, onQuit }: { onCancel: () => void; onQuit: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">Quit Game</h2>
        <div className="modal-content">
          <p>Return to the main menu?</p>
        </div>
        <div className="modal-actions">
          <button className="secondary-btn" onClick={onCancel}>Cancel</button>
          <button className="primary-btn" onClick={onQuit}>Quit</button>
        </div>
      </div>
    </div>
  )
}

function getStatusInfo(gameState: GameState, isThinking: boolean): { text: string; cls: string } {
  const { status, turn, winner } = gameState;
  const lightLabel = 'Light';
  const darkLabel = 'Dark';
  const turnLabel = turn === 'white' ? lightLabel : darkLabel;
  const turnCls = `game-header__status--${turn === 'white' ? 'light' : 'dark'}`;

  if (status === 'checkmate') {
    const winLabel = winner === 'white' ? lightLabel : darkLabel;
    const winCls = `game-header__status--${winner === 'white' ? 'light' : 'dark'}`;
    return { text: `${winLabel} wins by checkmate`, cls: winCls };
  }
  if (status === 'stalemate') return { text: 'Stalemate — Draw', cls: '' };
  if (status === 'draw') return { text: 'Draw', cls: '' };
  if (isThinking) return { text: 'Thinking...', cls: '' };
  if (status === 'check') return { text: `${turnLabel} is in check`, cls: turnCls };
  return { text: `${turnLabel}'s turn`, cls: turnCls };
}

export function Game({ config, theme, onThemeToggle, onBackToMenu, onWin, initialState, onSaveChange }: Props) {
  const [gameState, setGameState] = useState<GameState>(() => initialState ?? initGameState());
  const [isThinking, setIsThinking] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

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
  const statusInfo = getStatusInfo(gameState, isThinking);

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
      <Header
        showBack={true}
        onBack={() => setShowQuitConfirm(true)}
        theme={theme}
        onThemeToggle={onThemeToggle}
        onHelp={() => setShowHelp(true)}
        statusText={statusInfo.text}
        statusClass={statusInfo.cls}
      />
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
          <div className="game-over-overlay">
            <div className="game-over-content">
              {status === 'checkmate' && (
                <p>{winner === 'white' ? 'Light' : 'Dark'} wins by checkmate!</p>
              )}
              {status === 'stalemate' && <p>Stalemate — Draw!</p>}
              {status === 'draw' && <p>Draw!</p>}
              <button onClick={handlePlayAgain}>Play Again</button>
              <button onClick={onBackToMenu}>Back to Menu</button>
            </div>
          </div>
        )}
      </div>
      {showQuitConfirm && (
        <QuitModal
          onCancel={() => setShowQuitConfirm(false)}
          onQuit={() => { setShowQuitConfirm(false); onBackToMenu(); }}
        />
      )}
      {showHelp && (
        <div className="modal-backdrop" onClick={() => setShowHelp(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">How to Play</h2>
            <div className="modal-content">
              <h3>Objective</h3>
              <p>Checkmate your opponent's king — put it under attack with no escape.</p>
              <h3>Pieces</h3>
              <ul>
                <li>King moves one square in any direction.</li>
                <li>Queen moves any number of squares in any direction.</li>
                <li>Rook moves any number of squares horizontally or vertically.</li>
                <li>Bishop moves any number of squares diagonally.</li>
                <li>Knight moves in an L-shape and can jump over pieces.</li>
                <li>Pawn moves forward one square, captures diagonally. Reach the back rank to promote.</li>
              </ul>
              <h3>Special Rules</h3>
              <ul>
                <li>Castling: king and rook swap if neither has moved and the path is clear.</li>
                <li>En passant: a pawn may capture an adjacent pawn that just moved two squares.</li>
                <li>Draw by stalemate, 3-fold repetition, or 50 moves without capture or pawn move.</li>
              </ul>
            </div>
            <div className="modal-actions">
              <button className="primary-btn" onClick={() => setShowHelp(false)}>Got it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
