import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'
import { rollDice, getAIMove, getAllValidMoves, getValidMovesForChecker, checkWinner } from './gameLogic'

// ─── Module mock ─────────────────────────────────────────────────────────────

vi.mock('./gameLogic', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./gameLogic')>()
  return {
    ...actual,
    rollDice: vi.fn(),
    getAIMove: vi.fn(),
    getAllValidMoves: vi.fn(),
    checkWinner: vi.fn(),
    getValidMovesForChecker: vi.fn(),
  }
})

// Restore actual implementations before each test; individual tests can override.
beforeEach(async () => {
  const actual = await vi.importActual<typeof import('./gameLogic')>('./gameLogic')
  vi.mocked(rollDice).mockReset().mockReturnValue([3, 4])
  vi.mocked(getAIMove).mockReset().mockReturnValue([])
  vi.mocked(getAllValidMoves).mockReset().mockImplementation(actual.getAllValidMoves)
  vi.mocked(checkWinner).mockReset().mockImplementation(actual.checkWinner)
  // Wire getValidMovesForChecker to use the (possibly overridden) getAllValidMoves mock
  vi.mocked(getValidMovesForChecker).mockReset().mockImplementation(
    (state, from) => vi.mocked(getAllValidMoves)(state).filter(m => m.from === from)
  )
})

// ─── Mode select ──────────────────────────────────────────────────────────────

describe('Mode select', () => {
  it('renders "vs AI" and "2 Players" buttons', () => {
    render(<App />)
    expect(screen.getByText(/vs ai/i)).toBeTruthy()
    expect(screen.getByText(/2 players/i)).toBeTruthy()
  })

  it('clicking "vs AI" transitions to game screen', () => {
    render(<App />)
    fireEvent.click(screen.getByText(/vs ai/i))
    expect(screen.queryByText(/vs ai/i)).toBeNull()
    expect(document.querySelector('.board')).toBeTruthy()
  })

  it('clicking "2 Players" transitions to game screen', () => {
    render(<App />)
    fireEvent.click(screen.getByText(/2 players/i))
    expect(screen.queryByText(/2 players/i)).toBeNull()
    expect(document.querySelector('.board')).toBeTruthy()
  })
})

// ─── Dice display ────────────────────────────────────────────────────────────

describe('Dice display', () => {
  it('shows 2 dice after a mode is selected (non-doubles roll)', () => {
    render(<App />)
    fireEvent.click(screen.getByText(/2 players/i))
    expect(document.querySelectorAll('.die')).toHaveLength(2)
  })

  it('shows 4 dice when doubles are rolled', () => {
    vi.mocked(rollDice).mockReturnValue([5, 5, 5, 5])
    render(<App />)
    fireEvent.click(screen.getByText(/2 players/i))
    expect(document.querySelectorAll('.die')).toHaveLength(4)
  })
})

// ─── Checker selection ───────────────────────────────────────────────────────

// Only index 18 has moves; index 11 has none.
// Labels (24 - index): index 18 → "6",  index 11 → "13"
const MOVES_FROM_18 = [{ from: 18 as const, to: 22 as const, dieUsed: 4 }]

describe('Checker selection', () => {
  beforeEach(() => {
    vi.mocked(getAllValidMoves).mockReturnValue(MOVES_FROM_18)
  })

  it('clicking a checker with no valid moves does not select it', () => {
    render(<App />)
    fireEvent.click(screen.getByText(/2 players/i))

    const bp11 = screen.getByText('13').closest('.board-point')!
    fireEvent.click(bp11)

    expect(bp11.classList.contains('board-point--selected')).toBe(false)
  })

  it('clicking a checker with valid moves highlights it as selected', () => {
    render(<App />)
    fireEvent.click(screen.getByText(/2 players/i))

    const bp18 = screen.getByText('6').closest('.board-point')!
    fireEvent.click(bp18)

    expect(bp18.classList.contains('board-point--selected')).toBe(true)
  })

  it('clicking a valid destination after selecting moves the checker', () => {
    render(<App />)
    fireEvent.click(screen.getByText(/2 players/i))

    // Select point 18 (label "6", 5 white checkers initially)
    const bp18 = screen.getByText('6').closest('.board-point')!
    fireEvent.click(bp18)

    // Click the highlighted destination
    const dest = document.querySelector('.board-point--valid-dest')!
    fireEvent.click(dest)

    // Point 18 should now have 4 checkers (one moved away)
    expect(bp18.querySelectorAll('.checker')).toHaveLength(4)
    // And it is no longer selected
    expect(bp18.classList.contains('board-point--selected')).toBe(false)
  })
})

// ─── Win modal ───────────────────────────────────────────────────────────────

describe('Win modal', () => {
  it('"Play Again" button resets to mode select screen', () => {
    vi.mocked(getAllValidMoves).mockReturnValue(MOVES_FROM_18)
    vi.mocked(checkWinner).mockReturnValue('white')

    render(<App />)
    fireEvent.click(screen.getByText(/2 players/i))

    const bp18 = screen.getByText('6').closest('.board-point')!
    fireEvent.click(bp18)
    fireEvent.click(document.querySelector('.board-point--valid-dest')!)

    // Win modal appears
    expect(screen.getByText('Play Again')).toBeTruthy()

    fireEvent.click(screen.getByText('Play Again'))

    // Back to mode select
    expect(screen.getByText(/vs ai/i)).toBeTruthy()
  })
})

// ─── Forced skip ─────────────────────────────────────────────────────────────

describe('Forced skip', () => {
  it('displays "No legal moves" when no moves are available', () => {
    vi.useFakeTimers()
    vi.mocked(getAllValidMoves).mockReturnValue([])

    render(<App />)
    fireEvent.click(screen.getByText(/2 players/i))

    expect(screen.getByText(/no legal moves/i)).toBeTruthy()

    vi.useRealTimers()
  })
})

// ─── AI turn ─────────────────────────────────────────────────────────────────

describe('AI turn', () => {
  it('clicking a board point during AI turn does not select it', () => {
    vi.useFakeTimers()

    // Call sequence:
    // 1. beginTurn (white)          – return 1 move from 18
    // 2. getValidMovesForChecker    – also returns that move (then filtered by from===18)
    // 3. remaining after move       – [] → triggers advanceTurn
    // 4. beginTurn (black)          – [] → forcedSkip; AI stays idle
    vi.mocked(getAllValidMoves)
      .mockReturnValueOnce(MOVES_FROM_18)
      .mockReturnValueOnce(MOVES_FROM_18)
      .mockReturnValueOnce([])
      .mockReturnValue([])

    render(<App />)
    fireEvent.click(screen.getByText(/vs ai/i))

    // White selects point 18 and moves
    const bp18 = screen.getByText('6').closest('.board-point')!
    fireEvent.click(bp18)
    fireEvent.click(document.querySelector('.board-point--valid-dest')!)

    // Now it's black's turn with forcedSkip — clicking any point does nothing
    // Point 23 (label "1") has 2 black checkers
    const bp23 = screen.getByText('1').closest('.board-point')!
    fireEvent.click(bp23)
    expect(bp23.classList.contains('board-point--selected')).toBe(false)

    vi.useRealTimers()
  })
})
