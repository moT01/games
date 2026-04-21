import { getBestMove } from './gameLogic';
import type { GameState } from './gameLogic';

self.onmessage = (e: MessageEvent<{ gameState: GameState; depth: number; timeLimitMs: number }>) => {
  const { gameState, depth, timeLimitMs } = e.data;
  const move = getBestMove(gameState, depth, timeLimitMs);
  self.postMessage(move);
};
