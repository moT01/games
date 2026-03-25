import { describe, it, expect } from 'vitest';
import {
  createDeck,
  shuffleDeck,
  dealGame,
  canMoveToTableau,
  canMoveToFoundation,
  drawFromStock,
  resetStock,
  checkWin,
  applyMove,
  canAutoComplete,
} from './gameLogic';
import type { Card, GameState } from './gameLogic';

describe('createDeck', () => {
  it('returns exactly 52 unique cards', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);
    const keys = new Set(deck.map(c => `${c.suit}-${c.rank}`));
    expect(keys.size).toBe(52);
  });
});

describe('shuffleDeck', () => {
  it('returns all 52 cards with no duplicates or missing cards', () => {
    const deck = createDeck();
    const shuffled = shuffleDeck(deck);
    expect(shuffled).toHaveLength(52);
    const keys = new Set(shuffled.map(c => `${c.suit}-${c.rank}`));
    expect(keys.size).toBe(52);
  });
});

describe('dealGame', () => {
  it('produces correct pile sizes: tableau cols have 1-7 cards, stock has 24 cards, foundations and waste are empty', () => {
    const state = dealGame(1);
    expect(state.tableau).toHaveLength(7);
    for (let i = 0; i < 7; i++) {
      expect(state.tableau[i]).toHaveLength(i + 1);
    }
    expect(state.stock).toHaveLength(24);
    expect(state.foundations).toHaveLength(4);
    for (const f of state.foundations) expect(f).toHaveLength(0);
    expect(state.waste).toHaveLength(0);
  });

  it('produces bottom card face-up and rest face-down in each tableau column', () => {
    const state = dealGame(1);
    for (const col of state.tableau) {
      for (let i = 0; i < col.length - 1; i++) {
        expect(col[i].faceUp).toBe(false);
      }
      expect(col[col.length - 1].faceUp).toBe(true);
    }
  });
});

describe('canMoveToTableau', () => {
  it('valid: red 6 onto black 7', () => {
    const red6: Card = { suit: 'hearts', rank: '6', faceUp: true };
    const black7: Card = { suit: 'spades', rank: '7', faceUp: true };
    expect(canMoveToTableau(red6, [black7])).toBe(true);
  });

  it('valid: King onto empty column', () => {
    const king: Card = { suit: 'spades', rank: 'K', faceUp: true };
    expect(canMoveToTableau(king, [])).toBe(true);
  });

  it('invalid: same color', () => {
    const red6: Card = { suit: 'hearts', rank: '6', faceUp: true };
    const red7: Card = { suit: 'diamonds', rank: '7', faceUp: true };
    expect(canMoveToTableau(red6, [red7])).toBe(false);
  });

  it('invalid: wrong rank difference', () => {
    const red5: Card = { suit: 'hearts', rank: '5', faceUp: true };
    const black7: Card = { suit: 'spades', rank: '7', faceUp: true };
    expect(canMoveToTableau(red5, [black7])).toBe(false);
  });

  it('invalid: face-down target top card', () => {
    const red6: Card = { suit: 'hearts', rank: '6', faceUp: true };
    const black7: Card = { suit: 'spades', rank: '7', faceUp: false };
    expect(canMoveToTableau(red6, [black7])).toBe(false);
  });

  it('invalid: non-King onto empty column', () => {
    const queen: Card = { suit: 'hearts', rank: 'Q', faceUp: true };
    expect(canMoveToTableau(queen, [])).toBe(false);
  });
});

describe('canMoveToFoundation', () => {
  it('valid: Ace to empty foundation', () => {
    const ace: Card = { suit: 'hearts', rank: 'A', faceUp: true };
    expect(canMoveToFoundation(ace, [])).toBe(true);
  });

  it('valid: 2♥ onto A♥', () => {
    const aceH: Card = { suit: 'hearts', rank: 'A', faceUp: true };
    const two: Card = { suit: 'hearts', rank: '2', faceUp: true };
    expect(canMoveToFoundation(two, [aceH])).toBe(true);
  });

  it('invalid: wrong suit', () => {
    const aceH: Card = { suit: 'hearts', rank: 'A', faceUp: true };
    const twoS: Card = { suit: 'spades', rank: '2', faceUp: true };
    expect(canMoveToFoundation(twoS, [aceH])).toBe(false);
  });

  it('invalid: non-Ace to empty foundation', () => {
    const two: Card = { suit: 'hearts', rank: '2', faceUp: true };
    expect(canMoveToFoundation(two, [])).toBe(false);
  });

  it('invalid: out-of-sequence rank', () => {
    const aceH: Card = { suit: 'hearts', rank: 'A', faceUp: true };
    const three: Card = { suit: 'hearts', rank: '3', faceUp: true };
    expect(canMoveToFoundation(three, [aceH])).toBe(false);
  });
});

describe('drawFromStock', () => {
  it('draw-1: moves exactly 1 card from stock to waste face-up', () => {
    const state = dealGame(1);
    const stockLen = state.stock.length;
    const newState = drawFromStock(state);
    expect(newState.stock).toHaveLength(stockLen - 1);
    expect(newState.waste).toHaveLength(1);
    expect(newState.waste[0].faceUp).toBe(true);
  });

  it('draw-3: moves up to 3 cards from stock to waste face-up', () => {
    const state = dealGame(3);
    const stockLen = state.stock.length;
    const newState = drawFromStock(state);
    expect(newState.stock).toHaveLength(stockLen - 3);
    expect(newState.waste).toHaveLength(3);
    for (const c of newState.waste) expect(c.faceUp).toBe(true);
  });

  it('updates autoCompleteAvailable', () => {
    const state = dealGame(1);
    const newState = drawFromStock(state);
    // stock not empty yet, all tableau not face-up → false
    expect(newState.autoCompleteAvailable).toBe(false);
  });
});

describe('resetStock', () => {
  it('waste returns to stock face-down and stockRecycles increments', () => {
    let state = dealGame(1);
    state = drawFromStock(state);
    const wasteLen = state.waste.length;
    const newState = resetStock(state);
    expect(newState.waste).toHaveLength(0);
    expect(newState.stock).toHaveLength(wasteLen);
    for (const c of newState.stock) expect(c.faceUp).toBe(false);
    expect(newState.stockRecycles).toBe(1);
  });

  it('draw-3 penalty: score decreases by 20 when stockRecycles >= 1', () => {
    let state = dealGame(3);
    state = { ...state, score: 100, stockRecycles: 1 };
    const newState = resetStock(state);
    expect(newState.score).toBe(80);
  });

  it('draw-3 no penalty on first recycle (stockRecycles === 0)', () => {
    let state = dealGame(3);
    state = { ...state, score: 100, stockRecycles: 0 };
    const newState = resetStock(state);
    expect(newState.score).toBe(100);
  });

  it('updates autoCompleteAvailable', () => {
    let state = dealGame(1);
    state = drawFromStock(state);
    const newState = resetStock(state);
    expect(typeof newState.autoCompleteAvailable).toBe('boolean');
  });
});

describe('checkWin', () => {
  it('returns true only when all 4 foundations each have 13 cards', () => {
    const fullPile: Card[] = Array.from({ length: 13 }, (_, i) => ({
      suit: 'hearts',
      rank: 'A',
      faceUp: true,
    }));
    const state = dealGame(1);
    const wonState: GameState = {
      ...state,
      foundations: [fullPile, [...fullPile], [...fullPile], [...fullPile]],
    };
    expect(checkWin(wonState)).toBe(true);
  });

  it('returns false when foundations are not full', () => {
    const state = dealGame(1);
    expect(checkWin(state)).toBe(false);
  });
});

describe('applyMove scoring', () => {
  function makeStateWithWasteCard(): GameState {
    const state = dealGame(1);
    const wasteCard: Card = { suit: 'hearts', rank: 'A', faceUp: true };
    return { ...state, waste: [wasteCard] };
  }

  it('awards +10 when moving waste card to foundation', () => {
    const state = makeStateWithWasteCard();
    const newState = applyMove(state, {
      source: 'waste', sourceIndex: 0, target: 'foundation', targetIndex: 0,
    });
    expect(newState.score).toBe(10);
  });

  it('awards +5 when moving waste card to tableau', () => {
    const state = dealGame(1);
    // Put a King face-up in waste, then move it to an empty tableau column
    const king: Card = { suit: 'hearts', rank: 'K', faceUp: true };
    const stateWithWaste = { ...state, waste: [king] };
    // Find an empty tableau col — create one artificially
    const emptyCol = 6;
    const modifiedTableau = stateWithWaste.tableau.map((col, i) => i === emptyCol ? [] : col);
    const s = { ...stateWithWaste, tableau: modifiedTableau };
    const newState = applyMove(s, {
      source: 'waste', sourceIndex: 0, target: 'tableau', targetIndex: emptyCol,
    });
    expect(newState.score).toBe(5);
  });

  it('awards +5 when flipping a tableau card', () => {
    const state = dealGame(1);
    // tableau[1] has 2 cards: index 0 face-down, index 1 face-up
    // Move the face-up card to foundation if it's an Ace, or to another column
    // Simpler: construct a state where a tableau move exposes a face-down card
    const faceDown: Card = { suit: 'clubs', rank: '3', faceUp: false };
    const faceUp: Card = { suit: 'hearts', rank: 'A', faceUp: true };
    const targetCol: Card[] = [{ suit: 'spades', rank: '2', faceUp: true }];
    // Not a valid tableau move; use foundation move instead to expose faceDown
    const modState: GameState = {
      ...state,
      tableau: [[faceDown, faceUp], ...state.tableau.slice(1)],
      foundations: [[], [], [], []],
    };
    const newState = applyMove(modState, {
      source: 'tableau', sourceIndex: 0, cardIndex: 1, target: 'foundation', targetIndex: 0,
    });
    // +10 for foundation move, +5 for flipping faceDown
    expect(newState.score).toBe(15);
    expect(newState.tableau[0][0].faceUp).toBe(true);
  });

  it('deducts -15 when moving foundation card back to tableau', () => {
    const state = dealGame(1);
    const aceH: Card = { suit: 'hearts', rank: 'A', faceUp: true };
    const twoH: Card = { suit: 'hearts', rank: '2', faceUp: true };
    // Put A♥ and 2♥ in foundation 0; put 3♠ in tableau col 0 so A♥ can't go but 2♥→tableau
    // Actually: move A♥ back to empty tableau col
    // For -15: need a card in foundation that can go to a tableau col
    // Put A♥ in foundation and a black 2 on top of an otherwise empty tableau col
    const black2: Card = { suit: 'spades', rank: '2', faceUp: true };
    const modState: GameState = {
      ...state,
      score: 20,
      foundations: [[aceH], [], [], []],
      tableau: [[black2], ...state.tableau.slice(1)],
    };
    const newState = applyMove(modState, {
      source: 'foundation', sourceIndex: 0, target: 'tableau', targetIndex: 0,
    });
    expect(newState.score).toBe(5); // 20 - 15
  });

  it('score never goes below 0', () => {
    const state = dealGame(1);
    const aceH: Card = { suit: 'hearts', rank: 'A', faceUp: true };
    const black2: Card = { suit: 'spades', rank: '2', faceUp: true };
    const modState: GameState = {
      ...state,
      score: 0,
      foundations: [[aceH], [], [], []],
      tableau: [[black2], ...state.tableau.slice(1)],
    };
    const newState = applyMove(modState, {
      source: 'foundation', sourceIndex: 0, target: 'tableau', targetIndex: 0,
    });
    expect(newState.score).toBe(0);
  });
});

describe('canAutoComplete', () => {
  it('returns true when stock is empty and all tableau cards are face-up', () => {
    const state = dealGame(1);
    const allFaceUp = state.tableau.map(col => col.map(c => ({ ...c, faceUp: true })));
    const modState: GameState = { ...state, stock: [], tableau: allFaceUp };
    expect(canAutoComplete(modState)).toBe(true);
  });

  it('returns false when stock has cards', () => {
    const state = dealGame(1);
    const allFaceUp = state.tableau.map(col => col.map(c => ({ ...c, faceUp: true })));
    const modState: GameState = { ...state, tableau: allFaceUp }; // stock still has cards
    expect(canAutoComplete(modState)).toBe(false);
  });

  it('returns false when tableau has face-down cards', () => {
    const state = dealGame(1);
    const modState: GameState = { ...state, stock: [] }; // tableau still has face-down cards
    expect(canAutoComplete(modState)).toBe(false);
  });

  it('returns true even when waste pile has cards', () => {
    const state = dealGame(1);
    const allFaceUp = state.tableau.map(col => col.map(c => ({ ...c, faceUp: true })));
    const wasteCard: Card = { suit: 'clubs', rank: '5', faceUp: true };
    const modState: GameState = { ...state, stock: [], tableau: allFaceUp, waste: [wasteCard] };
    expect(canAutoComplete(modState)).toBe(true);
  });
});
