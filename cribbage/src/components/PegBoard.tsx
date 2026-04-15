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
const HOLE_R = 5
const PEG_R = 4
const COL_W = 13
const ROW_H = 17
const TRACK_H = ROW_H * 2 + 10
const TRACK_GAP = 10
const PAD_X = 14
const PAD_Y = 8
const BOARD_W = PAD_X * 2 + COLS * COL_W
const BOARD_H = PAD_Y * 2 + TRACK_H * 2 + TRACK_GAP

// Skunk line at the right edge — between hole 60 (end of outbound) and 61 (start of return)
const SKUNK_LINE_X = PAD_X + COLS * COL_W

function holePos(hole: number, trackY: number): { x: number; y: number } {
  if (hole === 0) return { x: -100, y: -100 }
  const idx = hole - 1
  if (idx < COLS) {
    // Outbound: holes 1-60, left to right, bottom row of track
    const x = PAD_X + idx * COL_W + COL_W / 2
    const y = trackY + ROW_H + ROW_H / 2
    return { x, y }
  } else {
    // Return: holes 61-121, right to left, top row of track
    const col = idx - COLS
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

function PegCircle({
  x, y, front, player,
}: {
  x: number; y: number; front: boolean; player: 'human' | 'computer'
}) {
  const cls = `peg peg--${front ? 'front' : 'back'} peg--${player}`
  return (
    <circle
      cx={x}
      cy={y}
      r={PEG_R}
      className={cls}
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

  // Skunk line spans from top of computer track to bottom of human track
  const skunkTop = PAD_Y - 2
  const skunkBottom = humanTrackY + TRACK_H + 2

  return (
    <div className="peg-board">
      <svg
        className="peg-board__svg"
        viewBox={`0 0 ${BOARD_W} ${BOARD_H}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <rect x={0} y={0} width={BOARD_W} height={BOARD_H} rx={4} className="board-bg" />

        {/* Computer track */}
        {renderHoles(compTrackY)}

        {/* Human track */}
        {renderHoles(humanTrackY)}

        {/* Skunk line */}
        <line
          x1={SKUNK_LINE_X}
          y1={skunkTop}
          x2={SKUNK_LINE_X}
          y2={skunkBottom}
          className="skunk-line"
        />

        {/* Score labels inside SVG, flanking the board */}
        <text x={PAD_X - 2} y={compTrackY + TRACK_H / 2 + 4} className="track-label track-label--computer" textAnchor="end">
          {computerScore}
        </text>
        <text x={PAD_X - 2} y={humanTrackY + TRACK_H / 2 + 4} className="track-label track-label--human" textAnchor="end">
          {humanScore}
        </text>

        {/* Skunk label */}
        <text
          x={SKUNK_LINE_X}
          y={skunkBottom + 8}
          className="skunk-label"
          textAnchor="middle"
        >
          61
        </text>

        {/* Human pegs */}
        {humanPegs.back > 0 && <PegCircle x={hBack.x} y={hBack.y} front={false} player="human" />}
        {humanPegs.front > 0 && <PegCircle x={hFront.x} y={hFront.y} front={true} player="human" />}

        {/* Computer pegs */}
        {computerPegs.back > 0 && <PegCircle x={cBack.x} y={cBack.y} front={false} player="computer" />}
        {computerPegs.front > 0 && <PegCircle x={cFront.x} y={cFront.y} front={true} player="computer" />}
      </svg>
    </div>
  )
}
