// ── Icons ───────────────────────────────────────────────────────────────────

const ICON_QUESTION = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" fill="currentColor"><path d="M64 160c0-53 43-96 96-96s96 43 96 96c0 42.7-27.9 78.9-66.5 91.4-28.4 9.2-61.5 35.3-61.5 76.6l0 24c0 17.7 14.3 32 32 32s32-14.3 32-32l0-24c0-1.7 .6-4.1 3.5-7.3 3-3.3 7.9-6.5 13.7-8.4 64.3-20.7 110.8-81 110.8-152.3 0-88.4-71.6-160-160-160S0 71.6 0 160c0 17.7 14.3 32 32 32s32-14.3 32-32zm96 352c22.1 0 40-17.9 40-40s-17.9-40-40-40-40 17.9-40 40 17.9 40 40 40z"/></svg>`;
const ICON_HEART = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor"><path d="M241 87.1l15 20.7 15-20.7C296 52.5 336.2 32 378.9 32 452.4 32 512 91.6 512 165.1l0 2.6c0 112.2-139.9 242.5-212.9 298.2-12.4 9.4-27.6 14.1-43.1 14.1s-30.8-4.6-43.1-14.1C139.9 410.2 0 279.9 0 167.7l0-2.6C0 91.6 59.6 32 133.1 32 175.8 32 216 52.5 241 87.1z"/></svg>`;
const ICON_X = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="currentColor"><path d="M376.6 84.5c11.3-13.6 9.5-33.8-4.1-45.1s-33.8-9.5-45.1 4.1L192 206 56.6 43.5C45.3 29.9 25.1 28.1 11.5 39.4S-3.9 70.9 7.4 84.5L150.3 256 7.4 427.5c-11.3 13.6-9.5 33.8 4.1 45.1s33.8 9.5 45.1-4.1L192 306 327.4 468.5c11.3 13.6 31.5 15.4 45.1 4.1s15.4-31.5 4.1-45.1L233.7 256 376.6 84.5z"/></svg>`;

function sunIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="currentColor"><path d="M288-32c8.4 0 16.3 4.4 20.6 11.7L364.1 72.3 468.9 46c8.2-2 16.9 .4 22.8 6.3S500 67 498 75.1l-26.3 104.7 92.7 55.5c7.2 4.3 11.7 12.2 11.7 20.6s-4.4 16.3-11.7 20.6L471.7 332.1 498 436.8c2 8.2-.4 16.9-6.3 22.8S477 468 468.9 466l-104.7-26.3-55.5 92.7c-4.3 7.2-12.2 11.7-20.6 11.7s-16.3-4.4-20.6-11.7L211.9 439.7 107.2 466c-8.2 2-16.8-.4-22.8-6.3S76 445 78 436.8l26.2-104.7-92.6-55.5C4.4 272.2 0 264.4 0 256s4.4-16.3 11.7-20.6L104.3 179.9 78 75.1c-2-8.2 .3-16.8 6.3-22.8S99 44 107.2 46l104.7 26.2 55.5-92.6 1.8-2.6c4.5-5.7 11.4-9.1 18.8-9.1zm0 144a144 144 0 1 0 0 288 144 144 0 1 0 0-288zm0 240a96 96 0 1 1 0-192 96 96 0 1 1 0 192z"/></svg>`;
}

function moonIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor"><path d="M256 0C114.6 0 0 114.6 0 256S114.6 512 256 512c68.8 0 131.3-27.2 177.3-71.4 7.3-7 9.4-17.9 5.3-27.1s-13.7-14.9-23.8-14.1c-4.9 .4-9.8 .6-14.8 .6-101.6 0-184-82.4-184-184 0-72.1 41.5-134.6 102.1-164.8 9.1-4.5 14.3-14.3 13.1-24.4S322.6 8.5 312.7 6.3C294.4 2.2 275.4 0 256 0z"/></svg>`;
}

function themeIcon() {
  return document.body.classList.contains('light-palette') ? moonIcon() : sunIcon();
}

// ── State ──────────────────────────────────────────────────────────────────

const state = {
  pegs: [[], [], []],
  selectedPeg: null,
  diskCount: 5,
  moveCount: 0,
  elapsedSeconds: 0,
  timerInterval: null,
  gameStatus: 'idle'
};

// ── Accessibility helpers ──────────────────────────────────────────────────

function getPegLabel(pegIndex) {
  const names = ['A', 'B', 'C'];
  const count = state.pegs[pegIndex].length;
  const label = count === 0 ? 'empty' : `${count} disk${count === 1 ? '' : 's'}`;
  return `Peg ${names[pegIndex]}: ${label}`;
}

function updatePegAriaLabels() {
  const cols = document.querySelectorAll('.peg-col');
  cols.forEach((col, i) => {
    col.setAttribute('aria-label', getPegLabel(i));
    col.setAttribute('aria-pressed', state.selectedPeg === i ? 'true' : 'false');
  });
}

function updateDiskAriaLabels() {
  const disks = document.querySelectorAll('.disk');
  disks.forEach(disk => {
    const size = disk.dataset.size;
    disk.setAttribute('aria-label', `Disk ${size}`);
  });
}

function trapFocus(modal) {
  const focusable = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  function handleKeydown(e) {
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
  }

  modal.addEventListener('keydown', handleKeydown);
  modal._removeTrapFocus = () => modal.removeEventListener('keydown', handleKeydown);
  first.focus();
}

function releaseFocus(modal) {
  if (modal._removeTrapFocus) {
    modal._removeTrapFocus();
    delete modal._removeTrapFocus;
  }
}

// ── Keyboard navigation on peg columns ────────────────────────────────────

function initPegKeyboard() {
  document.addEventListener('keydown', e => {
    const col = document.activeElement;
    if (!col || !col.classList.contains('peg-col')) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const index = parseInt(col.dataset.peg, 10);
      selectPeg(index);
    }
  });
}

// ── Game Logic ─────────────────────────────────────────────────────────────

function initGame(diskCount) {
  if (state.timerInterval) stopTimer();
  const pegs = [[], [], []];
  for (let i = diskCount; i >= 1; i--) pegs[0].push(i);
  state.pegs = pegs;
  state.selectedPeg = null;
  state.diskCount = diskCount;
  state.moveCount = 0;
  state.elapsedSeconds = 0;
  state.timerInterval = null;
  state.gameStatus = 'idle';
  saveGameState();
}

function selectPeg(pegIndex) {
  if (state.gameStatus === 'won') return;
  if (state.selectedPeg === null) {
    if (state.pegs[pegIndex].length === 0) return;
    state.selectedPeg = pegIndex;
  } else if (state.selectedPeg === pegIndex) {
    state.selectedPeg = null;
  } else {
    attemptMove(state.selectedPeg, pegIndex);
  }
  updatePegAriaLabels();
  renderPegs();
}

function attemptMove(fromIndex, toIndex) {
  if (isValidMove(fromIndex, toIndex)) {
    executeMove(fromIndex, toIndex);
  } else {
    flashError(toIndex);
  }
}

function isValidMove(fromIndex, toIndex) {
  const from = state.pegs[fromIndex];
  const to = state.pegs[toIndex];
  if (from.length === 0) return false;
  if (to.length === 0) return true;
  return to[to.length - 1] > from[from.length - 1];
}

function executeMove(fromIndex, toIndex) {
  const disk = state.pegs[fromIndex].pop();
  state.pegs[toIndex].push(disk);
  state.moveCount++;
  state.selectedPeg = null;
  if (state.gameStatus === 'idle') {
    state.gameStatus = 'playing';
    startTimer();
  }
  checkWin();
  saveGameState();
  renderHud();
  updatePegAriaLabels();
  renderPegs();
  animateMoveCounter();
  animateDiskPlaced(toIndex);
}

function checkWin() {
  if (state.pegs[2].length === state.diskCount) {
    state.gameStatus = 'won';
    stopTimer();
    const records = JSON.parse(localStorage.getItem('toh_records') || '{}');
    const existing = records[state.diskCount];
    state.isNewBest = !existing || state.moveCount < existing.moves ||
      (state.moveCount === existing.moves && state.elapsedSeconds < existing.time);
    saveRecord(state.diskCount, state.moveCount, state.elapsedSeconds);
    clearSavedGame();
    animateWinGlow();
    showGameOver();
  }
}

function startTimer() {
  state.timerInterval = setInterval(() => {
    state.elapsedSeconds++;
    renderHud();
  }, 1000);
}

function stopTimer() {
  clearInterval(state.timerInterval);
  state.timerInterval = null;
}

function saveRecord(diskCount, moves, time) {
  const records = JSON.parse(localStorage.getItem('toh_records') || '{}');
  const existing = records[diskCount];
  if (!existing || moves < existing.moves || (moves === existing.moves && time < existing.time)) {
    records[diskCount] = { moves, time };
    localStorage.setItem('toh_records', JSON.stringify(records));
  }
}

function saveGameState() {
  const data = {
    pegs: state.pegs,
    diskCount: state.diskCount,
    moveCount: state.moveCount,
    elapsedSeconds: state.elapsedSeconds,
    gameStatus: state.gameStatus
  };
  localStorage.setItem('toh_saved_game', JSON.stringify(data));
}

function loadGameState() {
  try {
    const raw = localStorage.getItem('toh_saved_game');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function hasSavedGame() {
  return localStorage.getItem('toh_saved_game') !== null;
}

function clearSavedGame() {
  localStorage.removeItem('toh_saved_game');
}

function flashError(pegIndex) {
  const cols = document.querySelectorAll('.peg-col');
  const col = cols[pegIndex];
  if (!col) return;
  col.classList.add('error-flash');
  setTimeout(() => col.classList.remove('error-flash'), 400);
}

function getOptimalMoves(diskCount) {
  return Math.pow(2, diskCount) - 1;
}

function getDiskColor(diskNum) {
  const dark = document.documentElement.classList.contains('dark') ||
    document.body.classList.contains('dark-palette') ||
    !document.body.classList.contains('light-palette');
  const map = {
    1: dark ? 'var(--red-light)'    : 'var(--red-dark)',
    2: dark ? 'var(--orange-light)' : 'var(--orange-dark)',
    3: dark ? 'var(--yellow-light)' : 'var(--yellow-dark)',
    4: dark ? 'var(--green-light)'  : 'var(--green-dark)',
    5: dark ? 'var(--blue-light)'   : 'var(--blue-dark)',
    6: dark ? 'var(--purple-light)' : 'var(--purple-dark)',
    7: dark ? 'var(--teal-light)'   : 'var(--teal-dark)'
  };
  return map[diskNum] || 'var(--gray-45)';
}

// ── Theme ──────────────────────────────────────────────────────────────────

function applyTheme(theme) {
  document.body.classList.remove('dark-palette', 'light-palette');
  document.body.classList.add(theme === 'light' ? 'light-palette' : 'dark-palette');
  localStorage.setItem('toh_theme', theme);
}

function toggleTheme() {
  const isLight = document.body.classList.contains('light-palette');
  applyTheme(isLight ? 'dark' : 'light');
  render();
}

// ── Render ─────────────────────────────────────────────────────────────────

function render() {
  const app = document.getElementById('app');
  if (state.gameStatus === 'idle' || state.gameStatus === 'won') {
    // If game just ended, we still show play screen with overlay
    // Home screen is shown when no game is active
    if (state.gameStatus === 'idle' && !state._inGame) {
      app.innerHTML = renderHome();
    } else {
      app.innerHTML = renderPlay();
    }
  } else {
    app.innerHTML = renderPlay();
  }
  attachEvents();
  buildHudLiveRegions();
}

function showHome() {
  state._inGame = false;
  state.gameStatus = 'idle';
  render();
}

// ── Home Screen ────────────────────────────────────────────────────────────

function renderHome() {
  const records = JSON.parse(localStorage.getItem('toh_records') || '{}');
  const saved = hasSavedGame();

  function recordVal(diskCount, field) {
    const r = records[diskCount];
    if (!r) return '--';
    if (field === 'moves') return r.moves;
    return formatTime(r.time);
  }

  return `
    <div class="home-screen">
      <div class="home-card">
        <header class="home-header">
          <div class="header-buttons">
            <button class="icon-btn" id="help-btn" aria-label="Help">${ICON_QUESTION}</button>
            <button class="icon-btn" id="theme-btn" aria-label="Toggle theme">${themeIcon()}</button>
            <a class="icon-btn" href="https://www.freecodecamp.org/donate" target="_blank" rel="noopener" aria-label="Donate">${ICON_HEART}</a>
          </div>
        </header>

        <div class="home-title-section">
          <h1 class="game-title">Tower of Hanoi</h1>
          <p class="game-subtitle">MOVE ALL DISKS TO THE RIGHT PEG</p>
        </div>

        <div class="disk-selector">
          <button class="disk-btn ${state.diskCount === 3 ? 'active' : ''}" data-disks="3">3 Disks</button>
          <button class="disk-btn ${state.diskCount === 5 ? 'active' : ''}" data-disks="5">5 Disks</button>
          <button class="disk-btn ${state.diskCount === 7 ? 'active' : ''}" data-disks="7">7 Disks</button>
        </div>

        <div class="records-section">
          <table class="records-table" aria-label="Best records">
            <thead>
              <tr>
                <th>Disks</th>
                <th>Best Moves</th>
                <th>Best Time</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>3</td>
                <td class="record-val">${recordVal(3, 'moves')}</td>
                <td class="record-val">${recordVal(3, 'time')}</td>
              </tr>
              <tr>
                <td>5</td>
                <td class="record-val">${recordVal(5, 'moves')}</td>
                <td class="record-val">${recordVal(5, 'time')}</td>
              </tr>
              <tr>
                <td>7</td>
                <td class="record-val">${recordVal(7, 'moves')}</td>
                <td class="record-val">${recordVal(7, 'time')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="home-actions">
          <button class="primary-btn" id="new-game-btn">New Game</button>
          ${saved ? `<button class="secondary-btn" id="resume-btn">Resume</button>` : ''}
        </div>
      </div>
    </div>
  `;
}

// ── Play Screen ────────────────────────────────────────────────────────────

function renderPlay() {
  return `
    <div class="play-screen">
      <div class="game-container">
        <header class="header">
          <button class="icon-btn" id="close-btn" aria-label="Close">${ICON_X}</button>
          <div class="header-buttons">
            <button class="icon-btn" id="help-btn" aria-label="Help">${ICON_QUESTION}</button>
            <button class="icon-btn" id="theme-btn" aria-label="Toggle theme">${themeIcon()}</button>
            <a class="icon-btn" href="https://www.freecodecamp.org/donate" target="_blank" rel="noopener" aria-label="Donate">${ICON_HEART}</a>
          </div>
        </header>

        <hr class="header-rule" />

        <div class="hud">
          <div class="hud-left">
            <span class="hud-item" id="hud-moves" aria-live="polite">Moves: ${state.moveCount}</span>
            <span class="hud-sep">|</span>
            <span class="hud-item hud-optimal">Optimal: ${getOptimalMoves(state.diskCount)}</span>
          </div>
          <span class="hud-item hud-timer" id="hud-timer" aria-live="polite">${formatTime(state.elapsedSeconds)}</span>
        </div>

        <div class="peg-area" id="peg-area">
          ${renderPegsHTML()}
        </div>

        ${state.gameStatus === 'won' ? renderGameOverHTML() : ''}
      </div>
    </div>
  `;
}

// ── Peg Rendering ──────────────────────────────────────────────────────────

function renderPegsHTML() {
  let html = '';
  for (let i = 0; i < 3; i++) {
    const isSelected = state.selectedPeg === i;
    const disks = state.pegs[i];
    html += `
      <div
        class="peg-col${isSelected ? ' selected' : ''}"
        data-peg="${i}"
        tabindex="0"
        role="button"
        aria-label="${getPegLabel(i)}"
        aria-pressed="${isSelected ? 'true' : 'false'}"
      >
        <div class="peg-rod"></div>
        <div class="peg-disks">
          ${renderDisksHTML(disks, isSelected)}
        </div>
        <div class="peg-base"></div>
      </div>
    `;
  }
  return html;
}

function renderDisksHTML(disks, pegSelected) {
  // Render from bottom to top (index 0 = bottom)
  let html = '';
  for (let j = 0; j < disks.length; j++) {
    const diskNum = disks[j];
    const isTop = j === disks.length - 1;
    const color = getDiskColor(diskNum);
    const widthPx = 40 + (diskNum / state.diskCount) * 160;
    const isHighlighted = pegSelected && isTop;
    html += `
      <div
        class="disk${isHighlighted ? ' disk-top-selected' : ''}"
        data-size="${diskNum}"
        aria-label="Disk ${diskNum}"
        style="width:${widthPx}px; background:${color};"
      ></div>
    `;
  }
  return html;
}

// Called after moves to re-render just the peg area in-place
function renderPegs() {
  const area = document.getElementById('peg-area');
  if (!area) return;
  area.innerHTML = renderPegsHTML();
  updateDiskAriaLabels();
  // Re-attach peg click events
  document.querySelectorAll('.peg-col').forEach(col => {
    col.addEventListener('click', () => {
      const index = parseInt(col.dataset.peg, 10);
      selectPeg(index);
    });
  });
}

// ── Game Over ──────────────────────────────────────────────────────────────

function renderGameOverHTML() {
  return `
    <div class="game-over-overlay" id="game-over-overlay">
      <div class="game-over-card">
        <div class="game-over-result">Puzzle Solved!</div>
        ${state.isNewBest ? `<div class="game-over-new-best">New Best</div>` : ''}
        <div class="game-over-stats">
          <div class="stat-row">
            <span class="stat-label">Moves</span>
            <span class="stat-val">${state.moveCount}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Time</span>
            <span class="stat-val">${formatTime(state.elapsedSeconds)}</span>
          </div>
        </div>
        <div class="game-over-actions">
          <button class="primary-btn" id="play-again-btn">Play Again</button>
          <button class="secondary-btn" id="menu-btn">Menu</button>
        </div>
      </div>
    </div>
  `;
}

function showGameOver() {
  // Overlay is included in the next render pass via renderPlay()
  // Re-render so the overlay appears
  const container = document.querySelector('.game-container');
  if (!container) return;
  // Append overlay into the existing container without full re-render
  const existing = document.getElementById('game-over-overlay');
  if (existing) return;
  container.insertAdjacentHTML('beforeend', renderGameOverHTML());
  // Wire up play-again and menu buttons
  document.getElementById('play-again-btn')?.addEventListener('click', () => {
    initGame(state.diskCount);
    state._inGame = true;
    render();
  });
  document.getElementById('menu-btn')?.addEventListener('click', showHome);
}

// ── HUD ────────────────────────────────────────────────────────────────────

function renderHud() {
  const movesEl = document.getElementById('hud-moves');
  const timerEl = document.getElementById('hud-timer');
  if (movesEl) movesEl.textContent = `Moves: ${state.moveCount}`;
  if (timerEl) timerEl.textContent = formatTime(state.elapsedSeconds);
}

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function buildHudLiveRegions() {
  const movesEl = document.getElementById('hud-moves');
  const timerEl = document.getElementById('hud-timer');
  if (movesEl) movesEl.setAttribute('aria-live', 'polite');
  if (timerEl) timerEl.setAttribute('aria-live', 'polite');
}

function animateMoveCounter() {
  const el = document.getElementById('hud-moves');
  if (!el) return;
  el.classList.remove('pulse');
  void el.offsetWidth;
  el.classList.add('pulse');
}

function animateDiskPlaced(pegIndex) {
  const cols = document.querySelectorAll('.peg-col');
  const col = cols[pegIndex];
  if (!col) return;
  const disks = col.querySelectorAll('.disk');
  if (!disks.length) return;
  const topDisk = disks[disks.length - 1];
  topDisk.classList.add('disk-placed');
  setTimeout(() => topDisk.classList.remove('disk-placed'), 150);
}

function animateWinGlow() {
  const cols = document.querySelectorAll('.peg-col');
  const rightCol = cols[2];
  if (!rightCol) return;
  const disks = rightCol.querySelectorAll('.disk');
  disks.forEach(disk => {
    disk.classList.add('disk-win-glow');
    setTimeout(() => disk.classList.remove('disk-win-glow'), 600);
  });
}

// ── Help Modal ─────────────────────────────────────────────────────────────

function renderHelpModal() {
  return `
    <div class="modal-backdrop" id="modal-backdrop">
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="help-modal-title">
        <button class="modal-close icon-btn" id="modal-close-btn" aria-label="Close">${ICON_X}</button>
        <h2 class="modal-title" id="help-modal-title">How to Play</h2>
        <div class="modal-content">
          <h3>Objective</h3>
          <p>Move all disks from the left peg to the right peg using the middle peg as a helper. Use the fewest moves possible.</p>

          <h3>Rules</h3>
          <ul>
            <li>Move only the top disk of any peg.</li>
            <li>Never place a larger disk on a smaller one.</li>
            <li>The puzzle is solved when all disks are stacked on the right peg.</li>
          </ul>

          <h3>Key Strategies</h3>
          <ul>
            <li>To move n disks from A to C using B: move the top n-1 disks from A to B, move disk n from A to C, then move the n-1 disks from B to C.</li>
            <li>For odd-numbered disks, the first move is always to the target (right) peg. For even-numbered disks, the first move is to the auxiliary (middle) peg.</li>
            <li>Always keep track of which peg the largest unmoved disk needs to go to.</li>
          </ul>

          <h3>Tips</h3>
          <ul>
            <li>Start with 3 disks and solve it once before trying 5.</li>
            <li>Label the pegs A, B, C in your head and always know where each disk belongs.</li>
            <li>The optimal move count is shown below the counter as a reference.</li>
            <li>Common mistake: moving the second-largest disk before clearing everything above the largest disk.</li>
          </ul>
        </div>
      </div>
    </div>
  `;
}

function showHelpModal() {
  const existing = document.getElementById('modal-backdrop');
  if (existing) return;
  document.body.insertAdjacentHTML('beforeend', renderHelpModal());
  const backdrop = document.getElementById('modal-backdrop');
  const card = backdrop.querySelector('.modal-card');
  trapFocus(card);

  document.getElementById('modal-close-btn').addEventListener('click', closeHelpModal);
  backdrop.addEventListener('click', e => { if (e.target === backdrop) closeHelpModal(); });
  document.addEventListener('keydown', onHelpEsc);
}

function closeHelpModal() {
  const backdrop = document.getElementById('modal-backdrop');
  if (!backdrop) return;
  releaseFocus(backdrop.querySelector('.modal-card'));
  backdrop.remove();
  document.removeEventListener('keydown', onHelpEsc);
}

function onHelpEsc(e) {
  if (e.key === 'Escape') closeHelpModal();
}

// ── Confirm Modal ──────────────────────────────────────────────────────────

function showConfirmModal(onConfirm) {
  const existing = document.getElementById('confirm-backdrop');
  if (existing) existing.remove();

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-backdrop" id="confirm-backdrop">
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <h2 class="modal-title" id="confirm-title">Return to menu?</h2>
        <p class="modal-body-text">Your game will be saved. You can resume it from the menu.</p>
        <div class="modal-actions">
          <button class="secondary-btn" id="confirm-cancel">Cancel</button>
          <button class="primary-btn" id="confirm-ok">Quit</button>
        </div>
      </div>
    </div>
  `);

  const backdrop = document.getElementById('confirm-backdrop');
  const card = backdrop.querySelector('.modal-card');
  trapFocus(card);

  document.getElementById('confirm-cancel').addEventListener('click', () => {
    releaseFocus(card);
    backdrop.remove();
  });
  document.getElementById('confirm-ok').addEventListener('click', () => {
    releaseFocus(card);
    backdrop.remove();
    onConfirm();
  });
  backdrop.addEventListener('click', e => {
    if (e.target === backdrop) {
      releaseFocus(card);
      backdrop.remove();
    }
  });
}

// ── Event Wiring ───────────────────────────────────────────────────────────

function attachEvents() {
  // Peg columns
  document.querySelectorAll('.peg-col').forEach(col => {
    col.addEventListener('click', () => {
      const index = parseInt(col.dataset.peg, 10);
      selectPeg(index);
    });
  });

  // Help button
  document.getElementById('help-btn')?.addEventListener('click', showHelpModal);

  // Theme button
  document.getElementById('theme-btn')?.addEventListener('click', toggleTheme);

  // Home screen
  document.querySelectorAll('.disk-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.diskCount = parseInt(btn.dataset.disks, 10);
      localStorage.setItem('toh_disk_count', state.diskCount);
      render();
    });
  });

  document.getElementById('new-game-btn')?.addEventListener('click', () => {
    initGame(state.diskCount);
    state._inGame = true;
    render();
  });

  document.getElementById('resume-btn')?.addEventListener('click', () => {
    const saved = loadGameState();
    if (!saved) return;
    state.pegs = saved.pegs;
    state.diskCount = saved.diskCount;
    state.moveCount = saved.moveCount;
    state.elapsedSeconds = saved.elapsedSeconds;
    state.gameStatus = saved.gameStatus;
    state.selectedPeg = null;
    state._inGame = true;
    if (state.gameStatus === 'playing') {
      startTimer();
    }
    render();
  });

  // Play screen
  document.getElementById('close-btn')?.addEventListener('click', () => {
    if (state.gameStatus === 'playing') {
      showConfirmModal(() => {
        if (state.timerInterval) stopTimer();
        state.gameStatus = 'idle';
        state._inGame = false;
        render();
      });
    } else {
      if (state.timerInterval) stopTimer();
      state.gameStatus = 'idle';
      state._inGame = false;
      render();
    }
  });

  document.getElementById('play-again-btn')?.addEventListener('click', () => {
    initGame(state.diskCount);
    state._inGame = true;
    render();
  });

  document.getElementById('menu-btn')?.addEventListener('click', showHome);
}

// ── Init ───────────────────────────────────────────────────────────────────

function init() {
  applyTheme(localStorage.getItem('toh_theme') || 'dark');
  const savedDisk = parseInt(localStorage.getItem('toh_disk_count') || '5', 10);
  if ([3, 5, 7].includes(savedDisk)) state.diskCount = savedDisk;
  state._inGame = false;
  initPegKeyboard();
  render();
}

init();
