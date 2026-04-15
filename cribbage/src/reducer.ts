import type { GameState, Phase, ShowState, PeggingState } from './types'
import {
  createDeck,
  shuffle,
  dealHands,
  cardValue,
  rankOrder,
  allCombinations,
  scoreHand,
  scorePegging,
  resolveGo,
  advancePegs,
  checkWin,
  computerDiscard,
  computerPlayCard,
} from './gameLogic'
import type { Card } from './gameLogic'

const DEFAULT_PEGGING: PeggingState = {
  currentCount: 0,
  currentSequence: [],
  allPlayedThisRound: [],
  humanCanPlay: true,
  computerCanPlay: true,
  isGo: false,
  selectedCardId: null,
  turn: 'human',
}

const DEFAULT_SHOW: ShowState = {
  scorer: null,
  humanBreakdown: null,
  computerBreakdown: null,
  cribBreakdown: null,
  selectedCardIds: [],
  claimedCombos: [],
  allCombos: [],
  manualError: null,
}

export function makeInitialState(): GameState {
  return {
    phase: 'home',
    deck: [],
    humanHand: [],
    computerHand: [],
    crib: [],
    starterCard: null,
    humanScore: 0,
    computerScore: 0,
    humanPegs: { front: 0, back: 0 },
    computerPegs: { front: 0, back: 0 },
    dealer: 'human',
    pegging: { ...DEFAULT_PEGGING },
    show: { ...DEFAULT_SHOW },
    cutForDeal: null,
    winner: null,
    lastScoringEvent: null,
    lastComputerCard: null,
    handHistory: [],
  }
}

export type Action =
  | { type: 'SET_PHASE'; phase: Phase }
  | { type: 'START_CUT_FOR_DEAL' }
  | { type: 'HUMAN_CUT'; cardIndex: number }
  | { type: 'COMPUTER_CUT' }
  | { type: 'FINISH_CUT_FOR_DEAL' }
  | { type: 'DEAL_HANDS' }
  | { type: 'HUMAN_DISCARD'; cards: [Card, Card] }
  | { type: 'COMPUTER_DISCARD' }
  | { type: 'CUT_STARTER' }
  | { type: 'SELECT_PLAY_CARD'; cardId: string }
  | { type: 'PLAY_CARD' }
  | { type: 'COMPUTER_PLAY_CARD' }
  | { type: 'DECLARE_GO' }
  | { type: 'RESOLVE_GO' }
  | { type: 'CLEAR_SCORING_EVENT' }
  | { type: 'AUTO_SCORE_SHOW' }
  | { type: 'ADVANCE_SHOW_SCORER' }
  | { type: 'SHOW_SELECT_CARD'; cardId: string }
  | { type: 'SHOW_CLAIM_COMBO' }
  | { type: 'SHOW_DONE' }
  | { type: 'NEXT_HAND' }
  | { type: 'PLAY_AGAIN' }

function awardPoints(
  state: GameState,
  player: 'human' | 'computer',
  points: number,
  event: string
): GameState {
  if (points <= 0) return state
  const scoreKey = player === 'human' ? 'humanScore' : 'computerScore'
  const pegsKey = player === 'human' ? 'humanPegs' : 'computerPegs'
  const newScore = state[scoreKey] + points
  const newPegs = advancePegs(state[pegsKey], points)
  const newHistory = [...state.handHistory, event]
  if (checkWin(newScore)) {
    return {
      ...state,
      [scoreKey]: newScore,
      [pegsKey]: newPegs,
      winner: player,
      phase: 'gameover',
      lastScoringEvent: event,
      handHistory: newHistory,
    }
  }
  return {
    ...state,
    [scoreKey]: newScore,
    [pegsKey]: newPegs,
    lastScoringEvent: event,
    handHistory: newHistory,
  }
}

function canPlay(hand: Card[], count: number): boolean {
  return hand.some(c => cardValue(c) + count <= 31)
}

function beginShow(state: GameState): GameState {
  const nonDealer = state.dealer === 'human' ? 'computer' : 'human'
  const scorer = nonDealer
  const starter = state.starterCard!
  const hand =
    scorer === 'human' ? state.humanHand : state.computerHand
  const combos = scorer === 'human' ? allCombinations(hand, starter, false) : []
  return {
    ...state,
    phase: 'show',
    show: {
      ...DEFAULT_SHOW,
      scorer,
      allCombos: combos,
    },
  }
}

function advanceShowScorer(state: GameState): GameState {
  const { scorer } = state.show
  const dealer = state.dealer
  const nonDealer = dealer === 'human' ? 'computer' : 'human'
  let next: ShowState['scorer']
  if (scorer === nonDealer) {
    next = dealer
  } else if (scorer === dealer) {
    next = 'crib'
  } else {
    next = null
  }

  if (next === null) {
    return { ...state, show: { ...state.show, scorer: null }, phase: 'summary' }
  }

  const starter = state.starterCard!
  const hand =
    next === 'crib'
      ? state.crib
      : next === 'human'
        ? state.humanHand
        : state.computerHand
  const isCrib = next === 'crib'
  const isHumanTurn =
    (next === 'human' || (isCrib && dealer === 'human')) &&
    state.countingMode === 'manual'

  const combos = isHumanTurn ? allCombinations(hand, starter, isCrib) : []

  return {
    ...state,
    show: {
      ...DEFAULT_SHOW,
      scorer: next,
      allCombos: combos,
      humanBreakdown: state.show.humanBreakdown,
      computerBreakdown: state.show.computerBreakdown,
      cribBreakdown: state.show.cribBreakdown,
    },
  }
}

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START_CUT_FOR_DEAL': {
      const deck = shuffle(createDeck())
      return {
        ...state,
        phase: 'cutForDeal',
        cutForDeal: {
          deck,
          humanCut: null,
          computerCut: null,
          result: 'pending',
        },
      }
    }

    case 'HUMAN_CUT': {
      if (!state.cutForDeal) return state
      const card = state.cutForDeal.deck[action.cardIndex]
      return {
        ...state,
        cutForDeal: { ...state.cutForDeal, humanCut: card },
      }
    }

    case 'COMPUTER_CUT': {
      if (!state.cutForDeal || !state.cutForDeal.humanCut) return state
      const available = state.cutForDeal.deck.filter(
        c => c.id !== state.cutForDeal!.humanCut!.id
      )
      const idx = Math.floor(Math.random() * available.length)
      const card = available[idx]
      const humanRank = rankOrder(state.cutForDeal.humanCut)
      const compRank = rankOrder(card)
      let result: CutForDealState['result']
      if (humanRank < compRank) result = 'human-deals'
      else if (compRank < humanRank) result = 'computer-deals'
      else result = 'tie'
      return {
        ...state,
        cutForDeal: { ...state.cutForDeal, computerCut: card, result },
      }
    }

    case 'FINISH_CUT_FOR_DEAL': {
      if (!state.cutForDeal) return state
      const { result } = state.cutForDeal
      if (result === 'tie') {
        const deck = shuffle(createDeck())
        return {
          ...state,
          cutForDeal: { deck, humanCut: null, computerCut: null, result: 'pending' },
        }
      }
      const dealer: 'human' | 'computer' =
        result === 'human-deals' ? 'human' : 'computer'
      return { ...state, dealer, cutForDeal: null, phase: 'dealing' }
    }

    case 'DEAL_HANDS': {
      const deck = shuffle(createDeck())
      const { humanHand, computerHand, remainingDeck } = dealHands(deck)
      const sortedHand = [...humanHand].sort((a, b) => rankOrder(a) - rankOrder(b))
      return {
        ...state,
        deck: remainingDeck,
        humanHand: sortedHand,
        computerHand,
        crib: [],
        starterCard: null,
        pegging: { ...DEFAULT_PEGGING },
        show: { ...DEFAULT_SHOW },
        handHistory: [],
        lastScoringEvent: null,
        phase: 'discard',
      }
    }

    case 'HUMAN_DISCARD': {
      const [c1, c2] = action.cards
      const newHand = state.humanHand.filter(
        c => c.id !== c1.id && c.id !== c2.id
      )
      return {
        ...state,
        humanHand: newHand,
        crib: [...state.crib, c1, c2],
      }
    }

    case 'COMPUTER_DISCARD': {
      const [c1, c2] = computerDiscard(state.computerHand, state.dealer === 'computer')
      const newHand = state.computerHand.filter(
        c => c.id !== c1.id && c.id !== c2.id
      )
      return {
        ...state,
        computerHand: newHand,
        crib: [...state.crib, c1, c2],
        phase: 'cut',
      }
    }

    case 'CUT_STARTER': {
      const card = state.deck[Math.floor(Math.random() * state.deck.length)]
      let next: GameState = { ...state, starterCard: card }
      if (card.rank === 'J') {
        const pts = 2
        const event = 'Nibs! Dealer scores 2'
        next = awardPoints(next, next.dealer, pts, event)
      }
      if (next.phase === 'gameover') return next
      const nonDealer = next.dealer === 'human' ? 'computer' : 'human'
      return {
        ...next,
        phase: 'play',
        pegging: {
          ...DEFAULT_PEGGING,
          turn: nonDealer,
          humanCanPlay: canPlay(next.humanHand, 0),
          computerCanPlay: canPlay(next.computerHand, 0),
        },
      }
    }

    case 'SELECT_PLAY_CARD': {
      if (state.pegging.turn !== 'human') return state
      const card = state.humanHand.find(c => c.id === action.cardId)
      if (!card) return state
      if (cardValue(card) + state.pegging.currentCount > 31) return state
      return {
        ...state,
        pegging: { ...state.pegging, selectedCardId: action.cardId },
      }
    }

    case 'PLAY_CARD': {
      if (state.pegging.turn !== 'human') return state
      const { selectedCardId, currentCount, currentSequence, allPlayedThisRound } =
        state.pegging
      if (!selectedCardId) return state
      const card = state.humanHand.find(c => c.id === selectedCardId)
      if (!card) return state

      const newHand = state.humanHand.filter(c => c.id !== card.id)
      const newSeq = [...currentSequence, card]
      const newAll = [...allPlayedThisRound, card]
      const newCount = currentCount + cardValue(card)
      const { points, events } = scorePegging(currentSequence, card, currentCount)

      let next: GameState = { ...state, humanHand: newHand, lastComputerCard: null }
      if (points > 0) {
        next = awardPoints(next, 'human', points, events.join(', '))
      }
      if (next.phase === 'gameover') return next

      const allPlayed = newAll.length === 8
      if (allPlayed) {
        next = {
          ...next,
          pegging: {
            ...next.pegging,
            currentCount: newCount,
            currentSequence: newSeq,
            allPlayedThisRound: newAll,
            selectedCardId: null,
          },
        }
        return beginShow(next)
      }

      const resetCount = newCount === 31
      const seq = resetCount ? [] : newSeq
      const cnt = resetCount ? 0 : newCount

      const hCanPlay = canPlay(newHand, cnt)
      const cCanPlay = canPlay(next.computerHand, cnt)

      return {
        ...next,
        pegging: {
          ...next.pegging,
          currentCount: cnt,
          currentSequence: seq,
          allPlayedThisRound: newAll,
          selectedCardId: null,
          turn: 'computer',
          humanCanPlay: hCanPlay,
          computerCanPlay: cCanPlay,
          isGo: false,
        },
      }
    }

    case 'COMPUTER_PLAY_CARD': {
      if (state.pegging.turn !== 'computer') return state
      const { currentCount, currentSequence, allPlayedThisRound } = state.pegging

      if (!canPlay(state.computerHand, currentCount)) {
        // computer must go
        const goPoints = resolveGo(currentSequence, currentCount)
        let next: GameState = state
        if (goPoints > 0) {
          next = awardPoints(next, 'computer', goPoints, 'Go for 1')
        }
        if (next.phase === 'gameover') return next
        return {
          ...next,
          pegging: {
            ...next.pegging,
            currentCount: 0,
            currentSequence: [],
            turn: 'human',
            computerCanPlay: canPlay(next.computerHand, 0),
            humanCanPlay: canPlay(next.humanHand, 0),
            isGo: false,
          },
        }
      }

      const card = computerPlayCard(state.computerHand, currentSequence, currentCount)
      const newHand = state.computerHand.filter(c => c.id !== card.id)
      const newSeq = [...currentSequence, card]
      const newAll = [...allPlayedThisRound, card]
      const newCount = currentCount + cardValue(card)
      const { points, events } = scorePegging(currentSequence, card, currentCount)

      let next: GameState = { ...state, computerHand: newHand, lastComputerCard: card }
      if (points > 0) {
        next = awardPoints(next, 'computer', points, events.join(', '))
      }
      if (next.phase === 'gameover') return next

      const allPlayed = newAll.length === 8
      if (allPlayed) {
        next = {
          ...next,
          pegging: {
            ...next.pegging,
            currentCount: newCount,
            currentSequence: newSeq,
            allPlayedThisRound: newAll,
          },
        }
        return beginShow(next)
      }

      const resetCount = newCount === 31
      const seq = resetCount ? [] : newSeq
      const cnt = resetCount ? 0 : newCount

      const hCanPlay = canPlay(next.humanHand, cnt)
      const cCanPlay = canPlay(newHand, cnt)

      return {
        ...next,
        pegging: {
          ...next.pegging,
          currentCount: cnt,
          currentSequence: seq,
          allPlayedThisRound: newAll,
          turn: 'human',
          humanCanPlay: hCanPlay,
          computerCanPlay: cCanPlay,
          isGo: !hCanPlay,
        },
      }
    }

    case 'DECLARE_GO': {
      // Human declares go
      const goPoints = resolveGo(state.pegging.currentSequence, state.pegging.currentCount)
      let next: GameState = state
      if (goPoints > 0) {
        next = awardPoints(next, 'computer', goPoints, 'Go for 1')
      }
      if (next.phase === 'gameover') return next
      return {
        ...next,
        pegging: {
          ...next.pegging,
          currentCount: 0,
          currentSequence: [],
          turn: 'computer',
          isGo: false,
          humanCanPlay: canPlay(next.humanHand, 0),
          computerCanPlay: canPlay(next.computerHand, 0),
        },
      }
    }

    case 'CLEAR_SCORING_EVENT': {
      return { ...state, lastScoringEvent: null }
    }

    case 'AUTO_SCORE_SHOW': {
      const { scorer } = state.show
      if (!scorer) return state
      const starter = state.starterCard!
      const hand =
        scorer === 'crib'
          ? state.crib
          : scorer === 'human'
            ? state.humanHand
            : state.computerHand
      const isCrib = scorer === 'crib'
      const player =
        scorer === 'crib' ? state.dealer : scorer
      const breakdown = scoreHand(hand, starter, isCrib)
      const label =
        scorer === 'crib'
          ? `Crib: ${breakdown.total} pts`
          : `${scorer === 'human' ? 'You' : 'Computer'} show: ${breakdown.total} pts`

      let next = awardPoints(state, player, breakdown.total, label)
      if (next.phase === 'gameover') return next

      const breakdownKey =
        scorer === 'human'
          ? 'humanBreakdown'
          : scorer === 'computer'
            ? 'computerBreakdown'
            : 'cribBreakdown'
      next = {
        ...next,
        show: { ...next.show, [breakdownKey]: breakdown },
      }
      return advanceShowScorer(next)
    }

    case 'ADVANCE_SHOW_SCORER': {
      return advanceShowScorer(state)
    }

    case 'SHOW_SELECT_CARD': {
      const { selectedCardIds } = state.show
      const already = selectedCardIds.includes(action.cardId)
      const next = already
        ? selectedCardIds.filter(id => id !== action.cardId)
        : [...selectedCardIds, action.cardId]
      return { ...state, show: { ...state.show, selectedCardIds: next, manualError: null } }
    }

    case 'SHOW_CLAIM_COMBO': {
      const { show, starterCard } = state
      const { scorer, selectedCardIds, allCombos, claimedCombos } = show
      if (!scorer || !starterCard) return state

      const selectedIdsSorted = [...selectedCardIds].sort()
      const matchingCombo = allCombos.find(combo => {
        const comboIds = [...combo.cardIds].sort()
        return (
          comboIds.length === selectedIdsSorted.length &&
          comboIds.every((id, i) => id === selectedIdsSorted[i])
        )
      })

      if (!matchingCombo) {
        return { ...state, show: { ...show, manualError: 'Not a valid scoring combination' } }
      }

      const alreadyClaimed = claimedCombos.some(claimed => {
        const claimedIds = [...claimed.cardIds].sort()
        return (
          claimedIds.length === selectedIdsSorted.length &&
          claimedIds.every((id, i) => id === selectedIdsSorted[i]) &&
          claimed.type === matchingCombo.type
        )
      })

      if (alreadyClaimed) {
        return { ...state, show: { ...show, manualError: 'Already claimed' } }
      }

      return {
        ...state,
        show: {
          ...show,
          claimedCombos: [...claimedCombos, matchingCombo],
          selectedCardIds: [],
          manualError: null,
        },
      }
    }

    case 'SHOW_DONE': {
      const { show, starterCard } = state
      const { scorer, claimedCombos } = show
      if (!scorer || !starterCard) return state

      const total = claimedCombos.reduce((s, c) => s + c.points, 0)
      const player =
        scorer === 'crib' ? state.dealer : scorer
      const label =
        scorer === 'crib'
          ? `Crib: ${total} pts`
          : `${scorer === 'human' ? 'You' : 'Computer'} show: ${total} pts`

      let next = awardPoints(state, player, total, label)
      if (next.phase === 'gameover') return next

      const hand =
        scorer === 'crib'
          ? state.crib
          : scorer === 'human'
            ? state.humanHand
            : state.computerHand
      const isCrib = scorer === 'crib'
      const breakdown = scoreHand(hand, starterCard, isCrib)
      const breakdownKey =
        scorer === 'human'
          ? 'humanBreakdown'
          : scorer === 'computer'
            ? 'computerBreakdown'
            : 'cribBreakdown'
      next = { ...next, show: { ...next.show, [breakdownKey]: breakdown } }
      return advanceShowScorer(next)
    }

    case 'NEXT_HAND': {
      const newDealer = state.dealer === 'human' ? 'computer' : 'human'
      const deck = shuffle(createDeck())
      const { humanHand, computerHand, remainingDeck } = dealHands(deck)
      return {
        ...state,
        deck: remainingDeck,
        humanHand,
        computerHand,
        crib: [],
        starterCard: null,
        dealer: newDealer,
        pegging: { ...DEFAULT_PEGGING },
        show: { ...DEFAULT_SHOW },
        handHistory: [],
        lastScoringEvent: null,
        phase: 'discard',
      }
    }

    case 'PLAY_AGAIN': {
      const saved = localStorage.getItem('countingMode')
      const countingMode: 'manual' | 'auto' = saved === 'manual' ? 'manual' : 'auto'
      return {
        ...makeInitialState(),
        countingMode,
        phase: 'home',
      }
    }

    default:
      return state
  }
}

// Re-export for use in reducer
type CutForDealState = NonNullable<GameState['cutForDeal']>
