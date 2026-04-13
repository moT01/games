import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { App } from './App';

// All 13 scorecard category labels in order
const ALL_CATEGORIES = [
  'Ones', 'Twos', 'Threes', 'Fours', 'Fives', 'Sixes',
  '3 of a Kind', '4 of a Kind', 'Full House',
  'Sm. Straight', 'Lg. Straight', 'YAHTZEE', 'Chance',
];

function playFullGame() {
  for (const label of ALL_CATEGORIES) {
    fireEvent.click(screen.getByRole('button', { name: /Roll/i }));
    fireEvent.click(screen.getByText(label).closest('tr')!);
  }
}

describe('App', () => {
  it('initial render shows 5 dice and a Roll button', () => {
    render(<App />);
    expect(screen.getAllByRole('button', { name: /^Die/i })).toHaveLength(5);
    expect(screen.getByRole('button', { name: 'Roll (1/3)' })).toBeTruthy();
  });

  it('Roll button is enabled on first turn before rolling', () => {
    render(<App />);
    const btn = screen.getByRole('button', { name: 'Roll (1/3)' }) as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it('clicking Roll increments roll count label', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Roll (1/3)' }));
    expect(screen.getByRole('button', { name: 'Roll (2/3)' })).toBeTruthy();
  });

  it('after 3 rolls Roll button is disabled', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Roll (1/3)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Roll (2/3)' }));
    fireEvent.click(screen.getByRole('button', { name: /Roll \(3\/3/i }));
    const btn = screen.getByRole('button', { name: 'Must score' }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('clicking a die after rolling toggles its held appearance', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Roll (1/3)' }));
    const die = screen.getAllByRole('button', { name: /^Die/i })[0];
    fireEvent.click(die);
    expect(die.className).toContain('die--held');
  });

  it('clicking an unscored category after rolling assigns a score and advances the turn', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Roll (1/3)' }));
    fireEvent.click(screen.getByText('Chance').closest('tr')!);
    expect(screen.getByText('Turn 2 of 13')).toBeTruthy();
  });

  it('clicking an already-scored category does nothing', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Roll (1/3)' }));
    const row = screen.getByText('Chance').closest('tr')!;
    fireEvent.click(row); // score Chance — turn advances to 2

    fireEvent.click(screen.getByRole('button', { name: 'Roll (1/3)' }));
    fireEvent.click(row); // click locked row — no action
    expect(screen.getByText('Turn 2 of 13')).toBeTruthy(); // still turn 2
  });

  it('clicking Roll before rolling blocks scoring', () => {
    render(<App />);
    // Don't roll — click a category directly
    fireEvent.click(screen.getByText('Chance').closest('tr')!);
    expect(screen.getByText('Turn 1 of 13')).toBeTruthy();
  });

  it('after 13 turns GameOverScreen renders with final score', () => {
    render(<App />);
    playFullGame();
    expect(screen.getByText('Game Over')).toBeTruthy();
  });

  it('Play Again button resets the game to initial state', () => {
    render(<App />);
    playFullGame();
    fireEvent.click(screen.getByRole('button', { name: 'Play Again' }));
    expect(screen.getByRole('button', { name: 'Roll (1/3)' })).toBeTruthy();
    expect(screen.getByText('Turn 1 of 13')).toBeTruthy();
  });
});
