import './TableauColumn.css';
import type { Card } from '../gameLogic';
import { CardView } from './CardView';

type Props = {
  cards: Card[];
  columnIndex: number;
  selectedCardIndex: number | null; // index in this column of the bottom selected card (null if nothing selected here)
  isTarget: boolean;
  onCardClick: (cardIndex: number) => void;
  onColumnClick: () => void;
};

export function TableauColumn({
  cards,
  columnIndex: _columnIndex,
  selectedCardIndex,
  isTarget,
  onCardClick,
  onColumnClick,
}: Props) {
  return (
    <div
      className={`tableau-column ${isTarget ? 'tableau-column-target' : ''}`}
      onClick={cards.length === 0 ? onColumnClick : undefined}
    >
      {cards.length === 0 ? (
        <div className="tableau-empty" />
      ) : (
        cards.map((card, i) => {
          const isSelected = selectedCardIndex !== null && i >= selectedCardIndex;
          const offset = i * (card.faceUp ? 28 : 18);
          return (
            <div
              key={i}
              className="tableau-card-slot"
              style={{ top: `${offset}px` }}
            >
              <CardView
                card={card}
                selected={isSelected}
                onClick={() => onCardClick(i)}
              />
            </div>
          );
        })
      )}
    </div>
  );
}
