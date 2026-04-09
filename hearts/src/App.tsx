import { useState, useEffect, useRef } from 'react'
import './App.css'
import HomeScreen from './HomeScreen'
import GameBoard from './GameBoard'
import GameOverScreen from './GameOverScreen'
import ConfirmModal from './ConfirmModal'
import {
  type GameState, type Card, type PlayerId, type HeartsRecord, type TrickPlay,
  createDeck, shuffleDeck, dealHands, getPassDirection,
  applyPass, findTwoOfClubs, getTrickWinner, getTrickPoints,
  checkMoonShot, applyHandScores, isGameOver, getWinner,
  getAIPass, getAIPlay, cardEquals,
} from './gameLogic'

// ─── Pure state transitions ───────────────────────────────────────────────────

function makeNewHandState(
  handNumber: number,
  scores: [number, number, number, number]
): GameState {
  const deck = shuffleDeck(createDeck())
  const hands = dealHands(deck)
  const passDirection = getPassDirection(handNumber)
  const leader = findTwoOfClubs(hands)
  return {
    phase: passDirection === 'none' ? 'playing' : 'passing',
    handNumber,
    scores,
    handPoints: [0, 0, 0, 0],
    hands,
    passDirection,
    passSelections: [],
    currentTrick: [],
    trickLeader: leader,
    heartsBroken: false,
    queenOfSpadesPlayed: false,
    activePlayer: leader,
    trickCount: 0,
    lastTrickWinner: null,
    handSummaryData: null,
    gameOverData: null,
  }
}

const HOME_STATE: GameState = {
  phase: 'home',
  handNumber: 0,
  scores: [0, 0, 0, 0],
  handPoints: [0, 0, 0, 0],
  hands: [[], [], [], []],
  passDirection: 'left',
  passSelections: [],
  currentTrick: [],
  trickLeader: 0,
  heartsBroken: false,
  queenOfSpadesPlayed: false,
  activePlayer: 0,
  trickCount: 0,
  lastTrickWinner: null,
  handSummaryData: null,
  gameOverData: null,
}

function playCardInState(state: GameState, player: PlayerId, card: Card): GameState {
  const newHands = state.hands.map((h, i) =>
    i === player ? h.filter(c => !cardEquals(c, card)) : [...h]
  ) as [Card[], Card[], Card[], Card[]]

  const newTrick: TrickPlay[] = [...state.currentTrick, { player, card }]

  let newHeartsBroken = state.heartsBroken
  if (
    card.suit === 'hearts' &&
    state.currentTrick.length > 0 &&
    state.currentTrick[0].card.suit !== 'hearts'
  ) {
    newHeartsBroken = true
  }

  let newQSPlayed = state.queenOfSpadesPlayed
  if (card.suit === 'spades' && card.rank === 12) newQSPlayed = true

  if (newTrick.length === 4) {
    const winner = getTrickWinner(newTrick)
    const pts = getTrickPoints(newTrick)
    const newHandPoints = state.handPoints.map((p, i) =>
      i === winner ? p + pts : p
    ) as [number, number, number, number]
    return {
      ...state,
      hands: newHands,
      currentTrick: newTrick,
      heartsBroken: newHeartsBroken,
      queenOfSpadesPlayed: newQSPlayed,
      handPoints: newHandPoints,
      lastTrickWinner: winner,
    }
  }

  const nextPlayer = ((state.trickLeader + newTrick.length) % 4) as PlayerId
  return {
    ...state,
    hands: newHands,
    currentTrick: newTrick,
    heartsBroken: newHeartsBroken,
    queenOfSpadesPlayed: newQSPlayed,
    activePlayer: nextPlayer,
  }
}

function advanceTrickInState(state: GameState): GameState {
  const winner = getTrickWinner(state.currentTrick)
  const newCount = state.trickCount + 1

  if (newCount === 13) {
    const moon = checkMoonShot(state.handPoints)
    const newScores = applyHandScores(state.scores, state.handPoints, moon)

    if (isGameOver(newScores)) {
      return {
        ...state,
        scores: newScores,
        phase: 'gameOver',
        currentTrick: [],
        trickCount: newCount,
        gameOverData: { finalScores: newScores, winner: getWinner(newScores) },
        handSummaryData: null,
      }
    }

    return {
      ...state,
      scores: newScores,
      phase: 'handSummary',
      currentTrick: [],
      trickCount: newCount,
      handSummaryData: {
        handPoints: state.handPoints,
        cumulativeAfter: newScores,
        moonShooter: moon,
      },
    }
  }

  return {
    ...state,
    currentTrick: [],
    trickLeader: winner,
    activePlayer: winner,
    trickCount: newCount,
  }
}

// ─── Local storage helpers ────────────────────────────────────────────────────

function loadTheme(): 'dark' | 'light' {
  return (localStorage.getItem('hearts_theme') as 'dark' | 'light') ?? 'dark'
}

function loadRecord(): HeartsRecord {
  try {
    const raw = localStorage.getItem('hearts_record')
    if (raw) return JSON.parse(raw) as HeartsRecord
  } catch {}
  return { wins: 0, losses: 0, bestScore: null }
}

function loadSavedGame(): GameState | null {
  try {
    const raw = localStorage.getItem('hearts_gameState')
    if (!raw) return null
    const s = JSON.parse(raw) as GameState
    return s.phase !== 'home' && s.phase !== 'gameOver' ? s : null
  } catch {
    return null
  }
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [gameState, setGameState] = useState<GameState>(HOME_STATE)
  const [savedGame, setSavedGame] = useState<GameState | null>(loadSavedGame)
  const [theme, setTheme] = useState<'dark' | 'light'>(loadTheme)
  const [record, setRecord] = useState<HeartsRecord>(loadRecord)
  const [toast, setToast] = useState<string | null>(null)
  const [confirmModal, setConfirmModal] = useState<{
    message: string
    onConfirm: () => void
  } | null>(null)
  const gameOverHandled = useRef(false)
  const prevHeartsBroken = useRef(false)

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('hearts_theme', theme)
  }, [theme])

  // Persist game state
  useEffect(() => {
    if (gameState.phase === 'home' || gameState.phase === 'gameOver') {
      localStorage.removeItem('hearts_gameState')
    } else {
      localStorage.setItem('hearts_gameState', JSON.stringify(gameState))
    }
  }, [gameState])

  // Hearts broken toast
  useEffect(() => {
    if (gameState.heartsBroken && !prevHeartsBroken.current) {
      prevHeartsBroken.current = true
      setToast('Hearts are broken!')
      const t = setTimeout(() => setToast(null), 2000)
      return () => clearTimeout(t)
    }
    if (!gameState.heartsBroken) prevHeartsBroken.current = false
  }, [gameState.heartsBroken])

  // AI turn
  useEffect(() => {
    if (gameState.phase !== 'playing') return
    if (gameState.activePlayer === 0) return
    if (gameState.currentTrick.length === 4) return

    const t = setTimeout(() => {
      setGameState(prev => {
        if (
          prev.phase !== 'playing' ||
          prev.activePlayer === 0 ||
          prev.currentTrick.length === 4
        ) return prev
        const player = prev.activePlayer
        const card = getAIPlay(
          prev.hands[player],
          prev.currentTrick,
          prev.heartsBroken,
          prev.trickCount,
          prev.handPoints,
          prev.queenOfSpadesPlayed
        )
        return playCardInState(prev, player, card)
      })
    }, 350)

    return () => clearTimeout(t)
  }, [gameState.activePlayer, gameState.phase, gameState.currentTrick.length])

  // Trick advance after 800ms pause
  useEffect(() => {
    if (gameState.phase !== 'playing' || gameState.currentTrick.length !== 4) return

    const t = setTimeout(() => {
      setGameState(prev => {
        if (prev.phase !== 'playing' || prev.currentTrick.length !== 4) return prev
        return advanceTrickInState(prev)
      })
    }, 800)

    return () => clearTimeout(t)
  }, [gameState.currentTrick.length, gameState.phase])

  // Update record on game over
  useEffect(() => {
    if (gameState.phase !== 'gameOver' || !gameState.gameOverData || gameOverHandled.current) return
    gameOverHandled.current = true

    const { finalScores, winner } = gameState.gameOverData
    const winners = Array.isArray(winner) ? winner : [winner]
    const humanWon = winners.length === 1 && winners[0] === 0

    setRecord(prev => {
      const next: HeartsRecord = {
        wins: prev.wins + (humanWon ? 1 : 0),
        losses: prev.losses + (humanWon ? 0 : 1),
        bestScore: humanWon
          ? prev.bestScore === null
            ? finalScores[0]
            : Math.min(prev.bestScore, finalScores[0])
          : prev.bestScore,
      }
      localStorage.setItem('hearts_record', JSON.stringify(next))
      return next
    })
  }, [gameState.phase, gameState.gameOverData])

  // ─── Handlers ────────────────────────────────────────────────────────────────

  function startNewGame() {
    gameOverHandled.current = false
    prevHeartsBroken.current = false
    setSavedGame(null)
    setGameState(makeNewHandState(1, [0, 0, 0, 0]))
  }

  function resumeGame() {
    if (!savedGame) return
    prevHeartsBroken.current = savedGame.heartsBroken
    setGameState(savedGame)
    setSavedGame(null)
  }

  function goHome() {
    gameOverHandled.current = false
    prevHeartsBroken.current = false
    setGameState(HOME_STATE)
  }

  function handlePassToggle(card: Card) {
    setGameState(prev => {
      if (prev.phase !== 'passing') return prev
      const isSelected = prev.passSelections.some(c => cardEquals(c, card))
      const newSel = isSelected
        ? prev.passSelections.filter(c => !cardEquals(c, card))
        : prev.passSelections.length < 3
          ? [...prev.passSelections, card]
          : prev.passSelections
      return { ...prev, passSelections: newSel }
    })
  }

  function handlePass() {
    setGameState(prev => {
      if (prev.phase !== 'passing' || prev.passSelections.length !== 3) return prev
      const aiPasses: [Card[], Card[], Card[], Card[]] = [
        prev.passSelections,
        getAIPass(prev.hands[1], prev.passDirection),
        getAIPass(prev.hands[2], prev.passDirection),
        getAIPass(prev.hands[3], prev.passDirection),
      ]
      const newHands = applyPass(prev.hands, aiPasses, prev.passDirection)
      const leader = findTwoOfClubs(newHands)
      return {
        ...prev,
        phase: 'playing',
        hands: newHands,
        passSelections: [],
        trickLeader: leader,
        activePlayer: leader,
      }
    })
  }

  function handleCardPlay(card: Card) {
    setGameState(prev => {
      if (prev.phase !== 'playing' || prev.activePlayer !== 0 || prev.currentTrick.length === 4) return prev
      return playCardInState(prev, 0, card)
    })
  }

  function handleNextHand() {
    gameOverHandled.current = false
    prevHeartsBroken.current = false
    setGameState(prev => {
      if (prev.phase !== 'handSummary') return prev
      return makeNewHandState(prev.handNumber + 1, prev.scores)
    })
  }

  function toggleTheme() {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'))
  }

  const isPlaying =
    gameState.phase === 'passing' ||
    gameState.phase === 'playing' ||
    gameState.phase === 'handSummary'

  return (
    <div className="app">
      {gameState.phase === 'home' && (
        <HomeScreen
          record={record}
          hasResume={savedGame !== null}
          theme={theme}
          onThemeToggle={toggleTheme}
          onStart={startNewGame}
          onResume={resumeGame}
        />
      )}

      {isPlaying && (
        <GameBoard
          gameState={gameState}
          onCardPlay={handleCardPlay}
          onPassToggle={handlePassToggle}
          onPass={handlePass}
          onNewGame={() =>
            setConfirmModal({
              message: 'Start a new game? Current progress will be lost.',
              onConfirm: startNewGame,
            })
          }
          onQuitHome={() =>
            setConfirmModal({
              message: 'Quit to home? Current progress will be lost.',
              onConfirm: goHome,
            })
          }
          onNextHand={handleNextHand}
          theme={theme}
          onThemeToggle={toggleTheme}
        />
      )}

      {gameState.phase === 'gameOver' && gameState.gameOverData && (
        <GameOverScreen
          data={gameState.gameOverData}
          record={record}
          onPlayAgain={startNewGame}
          onHome={goHome}
        />
      )}

      {confirmModal && (
        <ConfirmModal
          message={confirmModal.message}
          onConfirm={() => {
            confirmModal.onConfirm()
            setConfirmModal(null)
          }}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {toast && (
        <div className="toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  )
}
