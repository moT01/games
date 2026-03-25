import './GameBoard.css';
import type { GameState, Move } from '../gameLogic';
import { canMoveToFoundation, canMoveToTableau } from '../gameLogic';
import { StockPile } from './StockPile';
import { FoundationPile } from './FoundationPile';
import { TableauColumn } from './TableauColumn';
import { useState } from 'react';

type Selection =
  | { source: 'waste' }
  | { source: 'tableau'; colIndex: number; cardIndex: number }
  | { source: 'foundation'; pileIndex: number };

type Props = {
  gameState: GameState;
  onMove: (move: Move) => void;
  onDraw: () => void;
  onResetStock: () => void;
  onAutoComplete: () => void;
};

export function GameBoard({ gameState, onMove, onDraw, onResetStock, onAutoComplete }: Props) {
  const [selection, setSelection] = useState<Selection | null>(null);

  const clearSelection = () => setSelection(null);

  const getSelectedCard = () => {
    if (!selection) return null;
    if (selection.source === 'waste') {
      return gameState.waste[gameState.waste.length - 1] ?? null;
    }
    if (selection.source === 'tableau') {
      return gameState.tableau[selection.colIndex][selection.cardIndex] ?? null;
    }
    if (selection.source === 'foundation') {
      const pile = gameState.foundations[selection.pileIndex];
      return pile[pile.length - 1] ?? null;
    }
    return null;
  };

  const getSelectedBottomCard = () => getSelectedCard();

  // Determine which foundations are valid targets
  const foundationTargets = (foundationIndex: number): boolean => {
    if (!selection) return false;
    const card = getSelectedCard();
    if (!card) return false;
    // Only single cards can go to foundation (waste, foundation top, tableau top)
    if (selection.source === 'tableau') {
      const col = gameState.tableau[(selection as { source: 'tableau'; colIndex: number; cardIndex: number }).colIndex];
      if ((selection as { source: 'tableau'; colIndex: number; cardIndex: number }).cardIndex !== col.length - 1) return false;
    }
    return canMoveToFoundation(card, gameState.foundations[foundationIndex]);
  };

  // Determine which tableau columns are valid targets
  const tableauTargets = (colIndex: number): boolean => {
    if (!selection) return false;
    const bottomCard = getSelectedBottomCard();
    if (!bottomCard) return false;
    return canMoveToTableau(bottomCard, gameState.tableau[colIndex]);
  };

  const handleStockClick = () => {
    clearSelection();
    if (gameState.stock.length === 0) {
      onResetStock();
    } else {
      onDraw();
    }
  };

  const handleWasteClick = () => {
    if (gameState.waste.length === 0) return;
    if (selection?.source === 'waste') {
      clearSelection();
      return;
    }
    setSelection({ source: 'waste' });
  };

  const handleFoundationClick = (pileIndex: number) => {
    // If something is selected, try to move it to this foundation
    if (selection) {
      if (foundationTargets(pileIndex)) {
        const move: Move = {
          source: selection.source,
          sourceIndex:
            selection.source === 'waste' ? 0
            : selection.source === 'foundation' ? (selection as { source: 'foundation'; pileIndex: number }).pileIndex
            : (selection as { source: 'tableau'; colIndex: number; cardIndex: number }).colIndex,
          cardIndex:
            selection.source === 'tableau'
              ? (selection as { source: 'tableau'; colIndex: number; cardIndex: number }).cardIndex
              : undefined,
          target: 'foundation',
          targetIndex: pileIndex,
        };
        onMove(move);
        clearSelection();
        return;
      }
      clearSelection();
      return;
    }
    // Select foundation top card
    const pile = gameState.foundations[pileIndex];
    if (pile.length > 0) {
      setSelection({ source: 'foundation', pileIndex });
    }
  };

  const handleTableauCardClick = (colIndex: number, cardIndex: number) => {
    const card = gameState.tableau[colIndex][cardIndex];
    if (!card.faceUp) {
      clearSelection();
      return;
    }

    // If something is selected, try to move to this column
    if (selection) {
      if (tableauTargets(colIndex)) {
        const move: Move = {
          source: selection.source,
          sourceIndex:
            selection.source === 'waste' ? 0
            : selection.source === 'foundation' ? (selection as { source: 'foundation'; pileIndex: number }).pileIndex
            : (selection as { source: 'tableau'; colIndex: number; cardIndex: number }).colIndex,
          cardIndex:
            selection.source === 'tableau'
              ? (selection as { source: 'tableau'; colIndex: number; cardIndex: number }).cardIndex
              : undefined,
          target: 'tableau',
          targetIndex: colIndex,
        };
        onMove(move);
        clearSelection();
        return;
      }
      // If clicking within the same selection or invalid target, deselect and re-select if face-up
      clearSelection();
    }

    setSelection({ source: 'tableau', colIndex, cardIndex });
  };

  const handleTableauColumnClick = (colIndex: number) => {
    // Click on empty column
    if (!selection) return;
    if (tableauTargets(colIndex)) {
      const move: Move = {
        source: selection.source,
        sourceIndex:
          selection.source === 'waste' ? 0
          : selection.source === 'foundation' ? (selection as { source: 'foundation'; pileIndex: number }).pileIndex
          : (selection as { source: 'tableau'; colIndex: number; cardIndex: number }).colIndex,
        cardIndex:
          selection.source === 'tableau'
            ? (selection as { source: 'tableau'; colIndex: number; cardIndex: number }).cardIndex
            : undefined,
        target: 'tableau',
        targetIndex: colIndex,
      };
      onMove(move);
    }
    clearSelection();
  };

  return (
    <div className="game-board">
      {/* Top row: stock/waste + spacer + foundations */}
      <div className="board-top-row">
        <StockPile
          stock={gameState.stock}
          waste={gameState.waste}
          drawMode={gameState.drawMode}
          selectedFromWaste={selection?.source === 'waste'}
          onStockClick={handleStockClick}
          onWasteClick={handleWasteClick}
        />
        <div className="board-spacer" />
        <div className="foundations-row">
          {gameState.foundations.map((pile, i) => (
            <FoundationPile
              key={i}
              cards={pile}
              pileIndex={i}
              isTarget={foundationTargets(i)}
              onClick={() => handleFoundationClick(i)}
            />
          ))}
        </div>
      </div>

      {/* Auto-complete button */}
      {gameState.autoCompleteAvailable && (
        <button className="btn btn-primary auto-complete-btn" onClick={onAutoComplete}>
          Auto-Complete
        </button>
      )}

      {/* Tableau */}
      <div className="tableau-row">
        {gameState.tableau.map((col, i) => {
          const sel = selection?.source === 'tableau'
            && (selection as { source: 'tableau'; colIndex: number; cardIndex: number }).colIndex === i
            ? (selection as { source: 'tableau'; colIndex: number; cardIndex: number }).cardIndex
            : null;
          return (
            <TableauColumn
              key={i}
              cards={col}
              columnIndex={i}
              selectedCardIndex={sel}
              isTarget={tableauTargets(i)}
              onCardClick={(cardIndex) => handleTableauCardClick(i, cardIndex)}
              onColumnClick={() => handleTableauColumnClick(i)}
            />
          );
        })}
      </div>
    </div>
  );
}
