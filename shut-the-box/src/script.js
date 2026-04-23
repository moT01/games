// --- Game Logic ---

function initGame() {
  return {
    tiles: [true, true, true, true, true, true, true, true, true],
    dice: [],
    diceTotal: 0,
    selectedTiles: [],
    phase: 'rolling',
    canRollOneDie: false,
    diceCount: 2,
  };
}

function getValidCombinations(openTileIndices, target) {
  const results = [];
  function search(start, remaining, current) {
    if (remaining === 0) {
      results.push([...current]);
      return;
    }
    for (let i = start; i < openTileIndices.length; i++) {
      const val = openTileIndices[i] + 1;
      if (val > remaining) break;
      current.push(openTileIndices[i]);
      search(i + 1, remaining - val, current);
      current.pop();
    }
  }
  search(0, target, []);
  return results;
}

function checkNoMoves(state) {
  const openIndices = state.tiles
    .map((open, i) => (open ? i : -1))
    .filter(i => i !== -1);
  const combos = getValidCombinations(openIndices, state.diceTotal);
  return combos.length === 0;
}

function rollDice(state) {
  const count = state.diceCount;
  const dice = [];
  for (let i = 0; i < count; i++) {
    dice.push(Math.floor(Math.random() * 6) + 1);
  }
  state.dice = dice;
  state.diceTotal = dice.reduce((a, b) => a + b, 0);
  if (checkNoMoves(state)) {
    endGame(state);
  } else {
    state.phase = 'selecting';
  }
}

function toggleTileSelection(state, tileIndex) {
  if (!state.tiles[tileIndex]) return; // shut tile: no-op
  const alreadySelected = state.selectedTiles.indexOf(tileIndex);
  if (alreadySelected !== -1) {
    state.selectedTiles.splice(alreadySelected, 1);
    return;
  }
  const currentSum = state.selectedTiles.reduce((sum, i) => sum + (i + 1), 0);
  const tileValue = tileIndex + 1;
  if (currentSum + tileValue > state.diceTotal) {
    return 'shake'; // signal to UI to shake the tile
  }
  state.selectedTiles.push(tileIndex);
}

function confirmSelection(state) {
  const selectedSum = state.selectedTiles.reduce((sum, i) => sum + (i + 1), 0);
  if (selectedSum !== state.diceTotal) return;
  for (const i of state.selectedTiles) {
    state.tiles[i] = false;
  }
  state.selectedTiles = [];
  updateCanRollOneDie(state);
  if (state.tiles.every(t => !t)) {
    endGame(state);
    return;
  }
  state.phase = 'rolling';
}

function updateCanRollOneDie(state) {
  state.canRollOneDie = !state.tiles[6] && !state.tiles[7] && !state.tiles[8];
  if (!state.canRollOneDie) {
    state.diceCount = 2;
  }
}

function setDiceCount(state, count) {
  if (state.canRollOneDie && state.phase === 'rolling') {
    state.diceCount = count;
  }
}

function calcScore(tiles) {
  return tiles.reduce((sum, open, i) => sum + (open ? i + 1 : 0), 0);
}

function endGame(state) {
  state.score = calcScore(state.tiles);
  state.phase = 'game-over';
  saveBestScore(state.score);
}

function saveGame(state) {
  try {
    localStorage.setItem('stb-saved-game', JSON.stringify(state));
  } catch (e) {}
}

function loadGame() {
  try {
    const raw = localStorage.getItem('stb-saved-game');
    if (!raw) return null;
    const state = JSON.parse(raw);
    if (!state || !Array.isArray(state.tiles)) return null;
    return state;
  } catch (e) {
    return null;
  }
}

function clearSavedGame() {
  localStorage.removeItem('stb-saved-game');
}

function saveBestScore(score) {
  const key = 'stb-best-score';
  const existing = localStorage.getItem(key);
  if (existing === null || score < parseInt(existing, 10)) {
    localStorage.setItem(key, String(score));
  }
}

// --- UI State ---

let state = null;
let shakingTile = null;

// --- Rendering ---

function getBestScore() {
  const raw = localStorage.getItem('stb-best-score');
  return raw !== null ? parseInt(raw, 10) : null;
}

function hasSavedGame() {
  return localStorage.getItem('stb-saved-game') !== null;
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function renderHome() {
  const best = getBestScore();
  const bestEl = document.getElementById('home-best');
  bestEl.textContent = best !== null ? best : '--';

  const resumeBtn = document.getElementById('btn-resume');
  if (hasSavedGame()) {
    resumeBtn.classList.add('visible');
  } else {
    resumeBtn.classList.remove('visible');
  }

  showScreen('screen-home');
}

function renderPlay() {
  renderTiles();
  renderDice();
  renderStatus();
  renderScore();
  renderButtons();
  renderDiceCountToggle();
  showScreen('screen-play');
}

function renderTiles() {
  const container = document.getElementById('tile-row');
  container.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const tile = document.createElement('button');
    tile.className = 'tile';
    tile.dataset.index = i;
    const isOpen = state.tiles[i];
    const isSelected = state.selectedTiles.indexOf(i) !== -1;
    tile.textContent = i + 1;
    tile.setAttribute('aria-label', `Tile ${i + 1}, ${isOpen ? 'open' : 'shut'}`);
    tile.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    if (!isOpen) tile.classList.add('shut');
    if (isSelected) tile.classList.add('selected');
    if (shakingTile === i) tile.classList.add('shake');
    if (state.phase !== 'selecting' || !isOpen) tile.disabled = true;
    tile.addEventListener('click', () => onTileClick(i));
    container.appendChild(tile);
  }
}

function renderDice() {
  const container = document.getElementById('dice-area');
  container.innerHTML = '';
  if (state.dice.length === 0) {
    const placeholder = document.createElement('div');
    placeholder.className = 'dice-placeholder';
    placeholder.textContent = 'Roll the dice';
    container.appendChild(placeholder);
    return;
  }
  for (const val of state.dice) {
    const die = document.createElement('div');
    die.className = 'die';
    die.setAttribute('aria-label', `Die showing ${val}`);
    die.innerHTML = getDiePips(val);
    container.appendChild(die);
  }
}

function getDiePips(val) {
  const layouts = {
    1: [false, false, false, false, true, false, false, false, false],
    2: [true,  false, false, false, false, false, false, false, true],
    3: [true,  false, false, false, true,  false, false, false, true],
    4: [true,  false, true,  false, false, false, true,  false, true],
    5: [true,  false, true,  false, true,  false, true,  false, true],
    6: [true,  false, true,  true,  false, true,  true,  false, true],
  };
  const pips = layouts[val] || layouts[1];
  return pips.map(active => `<span class="pip${active ? ' pip-on' : ''}"></span>`).join('');
}

function renderStatus() {
  const el = document.getElementById('status-line');
  if (state.phase === 'rolling') {
    el.textContent = 'Roll the dice to begin your turn.';
  } else if (state.phase === 'selecting') {
    const selectedSum = state.selectedTiles.reduce((s, i) => s + (i + 1), 0);
    el.textContent = `Dice total: ${state.diceTotal}   Selected: ${selectedSum}`;
  }
}

function renderScore() {
  const el = document.getElementById('live-score');
  el.textContent = calcScore(state.tiles);
}

function renderButtons() {
  const rollBtn = document.getElementById('btn-roll');
  const confirmBtn = document.getElementById('btn-confirm');

  rollBtn.disabled = state.phase !== 'rolling';

  const selectedSum = state.selectedTiles.reduce((s, i) => s + (i + 1), 0);
  confirmBtn.disabled = state.phase !== 'selecting' || selectedSum !== state.diceTotal;
}

function renderDiceCountToggle() {
  const toggleEl = document.getElementById('dice-count-toggle');
  if (state.canRollOneDie && state.phase === 'rolling') {
    toggleEl.classList.add('visible');
    document.getElementById('btn-one-die').setAttribute('aria-pressed', state.diceCount === 1 ? 'true' : 'false');
    document.getElementById('btn-two-dice').setAttribute('aria-pressed', state.diceCount === 2 ? 'true' : 'false');
    document.getElementById('btn-one-die').classList.toggle('active', state.diceCount === 1);
    document.getElementById('btn-two-dice').classList.toggle('active', state.diceCount === 2);
  } else {
    toggleEl.classList.remove('visible');
  }
}

function renderGameOver() {
  const score = state.score !== undefined ? state.score : calcScore(state.tiles);
  const best = getBestScore();
  document.getElementById('gameover-score').textContent = score;
  const banner = document.getElementById('gameover-banner');
  banner.textContent = score === 0 ? 'Shut the Box!' : '';
  banner.style.display = score === 0 ? '' : 'none';
  document.getElementById('gameover-best').textContent = best !== null ? best : '--';

  const overlay = document.getElementById('gameover-overlay');
  overlay.classList.add('visible');
  if (score === 0) {
    const container = document.querySelector('.play-container');
    if (container) {
      container.classList.add('celebrate');
      setTimeout(() => container.classList.remove('celebrate'), 500);
    }
  }
  overlay.querySelector('[data-first-focus]').focus();
}

// --- Event Handlers ---

function onTileClick(i) {
  if (state.phase !== 'selecting') return;
  const result = toggleTileSelection(state, i);
  if (result === 'shake') {
    shakingTile = i;
    renderTiles();
    setTimeout(() => {
      shakingTile = null;
      renderTiles();
    }, 200);
    return;
  }
  saveGame(state);
  renderTiles();
  renderStatus();
  renderButtons();
}

function onRoll() {
  rollDice(state);
  saveGame(state);
  renderPlay();
  // Add roll animation class to dice
  document.querySelectorAll('.die').forEach(d => {
    d.classList.add('rolling');
    setTimeout(() => d.classList.remove('rolling'), 350);
  });
  if (state.phase === 'game-over') {
    renderGameOver();
  }
}

function onConfirm() {
  const justShut = [...state.selectedTiles];
  confirmSelection(state);
  saveGame(state);
  renderPlay();
  // Animate newly shut tiles
  justShut.forEach(i => {
    const tile = document.querySelector(`.tile[data-index="${i}"]`);
    if (tile) tile.classList.add('shutting');
  });
  if (state.phase === 'game-over') {
    setTimeout(() => renderGameOver(), 250);
  }
}

function onNewGame() {
  if (hasSavedGame()) {
    showConfirmModal('Quit this game? Your progress will be lost.', () => {
      clearSavedGame();
      startNewGame();
    });
  } else {
    startNewGame();
  }
}

function startNewGame() {
  state = initGame();
  saveGame(state);
  renderPlay();
}

function onResume() {
  const saved = loadGame();
  if (saved) {
    state = saved;
    renderPlay();
  } else {
    startNewGame();
  }
}

function onClosePlay() {
  showConfirmModal('Quit this game? Your progress will be lost.', () => {
    clearSavedGame();
    state = null;
    renderHome();
  });
}

function onPlayAgain() {
  document.getElementById('gameover-overlay').classList.remove('visible');
  clearSavedGame();
  state = initGame();
  saveGame(state);
  renderPlay();
}

function onMenuFromGameOver() {
  document.getElementById('gameover-overlay').classList.remove('visible');
  clearSavedGame();
  state = null;
  renderHome();
}

// --- Help Modal ---

function showHelpModal() {
  const modal = document.getElementById('help-modal');
  modal.classList.add('visible');
  modal.querySelector('[data-first-focus]').focus();
}

function closeHelpModal() {
  document.getElementById('help-modal').classList.remove('visible');
}

// --- Confirm Modal ---

let confirmCallback = null;

function showConfirmModal(message, onConfirm) {
  confirmCallback = onConfirm;
  document.getElementById('confirm-message').textContent = message;
  const modal = document.getElementById('confirm-modal');
  modal.classList.add('visible');
  modal.querySelector('[data-first-focus]').focus();
}

function closeConfirmModal() {
  document.getElementById('confirm-modal').classList.remove('visible');
  confirmCallback = null;
}

function onConfirmModalQuit() {
  const cb = confirmCallback;
  closeConfirmModal();
  if (cb) cb();
}

// --- Theme ---

function initTheme() {
  const saved = localStorage.getItem('stb-theme');
  document.body.classList.toggle('light-palette', saved === 'light');
}

function toggleTheme() {
  const isLight = document.body.classList.toggle('light-palette');
  localStorage.setItem('stb-theme', isLight ? 'light' : 'dark');
}

// --- Focus Trap ---

function trapFocus(modal) {
  const focusable = modal.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  modal.addEventListener('keydown', function handler(e) {
    if (e.key === 'Escape') {
      modal.classList.remove('visible');
      if (modal.id === 'confirm-modal') confirmCallback = null;
      return;
    }
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}

// --- Init ---

document.addEventListener('DOMContentLoaded', () => {
  initTheme();

  // Home screen
  document.getElementById('btn-new-game-home').addEventListener('click', onNewGame);
  document.getElementById('btn-resume').addEventListener('click', onResume);
  document.getElementById('btn-help-home').addEventListener('click', showHelpModal);
  document.getElementById('btn-theme-home').addEventListener('click', toggleTheme);

  // Play screen
  document.getElementById('btn-roll').addEventListener('click', onRoll);
  document.getElementById('btn-confirm').addEventListener('click', onConfirm);
  document.getElementById('btn-close-play').addEventListener('click', onClosePlay);
  document.getElementById('btn-help-play').addEventListener('click', showHelpModal);
  document.getElementById('btn-theme-play').addEventListener('click', toggleTheme);
  document.getElementById('btn-one-die').addEventListener('click', () => {
    setDiceCount(state, 1);
    renderDiceCountToggle();
  });
  document.getElementById('btn-two-dice').addEventListener('click', () => {
    setDiceCount(state, 2);
    renderDiceCountToggle();
  });

  // Game over overlay
  document.getElementById('btn-play-again').addEventListener('click', onPlayAgain);
  document.getElementById('btn-menu').addEventListener('click', onMenuFromGameOver);

  // Help modal
  document.getElementById('btn-close-help').addEventListener('click', closeHelpModal);

  // Confirm modal
  document.getElementById('btn-confirm-cancel').addEventListener('click', closeConfirmModal);
  document.getElementById('btn-confirm-quit').addEventListener('click', onConfirmModalQuit);

  // Focus traps
  trapFocus(document.getElementById('help-modal'));
  trapFocus(document.getElementById('confirm-modal'));
  trapFocus(document.getElementById('gameover-overlay'));

  renderHome();
});
