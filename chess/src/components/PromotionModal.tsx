import './PromotionModal.css';
import type { Color, PieceType } from '../gameLogic';
import { Piece } from './Piece';

interface Props {
  color: Color;
  onChoose: (type: PieceType) => void;
}

const OPTIONS: PieceType[] = ['queen', 'rook', 'bishop', 'knight'];

export function PromotionModal({ color, onChoose }: Props) {
  return (
    <div className="promotion-overlay">
      <div className="promotion-modal">
        <p>Promote to:</p>
        <div className="promotion-options">
          {OPTIONS.map(type => (
            <button key={type} className="promotion-btn" onClick={() => onChoose(type)}>
              <Piece piece={{ type, color }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
