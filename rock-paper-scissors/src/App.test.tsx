import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import * as gameLogic from './gameLogic';

// Control the computer's choice in tests
const mockGetComputerChoice = vi.spyOn(gameLogic, 'getComputerChoice');

beforeEach(() => {
  vi.clearAllMocks();
  // Default: computer always picks scissors so player wins with rock
  mockGetComputerChoice.mockReturnValue('scissors');
});


describe('App', () => {
  it('renders mode select screen on initial load', () => {
    render(<App />);
    expect(screen.getByText('Choose a Mode')).toBeTruthy();
    expect(screen.getByText('Free Play')).toBeTruthy();
    expect(screen.getByText('Best of 3')).toBeTruthy();
    expect(screen.getByText('Best of 5')).toBeTruthy();
  });

  it('clicking Best of 3 transitions to the game screen', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByText('Best of 3'));
    // Game screen shows choice buttons
    expect(screen.getByRole('button', { name: /rock/i })).toBeTruthy();
  });

  it('clicking a choice button shows a round result', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByText('Best of 3'));
    await user.click(screen.getByRole('button', { name: /rock/i }));
    // computer picks scissors → "Rock beats scissors"
    expect(screen.getByText('Rock beats scissors')).toBeTruthy();
  });

  it('player score increments after a win', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByText('Best of 3'));
    await user.click(screen.getByRole('button', { name: /rock/i }));
    // Score board "You" value should be 1
    const scoreValues = screen.getAllByText('1');
    expect(scoreValues.length).toBeGreaterThan(0);
  });

  it('match-over banner appears after player wins required rounds', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByText('Best of 3'));

    // Win round 1 — wait for isRevealing to clear before round 2
    await user.click(screen.getByRole('button', { name: /rock/i }));
    await waitFor(
      () => expect((screen.getByRole('button', { name: /rock/i }) as HTMLButtonElement).disabled).toBe(false),
      { timeout: 2000 }
    );

    // Win round 2 — triggers match over
    await user.click(screen.getByRole('button', { name: /rock/i }));
    expect(screen.getByText('You win the match!')).toBeTruthy();
  }, 10000);

  it('Play Again button resets scores and hides the banner', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByText('Best of 3'));

    await user.click(screen.getByRole('button', { name: /rock/i }));
    await waitFor(
      () => expect((screen.getByRole('button', { name: /rock/i }) as HTMLButtonElement).disabled).toBe(false),
      { timeout: 2000 }
    );
    await user.click(screen.getByRole('button', { name: /rock/i }));

    expect(screen.getByText('You win the match!')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /play again/i }));

    expect(screen.queryByText('You win the match!')).toBeNull();
    expect(screen.getByRole('button', { name: /rock/i })).toBeTruthy();
  }, 10000);

  it('Change Mode button returns to mode select screen', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByText('Best of 3'));
    expect(screen.queryByText('Choose a Mode')).toBeNull();

    await user.click(screen.getByRole('button', { name: /change mode/i }));
    expect(screen.getByText('Choose a Mode')).toBeTruthy();
  });
});
