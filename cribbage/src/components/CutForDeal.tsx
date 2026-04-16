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
  tie: 'Tie — cut again',
}

export default function CutForDeal({ deck, humanCut, computerCut, result, onHumanCut, onComputerCut, onContinue }: Props) {
  useEffect(() => {
    if (humanCut && !computerCut) {
      const t = setTimeout(onComputerCut, 700)
      return () => clearTimeout(t)
    }
  }, [humanCut, computerCut, onComputerCut])

  const canClick = !humanCut

  let hint = 'Click the deck to cut — low card deals first'
  if (humanCut && !computerCut) hint = 'Computer is cutting...'
  if (result !== 'pending') hint = RESULT_LABELS[result]

  return (
    <div className="cut-for-deal">
      <div className="cut-for-deal__inner">
        <h1 className="cut-for-deal__title">Cut for Deal</h1>
        <p className="cut-for-deal__hint">{hint}</p>

        <div className="cut-spread">
          {deck.map((card, i) => {
            const isHuman = humanCut?.id === card.id
            const isComputer = computerCut?.id === card.id
            const isRevealed = isHuman || isComputer

            return (
              <div
                key={card.id}
                className={[
                  'cut-card',
                  isRevealed ? 'cut-card--revealed' : '',
                  isHuman ? 'cut-card--human' : '',
                  isComputer ? 'cut-card--computer' : '',
                  canClick && !isRevealed ? 'cut-card--clickable' : '',
                ].filter(Boolean).join(' ')}
                style={{ zIndex: isRevealed ? 100 : i }}
                onClick={canClick && !isRevealed ? () => onHumanCut(i) : undefined}
              >
                {isRevealed ? (
                  <CardView card={card} />
                ) : (
                  <div className="card card--back cut-card__back" />
                )}
                {isRevealed && (
                  <span className="cut-card__label">
                    {isHuman ? 'You' : 'Computer'}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {result !== 'pending' && humanCut && computerCut && (
          <div className="cut-continue">
            <p className="cut-continue__label">{RESULT_LABELS[result]}</p>
            <button className="btn btn--primary" onClick={onContinue}>
              {result === 'tie' ? 'Cut Again' : 'Continue'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
