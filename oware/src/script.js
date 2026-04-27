// --- Game Logic ---

function initState(mode, difficulty) {
  return {
    pits: Array(12).fill(4),
    stores: [0, 0],
    currentPlayer: 0,
    phase: 'playing',
    mode,
    difficulty,
    winner: null,
    lastSownPit: null,
    capturedPits: [],
    boardHistory: [],
    animating: false,
  };
}

function getMyRange(currentPlayer) {
  return currentPlayer === 0 ? [0, 1, 2, 3, 4, 5] : [6, 7, 8, 9, 10, 11];
}

function getOpponentRange(currentPlayer) {
  return currentPlayer === 0 ? [6, 7, 8, 9, 10, 11] : [0, 1, 2, 3, 4, 5];
}

function sowSeeds(pits, startPit) {
  const newPits = pits.slice();
  let seeds = newPits[startPit];
  newPits[startPit] = 0;
  let cursor = startPit;
  while (seeds > 0) {
    cursor = (cursor + 1) % 12;
    if (cursor === startPit) continue;
    newPits[cursor]++;
    seeds--;
  }
  return { newPits, lastPit: cursor };
}

function totalOpponentSeeds(pits, currentPlayer) {
  return getOpponentRange(currentPlayer).reduce((sum, i) => sum + pits[i], 0);
}

function resolveCapture(pits, lastPit, currentPlayer) {
  const oppRange = getOpponentRange(currentPlayer);
  if (!oppRange.includes(lastPit)) {
    return { newPits: pits, captured: 0, capturedPits: [] };
  }
  const capturedIndices = [];
  let cursor = lastPit;
  while (oppRange.includes(cursor) && (pits[cursor] === 2 || pits[cursor] === 3)) {
    capturedIndices.push(cursor);
    cursor = (cursor - 1 + 12) % 12;
  }
  if (capturedIndices.length === 0) {
    return { newPits: pits, captured: 0, capturedPits: [] };
  }
  const totalOpp = totalOpponentSeeds(pits, currentPlayer);
  const capturedCount = capturedIndices.reduce((sum, i) => sum + pits[i], 0);
  if (capturedCount === totalOpp) {
    return { newPits: pits, captured: 0, capturedPits: [] };
  }
  const newPits = pits.slice();
  capturedIndices.forEach(i => { newPits[i] = 0; });
  return { newPits, captured: capturedCount, capturedPits: capturedIndices };
}

function pitReachesOpponent(pitIndex, pits, currentPlayer) {
  const oppRange = getOpponentRange(currentPlayer);
  const { newPits } = sowSeeds(pits, pitIndex);
  return oppRange.some(i => newPits[i] > pits[i]);
}

function getValidMoves(pits, currentPlayer) {
  const myRange = getMyRange(currentPlayer);
  const oppRange = getOpponentRange(currentPlayer);
  const oppEmpty = oppRange.every(i => pits[i] === 0);
  if (oppEmpty) {
    const feeding = myRange.filter(i => pits[i] > 0 && pitReachesOpponent(i, pits, currentPlayer));
    return feeding;
  }
  return myRange.filter(i => pits[i] > 0);
}

function serializeBoard(pits, currentPlayer) {
  return pits.join(',') + '|' + currentPlayer;
}

function checkCycle(boardHistory) {
  const last = boardHistory[boardHistory.length - 1];
  const count = boardHistory.filter(s => s === last).length;
  return count >= 3;
}

function checkWin(stores) {
  if (stores[0] >= 25) return 0;
  if (stores[1] >= 25) return 1;
  if (stores[0] === 24 && stores[1] === 24) return 'draw';
  return null;
}

function sweepBoard(pits, stores) {
  const newStores = stores.slice();
  newStores[0] += pits.slice(0, 6).reduce((s, v) => s + v, 0);
  newStores[1] += pits.slice(6, 12).reduce((s, v) => s + v, 0);
  return { pits: Array(12).fill(0), stores: newStores };
}

function evaluateBoard(pits, stores) {
  return stores[1] - stores[0] + 0.1 * (pits[0] + pits[1] + pits[2] + pits[3] + pits[4] + pits[5]);
}

function minimax(pits, stores, boardHistory, currentPlayer, depth, alpha, beta, moveOrdering) {
  const moves = getValidMoves(pits, currentPlayer);
  if (depth === 0 || moves.length === 0) {
    return { score: evaluateBoard(pits, stores), pitIndex: null };
  }
  let orderedMoves = moves;
  if (moveOrdering) {
    orderedMoves = moves.slice().sort((a, b) => {
      const sa = sowSeeds(pits, a);
      const ca = resolveCapture(sa.newPits, sa.lastPit, currentPlayer);
      const sb = sowSeeds(pits, b);
      const cb = resolveCapture(sb.newPits, sb.lastPit, currentPlayer);
      return cb.captured - ca.captured;
    });
  }
  const isMaximizing = currentPlayer === 1;
  let best = isMaximizing ? -Infinity : Infinity;
  let bestPit = orderedMoves[0];
  for (const pit of orderedMoves) {
    const sowed = sowSeeds(pits, pit);
    const cap = resolveCapture(sowed.newPits, sowed.lastPit, currentPlayer);
    const newStores = stores.slice();
    newStores[currentPlayer] += cap.captured;
    const serial = serializeBoard(cap.newPits, currentPlayer ^ 1);
    const newHistory = boardHistory.concat(serial);
    let score;
    if (checkCycle(newHistory) || checkWin(newStores) !== null) {
      score = evaluateBoard(cap.newPits, newStores);
    } else {
      const nextMoves = getValidMoves(cap.newPits, currentPlayer ^ 1);
      let evalPits = cap.newPits;
      let evalStores = newStores;
      if (nextMoves.length === 0) {
        const swept = sweepBoard(cap.newPits, newStores);
        evalPits = swept.pits;
        evalStores = swept.stores;
      }
      const result = minimax(evalPits, evalStores, newHistory, currentPlayer ^ 1, depth - 1, alpha, beta, moveOrdering);
      score = result.score;
    }
    if (isMaximizing) {
      if (score > best) { best = score; bestPit = pit; }
      alpha = Math.max(alpha, best);
    } else {
      if (score < best) { best = score; bestPit = pit; }
      beta = Math.min(beta, best);
    }
    if (beta <= alpha) break;
  }
  return { score: best, pitIndex: bestPit };
}

function computerMove(state) {
  const moves = getValidMoves(state.pits, state.currentPlayer);
  if (moves.length === 0) return null;
  if (state.difficulty === 'normal' && Math.random() < 0.3) {
    return moves[Math.floor(Math.random() * moves.length)];
  }
  const depth = state.difficulty === 'hard' ? 6 : 4;
  const ordering = state.difficulty === 'hard';
  const result = minimax(state.pits, state.stores, state.boardHistory, state.currentPlayer, depth, -Infinity, Infinity, ordering);
  return result.pitIndex;
}

function applyMove(state, pitIndex) {
  const next = Object.assign({}, state);
  next.capturedPits = [];
  next.lastSownPit = null;

  const sowed = sowSeeds(state.pits, pitIndex);
  next.lastSownPit = sowed.lastPit;

  const cap = resolveCapture(sowed.newPits, sowed.lastPit, state.currentPlayer);
  next.capturedPits = cap.capturedPits;
  next.pits = cap.newPits;
  next.stores = state.stores.slice();
  next.stores[state.currentPlayer] += cap.captured;

  const serial = serializeBoard(next.pits, state.currentPlayer);
  next.boardHistory = state.boardHistory.concat(serial);

  if (checkCycle(next.boardHistory)) {
    next.winner = 'draw';
    next.phase = 'gameover';
    next.animating = false;
    return next;
  }

  const winAfterCapture = checkWin(next.stores);
  if (winAfterCapture !== null) {
    next.winner = winAfterCapture;
    next.phase = 'gameover';
    next.animating = false;
    return next;
  }

  const nextPlayer = state.currentPlayer ^ 1;
  const nextMoves = getValidMoves(next.pits, nextPlayer);
  if (nextMoves.length === 0) {
    const swept = sweepBoard(next.pits, next.stores);
    next.pits = swept.pits;
    next.stores = swept.stores;
    const winAfterSweep = checkWin(next.stores);
    next.winner = winAfterSweep !== null ? winAfterSweep : (next.stores[0] > next.stores[1] ? 0 : next.stores[1] > next.stores[0] ? 1 : 'draw');
    next.phase = 'gameover';
    next.animating = false;
    return next;
  }

  next.currentPlayer = nextPlayer;
  next.animating = false;
  return next;
}

// --- App State ---

let state = {
  phase: 'home',
  mode: 'pvc',
  difficulty: 'normal',
  winner: null,
  pits: [],
  stores: [0, 0],
  currentPlayer: 0,
  lastSownPit: null,
  capturedPits: [],
  boardHistory: [],
  animating: false,
};

// --- localStorage ---

function saveGame(s) {
  try { localStorage.setItem('oware_state', JSON.stringify(s)); } catch (_) {}
}

function loadGame() {
  try {
    const raw = localStorage.getItem('oware_state');
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

function clearGame() {
  try { localStorage.removeItem('oware_state'); } catch (_) {}
}

function getRecords() {
  return {
    normal: parseInt(localStorage.getItem('oware_wins_normal') || '0', 10),
    hard:   parseInt(localStorage.getItem('oware_wins_hard')   || '0', 10),
    pvp:    parseInt(localStorage.getItem('oware_wins_pvp')    || '0', 10),
  };
}

function recordWin(mode, difficulty, winner) {
  if (mode === 'pvp') {
    localStorage.setItem('oware_wins_pvp', getRecords().pvp + 1);
  } else if (mode === 'pvc' && winner === 0) {
    if (difficulty === 'normal') {
      localStorage.setItem('oware_wins_normal', getRecords().normal + 1);
    } else {
      localStorage.setItem('oware_wins_hard', getRecords().hard + 1);
    }
  }
}

function getSavedTheme() {
  return localStorage.getItem('oware_theme') || 'dark';
}

function saveTheme(t) {
  localStorage.setItem('oware_theme', t);
}

function getSavedMode() {
  return localStorage.getItem('oware_mode') || 'pvc';
}

function getSavedDifficulty() {
  return localStorage.getItem('oware_difficulty') || 'normal';
}

function persistModeAndDifficulty(mode, difficulty) {
  localStorage.setItem('oware_mode', mode);
  localStorage.setItem('oware_difficulty', difficulty);
}

// --- Theme ---

function applyTheme(theme) {
  document.body.classList.remove('light-palette', 'dark-palette');
  document.body.classList.add(theme === 'light' ? 'light-palette' : 'dark-palette');
}

let currentTheme = getSavedTheme();
applyTheme(currentTheme);

// --- Icon helpers ---

function iconX() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
}

function iconQuestion() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
}

function iconSun() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
}

function iconMoon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
}

function iconHeart() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
}

// --- Rendering ---

const app = document.getElementById('app');

function render() {
  if (state.phase === 'home') {
    renderHome();
  } else if (state.phase === 'playing') {
    renderPlay();
  } else if (state.phase === 'gameover') {
    renderPlay();
    renderGameOver();
  }
}

// --- Home Screen ---

function renderHome() {
  const rec = getRecords();
  const saved = loadGame();
  const mode = getSavedMode();
  const diff = getSavedDifficulty();

  app.innerHTML = `
    <div class="container home-container">
      <div class="header-row">
        <div class="header-spacer"></div>
        <h1 class="game-title">Oware</h1>
        <div class="header-icons">
          <button class="icon-btn" id="btn-help-home" aria-label="Help">${iconQuestion()}</button>
          <button class="icon-btn" id="btn-theme-home" aria-label="Toggle theme">${currentTheme === 'light' ? iconMoon() : iconSun()}</button>
          <button class="icon-btn" id="btn-heart-home" aria-label="Support">${iconHeart()}</button>
        </div>
      </div>

      <div class="mode-selector">
        <button class="mode-tab ${mode === 'pvc' ? 'active' : ''}" data-mode="pvc">vs Computer</button>
        <button class="mode-tab ${mode === 'pvp' ? 'active' : ''}" data-mode="pvp">vs Player</button>
      </div>

      <div class="difficulty-selector ${mode === 'pvc' ? '' : 'hidden'}" id="diff-selector">
        <button class="diff-tab ${diff === 'normal' ? 'active' : ''}" data-diff="normal">Normal</button>
        <button class="diff-tab ${diff === 'hard' ? 'active' : ''}" data-diff="hard">Hard</button>
      </div>

      <div class="records-panel">
        <div class="record-row"><span>Wins vs Normal</span><span class="record-val" style="font-family: var(--font-mono)">${rec.normal}</span></div>
        <div class="record-row"><span>Wins vs Hard</span><span class="record-val" style="font-family: var(--font-mono)">${rec.hard}</span></div>
        <div class="record-row"><span>Wins PvP</span><span class="record-val" style="font-family: var(--font-mono)">${rec.pvp}</span></div>
      </div>

      <div class="home-actions">
        <button class="btn-primary" id="btn-new-game">New Game</button>
        ${saved && saved.phase === 'playing' ? `<button class="btn-secondary" id="btn-resume">Resume</button>` : ''}
      </div>
    </div>
    <div id="help-modal" class="modal-overlay hidden" role="dialog" aria-modal="true" aria-label="Help">
      ${helpModalContent()}
    </div>
  `;

  bindHomeEvents();
}

function bindHomeEvents() {
  let selectedMode = getSavedMode();
  let selectedDiff = getSavedDifficulty();

  document.querySelectorAll('.mode-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedMode = btn.dataset.mode;
      document.querySelectorAll('.mode-tab').forEach(b => b.classList.toggle('active', b.dataset.mode === selectedMode));
      const diffSel = document.getElementById('diff-selector');
      diffSel.classList.toggle('hidden', selectedMode !== 'pvc');
      persistModeAndDifficulty(selectedMode, selectedDiff);
    });
  });

  document.querySelectorAll('.diff-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedDiff = btn.dataset.diff;
      document.querySelectorAll('.diff-tab').forEach(b => b.classList.toggle('active', b.dataset.diff === selectedDiff));
      persistModeAndDifficulty(selectedMode, selectedDiff);
    });
  });

  document.getElementById('btn-new-game').addEventListener('click', () => {
    persistModeAndDifficulty(selectedMode, selectedDiff);
    state = initState(selectedMode, selectedDiff);
    state.phase = 'playing';
    saveGame(state);
    render();
    if (selectedMode === 'pvc' && state.currentPlayer === 1) triggerComputerMove();
  });

  const resumeBtn = document.getElementById('btn-resume');
  if (resumeBtn) {
    resumeBtn.addEventListener('click', () => {
      const saved = loadGame();
      if (saved) { state = saved; render(); }
    });
  }

  document.getElementById('btn-help-home').addEventListener('click', () => {
    document.getElementById('help-modal').classList.remove('hidden');
  });

  document.getElementById('btn-theme-home').addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    saveTheme(currentTheme);
    applyTheme(currentTheme);
    render();
  });

  document.getElementById('btn-heart-home').addEventListener('click', () => {
    window.open('https://www.freecodecamp.org/donate', '_blank');
  });

  bindHelpModal();
}

// --- Play Screen ---

function renderPlay() {
  const s = state;
  const validMoves = s.animating ? [] : getValidMoves(s.pits, s.currentPlayer);

  const northLabels = ['P2', 'Opp'];
  const southLabels = ['P1', 'You'];
  const northLabel = s.mode === 'pvp' ? northLabels[0] : northLabels[1];
  const southLabel = s.mode === 'pvp' ? southLabels[0] : southLabels[1];

  const statusText = buildStatusText(s, validMoves);

  app.innerHTML = `
    <div class="container play-container">
      <div class="header-row">
        <button class="icon-btn" id="btn-close" aria-label="Close">${iconX()}</button>
        <div class="header-icons">
          <button class="icon-btn" id="btn-help-play" aria-label="Help">${iconQuestion()}</button>
          <button class="icon-btn" id="btn-theme-play" aria-label="Toggle theme">${currentTheme === 'light' ? iconMoon() : iconSun()}</button>
          <button class="icon-btn" id="btn-heart-play" aria-label="Support">${iconHeart()}</button>
        </div>
      </div>
      <hr class="header-rule" />

      <div class="board-area">
        <div class="store north-store" aria-label="${northLabel} store, ${s.stores[1]} seeds">
          <div class="store-label">${northLabel}</div>
          <div class="store-count">${s.stores[1]}</div>
        </div>

        <div class="pits-area">
          <div class="pits-row north-row">
            ${[11,10,9,8,7,6].map(i => pitHtml(i, s, validMoves)).join('')}
          </div>
          <div class="pits-row south-row">
            ${[0,1,2,3,4,5].map(i => pitHtml(i, s, validMoves)).join('')}
          </div>
        </div>

        <div class="store south-store" aria-label="${southLabel} store, ${s.stores[0]} seeds">
          <div class="store-label">${southLabel}</div>
          <div class="store-count">${s.stores[0]}</div>
        </div>
      </div>

      <div class="status-bar" id="status-bar">${statusText}</div>
    </div>

    <div id="help-modal" class="modal-overlay hidden" role="dialog" aria-modal="true" aria-label="Help">
      ${helpModalContent()}
    </div>
    <div id="confirm-modal" class="modal-overlay hidden" role="dialog" aria-modal="true" aria-label="Confirm">
      ${confirmModalContent()}
    </div>
  `;

  bindPlayEvents(validMoves);
}

function buildStatusText(s, validMoves) {
  if (s.phase === 'gameover') {
    return gameOverStatusText(s);
  }
  if (s.animating && s.mode === 'pvc' && s.currentPlayer === 1) {
    return `<span class="status-thinking">Thinking<span class="dot-pulse"><span>.</span><span>.</span><span>.</span></span></span>`;
  }
  if (s.mode === 'pvc') {
    return `<span class="status-neutral">Your turn</span>`;
  }
  return `<span class="status-neutral">Player ${s.currentPlayer + 1}'s turn</span>`;
}

function gameOverStatusText(s) {
  if (s.winner === 'draw') return `<span class="status-neutral">Draw!</span>`;
  if (s.mode === 'pvc') {
    return s.winner === 0
      ? `<span class="status-win">You win!</span>`
      : `<span class="status-loss">You lose.</span>`;
  }
  return `<span class="status-win">Player ${s.winner + 1} wins!</span>`;
}

function pitHtml(i, s, validMoves) {
  const seeds = s.pits[i];
  const isValid = validMoves.includes(i);
  const isDisabled = !isValid && !s.animating ? true : (!validMoves.includes(i));
  const isLastSown = s.lastSownPit === i;
  const isCaptured = s.capturedPits.includes(i);
  let cls = 'pit';
  if (isValid) cls += ' valid';
  if (!isValid) cls += ' disabled';
  if (isLastSown) cls += ' last-sown';
  if (isCaptured) cls += ' captured';
  const dotsHtml = seedDotsHtml(seeds);
  const label = `Pit ${i + 1}, ${seeds} seed${seeds !== 1 ? 's' : ''}${isValid ? ', valid move' : ''}`;
  return `<div class="${cls}" data-pit="${i}" role="button" tabindex="${isValid ? '0' : '-1'}" aria-label="${label}" aria-disabled="${!isValid}">${dotsHtml}</div>`;
}

function seedDotsHtml(seeds) {
  if (seeds === 0) return `<span class="pit-count">0</span>`;
  if (seeds > 12) return `<span class="pit-count">${seeds}</span>`;
  const dots = Array(seeds).fill('<span class="seed-dot"></span>').join('');
  return `<div class="seed-grid">${dots}</div><span class="pit-count-small">${seeds}</span>`;
}

function bindPlayEvents(validMoves) {
  document.querySelectorAll('.pit.valid').forEach(el => {
    el.addEventListener('click', () => handlePitClick(parseInt(el.dataset.pit, 10)));
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handlePitClick(parseInt(el.dataset.pit, 10));
      }
    });
  });

  // Tab cycles only through .valid pits
  document.querySelectorAll('.pit.valid').forEach((el, idx, all) => {
    el.addEventListener('keydown', e => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const next = all[(idx + (e.shiftKey ? -1 + all.length : 1)) % all.length];
        next.focus();
      }
    });
  });

  document.getElementById('btn-close').addEventListener('click', () => {
    if (state.phase === 'playing' && state.pits.some(p => p > 0)) {
      document.getElementById('confirm-modal').classList.remove('hidden');
    } else {
      goHome();
    }
  });

  document.getElementById('btn-help-play').addEventListener('click', () => {
    document.getElementById('help-modal').classList.remove('hidden');
  });

  document.getElementById('btn-theme-play').addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    saveTheme(currentTheme);
    applyTheme(currentTheme);
    render();
  });

  document.getElementById('btn-heart-play').addEventListener('click', () => {
    window.open('https://www.freecodecamp.org/donate', '_blank');
  });

  bindHelpModal();
  bindConfirmModal();

  document.addEventListener('keydown', handleEscape);
}

function handlePitClick(pitIndex) {
  if (state.animating) return;
  const valid = getValidMoves(state.pits, state.currentPlayer);
  if (!valid.includes(pitIndex)) return;

  animateSow(pitIndex);
}

let escapeHandler = null;
function handleEscape(e) {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m => m.classList.add('hidden'));
  }
}

function bindHelpModal() {
  const modal = document.getElementById('help-modal');
  if (!modal) return;
  modal.querySelector('.modal-close')?.addEventListener('click', () => modal.classList.add('hidden'));
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });
}

function bindConfirmModal() {
  const modal = document.getElementById('confirm-modal');
  if (!modal) return;
  modal.querySelector('#confirm-abandon')?.addEventListener('click', () => {
    modal.classList.add('hidden');
    clearGame();
    goHome();
  });
  modal.querySelector('#confirm-cancel')?.addEventListener('click', () => modal.classList.add('hidden'));
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });
}

function goHome() {
  state = { phase: 'home', mode: getSavedMode(), difficulty: getSavedDifficulty(), winner: null, pits: [], stores: [0, 0], currentPlayer: 0, lastSownPit: null, capturedPits: [], boardHistory: [], animating: false };
  document.removeEventListener('keydown', handleEscape);
  render();
}

// --- Sow Animation ---

function animateSow(pitIndex) {
  state.animating = true;
  render();

  const pits = state.pits.slice();
  const startSeeds = pits[pitIndex];
  const sowPath = buildSowPath(pits, pitIndex);

  let step = 0;

  function nextStep() {
    if (step >= sowPath.length) {
      finishSow(pitIndex);
      return;
    }
    const idx = sowPath[step];
    const el = document.querySelector(`.pit[data-pit="${idx}"]`);
    if (el) {
      el.classList.add('receiving');
      setTimeout(() => el.classList.remove('receiving'), 120);
    }
    step++;
    setTimeout(nextStep, 80);
  }

  nextStep();
}

function buildSowPath(pits, startPit) {
  const seeds = pits[startPit];
  const path = [];
  let cursor = startPit;
  let remaining = seeds;
  while (remaining > 0) {
    cursor = (cursor + 1) % 12;
    if (cursor === startPit) continue;
    path.push(cursor);
    remaining--;
  }
  return path;
}

function finishSow(pitIndex) {
  const sowed = sowSeeds(state.pits, pitIndex);
  const cap = resolveCapture(sowed.newPits, sowed.lastPit, state.currentPlayer);

  state.lastSownPit = sowed.lastPit;

  if (cap.capturedPits.length > 0) {
    state.capturedPits = cap.capturedPits;
    state.pits = sowed.newPits;
    render();
    setTimeout(() => {
      state.pits = cap.newPits;
      const newStores = state.stores.slice();
      newStores[state.currentPlayer] += cap.captured;
      state.stores = newStores;
      state.capturedPits = [];
      completeMove();
    }, 350);
  } else {
    state.pits = sowed.newPits;
    completeMove();
  }
}

function completeMove() {
  const serial = serializeBoard(state.pits, state.currentPlayer);
  state.boardHistory = state.boardHistory.concat(serial);

  if (checkCycle(state.boardHistory)) {
    state.winner = 'draw';
    state.phase = 'gameover';
    state.animating = false;
    clearGame();
    render();
    return;
  }

  const winCheck = checkWin(state.stores);
  if (winCheck !== null) {
    state.winner = winCheck;
    state.phase = 'gameover';
    state.animating = false;
    if (winCheck !== 'draw') recordWin(state.mode, state.difficulty, winCheck);
    clearGame();
    render();
    return;
  }

  const nextPlayer = state.currentPlayer ^ 1;
  const nextMoves = getValidMoves(state.pits, nextPlayer);
  if (nextMoves.length === 0) {
    const swept = sweepBoard(state.pits, state.stores);
    state.pits = swept.pits;
    state.stores = swept.stores;
    const winAfterSweep = checkWin(state.stores);
    state.winner = winAfterSweep !== null ? winAfterSweep : (state.stores[0] > state.stores[1] ? 0 : state.stores[1] > state.stores[0] ? 1 : 'draw');
    state.phase = 'gameover';
    state.animating = false;
    if (state.winner !== 'draw') recordWin(state.mode, state.difficulty, state.winner);
    clearGame();
    render();
    return;
  }

  state.currentPlayer = nextPlayer;
  state.animating = false;
  saveGame(state);
  render();

  if (state.mode === 'pvc' && state.currentPlayer === 1) {
    triggerComputerMove();
  }
}

function triggerComputerMove() {
  state.animating = true;
  render();
  setTimeout(() => {
    const pit = computerMove(state);
    if (pit === null) { completeMove(); return; }
    animateSow(pit);
  }, 400);
}

// --- Game Over Overlay ---

function renderGameOver() {
  const s = state;
  let headline, headlineCls;
  if (s.winner === 'draw') {
    headline = 'Draw!';
    headlineCls = 'status-neutral';
  } else if (s.mode === 'pvc') {
    headline = s.winner === 0 ? 'You win!' : 'You lose.';
    headlineCls = s.winner === 0 ? 'status-win' : 'status-loss';
  } else {
    headline = `Player ${s.winner + 1} wins!`;
    headlineCls = 'status-win';
  }

  const overlay = document.createElement('div');
  overlay.className = 'gameover-overlay';
  overlay.innerHTML = `
    <div class="gameover-panel">
      <div class="gameover-headline ${headlineCls}">${headline}</div>
      <div class="gameover-scores">
        <div class="score-row"><span>${s.mode === 'pvp' ? 'P1' : 'You'}</span><span class="score-val">${s.stores[0]}</span></div>
        <div class="score-row"><span>${s.mode === 'pvp' ? 'P2' : 'Opp'}</span><span class="score-val">${s.stores[1]}</span></div>
      </div>
      <div class="gameover-actions">
        <button class="btn-primary" id="btn-play-again">Play Again</button>
        <button class="btn-secondary" id="btn-menu">Menu</button>
      </div>
    </div>
  `;
  app.querySelector('.container').appendChild(overlay);

  document.getElementById('btn-play-again').addEventListener('click', () => {
    state = initState(state.mode, state.difficulty);
    state.phase = 'playing';
    saveGame(state);
    render();
    if (state.mode === 'pvc' && state.currentPlayer === 1) triggerComputerMove();
  });

  document.getElementById('btn-menu').addEventListener('click', () => {
    clearGame();
    goHome();
  });
}

// --- Modals ---

function helpModalContent() {
  return `
    <div class="modal-panel">
      <div class="modal-header">
        <h2>How to Play</h2>
        <button class="icon-btn modal-close" aria-label="Close">${iconX()}</button>
      </div>
      <div class="modal-body">
        <h3>Objective</h3>
        <p>Capture more than half the seeds (25 of 48) before your opponent does.</p>
        <h3>Rules</h3>
        <ul>
          <li>On your turn, pick one of your pits (must have seeds). Pick up all seeds and sow them one by one counter-clockwise, skipping the starting pit on wraparound.</li>
          <li>If the last seed lands in an opponent's pit with exactly 2 or 3 seeds, capture those seeds. Keep capturing backward through consecutive opponent pits with 2 or 3 seeds.</li>
          <li>You can never strip all seeds from your opponent's side in one move (grand slam rule).</li>
          <li>If your opponent has no seeds and you can give them some, you must. If you cannot, the game ends and you collect all remaining seeds on your side.</li>
          <li>First to 25 wins. Repeating the same position 3 times is a draw.</li>
        </ul>
        <h3>Key Strategies</h3>
        <ul>
          <li>Keep seeds in your rightmost pits (4 and 5 for south) to reach the opponent's side quickly and set up captures.</li>
          <li>A pit on the opponent's side with 1 or 2 seeds is a capture opportunity - aim to land your last seed there.</li>
          <li>Set up chain captures: position multiple adjacent opponent pits with 2-3 seeds so one sow captures several at once.</li>
          <li>Deny your opponent's captures: avoid leaving 2 or 3 seeds in your pits when the opponent can reach them.</li>
          <li>A pit with 12+ seeds wraps the board - useful for spreading seeds while landing unpredictably.</li>
          <li>Always count where the last seed falls before committing to a move.</li>
        </ul>
        <h3>Common Mistakes</h3>
        <ul>
          <li>Forgetting the grand slam rule and expecting a capture that does not happen.</li>
          <li>Ignoring the feeding obligation - letting the opponent go empty-handed forces a sweep that may benefit them if they are ahead.</li>
          <li>Sowing from a pit that does not reach the opponent when feeding is required.</li>
          <li>Forgetting that chain captures go backward, not forward.</li>
        </ul>
      </div>
    </div>
  `;
}

function confirmModalContent() {
  return `
    <div class="modal-panel">
      <div class="modal-header">
        <h2>Abandon this game?</h2>
        <button class="icon-btn modal-close" aria-label="Close">${iconX()}</button>
      </div>
      <div class="modal-body">
        <p>Your current game will be lost.</p>
      </div>
      <div class="modal-actions">
        <button class="btn-danger" id="confirm-abandon">Abandon</button>
        <button class="btn-secondary" id="confirm-cancel">Cancel</button>
      </div>
    </div>
  `;
}

// --- Init ---

render();
