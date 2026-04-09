import type { TrickPlay, PlayerId } from './gameLogic'
import { rankLabel, suitSymbol, isRedSuit } from './gameLogic'
import './TrickArea.css'

interface Props {
  currentTrick: TrickPlay[]
  trickLeader: PlayerId
  lastTrickWinner: PlayerId | null
  trickComplete: boolean
}

const SLOT_POSITIONS: Record<PlayerId, string> = {
  0: 'south',
  1: 'west',
  2: 'north',
  3: 'east',
}

export default function TrickArea({ currentTrick, lastTrickWinner, trickComplete }: Props) {
  const playsByPlayer = new Map<PlayerId, TrickPlay>()
  for (const play of currentTrick) {
    playsByPlayer.set(play.player, play)
  }

  return (
    <div className="trick-area" aria-label="Current trick">
      {([0, 1, 2, 3] as PlayerId[]).map(playerId => {
        const play = playsByPlayer.get(playerId)
        const pos = SLOT_POSITIONS[playerId]
        const isWinner = trickComplete && lastTrickWinner === playerId

        return (
          <div
            key={playerId}
            className={`trick-area__slot trick-area__slot--${pos} ${isWinner ? 'trick-area__slot--winner' : ''}`}
          >
            {play ? (
              <div
                className={`playing-card trick-card ${isRedSuit(play.card.suit) ? 'red' : 'black'} ${isWinner ? 'winner' : ''}`}
                aria-label={`${rankLabel(play.card.rank)} of ${play.card.suit}`}
              >
                <span className="playing-card__rank">{rankLabel(play.card.rank)}</span>
                <span className="playing-card__suit">{suitSymbol(play.card.suit)}</span>
                <span className="playing-card__rank-bottom">{rankLabel(play.card.rank)}</span>
              </div>
            ) : (
              <div className="trick-area__empty" aria-hidden="true" />
            )}
          </div>
        )
      })}
    </div>
  )
}
