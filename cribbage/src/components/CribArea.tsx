import './CribArea.css'

interface Props {
  cribCount: number
  dealer: 'human' | 'computer'
}

export default function CribArea({ cribCount, dealer }: Props) {
  return (
    <div className="crib-area">
      <span className="crib-area__label">
        {dealer === 'human' ? 'Your Crib' : "Computer's Crib"}
      </span>
      <div className="crib-area__cards">
        {Array.from({ length: cribCount }).map((_, i) => (
          <div key={i} className="card card--back crib-area__card" />
        ))}
      </div>
      {cribCount > 0 && (
        <span className="crib-area__count">{cribCount}</span>
      )}
    </div>
  )
}
