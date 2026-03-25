import './FoundationPile.css';
import type { Card } from '../gameLogic';
import { CardView } from './CardView';

const SUIT_SYMBOLS = ['♥', '♦', '♣', '♠'];

type Props = {
  cards: Card[];
  pileIndex: number;
  isTarget: boolean;
  onClick: () => void;
};

export function FoundationPile({ cards, pileIndex, isTarget, onClick }: Props) {
  const topCard = cards.length > 0 ? cards[cards.length - 1] : null;

  return (
    <div
      className={`foundation-pile ${isTarget ? 'foundation-pile-target' : ''}`}
      onClick={onClick}
    >
      {topCard ? (
        <CardView card={topCard} />
      ) : (
        <div className="foundation-empty">{SUIT_SYMBOLS[pileIndex]}</div>
      )}
    </div>
  );
}
