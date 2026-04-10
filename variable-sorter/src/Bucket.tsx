import { useEffect, useRef } from 'react'
import './Bucket.css'
import type { VarType } from './gameLogic'

interface Props {
  type: VarType
  keyboardKey: number
  isNear: boolean
  flashColor: 'green' | 'red' | null
  showKeyHint: boolean
  onRegisterRef: (type: VarType, el: HTMLDivElement | null) => void
}

export default function Bucket({ type, keyboardKey, isNear, flashColor, showKeyHint, onRegisterRef }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    onRegisterRef(type, ref.current)
    return () => onRegisterRef(type, null)
  }, [type, onRegisterRef])

  let cls = 'bucket'
  if (isNear) cls += ' near'
  if (flashColor === 'green') cls += ' flash-correct'
  if (flashColor === 'red') cls += ' flash-wrong'

  return (
    <div
      ref={ref}
      className={cls}
      data-type={type}
      aria-label={`Drop zone for ${type}`}
      role="region"
    >
      <span className="bucket-label">{type}</span>
      <span className={`bucket-key${showKeyHint ? '' : ' key-hidden'}`}>{keyboardKey}</span>
    </div>
  )
}
