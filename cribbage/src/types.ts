import type { Card, Pegs, ScoreCombo, ScoreBreakdown } from './gameLogic'

export type { Card, Pegs, ScoreCombo, ScoreBreakdown }

export interface PeggingState {
  currentCount: number
  currentSequence: Card[]
  allPlayedThisRound: Card[]
  humanCanPlay: boolean
  computerCanPlay: boolean
  isGo: boolean
  selectedCardId: string | null
  turn: 'human' | 'computer'
}

export interface ShowState {
  scorer: 'human' | 'computer' | 'crib' | null
  humanBreakdown: ScoreBreakdown | null
  computerBreakdown: ScoreBreakdown | null
  cribBreakdown: ScoreBreakdown | null
  selectedCardIds: string[]
  claimedCombos: ScoreCombo[]
  allCombos: ScoreCombo[]
  manualError: string | null
}

export interface CutForDealState {
  deck: Card[]
  humanCut: Card | null
  computerCut: Card | null
  result: 'pending' | 'human-deals' | 'computer-deals' | 'tie'
}

export type Phase =
  | 'home'
  | 'cutForDeal'
  | 'dealing'
  | 'discard'
  | 'cut'
  | 'play'
  | 'show'
  | 'summary'
  | 'gameover'

export interface GameState {
  phase: Phase
  deck: Card[]
  humanHand: Card[]
  computerHand: Card[]
  crib: Card[]
  starterCard: Card | null
  humanScore: number
  computerScore: number
  humanPegs: Pegs
  computerPegs: Pegs
  dealer: 'human' | 'computer'
  humanShowHand: Card[]
  computerShowHand: Card[]
  pegging: PeggingState
  show: ShowState
  cutForDeal: CutForDealState | null
  winner: 'human' | 'computer' | null
  lastScoringEvent: string | null
  lastComputerCard: Card | null
  handHistory: string[]
}
