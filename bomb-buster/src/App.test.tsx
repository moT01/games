import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import * as gameLogic from './gameLogic';
import type { Cell } from './gameLogic';

// Mock only placeBombs; all other exports remain real implementations
vi.mock('./gameLogic', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./gameLogic')>();
  return { ...actual, placeBombs: vi.fn() };
});

// Build a board with bombs at the given indices and correct adjacentCounts
function makeMockBoard(rows: number, cols: number, bombIndices: number[]): Cell[] {
  const bombSet = new Set(bombIndices);
  const cells: Cell[] = Array.from({ length: rows * cols }, (_, i) => ({
    isBomb: bombSet.has(i),
    isRevealed: false,
    isFlagged: false,
    adjacentCount: 0,
  }));
  return gameLogic.calculateAdjacentCounts(cells, rows, cols);
}

beforeEach(() => {
  // Default: 9×9 board with one bomb at cell 0; safeIndex is intentionally ignored by mock
  vi.mocked(gameLogic.placeBombs).mockImplementation((cells, rows, cols) =>
    makeMockBoard(rows, cols, [0])
  );
});

// Renders App and clicks the first difficulty button (Protocol 1 / Beginner)
async function startBeginner() {
  const user = userEvent.setup();
  const result = render(<App />);
  await user.click(screen.getByRole('button', { name: /protocol 1/i }));
  return { ...result, user };
}

describe('App', () => {
  it('renders difficulty select screen on initial load', () => {
    render(<App />);
    expect(screen.queryByText('Cyber Sweeper')).not.toBeNull();
    expect(screen.getByRole('button', { name: /protocol 1/i })).toBeTruthy();
  });

  it('clicking a difficulty button transitions to the game board', async () => {
    await startBeginner();
    expect(screen.queryByText('Cyber Sweeper')).toBeNull();
    expect(screen.getByTitle('Reset System')).toBeTruthy();
  });

  it('mine counter shows correct initial value (bombs count)', async () => {
    const { container } = await startBeginner();
    const minesLcd = container.querySelector('.game-board__mines');
    expect(minesLcd?.textContent).toBe('010');
  });

  it('right-clicking a cell places a flag and decrements the mine counter', async () => {
    const { container } = await startBeginner();
    const cells = container.querySelectorAll('.board-cell');
    fireEvent.contextMenu(cells[1]); // right-click a safe cell (not index 0)
    const minesLcd = container.querySelector('.game-board__mines');
    expect(minesLcd?.textContent).toBe('009');
  });

  it('right-clicking a flagged cell removes the flag and increments the mine counter', async () => {
    const { container } = await startBeginner();
    const cells = container.querySelectorAll('.board-cell');
    fireEvent.contextMenu(cells[1]); // place flag
    fireEvent.contextMenu(cells[1]); // remove flag
    const minesLcd = container.querySelector('.game-board__mines');
    expect(minesLcd?.textContent).toBe('010');
  });

  it('left-clicking a flagged cell does nothing', async () => {
    const { container, user } = await startBeginner();
    const cells = container.querySelectorAll('.board-cell');
    fireEvent.contextMenu(cells[1]); // flag cell 1
    await user.click(cells[1]);     // left-click — should do nothing
    const minesLcd = container.querySelector('.game-board__mines');
    // Flag is still there, mine counter still decremented
    expect(minesLcd?.textContent).toBe('009');
  });

  it('clicking a bomb shows the loss overlay', async () => {
    const { container, user } = await startBeginner();
    // Mock places bomb at index 0; click that cell to trigger loss
    const cells = container.querySelectorAll('.board-cell');
    await user.click(cells[0]);
    expect(screen.getByText('Critical Failure')).toBeTruthy();
  });

  it('revealing all safe cells shows the win overlay', async () => {
    const { container, user } = await startBeginner();
    // Mock: bomb only at index 0. Clicking cell 80 (bottom-right) cascades
    // through all 0-adjacent cells and reveals all 80 safe cells → win.
    const cells = container.querySelectorAll('.board-cell');
    await user.click(cells[80]);
    expect(screen.getByText('System Purged')).toBeTruthy();
  });

  it('reset button starts a new game', async () => {
    const { container, user } = await startBeginner();
    // Lose the game first
    const cells = container.querySelectorAll('.board-cell');
    await user.click(cells[0]);
    expect(screen.getByText('Critical Failure')).toBeTruthy();

    // Click the reset (smiley) button
    await user.click(screen.getByTitle('Reset System'));
    // Overlay gone, mine counter reset to initial value
    expect(screen.queryByText('Critical Failure')).toBeNull();
    const minesLcd = container.querySelector('.game-board__mines');
    expect(minesLcd?.textContent).toBe('010');
  });

  it('"Change Difficulty" from end screen returns to difficulty select', async () => {
    const { container, user } = await startBeginner();
    // Lose the game
    const cells = container.querySelectorAll('.board-cell');
    await user.click(cells[0]);
    expect(screen.getByText('Critical Failure')).toBeTruthy();

    // Click "Change Difficulty"
    await user.click(screen.getByRole('button', { name: /abort mission/i }));
    expect(screen.queryByText('Cyber Sweeper')).not.toBeNull();
  });
});
