import { useState } from 'react'
import type { Card, GameState, PassDirection } from './gameLogic'
import { getLegalCards } from './gameLogic'
import OpponentHand from './OpponentHand'
import TrickArea from './TrickArea'
import ScorePanel from './ScorePanel'
import PlayerHand from './PlayerHand'
import HandSummaryModal from './HandSummaryModal'
import HelpModal from './HelpModal'
import './GameBoard.css'

const DIRECTION_LABEL: Record<PassDirection, string> = {
  left: 'Pass Left',
  right: 'Pass Right',
  across: 'Pass Across',
  none: 'Keep All',
}

interface Props {
  gameState: GameState
  onCardPlay: (card: Card) => void
  onPassToggle: (card: Card) => void
  onPass: () => void
  onNewGame: () => void
  onQuitHome: () => void
  onNextHand: () => void
  theme: 'dark' | 'light'
  onThemeToggle: () => void
}

export default function GameBoard({
  gameState,
  onCardPlay,
  onPassToggle,
  onPass,
  onNewGame,
  onQuitHome,
  onNextHand,
  theme,
  onThemeToggle,
}: Props) {
  const [showHelp, setShowHelp] = useState(false)

  const { phase, hands, handPoints, currentTrick, trickLeader, lastTrickWinner,
    heartsBroken, queenOfSpadesPlayed, passDirection, passSelections,
    activePlayer, trickCount, scores, handSummaryData } = gameState

  const trickComplete = currentTrick.length === 4
  const isMyTurn = phase === 'playing' && activePlayer === 0 && !trickComplete

  const legalCards = isMyTurn
    ? getLegalCards(hands[0], currentTrick, heartsBroken, trickCount)
    : []

  const handLabel = phase === 'passing'
    ? DIRECTION_LABEL[passDirection]
    : `Trick ${trickCount + 1} of 13`

  return (
    <div className="game-board">
      {/* Header */}
      <div className="game-board__header">
        <div className="game-board__hand-label">{handLabel}</div>
        <div className="game-board__controls">
          <button
            className="btn btn--icon"
            onClick={() => setShowHelp(true)}
            aria-label="Help"
            title="Help"
          >?</button>
          <button
            className="btn btn--icon"
            onClick={onThemeToggle}
            aria-label="Toggle theme"
            title="Toggle theme"
          >{theme === 'dark' ? '☀' : '☽'}</button>
          <button
            className="btn btn--secondary btn--sm"
            onClick={onNewGame}
            aria-label="New game"
          >New</button>
          <button
            className="btn btn--secondary btn--sm"
            onClick={onQuitHome}
            aria-label="Quit to home"
          >Quit</button>
        </div>
      </div>

      {/* Table */}
      <div className="game-board__table">
        {/* North */}
        <div className="game-board__north">
          <OpponentHand
            position="north"
            cardCount={hands[2].length}
            playerName="North"
            handPoints={handPoints[2]}
          />
        </div>

        {/* Middle row */}
        <div className="game-board__middle">
          <div className="game-board__west">
            <OpponentHand
              position="west"
              cardCount={hands[1].length}
              playerName="West"
              handPoints={handPoints[1]}
            />
          </div>

          <div className="game-board__felt">
            <TrickArea
              currentTrick={currentTrick}
              trickLeader={trickLeader}
              lastTrickWinner={lastTrickWinner}
              trickComplete={trickComplete}
            />
          </div>

          <div className="game-board__east">
            <OpponentHand
              position="east"
              cardCount={hands[3].length}
              playerName="East"
              handPoints={handPoints[3]}
            />
          </div>

          <div className="game-board__score">
            <ScorePanel
              scores={scores}
              handPoints={handPoints}
              heartsBroken={heartsBroken}
              queenOfSpadesPlayed={queenOfSpadesPlayed}
            />
          </div>
        </div>

        {/* South / Player hand */}
        <div className="game-board__south">
          <PlayerHand
            hand={hands[0]}
            phase={phase === 'passing' ? 'passing' : 'playing'}
            passDirection={passDirection}
            passSelections={passSelections}
            legalCards={legalCards}
            onCardToggle={onPassToggle}
            onCardPlay={onCardPlay}
            onPass={onPass}
            isMyTurn={isMyTurn}
          />
        </div>
      </div>

      {/* Modals */}
      {phase === 'handSummary' && handSummaryData && (
        <HandSummaryModal data={handSummaryData} onNextHand={onNextHand} />
      )}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  )
}
