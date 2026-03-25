import './CardView.css';
import type { Card } from '../gameLogic';

type Props = {
  card: Card;
  selected?: boolean;
  onClick?: () => void;
};

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

export function CardView({ card, selected = false, onClick }: Props) {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';

  if (!card.faceUp) {
    return (
      <div className="card card-back" onClick={onClick} />
    );
  }

  return (
    <div
      className={`card card-face ${isRed ? 'card-red' : 'card-black'} ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <span className="card-corner card-top-left">
        <span className="card-rank">{card.rank}</span>
        <span className="card-suit-small">{SUIT_SYMBOLS[card.suit]}</span>
      </span>
      <span className="card-center-suit">{SUIT_SYMBOLS[card.suit]}</span>
      <span className="card-corner card-bottom-right">
        <span className="card-rank">{card.rank}</span>
        <span className="card-suit-small">{SUIT_SYMBOLS[card.suit]}</span>
      </span>
    </div>
  );
}
