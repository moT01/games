import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

// 4x4 board: blank at index 10 (row 2, col 2).
// Adjacent tiles: 6 (tile 7), 14 (tile 15), 9 (tile 10), 11 (tile 12).
// None of these moves produce the solved board, so a single click stays unresolved.
const MOCK_4X4 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 0, 12, 13, 14, 15, 11];

// 3x3 board: blank at index 7, tile 8 at index 8.
// Clicking tile 8 solves the puzzle in one move.
const NEAR_SOLVED_3X3 = [1, 2, 3, 4, 5, 6, 7, 0, 8];

vi.mock('./gameLogic', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./gameLogic')>();
  return {
    ...actual,
    shuffleBoard: vi.fn((_tiles: number[], n: number) => {
      if (n === 3) return NEAR_SOLVED_3X3.slice();
      return MOCK_4X4.slice();
    }),
  };
});

beforeEach(() => {
  localStorage.clear();
});

function renderApp() {
  return render(<App />);
}

describe('Home screen', () => {
  it('renders mode select buttons and Play button', () => {
    renderApp();
    // Mode buttons appear in the button group; score labels also show mode names.
    // Use getAllByText and check that at least one result exists.
    expect(screen.getAllByText('3x3').length).toBeGreaterThan(0);
    expect(screen.getAllByText('4x4').length).toBeGreaterThan(0);
    expect(screen.getAllByText('5x5').length).toBeGreaterThan(0);
    expect(screen.getByText('Play')).toBeTruthy();
  });
});

describe('Mode selection and Play', () => {
  it('selecting 3x3 and clicking Play transitions to Play screen', () => {
    renderApp();
    // Click the 3x3 mode button (first occurrence is the button)
    fireEvent.click(screen.getAllByText('3x3')[0]);
    fireEvent.click(screen.getByText('Play'));
    expect(screen.getByText('New Game')).toBeTruthy();
  });

  it('Play screen renders correct number of tiles for 3x3 (9 cells)', () => {
    renderApp();
    fireEvent.click(screen.getAllByText('3x3')[0]);
    fireEvent.click(screen.getByText('Play'));
    const tiles = document.querySelectorAll('.tile');
    expect(tiles.length).toBe(9);
  });

  it('Play screen renders correct number of tiles for 4x4 (16 cells)', () => {
    renderApp();
    fireEvent.click(screen.getByText('Play'));
    const tiles = document.querySelectorAll('.tile');
    expect(tiles.length).toBe(16);
  });
});

describe('Tile interaction', () => {
  it('clicking a valid adjacent tile increments move counter', () => {
    renderApp();
    fireEvent.click(screen.getByText('Play'));

    // MOCK_4X4: blank at index 10. Tile 12 is at index 11 (adjacent, to the right).
    // Find the move counter (it shows "0" before the first move).
    const movesStat = screen.getByText('Moves').closest('.play-screen__stat');
    expect(movesStat?.querySelector('.play-screen__stat-value')?.textContent).toBe('0');

    fireEvent.click(screen.getByLabelText('Tile 12'));

    expect(movesStat?.querySelector('.play-screen__stat-value')?.textContent).toBe('1');
  });

  it('clicking an invalid non-adjacent tile does not change board or move count', () => {
    renderApp();
    fireEvent.click(screen.getByText('Play'));

    // Tile 1 is at index 0, blank at index 10 — not adjacent
    fireEvent.click(screen.getByLabelText('Tile 1'));

    const movesStat = screen.getByText('Moves').closest('.play-screen__stat');
    expect(movesStat?.querySelector('.play-screen__stat-value')?.textContent).toBe('0');
  });
});

describe('Win state', () => {
  it('win modal appears when puzzle is solved with correct move count', () => {
    // 3x3 near-solved: click tile 8 to solve
    renderApp();
    fireEvent.click(screen.getAllByText('3x3')[0]);
    fireEvent.click(screen.getByText('Play'));

    fireEvent.click(screen.getByLabelText('Tile 8'));

    expect(screen.getByText('Puzzle Solved!')).toBeTruthy();
    // Move count in win modal (win-modal__stat-value shows "1")
    const winStatValues = document.querySelectorAll('.win-modal__stat-value');
    expect(winStatValues[0]?.textContent).toBe('1');
  });

  it('"Play Again" in win modal starts a new game in the same mode', () => {
    renderApp();
    fireEvent.click(screen.getAllByText('3x3')[0]);
    fireEvent.click(screen.getByText('Play'));

    fireEvent.click(screen.getByLabelText('Tile 8'));
    expect(screen.getByText('Puzzle Solved!')).toBeTruthy();

    fireEvent.click(screen.getByText('Play Again'));
    expect(screen.queryByText('Puzzle Solved!')).toBeNull();
    expect(screen.getByText('New Game')).toBeTruthy();
  });
});

describe('ConfirmModal — Home button', () => {
  it('"Home" button during active game shows ConfirmModal', () => {
    renderApp();
    fireEvent.click(screen.getByText('Play'));

    // Make one move (tile 12 is adjacent to blank at index 10)
    fireEvent.click(screen.getByLabelText('Tile 12'));

    fireEvent.click(screen.getByLabelText('Home'));
    expect(screen.getByText(/Are you sure/i)).toBeTruthy();
  });

  it('confirming the modal returns to Home screen', () => {
    renderApp();
    fireEvent.click(screen.getByText('Play'));
    fireEvent.click(screen.getByLabelText('Tile 12'));
    fireEvent.click(screen.getByLabelText('Home'));

    fireEvent.click(screen.getByText('Yes'));
    expect(screen.getByText('Play')).toBeTruthy();
    expect(screen.queryByText('New Game')).toBeNull();
  });

  it('cancelling the modal dismisses it and stays on Play screen', () => {
    renderApp();
    fireEvent.click(screen.getByText('Play'));
    fireEvent.click(screen.getByLabelText('Tile 12'));
    fireEvent.click(screen.getByLabelText('Home'));

    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText(/Are you sure/i)).toBeNull();
    expect(screen.getByText('New Game')).toBeTruthy();
  });
});

describe('ConfirmModal — New Game button', () => {
  it('"New Game" during active game shows ConfirmModal', () => {
    renderApp();
    fireEvent.click(screen.getByText('Play'));
    fireEvent.click(screen.getByLabelText('Tile 12'));

    fireEvent.click(screen.getByText('New Game'));
    expect(screen.getByText(/Are you sure/i)).toBeTruthy();
  });
});

describe('Theme toggle', () => {
  it('theme toggle updates data-theme attribute and persists to localStorage', () => {
    renderApp();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    fireEvent.click(screen.getByLabelText('Toggle theme'));

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('number-tiles:theme')).toBe('light');
  });
});

describe('Help modal', () => {
  it('Help modal opens on "?" click and closes on close button click', () => {
    renderApp();
    fireEvent.click(screen.getByLabelText('Help'));

    expect(screen.getByText('How to Play')).toBeTruthy();

    fireEvent.click(screen.getByLabelText('Close help'));
    expect(screen.queryByText('How to Play')).toBeNull();
  });
});
