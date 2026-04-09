import { Game, HomeAnimator } from './game.js';
import { loadHighScore } from './storage.js';
import { showHome, showHelpModal, hideHelpModal, showGameControls, hideGameControls } from './ui.js';

let homeAnimator = null;
let activeGame = null;

function getOrCreateCanvas() {
  let canvas = document.getElementById('game-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'game-canvas';
    document.getElementById('app').prepend(canvas);
  }
  return canvas;
}

function startHomeScreen() {
  if (activeGame) { activeGame.destroy(); activeGame = null; }

  showHome(loadHighScore());

  const canvas = getOrCreateCanvas();
  homeAnimator = new HomeAnimator(canvas);

  document.getElementById('start-btn').addEventListener('click', startGame);
  document.getElementById('help-btn').addEventListener('click', () => showHelpModal(false));

  document.addEventListener('keydown', function onEsc(e) {
    if (e.code === 'Escape') { hideHelpModal(); }
    if (e.code === 'Enter' || e.code === 'Space') {
      document.removeEventListener('keydown', onEsc);
      startGame();
    }
  }, { once: false });
}

function startGame() {
  if (homeAnimator) { homeAnimator.destroy(); homeAnimator = null; }
  if (activeGame) { activeGame.destroy(); activeGame = null; }

  const app = document.getElementById('app');
  // Clear DOM overlays
  const homeScreen = document.getElementById('home-screen');
  const goScreen = document.getElementById('gameover-screen');
  if (homeScreen) homeScreen.remove();
  if (goScreen) goScreen.remove();

  const canvas = getOrCreateCanvas();
  showGameControls(() => showHelpModal(true));

  activeGame = new Game(
    canvas,
    (score, wave, highScore) => {
      activeGame = null;
      hideGameControls();
      bindGameOverButtons();
    },
    () => { hideGameControls(); startHomeScreen(); }
  );
}

function bindGameOverButtons() {
  const playAgain = document.getElementById('play-again-btn');
  const homeBtn = document.getElementById('home-btn-go');
  const helpBtn = document.getElementById('help-btn-go');
  if (playAgain) playAgain.addEventListener('click', startGame);
  if (homeBtn) homeBtn.addEventListener('click', startHomeScreen);
  if (helpBtn) helpBtn.addEventListener('click', () => showHelpModal(false));
}

// Boot
startHomeScreen();
