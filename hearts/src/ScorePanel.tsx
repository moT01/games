import type { PlayerId } from './gameLogic'
import './ScorePanel.css'

const PLAYER_NAMES = ['You', 'West', 'North', 'East']

interface Props {
  scores: [number, number, number, number]
  handPoints: [number, number, number, number]
  heartsBroken: boolean
  queenOfSpadesPlayed: boolean
}

export default function ScorePanel({ scores, handPoints, heartsBroken, queenOfSpadesPlayed }: Props) {
  const minScore = Math.min(...scores)

  return (
    <div className="score-panel" aria-label="Scores">
      <div className="score-panel__indicators">
        <span
          className={`score-panel__badge ${heartsBroken ? 'active' : ''}`}
          title={heartsBroken ? 'Hearts are broken' : 'Hearts not broken'}
          aria-label={heartsBroken ? 'Hearts broken' : 'Hearts not broken yet'}
        >
          ♥
        </span>
        <span
          className={`score-panel__badge ${queenOfSpadesPlayed ? 'played' : ''}`}
          title={queenOfSpadesPlayed ? 'Queen of Spades played' : 'Queen of Spades in play'}
          aria-label={queenOfSpadesPlayed ? 'Queen of Spades played' : 'Queen of Spades not yet played'}
        >
          Q♠
        </span>
      </div>

      <div className="score-panel__rows">
        {([0, 1, 2, 3] as PlayerId[]).map(id => {
          const isLeading = scores[id] === minScore
          return (
            <div
              key={id}
              className={`score-panel__row ${id === 0 ? 'you' : ''} ${isLeading ? 'leading' : ''}`}
              aria-label={`${PLAYER_NAMES[id]}: ${scores[id]} total, ${handPoints[id]} this hand`}
            >
              <span className="score-panel__name">{PLAYER_NAMES[id]}</span>
              <div className="score-panel__numbers">
                {handPoints[id] > 0 && (
                  <span className="score-panel__hand">+{handPoints[id]}</span>
                )}
                <span className="score-panel__total">{scores[id]}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
