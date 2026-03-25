import { useState } from 'react';
import type { Choice, GameMode, MatchResult, RoundResult } from './gameLogic';
import { getComputerChoice, getMatchResult, getRoundResult } from './gameLogic';
import { GameScreen } from './components/GameScreen';
import { ModeSelect } from './components/ModeSelect';
import './App.css';

interface GameState {
  mode: GameMode | null;
  playerScore: number;
  computerScore: number;
  drawCount: number;
  roundsPlayed: number;
  lastPlayerChoice: Choice | null;
  lastComputerChoice: Choice | null;
  lastRoundResult: RoundResult | null;
  matchResult: MatchResult;
  isRevealing: boolean;
}

const initialState: GameState = {
  mode: null,
  playerScore: 0,
  computerScore: 0,
  drawCount: 0,
  roundsPlayed: 0,
  lastPlayerChoice: null,
  lastComputerChoice: null,
  lastRoundResult: null,
  matchResult: null,
  isRevealing: false,
};

function App() {
  const [state, setState] = useState<GameState>(initialState);

  function handleSelectMode(mode: GameMode) {
    setState({ ...initialState, mode });
  }

  function handleChoice(playerChoice: Choice) {
    if (state.mode === null || state.isRevealing || state.matchResult !== null) return;

    const computerChoice = getComputerChoice();
    const roundResult = getRoundResult(playerChoice, computerChoice);

    const newPlayerScore = state.playerScore + (roundResult === 'win' ? 1 : 0);
    const newComputerScore = state.computerScore + (roundResult === 'loss' ? 1 : 0);
    const newDrawCount = state.drawCount + (roundResult === 'draw' ? 1 : 0);
    const newMatchResult = getMatchResult(newPlayerScore, newComputerScore, state.mode);

    setState({
      ...state,
      playerScore: newPlayerScore,
      computerScore: newComputerScore,
      drawCount: newDrawCount,
      roundsPlayed: state.roundsPlayed + 1,
      lastPlayerChoice: playerChoice,
      lastComputerChoice: computerChoice,
      lastRoundResult: roundResult,
      matchResult: newMatchResult,
      isRevealing: true,
    });

    setTimeout(() => {
      setState((prev) => ({ ...prev, isRevealing: false }));
    }, 600);
  }

  function handlePlayAgain() {
    if (state.mode === null) return;
    setState({ ...initialState, mode: state.mode });
  }

  function handleChangeMode() {
    setState(initialState);
  }

  function handleResetScore() {
    setState({
      ...state,
      playerScore: 0,
      computerScore: 0,
      drawCount: 0,
      roundsPlayed: 0,
      lastPlayerChoice: null,
      lastComputerChoice: null,
      lastRoundResult: null,
      matchResult: null,
    });
  }

  return (
    <div className="app">
      <h1>Rock Paper Scissors</h1>
      {state.mode === null ? (
        <ModeSelect onSelect={handleSelectMode} />
      ) : (
        <GameScreen
          mode={state.mode}
          playerScore={state.playerScore}
          computerScore={state.computerScore}
          drawCount={state.drawCount}
          lastPlayerChoice={state.lastPlayerChoice}
          lastComputerChoice={state.lastComputerChoice}
          lastRoundResult={state.lastRoundResult}
          matchResult={state.matchResult}
          isRevealing={state.isRevealing}
          onChoice={handleChoice}
          onPlayAgain={handlePlayAgain}
          onChangeMode={handleChangeMode}
          onResetScore={handleResetScore}
        />
      )}
    </div>
  );
}

export default App;
