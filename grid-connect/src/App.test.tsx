import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, it, vi } from 'vitest'
import * as gameLogic from './gameLogic'
import App from './App'

// Mock checkDraw so the draw test can trigger it without clicking 42 times
vi.mock('./gameLogic', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./gameLogic')>()
  return { ...actual, checkDraw: vi.fn(actual.checkDraw) }
})

afterEach(() => {
  vi.clearAllMocks()
})

async function startVsPlayerGame() {
  const user = userEvent.setup()
  const { container } = render(<App />)
  await user.click(screen.getByText('Start Game'))
  return { user, container }
}

describe('App', () => {
  it('renders the mode selector on initial load', () => {
    render(<App />)
    expect(screen.getByText('vs Player')).toBeTruthy()
    expect(screen.getByText('vs Computer')).toBeTruthy()
    expect(screen.getByText('Start Game')).toBeTruthy()
  })

  it('selecting "vs Computer" reveals difficulty and color pickers', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.queryByText('Easy')).toBeNull()
    expect(screen.queryByText('Play as Red')).toBeNull()

    await user.click(screen.getByText('vs Computer'))

    expect(screen.getByText('Easy')).toBeTruthy()
    expect(screen.getByText('Hard')).toBeTruthy()
    expect(screen.getByText('Play as Red')).toBeTruthy()
    expect(screen.getByText('Play as Yellow')).toBeTruthy()
  })

  it('clicking a column drops the piece into the lowest available row', async () => {
    const { user, container } = await startVsPlayerGame()
    const cells = container.querySelectorAll('.cell')

    // Click the top cell of column 0 — piece should land at row 5 (index 35)
    await user.click(cells[0])

    const bottomCell = cells[5 * 7 + 0]
    expect(bottomCell.querySelector('.cell__piece')?.className).toContain('cell__piece--red')
  })

  it('a winning move shows the result message with the correct winner', async () => {
    const { user, container } = await startVsPlayerGame()
    const cells = container.querySelectorAll('.cell')

    // Red plays cols 0, 1, 2, 3 (interleaved with Yellow at col 6)
    // → Red wins with a horizontal at row 5
    for (const col of [0, 6, 1, 6, 2, 6, 3]) {
      await user.click(cells[col])
    }

    expect(screen.getByText('Red wins!')).toBeTruthy()
  })

  it('filling the board with no winner shows the draw message', async () => {
    const { user, container } = await startVsPlayerGame()

    // Force checkDraw to return true on the next applyMove call
    vi.mocked(gameLogic.checkDraw).mockReturnValueOnce(true)

    const cells = container.querySelectorAll('.cell')
    await user.click(cells[0]) // triggers applyMove → checkDraw returns true

    expect(screen.getByText("It's a draw!")).toBeTruthy()
  })

  it('clicking "Play Again" returns to the mode selector', async () => {
    const { user, container } = await startVsPlayerGame()
    const cells = container.querySelectorAll('.cell')

    for (const col of [0, 6, 1, 6, 2, 6, 3]) {
      await user.click(cells[col])
    }

    await user.click(screen.getByText('Play Again'))

    expect(screen.getByText('vs Player')).toBeTruthy()
    expect(screen.getByText('vs Computer')).toBeTruthy()
    expect(screen.getByText('Start Game')).toBeTruthy()
  })
})
