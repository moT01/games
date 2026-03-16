import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

async function startVsPlayerGame() {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByText('Start Game'))
  return user
}

describe('App', () => {
  it('renders the mode selector on initial load', () => {
    render(<App />)
    expect(screen.getByText('vs Player')).toBeTruthy()
    expect(screen.getByText('vs Computer')).toBeTruthy()
    expect(screen.getByText('Start Game')).toBeTruthy()
  })

  it('selecting "vs Computer" reveals difficulty and side pickers', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.queryByText('Easy')).toBeNull()
    expect(screen.queryByText('Play as X')).toBeNull()

    await user.click(screen.getByText('vs Computer'))

    expect(screen.getByText('Easy')).toBeTruthy()
    expect(screen.getByText('Hard')).toBeTruthy()
    expect(screen.getByText('Play as X')).toBeTruthy()
    expect(screen.getByText('Play as O')).toBeTruthy()
  })

  it('clicking a square places the current player mark', async () => {
    const user = await startVsPlayerGame()

    await user.click(screen.getAllByRole('button')[0])
    expect(screen.getAllByRole('button')[0].textContent).toBe('X')

    await user.click(screen.getAllByRole('button')[3])
    expect(screen.getAllByRole('button')[3].textContent).toBe('O')
  })

  it('a winning move shows the result message with the correct winner', async () => {
    const user = await startVsPlayerGame()
    // X wins the top row: X(0), O(3), X(1), O(4), X(2)
    for (const idx of [0, 3, 1, 4, 2]) {
      await user.click(screen.getAllByRole('button')[idx])
    }
    expect(screen.getByText('X wins!')).toBeTruthy()
  })

  it('filling the board with no winner shows the draw message', async () => {
    const user = await startVsPlayerGame()
    // Produces X O X / O O X / X X O — a valid draw board
    // X plays 0,2,5,6,7 — O plays 1,3,4,8
    for (const idx of [0, 1, 2, 3, 5, 4, 6, 8, 7]) {
      await user.click(screen.getAllByRole('button')[idx])
    }
    expect(screen.getByText("It's a draw!")).toBeTruthy()
  })

  it('clicking "Play Again" returns to the mode selector', async () => {
    const user = await startVsPlayerGame()
    // Reach game over via X winning
    for (const idx of [0, 3, 1, 4, 2]) {
      await user.click(screen.getAllByRole('button')[idx])
    }
    await user.click(screen.getByText('Play Again'))
    expect(screen.getByText('vs Player')).toBeTruthy()
    expect(screen.getByText('vs Computer')).toBeTruthy()
    expect(screen.getByText('Start Game')).toBeTruthy()
  })
})
