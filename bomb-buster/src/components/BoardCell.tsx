import type { Cell, GameStatus } from '../gameLogic';
import './BoardCell.css';

type Props = {
  cell: Cell;
  index: number;
  status: GameStatus;
  isDetonated: boolean;
  onClick: (index: number) => void;
  onRightClick: (index: number) => void;
};

const NUM_CLASS = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];

export function BoardCell({ cell, index, status, isDetonated, onClick, onRightClick }: Props) {
  const { isBomb, isRevealed, isFlagged, adjacentCount } = cell;

  function getClassAndContent(): [string, string | number | null] {
    if (isRevealed) {
      if (isBomb) {
        const cls = isDetonated ? 'board-cell--detonated' : 'board-cell--bomb';
        return [`board-cell board-cell--revealed ${cls}`, '💣'];
      }
      if (adjacentCount > 0) {
        return [`board-cell board-cell--revealed board-cell--num board-cell--${NUM_CLASS[adjacentCount]}`, adjacentCount];
      }
      return ['board-cell board-cell--revealed board-cell--blank', null];
    }

    if (isFlagged) {
      if (status === 'lost' && !isBomb) {
        return ['board-cell board-cell--wrong-flag', '❌'];
      }
      return ['board-cell board-cell--flagged', '🚩'];
    }

    return ['board-cell board-cell--unrevealed', null];
  }

  const [className, content] = getClassAndContent();

  return (
    <button
      className={className}
      onClick={() => onClick(index)}
      onContextMenu={e => { e.preventDefault(); onRightClick(index); }}
    >
      {content}
    </button>
  );
}
