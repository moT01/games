export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
export type Card = { suit: Suit; rank: Rank; faceUp: boolean };

export type GameState = {
  tableau: Card[][];
  foundations: Card[][];  // index order: hearts, diamonds, clubs, spades
  stock: Card[];
  waste: Card[];
  drawMode: 1 | 3;
  score: number;
  stockRecycles: number;
  autoCompleteAvailable: boolean;
};

export type MoveSource = 'waste' | 'tableau' | 'foundation';
export type MoveTarget = 'tableau' | 'foundation';
export type Move = {
  source: MoveSource;
  sourceIndex: number;
  cardIndex?: number;
  target: MoveTarget;
  targetIndex: number;
};

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const RANK_VALUES: Record<Rank, number> = {
  'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
  '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13,
};
const RED_SUITS: Set<Suit> = new Set(['hearts', 'diamonds']);

function isRed(suit: Suit): boolean {
  return RED_SUITS.has(suit);
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, faceUp: false });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealGame(drawMode: 1 | 3): GameState {
  const deck = shuffleDeck(createDeck());
  const tableau: Card[][] = [];
  let idx = 0;

  for (let col = 0; col < 7; col++) {
    const column: Card[] = [];
    for (let row = 0; row <= col; row++) {
      const card = { ...deck[idx++] };
      card.faceUp = row === col;
      column.push(card);
    }
    tableau.push(column);
  }

  const stock = deck.slice(idx).map(c => ({ ...c, faceUp: false }));

  return {
    tableau,
    foundations: [[], [], [], []],
    stock,
    waste: [],
    drawMode,
    score: 0,
    stockRecycles: 0,
    autoCompleteAvailable: false,
  };
}

export function canMoveToTableau(bottomCard: Card, targetColumn: Card[]): boolean {
  if (targetColumn.length === 0) {
    return bottomCard.rank === 'K';
  }
  const top = targetColumn[targetColumn.length - 1];
  if (!top.faceUp) return false;
  const rankDiff = RANK_VALUES[top.rank] - RANK_VALUES[bottomCard.rank];
  if (rankDiff !== 1) return false;
  return isRed(bottomCard.suit) !== isRed(top.suit);
}

export function canMoveToFoundation(card: Card, foundationPile: Card[]): boolean {
  if (foundationPile.length === 0) {
    return card.rank === 'A';
  }
  const top = foundationPile[foundationPile.length - 1];
  if (top.suit !== card.suit) return false;
  return RANK_VALUES[card.rank] === RANK_VALUES[top.rank] + 1;
}

export function canAutoComplete(state: GameState): boolean {
  if (state.stock.length !== 0) return false;
  for (const col of state.tableau) {
    for (const card of col) {
      if (!card.faceUp) return false;
    }
  }
  return true;
}

export function drawFromStock(state: GameState): GameState {
  if (state.stock.length === 0) return state;

  const count = Math.min(state.drawMode, state.stock.length);
  const newStock = [...state.stock];
  const drawn = newStock.splice(newStock.length - count, count);
  const newWaste = [...state.waste, ...drawn.map(c => ({ ...c, faceUp: true }))];

  const newState: GameState = {
    ...state,
    stock: newStock,
    waste: newWaste,
  };
  newState.autoCompleteAvailable = canAutoComplete(newState);
  return newState;
}

export function resetStock(state: GameState): GameState {
  const newStock = [...state.waste].reverse().map(c => ({ ...c, faceUp: false }));
  const newRecycles = state.stockRecycles + 1;

  let newScore = state.score;
  if (state.drawMode === 3 && state.stockRecycles >= 1) {
    newScore = Math.max(0, newScore - 20);
  }

  const newState: GameState = {
    ...state,
    stock: newStock,
    waste: [],
    stockRecycles: newRecycles,
    score: newScore,
  };
  newState.autoCompleteAvailable = canAutoComplete(newState);
  return newState;
}

export function applyMove(state: GameState, move: Move): GameState {
  let newState = deepCloneState(state);
  let scoreChange = 0;

  if (move.source === 'waste' && move.target === 'foundation') {
    const card = newState.waste[newState.waste.length - 1];
    if (!canMoveToFoundation(card, newState.foundations[move.targetIndex])) return state;
    newState.waste.pop();
    newState.foundations[move.targetIndex].push({ ...card, faceUp: true });
    scoreChange += 10;
  } else if (move.source === 'waste' && move.target === 'tableau') {
    const card = newState.waste[newState.waste.length - 1];
    if (!canMoveToTableau(card, newState.tableau[move.targetIndex])) return state;
    newState.waste.pop();
    newState.tableau[move.targetIndex].push({ ...card, faceUp: true });
    scoreChange += 5;
  } else if (move.source === 'tableau' && move.target === 'foundation') {
    const col = newState.tableau[move.sourceIndex];
    const cardIdx = move.cardIndex ?? col.length - 1;
    const card = col[cardIdx];
    if (!canMoveToFoundation(card, newState.foundations[move.targetIndex])) return state;
    col.splice(cardIdx, 1);
    newState.foundations[move.targetIndex].push({ ...card, faceUp: true });
    scoreChange += 10;
    // Flip newly exposed card
    if (col.length > 0 && !col[col.length - 1].faceUp) {
      col[col.length - 1].faceUp = true;
      scoreChange += 5;
    }
  } else if (move.source === 'tableau' && move.target === 'tableau') {
    const srcCol = newState.tableau[move.sourceIndex];
    const cardIdx = move.cardIndex ?? srcCol.length - 1;
    const movingStack = srcCol.splice(cardIdx);
    const bottomCard = movingStack[0];
    if (!canMoveToTableau(bottomCard, newState.tableau[move.targetIndex])) {
      // Restore and return original state
      srcCol.splice(cardIdx, 0, ...movingStack);
      return state;
    }
    newState.tableau[move.targetIndex].push(...movingStack);
    // Flip newly exposed card
    if (srcCol.length > 0 && !srcCol[srcCol.length - 1].faceUp) {
      srcCol[srcCol.length - 1].faceUp = true;
      scoreChange += 5;
    }
  } else if (move.source === 'foundation' && move.target === 'tableau') {
    const pile = newState.foundations[move.sourceIndex];
    const card = pile[pile.length - 1];
    if (!canMoveToTableau(card, newState.tableau[move.targetIndex])) return state;
    pile.pop();
    newState.tableau[move.targetIndex].push({ ...card, faceUp: true });
    scoreChange -= 15;
  }

  newState.score = Math.max(0, newState.score + scoreChange);
  newState.autoCompleteAvailable = canAutoComplete(newState);
  return newState;
}

export function checkWin(state: GameState): boolean {
  return state.foundations.every(pile => pile.length === 13);
}

export function calcTimeBonus(startTime: number, endTime: number): number {
  const seconds = Math.max(1, Math.floor((endTime - startTime) / 1000));
  return Math.floor(35000 / seconds);
}

function deepCloneState(state: GameState): GameState {
  return {
    ...state,
    tableau: state.tableau.map(col => col.map(c => ({ ...c }))),
    foundations: state.foundations.map(pile => pile.map(c => ({ ...c }))),
    stock: state.stock.map(c => ({ ...c })),
    waste: state.waste.map(c => ({ ...c })),
  };
}
