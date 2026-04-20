import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as gameLogic from './gameLogic'
import App from './App'

vi.mock('./gameLogic', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./gameLogic')>()
  return { ...actual, checkWinner: vi.fn(actual.checkWinner) }
})

const storageData = new Map<string, string>()

const localStorageMock = {
  getItem(key: string) {
    return storageData.has(key) ? storageData.get(key)! : null
  },
  setItem(key: string, value: string) {
    storageData.set(key, String(value))
  },
  removeItem(key: string) {
    storageData.delete(key)
  },
  clear() {
    storageData.clear()
  },
}

beforeEach(() => {
  storageData.clear()
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    configurable: true,
  })
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    configurable: true,
  })
})

afterEach(() => {
  vi.clearAllMocks()
})

async function startVsPlayerGame() {
  const user = userEvent.setup()
  const { container } = render(<App />)
  await user.click(screen.getByText('2 Players'))
  await user.click(screen.getByText('New Game'))
  return { user, container }
}

describe('App', () => {
  it('renders the current setup screen on initial load', () => {
    render(<App />)

    expect(screen.getByText('vs Computer')).toBeTruthy()
    expect(screen.getByText('2 Players')).toBeTruthy()
    expect(screen.getByText('Light')).toBeTruthy()
    expect(screen.getByText('Dark')).toBeTruthy()
    expect(screen.getByText('Hard mode')).toBeTruthy()
    expect(screen.getByText('New Game')).toBeTruthy()
  })

  it('switching to 2 Players hides the computer-only options', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByText('Hard mode')).toBeTruthy()
    expect(screen.getByText('Light')).toBeTruthy()
    expect(screen.getByText('Dark')).toBeTruthy()

    await user.click(screen.getByText('2 Players'))

    expect(screen.queryByText('Hard mode')).toBeNull()
    expect(screen.queryByText('Light')).toBeNull()
    expect(screen.queryByText('Dark')).toBeNull()
    expect(screen.getByText('New Game')).toBeTruthy()
  })

  it('clicking a piece selects it and highlights its valid moves', async () => {
    const { user, container } = await startVsPlayerGame()
    const squares = container.querySelectorAll('.square')

    await user.click(squares[40])

    expect(squares[40].classList.contains('square--selected')).toBe(true)
    expect(squares[33].classList.contains('square--valid-destination')).toBe(true)
  })

  it('clicking a valid destination moves the piece there', async () => {
    const { user, container } = await startVsPlayerGame()
    const squares = container.querySelectorAll('.square')

    await user.click(squares[40])
    await user.click(squares[33])

    expect(squares[33].querySelector('.piece')).toBeTruthy()
    expect(squares[40].querySelector('.piece')).toBeNull()
  })

  it('a winning condition shows the result message', async () => {
    vi.mocked(gameLogic.checkWinner).mockReturnValueOnce('Light')

    const { user, container } = await startVsPlayerGame()
    const squares = container.querySelectorAll('.square')

    await user.click(squares[40])
    await user.click(squares[33])

    expect(screen.getByText('Light wins!')).toBeTruthy()
  })

  it('clicking Play Again returns to the setup screen', async () => {
    vi.mocked(gameLogic.checkWinner).mockReturnValueOnce('Light')

    const { user, container } = await startVsPlayerGame()
    const squares = container.querySelectorAll('.square')

    await user.click(squares[40])
    await user.click(squares[33])
    await user.click(screen.getByText('Play Again'))

    expect(screen.getByText('vs Computer')).toBeTruthy()
    expect(screen.getByText('2 Players')).toBeTruthy()
    expect(screen.getByText('New Game')).toBeTruthy()
  })
})
