import { useState, useEffect, useRef, useCallback } from 'react'
import './PlayScreen.css'
import type { GameState, VarType, BucketRect } from './gameLogic'
import { getBuckets, getProximityBucket, formatTime } from './gameLogic'
import VariableCard from './VariableCard'
import NextPreview from './NextPreview'
import BucketRow from './BucketRow'

interface Props {
  state: GameState
  onDrop: (bucketType: VarType) => 'correct' | 'wrong'
  onQuit: () => void
  onShowHelp: () => void
}

export default function PlayScreen({ state, onDrop, onQuit, onShowHelp }: Props) {
  const [elapsed, setElapsed] = useState(0)
  const [flashBucket, setFlashBucket] = useState<{ type: VarType; color: 'green' | 'red' } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null)
  const [keyboardUsed, setKeyboardUsed] = useState(false)

  const bucketRefsMap = useRef<Map<VarType, HTMLDivElement>>(new Map())

  const buckets = getBuckets(state.language)

  // Timer
  useEffect(() => {
    if (!state.startTime) return
    const interval = setInterval(() => {
      setElapsed(Date.now() - state.startTime!)
    }, 10)
    return () => clearInterval(interval)
  }, [state.startTime])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.repeat) return
      const key = parseInt(e.key)
      if (isNaN(key) || key < 1 || key > 9) return
      const bucket = buckets.find(b => b.keyboardKey === key)
      if (!bucket) return
      e.preventDefault()
      setKeyboardUsed(true)
      const result = onDrop(bucket.type)
      setFlashBucket({ type: bucket.type, color: result === 'correct' ? 'green' : 'red' })
      setTimeout(() => setFlashBucket(null), result === 'correct' ? 200 : 150)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [buckets, onDrop])

  const registerBucketRef = useCallback((type: VarType, el: HTMLDivElement | null) => {
    if (el) bucketRefsMap.current.set(type, el)
    else bucketRefsMap.current.delete(type)
  }, [])

  function getBucketRects(): BucketRect[] {
    const rects: BucketRect[] = []
    bucketRefsMap.current.forEach((el, type) => {
      const rect = el.getBoundingClientRect()
      rects.push({
        type,
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2,
      })
    })
    return rects
  }

  function getNearBucketType(): VarType | null {
    if (!dragPos) return null
    let closest: VarType | null = null
    let minDist = Infinity
    bucketRefsMap.current.forEach((el, type) => {
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = dragPos.x - cx
      const dy = dragPos.y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < minDist) {
        minDist = dist
        closest = type
      }
    })
    return closest && minDist <= 100 ? closest : null
  }

  function handleCardDrop(centerX: number, centerY: number): 'correct' | 'wrong' | 'miss' {
    const rects = getBucketRects()
    const bucket = getProximityBucket(centerX, centerY, rects)
    if (!bucket) return 'miss'
    const result = onDrop(bucket.type)
    setFlashBucket({ type: bucket.type, color: result === 'correct' ? 'green' : 'red' })
    setTimeout(() => setFlashBucket(null), result === 'correct' ? 200 : 150)
    return result
  }

  const nearType = isDragging ? getNearBucketType() : null

  return (
    <div className="play-screen">
      <div className="play-header">
        <span className="progress-counter" aria-live="polite">
          {state.sorted} / {state.variableCount}
        </span>
        <span className="timer" aria-label={`Time: ${formatTime(elapsed)}`}>
          {formatTime(elapsed)}
        </span>
        <div className="play-header-actions">
          <button className="play-icon-btn" onClick={onShowHelp} aria-label="Help">?</button>
          <button className="play-icon-btn" onClick={onQuit} aria-label="Quit run">Quit</button>
        </div>
      </div>

      <div className="play-area">
        <div className="card-zone">
          {state.current && (
            <VariableCard
              key={state.current.id}
              declaration={state.current.declaration}
              onCardDrop={handleCardDrop}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={() => { setIsDragging(false); setDragPos(null) }}
              onDragMove={(x, y) => setDragPos({ x, y })}
            />
          )}
        </div>
        <div className="preview-zone">
          <NextPreview variable={state.next} />
        </div>
      </div>

      <div className="buckets-zone">
        <BucketRow
          buckets={buckets}
          nearType={nearType}
          flashBucket={flashBucket}
          showKeyHints={!keyboardUsed}
          onRegisterRef={registerBucketRef}
        />
      </div>
    </div>
  )
}
