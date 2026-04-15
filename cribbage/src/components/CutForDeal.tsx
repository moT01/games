import { useEffect } from 'react'
import type { Card } from '../gameLogic'
import CardView from './CardView'
import './CutForDeal.css'

interface Props {
  deck: Card[]
  humanCut: Card | null
  computerCut: Card | null
  result: 'pending' | 'human-deals' | 'computer-deals' | 'tie'
  onHumanCut: (index: number) => void
  onComputerCut: () => void
  onContinue: () => void
}

const RESULT_LABELS: Record<string, string> = {
  'human-deals': 'You deal first',
  'computer-deals': 'Computer deals first',
  tie: 'Tie - cut again',
}

export default function CutForDeal({
  deck,
  humanCut,
  computerCut,
  result,
  onHumanCut,
  onComputerCut,
  onContinue,
}: Props) {
  useEffect(() => {
    if (humanCut && !computerCut) {
      const t = setTimeout(onComputerCut, 600)
      return () => clearTimeout(t)
    }
  }, [humanCut, computerCut, onComputerCut])

  const canClick = !humanCut

  return (
    <div className="cut-for-deal">
      <h2 className="cut-title">Cut for Deal</h2>
      <p className="cut-hint">
        {canClick ? 'Click any card to cut' : 'Waiting...'}
      </p>

      <div className="cut-spread">
        {deck.map((card, i) => (
          <div key={card.id} className="cut-spread__card">
            {humanCut?.id === card.id ? (
              <div className="cut-reveal cut-reveal--human">
                <CardView card={card} />
                <span className="cut-reveal__label">You</span>
              </div>
            ) : computerCut?.id === card.id ? (
              <div className="cut-reveal cut-reveal--computer">
                <CardView card={card} />
                <span className="cut-reveal__label">Computer</span>
              </div>
            ) : (
              <CardView
                card={card}
                faceDown
                onClick={canClick ? () => onHumanCut(i) : undefined}
              />
            )}
          </div>
        ))}
      </div>

      {result !== 'pending' && (
        <div className="cut-result">
          <p className="cut-result__label">{RESULT_LABELS[result]}</p>
          {humanCut && computerCut && (
            <div className="cut-result__cards">
              <div className="cut-result__card-wrap">
                <CardView card={humanCut} />
                <span>You</span>
              </div>
              <div className="cut-result__card-wrap">
                <CardView card={computerCut} />
                <span>Computer</span>
              </div>
            </div>
          )}
          <button className="btn btn--primary" onClick={onContinue}>
            {result === 'tie' ? 'Cut Again' : 'Continue'}
          </button>
        </div>
      )}
    </div>
  )
}
