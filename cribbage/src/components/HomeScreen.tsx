import './HomeScreen.css'

interface Props {
  onStart: () => void
}

export default function HomeScreen({ onStart }: Props) {
  return (
    <div className="home-screen">
      <div className="home-box">
        <h1 className="home-title">Cribbage</h1>
        <p className="home-subtitle">vs Opponent</p>

        <button className="btn btn--primary home-start" onClick={onStart}>
          Play
        </button>
      </div>
    </div>
  )
}
