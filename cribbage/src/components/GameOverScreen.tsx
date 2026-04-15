import './GameOverScreen.css'

interface Props {
  winner: 'human' | 'computer'
  humanScore: number
  computerScore: number
  onPlayAgain: () => void
}

export default function GameOverScreen({ winner, humanScore, computerScore, onPlayAgain }: Props) {
  return (
    <div className="game-over">
      <div className="game-over__box">
        <h1 className="game-over__heading">
          {winner === 'human' ? 'You Win!' : 'Computer Wins'}
        </h1>

        <div className="game-over__scores">
          <div className={`game-over__score ${winner === 'human' ? 'game-over__score--winner' : ''}`}>
            <span className="game-over__score-label">You</span>
            <span className="game-over__score-value">{humanScore}</span>
          </div>
          <div className={`game-over__score ${winner === 'computer' ? 'game-over__score--winner' : ''}`}>
            <span className="game-over__score-label">Computer</span>
            <span className="game-over__score-value">{computerScore}</span>
          </div>
        </div>

        <button className="btn btn--primary" onClick={onPlayAgain}>
          Play Again
        </button>
      </div>
    </div>
  )
}
