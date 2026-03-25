import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

// Mock gameLogic so we control state
vi.mock('./gameLogic', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./gameLogic')>();
  const baseState = actual.dealGame(1);
  const mockState = { ...baseState, autoCompleteAvailable: false };

  return {
    ...actual,
    dealGame: vi.fn(() => mockState),
    checkWin: vi.fn(() => false),
    canAutoComplete: vi.fn(() => false),
    drawFromStock: vi.fn((state) => {
      const card = { suit: 'hearts' as const, rank: 'A' as const, faceUp: true };
      return { ...state, waste: [...state.waste, card] };
    }),
    resetStock: vi.fn((state) => ({ ...state, stockRecycles: state.stockRecycles + 1 })),
    applyMove: vi.fn((state) => state),
    calcTimeBonus: vi.fn(() => 100),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

function startGame() {
  render(<App />);
  fireEvent.click(screen.getByText('New Game'));
}

function drawCard() {
  const stockPile = document.querySelector('.stock-pile');
  if (stockPile) fireEvent.click(stockPile);
}

function selectWasteCard() {
  // The waste card is a .card element inside .waste-pile
  const wasteCard = document.querySelector('.waste-pile .card');
  if (wasteCard) fireEvent.click(wasteCard);
}

function clickFoundation(index: number) {
  const foundations = document.querySelectorAll('.foundation-pile');
  if (foundations[index]) fireEvent.click(foundations[index]);
}

describe('App', () => {
  it('renders setup screen initially', () => {
    render(<App />);
    expect(screen.getByText('Solitaire')).toBeTruthy();
    expect(screen.getByText('New Game')).toBeTruthy();
  });

  it('selecting draw mode and clicking New Game transitions to game screen', () => {
    render(<App />);
    fireEvent.click(screen.getByText('New Game'));
    expect(screen.getByText(/Score/i)).toBeTruthy();
  });

  it('clicking stock pile adds card(s) to waste', async () => {
    const { drawFromStock } = await import('./gameLogic');
    startGame();
    drawCard();
    expect(drawFromStock).toHaveBeenCalled();
  });

  it('win screen appears when checkWin returns true after a move', async () => {
    const gameLogic = await import('./gameLogic');
    vi.mocked(gameLogic.checkWin).mockReturnValue(true);

    startGame();
    drawCard();
    selectWasteCard();
    clickFoundation(0);

    expect(screen.getByText('You Win!')).toBeTruthy();
  });

  it('win screen shows correct session tally after win', async () => {
    const gameLogic = await import('./gameLogic');
    vi.mocked(gameLogic.checkWin).mockReturnValue(true);

    startGame();
    drawCard();
    selectWasteCard();
    clickFoundation(0);

    expect(screen.getByText('W–L: 1–0')).toBeTruthy();
  });

  it('"Play Again" on win screen returns to setup screen', async () => {
    const gameLogic = await import('./gameLogic');
    vi.mocked(gameLogic.checkWin).mockReturnValue(true);

    startGame();
    drawCard();
    selectWasteCard();
    clickFoundation(0);

    fireEvent.click(screen.getByText('Play Again'));

    expect(screen.getByText('Solitaire')).toBeTruthy();
    expect(screen.getByText('New Game')).toBeTruthy();
  });

  it('auto-complete button renders when gameState.autoCompleteAvailable is true', async () => {
    const gameLogic = await import('./gameLogic');
    const baseState = gameLogic.dealGame(1);
    vi.mocked(gameLogic.dealGame).mockReturnValue({ ...baseState, autoCompleteAvailable: true });

    render(<App />);
    fireEvent.click(screen.getByText('New Game'));

    expect(screen.getByText('Auto-Complete')).toBeTruthy();
  });

  it('clicking auto-complete button steps cards to foundations via setInterval', async () => {
    vi.useFakeTimers();
    const gameLogic = await import('./gameLogic');

    const aceH = { suit: 'hearts' as const, rank: 'A' as const, faceUp: true };
    const autoState = {
      ...gameLogic.dealGame(1),
      autoCompleteAvailable: true,
      stock: [] as typeof aceH[],
      waste: [aceH],
      tableau: Array.from({ length: 7 }, () => [] as typeof aceH[]),
      foundations: [[], [], [], []] as typeof aceH[][],
      score: 0,
      stockRecycles: 0,
      drawMode: 1 as const,
    };
    vi.mocked(gameLogic.dealGame).mockReturnValue(autoState);

    const afterMove = { ...autoState, waste: [], foundations: [[aceH], [], [], []] };
    vi.mocked(gameLogic.applyMove).mockReturnValueOnce(afterMove);
    vi.mocked(gameLogic.checkWin).mockReturnValueOnce(false).mockReturnValue(true);

    render(<App />);
    fireEvent.click(screen.getByText('New Game'));
    fireEvent.click(screen.getByText('Auto-Complete'));

    vi.advanceTimersByTime(50);

    expect(gameLogic.applyMove).toHaveBeenCalled();

    vi.useRealTimers();
  });
});
