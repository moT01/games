export type Choice = 'rock' | 'paper' | 'scissors';
export type RoundResult = 'win' | 'loss' | 'draw';
export type GameMode = 'free' | 'best-of-3' | 'best-of-5';
export type MatchResult = 'player' | 'computer' | null;

const choices: Choice[] = ['rock', 'paper', 'scissors'];

export function getComputerChoice(): Choice {
  return choices[Math.floor(Math.random() * 3)];
}

const wins: Record<Choice, Choice> = {
  rock: 'scissors',
  scissors: 'paper',
  paper: 'rock',
};

export function getRoundResult(player: Choice, computer: Choice): RoundResult {
  if (player === computer) return 'draw';
  return wins[player] === computer ? 'win' : 'loss';
}

export function getWinsRequired(mode: GameMode): number {
  if (mode === 'best-of-3') return 2;
  if (mode === 'best-of-5') return 3;
  return Infinity;
}

export function getMatchResult(
  playerScore: number,
  computerScore: number,
  mode: GameMode
): MatchResult {
  const threshold = getWinsRequired(mode);
  if (playerScore >= threshold) return 'player';
  if (computerScore >= threshold) return 'computer';
  return null;
}
