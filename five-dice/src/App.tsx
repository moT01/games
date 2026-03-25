import { useState } from 'react';
import './App.css';
import type { Die, ScoreCategory, Scores } from './gameLogic';
import { initialDice, rollDice, toggleHold, calculateScore, isGameOver } from './gameLogic';
import { DiceArea } from './components/DiceArea';
import { Scorecard } from './components/Scorecard';
import { GameOverScreen } from './components/GameOverScreen';

type GameState = {
  dice: Die[];
  rollCount: number;
  turn: number;
  scores: Scores;
  yahtzeeBonusCount: number;
  gameOver: boolean;
};

function makeInitialState(): GameState {
  return {
    dice: initialDice(),
    rollCount: 0,
    turn: 1,
    scores: {
      ones: null, twos: null, threes: null, fours: null, fives: null, sixes: null,
      threeOfAKind: null, fourOfAKind: null, fullHouse: null,
      smallStraight: null, largeStraight: null, yahtzee: null, chance: null,
    },
    yahtzeeBonusCount: 0,
    gameOver: false,
  };
}

export function App() {
  const [state, setState] = useState<GameState>(makeInitialState);

  function handleRoll() {
    if (state.rollCount >= 3 || state.gameOver) return;
    setState(s => ({ ...s, dice: rollDice(s.dice), rollCount: s.rollCount + 1 }));
  }

  function handleToggleHold(id: number) {
    if (state.rollCount === 0 || state.rollCount >= 3 || state.gameOver) return;
    setState(s => ({ ...s, dice: toggleHold(s.dice, id) }));
  }

  function handleScore(category: ScoreCategory) {
    if (state.rollCount === 0 || state.scores[category] !== null || state.gameOver) return;

    const score = calculateScore(category, state.dice);
    const newScores = { ...state.scores, [category]: score };

    // Award yahtzee bonus if yahtzee was previously scored 50 and current roll is also a yahtzee
    let newBonusCount = state.yahtzeeBonusCount;
    if (state.scores.yahtzee === 50 && calculateScore('yahtzee', state.dice) === 50) {
      newBonusCount++;
    }

    const newTurn = state.turn + 1;

    setState({
      ...state,
      scores: newScores,
      yahtzeeBonusCount: newBonusCount,
      turn: newTurn,
      gameOver: isGameOver(newTurn),
      rollCount: 0,
      dice: initialDice(),
    });
  }

  function handlePlayAgain() {
    setState(makeInitialState());
  }

  if (state.gameOver) {
    return (
      <GameOverScreen
        scores={state.scores}
        yahtzeeBonusCount={state.yahtzeeBonusCount}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  return (
    <div className="app">
      <DiceArea
        dice={state.dice}
        rollCount={state.rollCount}
        turn={state.turn}
        onRoll={handleRoll}
        onToggleHold={handleToggleHold}
        gameOver={state.gameOver}
      />
      <Scorecard
        scores={state.scores}
        dice={state.dice}
        rollCount={state.rollCount}
        yahtzeeBonusCount={state.yahtzeeBonusCount}
        onScore={handleScore}
        gameOver={state.gameOver}
      />
    </div>
  );
}

export default App;
