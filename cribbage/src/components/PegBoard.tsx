import type { Pegs } from '../gameLogic'
import './PegBoard.css'

interface Props {
  humanPegs: Pegs
  computerPegs: Pegs
  humanScore: number
  computerScore: number
}

const TOTAL_HOLES = 121
const COLS = 60
// Row 0: holes 1-60 left to right
// Row 1: holes 61-121 right to left (61 = COLS+1 = col 59, 121 = col 0)

const HOLE_R = 4
const PEG_R = 3
const COL_W = 10
const ROW_H = 14
const TRACK_H = ROW_H * 2 + 10
const TRACK_GAP = 8
const PAD_X = 10
const PAD_Y = 6
const BOARD_W = PAD_X * 2 + COLS * COL_W
const BOARD_H = PAD_Y * 2 + TRACK_H * 2 + TRACK_GAP

function holePos(hole: number, trackY: number): { x: number; y: number } {
  if (hole === 0) return { x: -100, y: -100 } // off screen
  const idx = hole - 1 // 0-based
  if (idx < COLS) {
    // row 0: left to right
    const x = PAD_X + idx * COL_W + COL_W / 2
    const y = trackY + ROW_H + ROW_H / 2
    return { x, y }
  } else {
    // row 1: right to left; idx 60 = hole 61 = rightmost
    const col = idx - COLS // 0-based in row 1
    const x = PAD_X + (COLS - 1 - col) * COL_W + COL_W / 2
    const y = trackY + ROW_H / 2
    return { x, y }
  }
}

function renderHoles(trackY: number) {
  const holes = []
  for (let h = 1; h <= TOTAL_HOLES; h++) {
    const { x, y } = holePos(h, trackY)
    const isSkunk = h === 61
    holes.push(
      <circle
        key={h}
        cx={x}
        cy={y}
        r={HOLE_R}
        className={isSkunk ? 'hole hole--skunk' : 'hole'}
      />
    )
  }
  return holes
}

function PegCircle({ x, y, front }: { x: number; y: number; front: boolean }) {
  return (
    <circle
      cx={x}
      cy={y}
      r={PEG_R}
      className={front ? 'peg peg--front' : 'peg peg--back'}
      style={{ transition: 'cx 0.3s ease, cy 0.3s ease' }}
    />
  )
}

export default function PegBoard({ humanPegs, computerPegs, humanScore, computerScore }: Props) {
  const compTrackY = PAD_Y
  const humanTrackY = PAD_Y + TRACK_H + TRACK_GAP

  const hFront = holePos(humanPegs.front, humanTrackY)
  const hBack = holePos(humanPegs.back, humanTrackY)
  const cFront = holePos(computerPegs.front, compTrackY)
  const cBack = holePos(computerPegs.back, compTrackY)

  return (
    <div className="peg-board">
      <div className="peg-board__scores">
        <span className="peg-board__score peg-board__score--computer">
          Computer: {computerScore}
        </span>
        <span className="peg-board__score peg-board__score--human">
          You: {humanScore}
        </span>
      </div>
      <svg
        className="peg-board__svg"
        viewBox={`0 0 ${BOARD_W} ${BOARD_H}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <rect
          x={0}
          y={0}
          width={BOARD_W}
          height={BOARD_H}
          rx={4}
          className="board-bg"
        />

        {/* Computer track */}
        {renderHoles(compTrackY)}

        {/* Human track */}
        {renderHoles(humanTrackY)}

        {/* Skunk label */}
        <text
          x={holePos(61, humanTrackY).x}
          y={humanTrackY + TRACK_H + 2}
          className="skunk-label"
        >
          61
        </text>

        {/* Human pegs */}
        {humanPegs.back > 0 && <PegCircle x={hBack.x} y={hBack.y} front={false} />}
        {humanPegs.front > 0 && <PegCircle x={hFront.x} y={hFront.y} front={true} />}

        {/* Computer pegs */}
        {computerPegs.back > 0 && <PegCircle x={cBack.x} y={cBack.y} front={false} />}
        {computerPegs.front > 0 && <PegCircle x={cFront.x} y={cFront.y} front={true} />}
      </svg>
    </div>
  )
}
