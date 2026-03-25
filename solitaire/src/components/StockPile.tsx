import './StockPile.css';
import type { Card } from '../gameLogic';
import { CardView } from './CardView';

type Props = {
  stock: Card[];
  waste: Card[];
  drawMode: 1 | 3;
  selectedFromWaste: boolean;
  onStockClick: () => void;
  onWasteClick: () => void;
};

export function StockPile({ stock, waste, drawMode, selectedFromWaste, onStockClick, onWasteClick }: Props) {
  const topWasteCards = drawMode === 3 ? waste.slice(-3) : waste.slice(-1);
  const topWaste = waste.length > 0 ? waste[waste.length - 1] : null;

  return (
    <div className="stock-area">
      {/* Stock pile */}
      <div className="stock-pile" onClick={onStockClick}>
        {stock.length > 0 ? (
          <CardView card={{ suit: 'spades', rank: 'A', faceUp: false }} />
        ) : (
          <div className="stock-empty">↺</div>
        )}
      </div>

      {/* Waste pile */}
      <div className="waste-pile">
        {drawMode === 3 && topWasteCards.length > 1 ? (
          <div className="waste-fan">
            {topWasteCards.map((card, i) => {
              const isTop = i === topWasteCards.length - 1;
              return (
                <div
                  key={i}
                  className="waste-fan-card"
                  style={{ left: `${i * 18}px` }}
                  onClick={isTop ? onWasteClick : undefined}
                >
                  <CardView
                    card={card}
                    selected={isTop && selectedFromWaste}
                  />
                </div>
              );
            })}
          </div>
        ) : topWaste ? (
          <CardView
            card={topWaste}
            selected={selectedFromWaste}
            onClick={onWasteClick}
          />
        ) : (
          <div className="waste-empty" />
        )}
      </div>
    </div>
  );
}
