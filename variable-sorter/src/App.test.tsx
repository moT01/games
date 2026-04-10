import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { generateQueue, formatTime } from './gameLogic'
import type { Variable, PersonalBests } from './gameLogic'

// Mock generateQueue so tests use controlled variable sets
vi.mock('./gameLogic', async (importOriginal) => {
  const mod = await importOriginal<typeof import('./gameLogic')>()
  return { ...mod, generateQueue: vi.fn(mod.generateQueue) }
})

// Controlled variable sets
function makeVars(count: number, type: Variable['type'] = 'string'): Variable[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `v${i}`,
    declaration: `const x${i} = "val"`,
    type,
  }))
}

// JS type → keyboard key number (1-indexed, matches bucket order)
const JS_KEY: Record<string, string> = {
  string: '1', number: '2', boolean: '3', null: '4',
  undefined: '5', object: '6', array: '7', function: '8',
}

// localStorage mock
let lsStore: Record<string, string> = {}
const localStorageMock = {
  getItem: (key: string) => lsStore[key] ?? null,
  setItem: (key: string, value: string) => { lsStore[key] = value },
  removeItem: (key: string) => { delete lsStore[key] },
  clear: () => { lsStore = {} },
  length: 0,
  key: () => null,
}

beforeEach(() => {
  lsStore = {}
  vi.stubGlobal('localStorage', localStorageMock)
  vi.mocked(generateQueue).mockRestore?.()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

// ---- HomeScreen ----

describe('HomeScreen', () => {
  it('renders with JavaScript selected by default and count 10', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /javascript/i }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByText('10').className).toContain('active')
  })

  it('changing language to Python updates the pressed button', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /python/i }))
    expect(screen.getByRole('button', { name: /python/i }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: /javascript/i }).getAttribute('aria-pressed')).toBe('false')
  })

  it('loads personal best from localStorage on mount', () => {
    const bests: PersonalBests = {
      javascript: { 10: 5000, 20: null, 30: null },
      python: { 10: null, 20: null, 30: null },
    }
    lsStore['vs_personal_bests'] = JSON.stringify(bests)
    render(<App />)
    expect(screen.getByText(formatTime(5000))).not.toBeNull()
  })
})

// ---- Start / PlayScreen ----

describe('Start and PlayScreen', () => {
  it('clicking Start transitions to play screen', async () => {
    vi.mocked(generateQueue).mockReturnValue(makeVars(10))
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /start/i }))
    expect(screen.queryByText('0 / 10')).not.toBeNull()
  })

  it('play screen shows the current variable and next preview', async () => {
    const vars = makeVars(10)
    vi.mocked(generateQueue).mockReturnValue(vars)
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /start/i }))
    expect(screen.queryByLabelText(`Current variable: ${vars[0].declaration}`)).not.toBeNull()
    expect(screen.queryByLabelText(`Next variable: ${vars[1].declaration}`)).not.toBeNull()
  })
})

// ---- Keyboard sorting ----

describe('Keyboard sorting', () => {
  it('correct keyboard press advances to next variable', async () => {
    vi.mocked(generateQueue).mockReturnValue(makeVars(10, 'string'))
    render(<App />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /start/i }))
    })
    await act(async () => {
      fireEvent.keyDown(document, { key: JS_KEY['string'] })
    })
    expect(screen.queryByText('1 / 10')).not.toBeNull()
  })

  it('wrong keyboard press triggers fail screen after delay', async () => {
    vi.useFakeTimers()
    vi.mocked(generateQueue).mockReturnValue(makeVars(10, 'string'))
    render(<App />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /start/i }))
    })
    act(() => {
      fireEvent.keyDown(document, { key: JS_KEY['number'] }) // wrong for string
    })
    await act(async () => {
      vi.advanceTimersByTime(200)
    })
    expect(screen.queryByText('Wrong type!')).not.toBeNull()
  })

  it('fail screen shows the dropped type and correct type', async () => {
    vi.useFakeTimers()
    vi.mocked(generateQueue).mockReturnValue(makeVars(10, 'string'))
    render(<App />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /start/i }))
    })
    act(() => {
      fireEvent.keyDown(document, { key: JS_KEY['number'] }) // wrong
    })
    await act(async () => {
      vi.advanceTimersByTime(200)
    })
    expect(screen.queryByText('Wrong type!')).not.toBeNull()
    // Fail screen shows both dropped type and correct type
    const types = screen.getAllByText(/^(string|number)$/).map(el => el.textContent)
    expect(types).toContain('number')
    expect(types).toContain('string')
  })

  it('win screen shows after all variables sorted correctly', async () => {
    vi.useFakeTimers()
    vi.mocked(generateQueue).mockReturnValue(makeVars(10, 'string'))
    render(<App />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /start/i }))
    })
    for (let i = 0; i < 10; i++) {
      act(() => { fireEvent.keyDown(document, { key: JS_KEY['string'] }) })
    }
    await act(async () => { vi.advanceTimersByTime(50) })
    expect(screen.queryByText('Run complete!')).not.toBeNull()
  })

  it('saves personal best to localStorage on win', async () => {
    vi.useFakeTimers()
    vi.mocked(generateQueue).mockReturnValue(makeVars(10, 'string'))
    render(<App />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /start/i }))
    })
    for (let i = 0; i < 10; i++) {
      act(() => { fireEvent.keyDown(document, { key: JS_KEY['string'] }) })
    }
    await act(async () => { vi.advanceTimersByTime(50) })
    const stored = lsStore['vs_personal_bests']
    expect(stored).not.toBeNull()
    const bests = JSON.parse(stored) as PersonalBests
    expect(bests.javascript[10]).not.toBeNull()
  })
})
