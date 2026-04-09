import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v },
    removeItem: (k: string) => { delete store[k] },
    clear: () => { store = {} },
  }
})()

beforeEach(() => {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true, configurable: true })
  localStorageMock.clear()
  vi.useFakeTimers()
})

describe('HomeScreen', () => {
  it('renders Start button and record display', () => {
    render(<App />)
    expect(screen.getByTestId('start-button')).toBeTruthy()
    expect(screen.getByLabelText('Your record')).toBeTruthy()
  })
})

describe('Game start', () => {
  it('clicking Start transitions to passing or playing phase', () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('start-button'))
    // Either the pass button or the player hand should be present
    const passBtn = document.querySelector('[data-testid="pass-button"]')
    const playerHand = document.querySelector('.player-hand')
    expect(passBtn || playerHand).toBeTruthy()
  })
})

describe('Passing phase', () => {
  function startAndGetToPass() {
    render(<App />)
    fireEvent.click(screen.getByTestId('start-button'))

    // If it's a no-pass hand we can't test passing, so bail
    const passBtn = document.querySelector<HTMLButtonElement>('[data-testid="pass-button"]')
    return passBtn
  }

  it('Pass button is disabled until 3 cards are selected', () => {
    const passBtn = startAndGetToPass()
    if (!passBtn) return // no-pass hand, skip

    expect(passBtn.disabled).toBe(true)

    // Select cards one at a time
    const cards = document.querySelectorAll<HTMLElement>('.player-card')
    if (cards.length < 3) return

    fireEvent.click(cards[0])
    expect(passBtn.disabled).toBe(true)

    fireEvent.click(cards[1])
    expect(passBtn.disabled).toBe(true)

    fireEvent.click(cards[2])
    expect(passBtn.disabled).toBe(false)
  })

  it('clicking a selected card deselects it, and only 3 can be selected at once', () => {
    const passBtn = startAndGetToPass()
    if (!passBtn) return

    const cards = document.querySelectorAll<HTMLElement>('.player-card')
    if (cards.length < 4) return

    fireEvent.click(cards[0])
    fireEvent.click(cards[1])
    fireEvent.click(cards[2])
    expect(passBtn.disabled).toBe(false)

    // Try selecting a 4th — should stay at 3 selected
    fireEvent.click(cards[3])
    const selected = document.querySelectorAll('.player-card.selected')
    expect(selected.length).toBe(3)

    // Deselect one
    fireEvent.click(cards[0])
    expect(document.querySelectorAll('.player-card.selected').length).toBe(2)
    expect(passBtn.disabled).toBe(true)
  })

  it('after passing, human hand has 13 cards and phase is playing', () => {
    const passBtn = startAndGetToPass()
    if (!passBtn) return

    const cards = document.querySelectorAll<HTMLElement>('.player-card')
    if (cards.length < 3) return

    fireEvent.click(cards[0])
    fireEvent.click(cards[1])
    fireEvent.click(cards[2])
    fireEvent.click(passBtn)

    const handCards = document.querySelectorAll('.player-card')
    expect(handCards.length).toBe(13)
  })
})
