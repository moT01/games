import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'

// Minimal localStorage mock
const store: Record<string, string> = {}
const localStorageMock = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v },
  removeItem: (k: string) => { delete store[k] },
  clear: () => { Object.keys(store).forEach(k => delete store[k]) },
}
vi.stubGlobal('localStorage', localStorageMock)

// Seed dice state: 5 rolled dice, no holds, rollCount=1
function playingState(overrides = {}) {
  return JSON.stringify({
    dice: [1,2,3,4,5].map(v => ({ value: v, held: false })),
    rollCount: 1,
    scores: {},
    fiveOfAKindBonus: 0,
    gamePhase: 'playing',
    ...overrides,
  })
}

beforeEach(() => {
  localStorageMock.clear()
})

describe('HomeScreen', () => {
  it('shows high score from localStorage', () => {
    store['five-dice-high-score'] = '247'
    render(<App />)
    expect(screen.getByText('247')).toBeTruthy()
  })

  it('shows "No high score yet" when localStorage is empty', () => {
    render(<App />)
    expect(screen.getByText('No high score yet')).toBeTruthy()
  })

  it('clicking Play transitions to the play screen', () => {
    render(<App />)
    fireEvent.click(screen.getByText('Play'))
    expect(screen.getByText('Roll')).toBeTruthy()
  })
})

describe('PlayScreen', () => {
  it('Roll button is enabled at the start of a turn', () => {
    store['five-dice-state'] = playingState()
    render(<App />)
    fireEvent.click(screen.getByText('Resume Game'))
    const btn = screen.getByRole('button', { name: /roll/i }) as HTMLButtonElement
    expect(btn.disabled).toBe(false)
  })

  it('Roll button is disabled after 3 rolls', () => {
    store['five-dice-state'] = playingState()
    render(<App />)
    fireEvent.click(screen.getByText('Resume Game'))
    fireEvent.click(screen.getByRole('button', { name: /roll/i }))
    fireEvent.click(screen.getByRole('button', { name: /roll/i }))
    const btn = screen.getByRole('button', { name: /roll/i }) as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it('clicking a die toggles its held state', () => {
    store['five-dice-state'] = playingState()
    render(<App />)
    fireEvent.click(screen.getByText('Resume Game'))
    const die = screen.getByLabelText(/die 1/i)
    expect(die.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(die)
    expect(die.getAttribute('aria-pressed')).toBe('true')
  })

  it('clicking a scored category row has no effect', () => {
    store['five-dice-state'] = playingState({ scores: { ones: 3 } })
    render(<App />)
    fireEvent.click(screen.getByText('Resume Game'))
    const onesRow = screen.getAllByLabelText(/ones/i)[0]
    expect(onesRow.getAttribute('aria-disabled')).toBe('true')
    expect(onesRow.getAttribute('role')).not.toBe('button')
  })
})

describe('GameOver', () => {
  it('scoring the final category triggers the game over screen', () => {
    // 12 categories already scored, one remaining: chance
    const scores = {
      ones: 3, twos: 6, threes: 9, fours: 12, fives: 15, sixes: 18,
      threeOfAKind: 25, fourOfAKind: 22, fullHouse: 25,
      smallStraight: 30, largeStraight: 40, fiveOfAKind: 50,
    }
    store['five-dice-state'] = playingState({ scores, rollCount: 1 })
    render(<App />)
    fireEvent.click(screen.getByText('Resume Game'))
    const chanceRow = screen.getAllByLabelText(/chance/i)[0]
    fireEvent.click(chanceRow)
    expect(screen.getByText('Game Over')).toBeTruthy()
  })

  it('game over screen shows updated high score when beaten', () => {
    store['five-dice-high-score'] = '1'
    const scores = {
      ones: 3, twos: 6, threes: 9, fours: 12, fives: 15, sixes: 18,
      threeOfAKind: 25, fourOfAKind: 22, fullHouse: 25,
      smallStraight: 30, largeStraight: 40, fiveOfAKind: 50,
    }
    store['five-dice-state'] = playingState({ scores, rollCount: 1 })
    render(<App />)
    fireEvent.click(screen.getByText('Resume Game'))
    fireEvent.click(screen.getAllByLabelText(/chance/i)[0])
    expect(screen.getByText('New best!')).toBeTruthy()
  })
})
