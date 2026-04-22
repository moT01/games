import './Board.css'
import { BoardPoint } from './BoardPoint'
import { Bar } from './Bar'
import { OffArea } from './OffArea'
import type { GameState, ValidMove, Color } from '../gameLogic'

// Board index layout (left→right):
// Top row:    [11,10,9,8,7,6] | BAR | [5,4,3,2,1,0]   (points face down)
// Bottom row: [12,13,14,15,16,17] | BAR | [18,19,20,21,22,23] (points face up)
// Labels: 24-index (traditional Light's perspective, 1–24)
const TOP_LEFT = [11, 10, 9, 8, 7, 6]
const TOP_RIGHT = [5, 4, 3, 2, 1, 0]
const BOTTOM_LEFT = [12, 13, 14, 15, 16, 17]
const BOTTOM_RIGHT = [18, 19, 20, 21, 22, 23]

// Home board index ranges: Light 18–23 (bottom-right), Dark 0–5 (top-right)
const LIGHT_HOME = new Set([18, 19, 20, 21, 22, 23])
const DARK_HOME = new Set([0, 1, 2, 3, 4, 5])

interface BoardProps {
  state: GameState
  onPointClick: (index: number) => void
  onBarClick: () => void
  onOffClick: (color: Color) => void
}

export function Board({ state, onPointClick, onBarClick, onOffClick }: BoardProps) {
  const { points, bar, off, selectedPoint, validMoves, currentPlayer } = state

  const isValidDest = (index: number) => validMoves.some(m => m.to === index)
  const isOffValid = (color: Color) => color === currentPlayer && validMoves.some((m: ValidMove) => m.to === 'off')

  function renderPoint(index: number, isTopRow: boolean) {
    const isHomePoint = isTopRow
      ? DARK_HOME.has(index)
      : LIGHT_HOME.has(index)

    return (
      <BoardPoint
        key={index}
        index={index}
        point={points[index]}
        isSelected={selectedPoint === index}
        isValidDest={isValidDest(index)}
        isTopRow={isTopRow}
        isHomePoint={isHomePoint}
        onClick={() => onPointClick(index)}
      />
    )
  }

  return (
    <div className="board">
      <OffArea
        color="light"
        count={off.light}
        isValidDest={isOffValid('light')}
        onClick={() => onOffClick('light')}
      />

      <div className="board__field">
        <div className="board__row board__row--top">
          <div className="board__half">
            {TOP_LEFT.map(i => renderPoint(i, true))}
          </div>
          <Bar
            bar={bar}
            currentPlayer={currentPlayer}
            isBarSelected={selectedPoint === -1}
            onBarClick={onBarClick}
          />
          <div className="board__half">
            {TOP_RIGHT.map(i => renderPoint(i, true))}
          </div>
        </div>

        <div className="board__row board__row--bottom">
          <div className="board__half">
            {BOTTOM_LEFT.map(i => renderPoint(i, false))}
          </div>
          <div className="board__bar-spacer" />
          <div className="board__half">
            {BOTTOM_RIGHT.map(i => renderPoint(i, false))}
          </div>
        </div>
      </div>

      <OffArea
        color="dark"
        count={off.dark}
        isValidDest={isOffValid('dark')}
        onClick={() => onOffClick('dark')}
      />
    </div>
  )
}
