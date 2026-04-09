import type { GameOverData, HeartsRecord, PlayerId } from './gameLogic'
import './GameOverScreen.css'

const PLAYER_NAMES = ['You', 'West', 'North', 'East']

interface Props {
  data: GameOverData
  record: HeartsRecord
  onPlayAgain: () => void
  onHome: () => void
}

export default function GameOverScreen({ data, record, onPlayAgain, onHome }: Props) {
  const { finalScores, winner } = data
  const winners = Array.isArray(winner) ? winner : [winner]
  const humanWon = winners.length === 1 && winners[0] === 0
  const isTie = winners.length > 1

  const resultLabel = isTie ? 'Tie Game' : humanWon ? 'You Win!' : `${PLAYER_NAMES[winners[0] as PlayerId]} Wins`

  return (
    <div className="game-over" role="main">
      <div className="game-over__box">
        <div className={`game-over__result ${humanWon ? 'win' : isTie ? 'tie' : 'loss'}`}>
          {resultLabel}
        </div>

        <table className="game-over__table" aria-label="Final scores">
          <thead>
            <tr>
              <th>Player</th>
              <th>Final Score</th>
            </tr>
          </thead>
          <tbody>
            {([0, 1, 2, 3] as PlayerId[]).map(id => {
              const isWinner = winners.includes(id)
              return (
                <tr key={id} className={`${id === 0 ? 'you' : ''} ${isWinner ? 'winner' : ''}`}>
                  <td>{PLAYER_NAMES[id]} {isWinner && <span className="game-over__crown">★</span>}</td>
                  <td className="game-over__score">{finalScores[id]}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="game-over__record">
          <span className="game-over__record-label">Your record</span>
          <div className="game-over__record-stats">
            <span className="win-count">{record.wins}W</span>
            <span className="sep">/</span>
            <span className="loss-count">{record.losses}L</span>
            {record.bestScore !== null && (
              <span className="best-score">Best: {record.bestScore}</span>
            )}
          </div>
        </div>

        <div className="game-over__buttons">
          <button className="btn btn--secondary" onClick={onHome}>Home</button>
          <button className="btn btn--primary" onClick={onPlayAgain}>Play Again</button>
        </div>
      </div>
    </div>
  )
}
