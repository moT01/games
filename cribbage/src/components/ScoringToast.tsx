import { useEffect, useState } from 'react'
import './ScoringToast.css'

interface Props {
  message: string | null
  onDone: () => void
}

export default function ScoringToast({ message, onDone }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!message) return
    setVisible(true)
    const t = setTimeout(() => {
      setVisible(false)
      onDone()
    }, 1500)
    return () => clearTimeout(t)
  }, [message])

  if (!message) return null

  return (
    <div className={`scoring-toast ${visible ? 'scoring-toast--visible' : ''}`}>
      {message}
    </div>
  )
}
