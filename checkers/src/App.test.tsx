import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, it, vi } from 'vitest'
import * as gameLogic from './gameLogic'
import App from './App'

// Wrap checkWinner in vi.fn so individual tests can override its return value
vi.mock('./gameLogic', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./gameLogic')>()
  return { ...actual, checkWinner: vi.fn(actual.checkWinner) }
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
    expect(screen.getByText('Play as Black')).toBeTruthy()
  })

  it('clicking a piece selects it and highlights its valid moves', async () => {
    const { user, container } = await startVsPlayerGame()
    const squares = container.querySelectorAll('.square')

    // Red piece at index 40 (row 5, col 0) — can only move to index 33 (row 4, col 1)
    await user.click(squares[40])

    expect(squares[40].classList.contains('square--selected')).toBe(true)
    expect(squares[33].classList.contains('square--valid-destination')).toBe(true)
  })

  it('clicking a valid destination moves the piece there', async () => {
    const { user, container } = await startVsPlayerGame()
    const squares = container.querySelectorAll('.square')

    await user.click(squares[40]) // select Red at row 5, col 0
    await user.click(squares[33]) // move to row 4, col 1

    expect(squares[33].querySelector('.piece')).toBeTruthy()
    expect(squares[40].querySelector('.piece')).toBeNull()
  })

  it('a winning condition shows the result message', async () => {
    vi.mocked(gameLogic.checkWinner).mockReturnValueOnce('Red')

    const { user, container } = await startVsPlayerGame()
    const squares = container.querySelectorAll('.square')

    // Make any valid move — the mocked checkWinner returns 'Red' immediately
    await user.click(squares[40])
    await user.click(squares[33])

    expect(screen.getByText('Red wins!')).toBeTruthy()
  })

  it('clicking "Play Again" returns to the mode selector', async () => {
    vi.mocked(gameLogic.checkWinner).mockReturnValueOnce('Red')

    const { user, container } = await startVsPlayerGame()
    const squares = container.querySelectorAll('.square')

    await user.click(squares[40])
    await user.click(squares[33])

    await user.click(screen.getByText('Play Again'))

    expect(screen.getByText('vs Player')).toBeTruthy()
    expect(screen.getByText('vs Computer')).toBeTruthy()
    expect(screen.getByText('Start Game')).toBeTruthy()
  })
})
