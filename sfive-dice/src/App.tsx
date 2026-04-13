import { useState, useEffect } from 'react';
import './App.css';
import type { Die, ScoreCategory, Scores } from './gameLogic';
import { initialDice, rollDice, toggleHold, calculateScore, isGameOver, getGrandTotal } from './gameLogic';
import { DiceArea } from './components/DiceArea';
import { Scorecard } from './components/Scorecard';
import { GameOverScreen } from './components/GameOverScreen';
import { HomeScreen } from './components/HomeScreen';
import { ConfirmModal } from './components/ConfirmModal';

const LS_THEME = 'five-dice-theme';
const LS_BEST = 'five-dice-best-score';
const LS_STATE = 'five-dice-state';

type Theme = 'dark' | 'light';
type Screen = 'home' | 'play';

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

function loadSavedState(): GameState | null {
  try {
    const raw = localStorage.getItem(LS_STATE);
    return raw ? (JSON.parse(raw) as GameState) : null;
  } catch {
    return null;
  }
}

export function App() {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(LS_THEME) as Theme) ?? 'dark'
  );
  const [screen, setScreen] = useState<Screen>('home');
  const [bestScore, setBestScore] = useState<number>(
    () => Number(localStorage.getItem(LS_BEST)) || 0
  );
  const [state, setState] = useState<GameState>(
    () => loadSavedState() ?? makeInitialState()
  );
  const [confirmAction, setConfirmAction] = useState<'new-game' | 'quit' | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(LS_THEME, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(LS_STATE, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (state.gameOver) {
      const total = getGrandTotal(state.scores, state.yahtzeeBonusCount);
      if (total > bestScore) {
        setBestScore(total);
        localStorage.setItem(LS_BEST, String(total));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.gameOver]);

  function toggleTheme() {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'));
  }

  const hasSavedGame = !state.gameOver && (state.turn > 1 || state.rollCount > 0);

  function handleResume() {
    setScreen('play');
  }

  function handleStartNew() {
    setState(makeInitialState());
    setScreen('play');
  }

  function isInProgress(): boolean {
    return !state.gameOver && (state.turn > 1 || state.rollCount > 0);
  }

  function handleNewGame() {
    if (isInProgress()) {
      setConfirmAction('new-game');
    } else {
      doNewGame();
    }
  }

  function handleQuit() {
    if (isInProgress()) {
      setConfirmAction('quit');
    } else {
      doQuit();
    }
  }

  function doNewGame() {
    setState(makeInitialState());
    setConfirmAction(null);
  }

  function doQuit() {
    setScreen('home');
    setConfirmAction(null);
  }

  function handleConfirm() {
    if (confirmAction === 'new-game') doNewGame();
    else if (confirmAction === 'quit') doQuit();
  }

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

  if (screen === 'home') {
    return (
      <HomeScreen
        bestScore={bestScore}
        hasSavedGame={hasSavedGame}
        theme={theme}
        onToggleTheme={toggleTheme}
        onNew={handleStartNew}
        onResume={handleResume}
      />
    );
  }

  if (state.gameOver) {
    return (
      <GameOverScreen
        scores={state.scores}
        yahtzeeBonusCount={state.yahtzeeBonusCount}
        bestScore={bestScore}
        theme={theme}
        onToggleTheme={toggleTheme}
        onPlayAgain={doNewGame}
        onQuit={doQuit}
      />
    );
  }

  return (
    <>
      {confirmAction && (
        <ConfirmModal
          message={
            confirmAction === 'new-game'
              ? 'Start a new game? Your current progress will be lost.'
              : 'Quit to home? Your current progress will be lost.'
          }
          onConfirm={handleConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      <div className="app">
        <DiceArea
          dice={state.dice}
          rollCount={state.rollCount}
          turn={state.turn}
          onRoll={handleRoll}
          onToggleHold={handleToggleHold}
          gameOver={state.gameOver}
          theme={theme}
          onToggleTheme={toggleTheme}
          onNewGame={handleNewGame}
          onQuit={handleQuit}
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
    </>
  );
}

export default App;
