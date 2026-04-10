import { useState, useRef } from 'react'
import './VariableCard.css'
import { tokenize } from './tokenize'

interface Props {
  declaration: string
  onCardDrop: (centerX: number, centerY: number) => 'correct' | 'wrong' | 'miss'
  onDragStart: () => void
  onDragEnd: () => void
  onDragMove: (x: number, y: number) => void
}

export default function VariableCard({ declaration, onCardDrop, onDragStart, onDragEnd, onDragMove }: Props) {
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [snapping, setSnapping] = useState(false)
  const startPos = useRef({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  function handlePointerDown(e: React.PointerEvent) {
    e.preventDefault()
    isDragging.current = true
    setDragging(true)
    setSnapping(false)
    startPos.current = { x: e.clientX, y: e.clientY }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    onDragStart()
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isDragging.current) return
    const newOffset = {
      x: e.clientX - startPos.current.x,
      y: e.clientY - startPos.current.y,
    }
    setOffset(newOffset)
    onDragMove(e.clientX, e.clientY)
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (!isDragging.current) return
    isDragging.current = false
    onDragEnd()

    const el = cardRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const result = onCardDrop(centerX, centerY)
    if (result === 'miss') {
      setSnapping(true)
      setOffset({ x: 0, y: 0 })
      setTimeout(() => {
        setSnapping(false)
        setDragging(false)
      }, 240)
    } else {
      setDragging(false)
      setOffset({ x: 0, y: 0 })
    }
  }

  function handlePointerCancel(_e: React.PointerEvent) {
    isDragging.current = false
    setSnapping(true)
    setOffset({ x: 0, y: 0 })
    setTimeout(() => {
      setSnapping(false)
      setDragging(false)
    }, 240)
    onDragEnd()
  }

  const tokens = tokenize(declaration)

  return (
    <div
      ref={cardRef}
      className={`variable-card${dragging ? ' dragging' : ''}${snapping ? ' snapping' : ''}`}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)${dragging ? ' rotate(2deg)' : ''}`,
        transition: snapping ? 'transform 220ms cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      role="button"
      tabIndex={0}
      aria-label={`Current variable: ${declaration}`}
      aria-grabbed={dragging}
    >
      <code className="card-code">
        {tokens.map((tok, i) => (
          <span key={i} className={tok.cls || undefined}>{tok.text}</span>
        ))}
      </code>
      <span className="card-hint">drag to a bucket or use 1–9</span>
    </div>
  )
}
