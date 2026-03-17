import type { Player } from '../gameLogic'
import './Cell.css'

interface Props {
  value: Player | null
  isWinner: boolean
  isPreview: boolean
  previewPlayer: Player
  onClick: () => void
  onMouseEnter: () => void
  isInteractable: boolean
}

export function Cell({ value, isWinner, isPreview, previewPlayer, onClick, onMouseEnter, isInteractable }: Props) {
  const piecePlayer = value ?? (isPreview ? previewPlayer : null)

  const cellClasses = [
    'cell',
    isInteractable ? 'cell--interactable' : '',
  ].filter(Boolean).join(' ')

  const pieceClasses = [
    'cell__piece',
    piecePlayer ? `cell__piece--${piecePlayer.toLowerCase()}` : '',
    isPreview && !value ? 'cell__piece--preview' : '',
    isWinner ? 'cell__piece--winner' : '',
  ].filter(Boolean).join(' ')

  return (
    <div
      className={cellClasses}
      onClick={isInteractable ? onClick : undefined}
      onMouseEnter={onMouseEnter}
    >
      <div className={pieceClasses} />
    </div>
  )
}
