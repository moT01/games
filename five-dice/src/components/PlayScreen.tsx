import { useState } from 'react'
import './PlayScreen.css'
import type { GameState, CategoryKey } from '../gameLogic'
import DiceArea from './DiceArea'
import RollButton from './RollButton'
import ScoreCard from './ScoreCard'
import HelpModal from './HelpModal'
import ConfirmModal from './ConfirmModal'
import BackgroundDice from './BackgroundDice'

interface Props {
  state: GameState
  onRoll: () => void
  onToggleHold: (index: number) => void
  onScore: (key: CategoryKey) => void
  onQuit: () => void
  confirmQuit: boolean
  onConfirmQuit: () => void
  onCancelQuit: () => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  helpOpen: boolean
  onHelp: () => void
  onCloseHelp: () => void
}

export default function PlayScreen({
  state, onRoll, onToggleHold, onScore,
  onQuit, confirmQuit, onConfirmQuit, onCancelQuit,
  theme, onToggleTheme,
  helpOpen, onHelp, onCloseHelp,
}: Props) {
  const [rolling, setRolling] = useState(false)

  const handleRoll = () => {
    if (state.rollCount >= 3) return
    setRolling(true)
    onRoll()
    setTimeout(() => setRolling(false), 400)
  }

  const getHint = () => {
    if (state.rollCount === 0) {
      const turn = Object.keys(state.scores).length + 1
      return `Roll to start turn ${turn} / 13`
    }
    if (state.rollCount < 3) return 'Click dice to hold, then roll again or pick a category'
    return 'Pick a category to score'
  }

  return (
    <div className="play-screen">
      <BackgroundDice />
      <div className="play-header">
        <button className="btn-icon" onClick={onQuit} aria-label="Quit game">✕</button>
        <div className="play-header-actions">
          <button className="btn-icon" onClick={onHelp} aria-label="Help and rules">?</button>
          <button className="btn-icon" onClick={onToggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? '☾' : '☀'}
          </button>
          <a
            className="btn-icon"
            href="https://www.freecodecamp.org/donate"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Donate"
          >
            ♥
          </a>
        </div>
      </div>

      <div className="play-top">
        <DiceArea
          dice={state.dice}
          rollCount={state.rollCount}
          rolling={rolling}
          onToggleHold={onToggleHold}
        />
        <RollButton rollCount={state.rollCount} onRoll={handleRoll} />
        <p className="play-hint">{getHint()}</p>
      </div>

      <div className="play-scorecard">
        <ScoreCard
          scores={state.scores}
          dice={state.dice}
          rollCount={state.rollCount}
          fiveOfAKindBonus={state.fiveOfAKindBonus}
          onScore={onScore}
        />
      </div>

      {helpOpen && <HelpModal onClose={onCloseHelp} />}
      {confirmQuit && (
        <ConfirmModal
          message="Quit this game? Your progress will be lost."
          confirmLabel="Quit"
          cancelLabel="Keep Playing"
          onConfirm={onConfirmQuit}
          onCancel={onCancelQuit}
        />
      )}
    </div>
  )
}
