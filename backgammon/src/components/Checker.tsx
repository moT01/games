import './Checker.css'
import type { Color } from '../gameLogic'

interface CheckerProps {
  color: Color
}

export function Checker({ color }: CheckerProps) {
  return <div className={`checker checker--${color}`} />
}
