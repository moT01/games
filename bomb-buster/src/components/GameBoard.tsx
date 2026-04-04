import type { Cell, Config, GameStatus } from '../gameLogic';
import { BoardCell } from './BoardCell';
import { HelpModal } from './HelpModal';
import './GameBoard.css';

type Props = {
  cells: Cell[];
  config: Config;
  status: GameStatus;
  flagCount: number;
  elapsedSeconds: number;
  detonatedIndex: number | null;
  showHelp: boolean;
  onCellClick: (index: number) => void;
  onCellRightClick: (index: number) => void;
  onReset: () => void;
  onChangeDifficulty: () => void;
  onToggleHelp: () => void;
};

function pad3(n: number): string {
  return String(Math.min(Math.abs(n), 999)).padStart(3, '0');
}

function formatMines(bombs: number, flags: number): string {
  const n = bombs - flags;
  if (n < 0) return '-' + String(Math.min(-n, 99)).padStart(2, '0');
  return pad3(n);
}

export function GameBoard({
  cells, config, status, flagCount, elapsedSeconds,
  detonatedIndex, showHelp,
  onCellClick, onCellRightClick, onReset, onChangeDifficulty, onToggleHelp,
}: Props) {
  const face = status === 'won' ? '😎' : status === 'lost' ? '😵' : '🙂';
  const mineStr = formatMines(config.bombs, flagCount);
  const timerStr = pad3(elapsedSeconds);

  return (
    <div className="game-board">
      <div className="game-board__header">
        <div className="game-board__lcd game-board__mines">{mineStr}</div>
        <button className="game-board__reset" onClick={onReset} title="New Game">
          {face}
        </button>
        <div className="game-board__lcd game-board__timer">{timerStr}</div>
        <button className="game-board__help-btn" onClick={onToggleHelp} title="Help">?</button>
      </div>
      <div
        className={`game-board__grid${status === 'lost' ? ' game-board__grid--shake' : ''}`}
        style={{ gridTemplateColumns: `repeat(${config.cols}, 28px)` }}
      >
        {cells.map((cell, index) => (
          <BoardCell
            key={index}
            cell={cell}
            index={index}
            status={status}
            isDetonated={index === detonatedIndex}
            onClick={onCellClick}
            onRightClick={onCellRightClick}
          />
        ))}
      </div>
      {(status === 'won' || status === 'lost') && (
        <div className="game-board__overlay">
          <div className="game-board__overlay-box">
            {status === 'won' ? (
              <>
                <div className="game-board__overlay-icon">🎉</div>
                <h2>You win!</h2>
                <p>Cleared in {elapsedSeconds}s</p>
              </>
            ) : (
              <>
                <div className="game-board__overlay-icon">💥</div>
                <h2>Game over</h2>
              </>
            )}
            <button className="game-board__overlay-btn" onClick={onReset}>
              Play Again
            </button>
            <button className="game-board__overlay-btn game-board__overlay-btn--secondary" onClick={onChangeDifficulty}>
              Change Difficulty
            </button>
          </div>
        </div>
      )}
      {showHelp && <HelpModal onClose={onToggleHelp} />}
    </div>
  );
}
