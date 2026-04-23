// ─── Storage Keys ─────────────────────────────────────────────────────────────

const STORAGE = {
  THEME: 'dab_theme',
  MODE: 'dab_mode',
  GRID: 'dab_gridSize',
  DIFF: 'dab_difficulty',
  COLOR: 'dab_playerColor',
  GAME: 'dab_game',
  RECORDS: 'dab_records',
};

// ─── App State ────────────────────────────────────────────────────────────────

let state = null;         // full game state
let isAnimating = false;
let hasSavedGame = false;

// hEdgeOwner[r][c] = 'dark'|'light'|null — tracks who claimed each edge
let hEdgeOwner = [];
let vEdgeOwner = [];

let settings = {
  mode: localStorage.getItem(STORAGE.MODE) || 'vs-computer',
  gridSize: parseInt(localStorage.getItem(STORAGE.GRID)) || 6,
  difficulty: localStorage.getItem(STORAGE.DIFF) || 'normal',
  playerColor: localStorage.getItem(STORAGE.COLOR) || 'dark',
};

// ─── Records ──────────────────────────────────────────────────────────────────

function getRecords() {
  try {
    const r = JSON.parse(localStorage.getItem(STORAGE.RECORDS));
    if (r && typeof r.wins_normal === 'number' && typeof r.wins_hard === 'number') return r;
  } catch (e) {}
  return { wins_normal: 0, wins_hard: 0 };
}

function saveRecords(r) {
  localStorage.setItem(STORAGE.RECORDS, JSON.stringify(r));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function make2D(rows, cols, fill) {
  return Array.from({ length: rows }, () => Array(cols).fill(fill));
}

function randItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Game Logic ───────────────────────────────────────────────────────────────

function initGame(gridSize, mode, difficulty, playerColor) {
  const g = gridSize;
  state = {
    gridSize: g,
    mode,
    difficulty,
    playerColor,
    humanSide: playerColor,
    hEdges: make2D(g + 1, g, false),
    vEdges: make2D(g, g + 1, false),
    boxes: make2D(g, g, null),
    score: { dark: 0, light: 0 },
    currentSide: 'dark',
    gameOver: false,
    winner: null,
  };
  hEdgeOwner = make2D(g + 1, g, null);
  vEdgeOwner = make2D(g, g + 1, null);
  isAnimating = false;
  renderPlayScreen();
  saveGame();
  if (mode === 'vs-computer' && playerColor === 'light') {
    scheduleComputerMove();
  }
}

function claimEdge(type, r, c) {
  if (type === 'h') {
    state.hEdges[r][c] = true;
    hEdgeOwner[r][c] = state.currentSide;
  } else {
    state.vEdges[r][c] = true;
    vEdgeOwner[r][c] = state.currentSide;
  }
  return checkBoxes(type, r, c);
}

function checkBoxes(type, r, c) {
  const completed = [];
  const g = state.gridSize;
  if (type === 'h') {
    if (r > 0 && isBoxComplete(r - 1, c)) completed.push({ r: r - 1, c });
    if (r < g && isBoxComplete(r, c)) completed.push({ r, c });
  } else {
    if (c > 0 && isBoxComplete(r, c - 1)) completed.push({ r, c: c - 1 });
    if (c < g && isBoxComplete(r, c)) completed.push({ r, c });
  }
  return completed;
}

function isBoxComplete(br, bc) {
  return (
    state.hEdges[br][bc] &&
    state.hEdges[br + 1][bc] &&
    state.vEdges[br][bc] &&
    state.vEdges[br][bc + 1]
  );
}

function scoreBoxes(completedCoords, side) {
  for (const { r, c } of completedCoords) {
    if (state.boxes[r][c] === null) {
      state.boxes[r][c] = side;
      state.score[side]++;
    }
  }
}

function allEdgesClaimed() {
  const g = state.gridSize;
  const total = 2 * g * (g + 1);
  let count = 0;
  for (let r = 0; r <= g; r++) for (let c = 0; c < g; c++) if (state.hEdges[r][c]) count++;
  for (let r = 0; r < g; r++) for (let c = 0; c <= g; c++) if (state.vEdges[r][c]) count++;
  return count === total;
}

function handleEdgeClick(type, r, c) {
  if (state.gameOver) return;
  if (isAnimating) return;

  // bounds check
  const g = state.gridSize;
  if (type === 'h' && (r < 0 || r > g || c < 0 || c >= g)) return;
  if (type === 'v' && (r < 0 || r >= g || c < 0 || c > g)) return;

  // already claimed?
  if (type === 'h' ? state.hEdges[r][c] : state.vEdges[r][c]) return;

  // correct side in vs-computer?
  if (state.mode === 'vs-computer' && state.currentSide !== state.playerColor) return;

  const completed = claimEdge(type, r, c);
  scoreBoxes(completed, state.currentSide);

  if (completed.length > 0) {
    pulseScore(state.currentSide);
    if (allEdgesClaimed()) {
      renderBoard();
      endGame();
    } else {
      renderBoard();
      flashGoAgain(() => {
        renderStatus();
        saveGame();
        if (state.mode === 'vs-computer' && state.currentSide !== state.playerColor) {
          scheduleComputerMove();
        }
      });
    }
  } else {
    switchSide();
    renderBoard();
    renderStatus();
    saveGame();
    if (allEdgesClaimed()) {
      endGame();
    } else if (state.mode === 'vs-computer' && state.currentSide !== state.playerColor) {
      scheduleComputerMove();
    }
  }
}

function switchSide() {
  state.currentSide = state.currentSide === 'dark' ? 'light' : 'dark';
}

function scheduleComputerMove() {
  isAnimating = true;
  renderStatus();
  setTimeout(runComputerMove, 400);
}

function runComputerMove() {
  isAnimating = false;
  const move = getComputerMove();
  if (move) handleEdgeClick(move.type, move.r, move.c);
}

function getComputerMove() {
  return state.difficulty === 'hard' ? aiHard() : aiNormal();
}

// ─── AI ───────────────────────────────────────────────────────────────────────

function getUnclaimedEdges() {
  const edges = [];
  const g = state.gridSize;
  for (let r = 0; r <= g; r++) for (let c = 0; c < g; c++) if (!state.hEdges[r][c]) edges.push({ type: 'h', r, c });
  for (let r = 0; r < g; r++) for (let c = 0; c <= g; c++) if (!state.vEdges[r][c]) edges.push({ type: 'v', r, c });
  return edges;
}

function countBoxesScoredByEdge(type, r, c) {
  const g = state.gridSize;
  let count = 0;
  const check = (br, bc) => {
    if (br < 0 || bc < 0 || br >= g || bc >= g) return;
    let sides = 0;
    if (state.hEdges[br][bc]) sides++;
    if (state.hEdges[br + 1][bc]) sides++;
    if (state.vEdges[br][bc]) sides++;
    if (state.vEdges[br][bc + 1]) sides++;
    if (sides === 3) count++;
  };
  if (type === 'h') { check(r - 1, c); check(r, c); }
  else { check(r, c - 1); check(r, c); }
  return count;
}

function wouldCreate3SidedBox(type, r, c) {
  const g = state.gridSize;
  const check = (br, bc) => {
    if (br < 0 || bc < 0 || br >= g || bc >= g) return false;
    if (state.boxes[br][bc] !== null) return false;
    let sides = 0;
    if (state.hEdges[br][bc]) sides++;
    if (state.hEdges[br + 1][bc]) sides++;
    if (state.vEdges[br][bc]) sides++;
    if (state.vEdges[br][bc + 1]) sides++;
    return sides === 2;
  };
  if (type === 'h') return check(r - 1, c) || check(r, c);
  return check(r, c - 1) || check(r, c);
}

function findChains() {
  const g = state.gridSize;
  const visited = make2D(g, g, false);
  const chains = [];

  const countMissing = (br, bc) => {
    let m = 0;
    if (!state.hEdges[br][bc]) m++;
    if (!state.hEdges[br + 1][bc]) m++;
    if (!state.vEdges[br][bc]) m++;
    if (!state.vEdges[br][bc + 1]) m++;
    return m;
  };

  const getNeighbors = (br, bc) => {
    const result = [];
    const dirs = [
      { dr: -1, dc: 0, linked: () => !state.hEdges[br][bc] },
      { dr: 1, dc: 0, linked: () => !state.hEdges[br + 1][bc] },
      { dr: 0, dc: -1, linked: () => !state.vEdges[br][bc] },
      { dr: 0, dc: 1, linked: () => !state.vEdges[br][bc + 1] },
    ];
    for (const d of dirs) {
      const nr = br + d.dr, nc = bc + d.dc;
      if (nr < 0 || nc < 0 || nr >= g || nc >= g) continue;
      if (state.boxes[nr][nc] !== null) continue;
      if (countMissing(nr, nc) === 1 && d.linked()) result.push({ r: nr, c: nc });
    }
    return result;
  };

  for (let r = 0; r < g; r++) {
    for (let c = 0; c < g; c++) {
      if (visited[r][c] || state.boxes[r][c] !== null || countMissing(r, c) !== 1) continue;
      const chain = [];
      const queue = [{ r, c }];
      visited[r][c] = true;
      while (queue.length) {
        const cur = queue.shift();
        chain.push(cur);
        for (const nb of getNeighbors(cur.r, cur.c)) {
          if (!visited[nb.r][nb.c]) { visited[nb.r][nb.c] = true; queue.push(nb); }
        }
      }
      chains.push(chain);
    }
  }
  return chains;
}

function getMissingEdge(br, bc) {
  if (!state.hEdges[br][bc]) return { type: 'h', r: br, c: bc };
  if (!state.hEdges[br + 1][bc]) return { type: 'h', r: br + 1, c: bc };
  if (!state.vEdges[br][bc]) return { type: 'v', r: br, c: bc };
  if (!state.vEdges[br][bc + 1]) return { type: 'v', r: br, c: bc + 1 };
  return null;
}

function aiNormal() {
  const edges = getUnclaimedEdges();
  const completing = edges.filter(e => countBoxesScoredByEdge(e.type, e.r, e.c) > 0);
  if (completing.length > 0) return randItem(completing);
  const safe = edges.filter(e => !wouldCreate3SidedBox(e.type, e.r, e.c));
  if (safe.length > 0) return randItem(safe);
  return randItem(edges);
}

function aiHard() {
  const edges = getUnclaimedEdges();
  const completing = edges.filter(e => countBoxesScoredByEdge(e.type, e.r, e.c) > 0);
  if (completing.length > 0) {
    completing.sort((a, b) => countBoxesScoredByEdge(b.type, b.r, b.c) - countBoxesScoredByEdge(a.type, a.r, a.c));
    return completing[0];
  }
  const safe = edges.filter(e => !wouldCreate3SidedBox(e.type, e.r, e.c));
  if (safe.length > 0) return randItem(safe);
  const chains = findChains();
  if (chains.length > 0) {
    const long = chains.filter(ch => ch.length >= 3);
    if (long.length > 0) {
      const chain = long.reduce((a, b) => b.length > a.length ? b : a);
      return getMissingEdge(chain[0].r, chain[0].c);
    }
    const shortest = chains.reduce((a, b) => b.length < a.length ? b : a);
    return getMissingEdge(shortest[0].r, shortest[0].c);
  }
  return randItem(edges);
}

// ─── Game Over / Persistence ──────────────────────────────────────────────────

function endGame() {
  state.gameOver = true;
  isAnimating = false;
  if (state.score.dark > state.score.light) state.winner = 'dark';
  else if (state.score.light > state.score.dark) state.winner = 'light';
  else state.winner = 'draw';

  if (state.mode === 'vs-computer' && state.winner === state.playerColor) {
    const rec = getRecords();
    if (state.difficulty === 'hard') rec.wins_hard++;
    else rec.wins_normal++;
    saveRecords(rec);
  }
  clearSavedGame();
  showGameOver();
}

function saveGame() {
  const snap = {
    gridSize: state.gridSize,
    mode: state.mode,
    difficulty: state.difficulty,
    playerColor: state.playerColor,
    humanSide: state.humanSide,
    hEdges: state.hEdges,
    vEdges: state.vEdges,
    boxes: state.boxes,
    score: state.score,
    currentSide: state.currentSide,
    gameOver: state.gameOver,
    winner: state.winner,
    hEdgeOwner,
    vEdgeOwner,
  };
  localStorage.setItem(STORAGE.GAME, JSON.stringify(snap));
  hasSavedGame = true;
}

function loadGame() {
  try {
    const raw = localStorage.getItem(STORAGE.GAME);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || !s.hEdges || !s.vEdges || !s.boxes) return null;
    return s;
  } catch (e) {
    return null;
  }
}

function clearSavedGame() {
  localStorage.removeItem(STORAGE.GAME);
  hasSavedGame = false;
}

// ─── Theme / Icons ────────────────────────────────────────────────────────────

function applyTheme(theme) {
  document.body.classList.toggle('light-palette', theme === 'light');
  document.body.classList.toggle('dark-palette', theme !== 'light');
}

function getTheme() {
  return localStorage.getItem(STORAGE.THEME) || 'dark';
}

function toggleTheme() {
  const next = getTheme() === 'dark' ? 'light' : 'dark';
  localStorage.setItem(STORAGE.THEME, next);
  applyTheme(next);
  document.querySelectorAll('.btn-theme').forEach(btn => {
    btn.innerHTML = iconTheme(next);
    btn.setAttribute('aria-label', next === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  });
}

function iconTheme(theme) {
  if (theme === 'dark') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M288-32c8.4 0 16.3 4.4 20.6 11.7L364.1 72.3 468.9 46c8.2-2 16.9 .4 22.8 6.3S500 67 498 75.1l-26.3 104.7 92.7 55.5c7.2 4.3 11.7 12.2 11.7 20.6s-4.4 16.3-11.7 20.6L471.7 332.1 498 436.8c2 8.2-.4 16.9-6.3 22.8S477 468 468.9 466l-104.7-26.3-55.5 92.7c-4.3 7.2-12.2 11.7-20.6 11.7s-16.3-4.4-20.6-11.7L211.9 439.7 107.2 466c-8.2 2-16.8-.4-22.8-6.3S76 445 78 436.8l26.2-104.7-92.6-55.5C4.4 272.2 0 264.4 0 256s4.4-16.3 11.7-20.6L104.3 179.9 78 75.1c-2-8.2 .3-16.8 6.3-22.8S99 44 107.2 46l104.7 26.2 55.5-92.6 1.8-2.6c4.5-5.7 11.4-9.1 18.8-9.1zm0 144a144 144 0 1 0 0 288 144 144 0 1 0 0-288zm0 240a96 96 0 1 1 0-192 96 96 0 1 1 0 192z"/></svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 0C114.6 0 0 114.6 0 256S114.6 512 256 512c68.8 0 131.3-27.2 177.3-71.4 7.3-7 9.4-17.9 5.3-27.1s-13.7-14.9-23.8-14.1c-4.9 .4-9.8 .6-14.8 .6-101.6 0-184-82.4-184-184 0-72.1 41.5-134.6 102.1-164.8 9.1-4.5 14.3-14.3 13.1-24.4S322.6 8.5 312.7 6.3C294.4 2.2 275.4 0 256 0z"/></svg>`;
}

function iconHeart() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M241 87.1l15 20.7 15-20.7C296 52.5 336.2 32 378.9 32 452.4 32 512 91.6 512 165.1l0 2.6c0 112.2-139.9 242.5-212.9 298.2-12.4 9.4-27.6 14.1-43.1 14.1s-30.8-4.6-43.1-14.1C139.9 410.2 0 279.9 0 167.7l0-2.6C0 91.6 59.6 32 133.1 32 175.8 32 216 52.5 241 87.1z"/></svg>`;
}

function iconQuestion() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M64 160c0-53 43-96 96-96s96 43 96 96c0 42.7-27.9 78.9-66.5 91.4-28.4 9.2-61.5 35.3-61.5 76.6l0 24c0 17.7 14.3 32 32 32s32-14.3 32-32l0-24c0-1.7 .6-4.1 3.5-7.3 3-3.3 7.9-6.5 13.7-8.4 64.3-20.7 110.8-81 110.8-152.3 0-88.4-71.6-160-160-160S0 71.6 0 160c0 17.7 14.3 32 32 32s32-14.3 32-32zm96 352c22.1 0 40-17.9 40-40s-17.9-40-40-40-40 17.9-40 40 17.9 40 40 40z"/></svg>`;
}

function iconX() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M376.6 84.5c11.3-13.6 9.5-33.8-4.1-45.1s-33.8-9.5-45.1 4.1L192 206 56.6 43.5C45.3 29.9 25.1 28.1 11.5 39.4S-3.9 70.9 7.4 84.5L150.3 256 7.4 427.5c-11.3 13.6-9.5 33.8 4.1 45.1s33.8 9.5 45.1-4.1L192 306 327.4 468.5c11.3 13.6 31.5 15.4 45.1 4.1s15.4-31.5 4.1-45.1L233.7 256 376.6 84.5z"/></svg>`;
}

// ─── Home Screen ──────────────────────────────────────────────────────────────

const app = document.getElementById('app');

function renderHomeScreen() {
  const records = getRecords();
  const showRecords = records.wins_normal > 0 || records.wins_hard > 0;
  const theme = getTheme();
  const isVsComputer = settings.mode === 'vs-computer';

  app.innerHTML = `
    <div class="screen home-screen">
      <div class="screen-header">
        <button class="icon-btn btn-help" aria-label="Help">${iconQuestion()}</button>
        <button class="icon-btn btn-theme" aria-label="${theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}">${iconTheme(theme)}</button>
        <a href="https://www.freecodecamp.org/donate" target="_blank" rel="noopener" class="icon-btn btn-donate" aria-label="Donate">${iconHeart()}</a>
      </div>

      <h1 class="game-title">Dots and Boxes</h1>

      <div class="selector-group" role="radiogroup" aria-label="Game mode">
        <span class="selector-label">Mode</span>
        <div class="selector-pills">
          <button class="pill${settings.mode === 'vs-computer' ? ' selected' : ''}" role="radio" aria-checked="${settings.mode === 'vs-computer'}" data-mode="vs-computer">vs Computer</button>
          <button class="pill${settings.mode === 'vs-human' ? ' selected' : ''}" role="radio" aria-checked="${settings.mode === 'vs-human'}" data-mode="vs-human">vs Human</button>
        </div>
      </div>

      <div class="selector-group" role="radiogroup" aria-label="Grid size">
        <span class="selector-label">Grid Size</span>
        <div class="selector-pills">
          <button class="pill${settings.gridSize === 4 ? ' selected' : ''}" role="radio" aria-checked="${settings.gridSize === 4}" data-grid="4">4x4</button>
          <button class="pill${settings.gridSize === 6 ? ' selected' : ''}" role="radio" aria-checked="${settings.gridSize === 6}" data-grid="6">6x6</button>
          <button class="pill${settings.gridSize === 8 ? ' selected' : ''}" role="radio" aria-checked="${settings.gridSize === 8}" data-grid="8">8x8</button>
        </div>
      </div>

      <div class="selector-group${isVsComputer ? '' : ' hidden'}" role="radiogroup" aria-label="Difficulty">
        <span class="selector-label">Difficulty</span>
        <div class="selector-pills">
          <button class="pill${settings.difficulty === 'normal' ? ' selected' : ''}" role="radio" aria-checked="${settings.difficulty === 'normal'}" data-diff="normal">Normal</button>
          <button class="pill${settings.difficulty === 'hard' ? ' selected' : ''}" role="radio" aria-checked="${settings.difficulty === 'hard'}" data-diff="hard">Hard</button>
        </div>
      </div>

      <div class="selector-group${isVsComputer ? '' : ' hidden'}" role="radiogroup" aria-label="Your Color">
        <span class="selector-label">Your Color</span>
        <div class="selector-pills">
          <button class="pill${settings.playerColor === 'dark' ? ' selected' : ''}" role="radio" aria-checked="${settings.playerColor === 'dark'}" data-color="dark">Dark (goes first)</button>
          <button class="pill${settings.playerColor === 'light' ? ' selected' : ''}" role="radio" aria-checked="${settings.playerColor === 'light'}" data-color="light">Light</button>
        </div>
      </div>

      ${showRecords ? `
      <div class="records-section">
        <span class="records-text">Normal wins: <span class="mono">${records.wins_normal}</span> | Hard wins: <span class="mono">${records.wins_hard}</span></span>
      </div>` : ''}

      <div class="home-actions">
        <button class="btn-primary" id="btn-new-game">New Game</button>
        ${hasSavedGame ? `<button class="btn-secondary" id="btn-resume">Resume</button>` : ''}
      </div>
    </div>
  `;

  app.querySelector('.btn-help').addEventListener('click', showHelpModal);
  app.querySelector('.btn-theme').addEventListener('click', toggleTheme);

  app.querySelectorAll('[data-mode]').forEach(btn => btn.addEventListener('click', () => {
    settings.mode = btn.dataset.mode;
    localStorage.setItem(STORAGE.MODE, settings.mode);
    renderHomeScreen();
  }));

  app.querySelectorAll('[data-grid]').forEach(btn => btn.addEventListener('click', () => {
    settings.gridSize = parseInt(btn.dataset.grid);
    localStorage.setItem(STORAGE.GRID, settings.gridSize);
    renderHomeScreen();
  }));

  app.querySelectorAll('[data-diff]').forEach(btn => btn.addEventListener('click', () => {
    settings.difficulty = btn.dataset.diff;
    localStorage.setItem(STORAGE.DIFF, settings.difficulty);
    renderHomeScreen();
  }));

  app.querySelectorAll('[data-color]').forEach(btn => btn.addEventListener('click', () => {
    settings.playerColor = btn.dataset.color;
    localStorage.setItem(STORAGE.COLOR, settings.playerColor);
    renderHomeScreen();
  }));

  app.querySelector('#btn-new-game').addEventListener('click', () => {
    clearSavedGame();
    initGame(settings.gridSize, settings.mode, settings.difficulty, settings.playerColor);
  });

  const btnResume = app.querySelector('#btn-resume');
  if (btnResume) {
    btnResume.addEventListener('click', () => {
      const saved = loadGame();
      if (!saved) { clearSavedGame(); renderHomeScreen(); return; }
      state = saved;
      hEdgeOwner = saved.hEdgeOwner || make2D(saved.gridSize + 1, saved.gridSize, null);
      vEdgeOwner = saved.vEdgeOwner || make2D(saved.gridSize, saved.gridSize + 1, null);
      isAnimating = false;
      renderPlayScreen();
      if (state.mode === 'vs-computer' && state.currentSide !== state.playerColor && !state.gameOver) {
        scheduleComputerMove();
      }
    });
  }
}

// ─── Play Screen ──────────────────────────────────────────────────────────────

function renderPlayScreen() {
  const theme = getTheme();
  app.innerHTML = `
    <div class="screen play-screen">
      <div class="screen-header">
        <button class="icon-btn btn-close" aria-label="Close">${iconX()}</button>
        <button class="icon-btn btn-help" aria-label="Help">${iconQuestion()}</button>
        <button class="icon-btn btn-theme" aria-label="${theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}">${iconTheme(theme)}</button>
        <a href="https://www.freecodecamp.org/donate" target="_blank" rel="noopener" class="icon-btn btn-donate" aria-label="Donate">${iconHeart()}</a>
      </div>
      <hr class="divider" />
      <div class="score-row" aria-live="polite">
        <span class="score-label score-dark-label">Dark:</span><span class="mono score-val" id="score-dark-val">${state.score.dark}</span>
        <span class="score-sep">--</span>
        <span class="score-label score-light-label">Light:</span><span class="mono score-val" id="score-light-val">${state.score.light}</span>
      </div>
      <div class="status-text" aria-live="polite" id="status-text"></div>
      <div class="board-container" id="board-container"></div>
    </div>
  `;

  app.querySelector('.btn-close').addEventListener('click', () => {
    if (!state.gameOver) {
      showConfirmModal('Leave this game? Your progress will be saved.', renderHomeScreen);
    } else {
      renderHomeScreen();
    }
  });
  app.querySelector('.btn-help').addEventListener('click', showHelpModal);
  app.querySelector('.btn-theme').addEventListener('click', toggleTheme);

  renderStatus();
  renderBoard();
}

function renderStatus() {
  const el = document.getElementById('status-text');
  if (!el) return;
  if (state.gameOver) { el.textContent = ''; el.className = 'status-text'; return; }

  const isComputerTurn = state.mode === 'vs-computer' && state.currentSide !== state.playerColor;
  if (isAnimating || isComputerTurn) {
    el.textContent = 'Computer thinking...';
    el.className = 'status-text muted';
    return;
  }

  if (state.mode === 'vs-computer') {
    el.textContent = 'Your turn';
    el.className = 'status-text accent';
  } else {
    el.textContent = state.currentSide === 'dark' ? "Dark's turn" : "Light's turn";
    el.className = 'status-text accent';
  }
}

// ─── SVG Board ────────────────────────────────────────────────────────────────

function getCellSize() {
  return Math.min(Math.floor(400 / state.gridSize), 60);
}

function renderBoard() {
  const container = document.getElementById('board-container');
  if (!container) return;

  const g = state.gridSize;
  const cell = getCellSize();
  const pad = 24;
  const size = g * cell + pad * 2;
  const dotR = 5;
  const svgNS = 'http://www.w3.org/2000/svg';

  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.setAttribute('class', 'game-board');
  svg.setAttribute('role', 'grid');
  svg.setAttribute('aria-label', 'Dots and Boxes board');

  // Box fills
  for (let r = 0; r < g; r++) {
    for (let c = 0; c < g; c++) {
      const rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('x', pad + c * cell + 2);
      rect.setAttribute('y', pad + r * cell + 2);
      rect.setAttribute('width', cell - 4);
      rect.setAttribute('height', cell - 4);
      rect.setAttribute('rx', 4);
      let cls = 'box-fill';
      if (state.boxes[r][c] === 'dark') cls += ' box-dark';
      else if (state.boxes[r][c] === 'light') cls += ' box-light';
      rect.setAttribute('class', cls);
      rect.dataset.r = r;
      rect.dataset.c = c;
      svg.appendChild(rect);
    }
  }

  // Horizontal edges
  for (let r = 0; r <= g; r++) {
    for (let c = 0; c < g; c++) {
      const x1 = pad + c * cell + dotR + 2;
      const y1 = pad + r * cell;
      const x2 = pad + (c + 1) * cell - dotR - 2;
      const y2 = y1;
      const claimed = state.hEdges[r][c];
      const owner = claimed ? hEdgeOwner[r][c] : null;

      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', x1); line.setAttribute('y1', y1);
      line.setAttribute('x2', x2); line.setAttribute('y2', y2);
      let cls = 'edge-line';
      if (claimed) cls += owner === 'dark' ? ' edge-dark' : ' edge-light';
      else cls += ' edge-unclaimed';
      line.setAttribute('class', cls);
      line.setAttribute('stroke-width', claimed ? 4 : 2);
      if (claimed) line.setAttribute('pointer-events', 'none');
      svg.appendChild(line);

      if (!claimed) {
        const hit = document.createElementNS(svgNS, 'line');
        hit.setAttribute('x1', x1); hit.setAttribute('y1', y1);
        hit.setAttribute('x2', x2); hit.setAttribute('y2', y2);
        hit.setAttribute('stroke', 'transparent');
        hit.setAttribute('stroke-width', 16);
        hit.setAttribute('class', 'edge-hit');
        hit.setAttribute('tabindex', '0');
        hit.setAttribute('role', 'button');
        hit.setAttribute('aria-label', `Horizontal edge row ${r + 1} column ${c + 1}, unclaimed`);
        hit.dataset.type = 'h'; hit.dataset.r = r; hit.dataset.c = c;
        hit.addEventListener('click', () => handleEdgeClick('h', r, c));
        hit.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleEdgeClick('h', r, c); } });
        hit.addEventListener('mouseenter', () => {
          const vis = svg.querySelector(`.edge-line.edge-unclaimed[data-key="h-${r}-${c}"]`);
          if (vis) vis.classList.add('edge-hover');
          hit.classList.add('hovered');
        });
        hit.addEventListener('mouseleave', () => {
          const vis = svg.querySelector(`.edge-line.edge-unclaimed[data-key="h-${r}-${c}"]`);
          if (vis) vis.classList.remove('edge-hover');
          hit.classList.remove('hovered');
        });
        line.setAttribute('data-key', `h-${r}-${c}`);
        svg.appendChild(hit);
      }
    }
  }

  // Vertical edges
  for (let r = 0; r < g; r++) {
    for (let c = 0; c <= g; c++) {
      const x1 = pad + c * cell;
      const y1 = pad + r * cell + dotR + 2;
      const x2 = x1;
      const y2 = pad + (r + 1) * cell - dotR - 2;
      const claimed = state.vEdges[r][c];
      const owner = claimed ? vEdgeOwner[r][c] : null;

      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', x1); line.setAttribute('y1', y1);
      line.setAttribute('x2', x2); line.setAttribute('y2', y2);
      let cls = 'edge-line';
      if (claimed) cls += owner === 'dark' ? ' edge-dark' : ' edge-light';
      else cls += ' edge-unclaimed';
      line.setAttribute('class', cls);
      line.setAttribute('stroke-width', claimed ? 4 : 2);
      if (claimed) line.setAttribute('pointer-events', 'none');
      svg.appendChild(line);

      if (!claimed) {
        const hit = document.createElementNS(svgNS, 'line');
        hit.setAttribute('x1', x1); hit.setAttribute('y1', y1);
        hit.setAttribute('x2', x2); hit.setAttribute('y2', y2);
        hit.setAttribute('stroke', 'transparent');
        hit.setAttribute('stroke-width', 16);
        hit.setAttribute('class', 'edge-hit');
        hit.setAttribute('tabindex', '0');
        hit.setAttribute('role', 'button');
        hit.setAttribute('aria-label', `Vertical edge row ${r + 1} column ${c + 1}, unclaimed`);
        hit.dataset.type = 'v'; hit.dataset.r = r; hit.dataset.c = c;
        hit.addEventListener('click', () => handleEdgeClick('v', r, c));
        hit.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleEdgeClick('v', r, c); } });
        hit.addEventListener('mouseenter', () => {
          const vis = svg.querySelector(`.edge-line.edge-unclaimed[data-key="v-${r}-${c}"]`);
          if (vis) vis.classList.add('edge-hover');
        });
        hit.addEventListener('mouseleave', () => {
          const vis = svg.querySelector(`.edge-line.edge-unclaimed[data-key="v-${r}-${c}"]`);
          if (vis) vis.classList.remove('edge-hover');
        });
        line.setAttribute('data-key', `v-${r}-${c}`);
        svg.appendChild(hit);
      }
    }
  }

  // Dots (on top)
  for (let r = 0; r <= g; r++) {
    for (let c = 0; c <= g; c++) {
      const dot = document.createElementNS(svgNS, 'circle');
      dot.setAttribute('cx', pad + c * cell);
      dot.setAttribute('cy', pad + r * cell);
      dot.setAttribute('r', dotR);
      dot.setAttribute('class', 'dot');
      svg.appendChild(dot);
    }
  }

  container.innerHTML = '';
  container.appendChild(svg);
}

// ─── Animations ───────────────────────────────────────────────────────────────

function flashGoAgain(cb) {
  const el = document.getElementById('status-text');
  if (el) {
    el.textContent = 'Go again!';
    el.className = 'status-text accent';
  }
  setTimeout(cb, 600);
}

function pulseScore(side) {
  const el = document.getElementById(`score-${side}-val`);
  if (!el) return;
  el.textContent = state.score[side];
  el.classList.remove('score-pulse');
  void el.offsetWidth;
  el.classList.add('score-pulse');
  el.addEventListener('animationend', () => el.classList.remove('score-pulse'), { once: true });
}

// ─── Overlays ─────────────────────────────────────────────────────────────────

function showGameOver() {
  const records = getRecords();
  let resultText, resultClass;
  if (state.mode === 'vs-computer') {
    if (state.winner === 'draw') { resultText = 'Draw!'; resultClass = 'result-draw'; }
    else if (state.winner === state.playerColor) { resultText = 'You win!'; resultClass = 'result-win'; }
    else { resultText = 'You lose!'; resultClass = 'result-lose'; }
  } else {
    if (state.winner === 'draw') { resultText = 'Draw!'; resultClass = 'result-draw'; }
    else { resultText = state.winner === 'dark' ? 'Dark wins!' : 'Light wins!'; resultClass = 'result-win'; }
  }

  const winsLine = state.mode === 'vs-computer'
    ? `<p class="gameover-wins">Normal wins: <span class="mono">${records.wins_normal}</span> | Hard wins: <span class="mono">${records.wins_hard}</span></p>`
    : '';

  const overlay = document.createElement('div');
  overlay.className = 'overlay gameover-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Game over');
  overlay.innerHTML = `
    <div class="overlay-panel gameover-panel">
      <div class="result-text ${resultClass}">${resultText}</div>
      <div class="gameover-score mono">Dark: ${state.score.dark} | Light: ${state.score.light}</div>
      ${winsLine}
      <div class="overlay-actions">
        <button class="btn-primary" id="btn-play-again">Play Again</button>
        <button class="btn-secondary" id="btn-menu">Menu</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('overlay-visible'));

  overlay.querySelector('#btn-play-again').focus();
  overlay.querySelector('#btn-play-again').addEventListener('click', () => {
    overlay.remove();
    initGame(state.gridSize, state.mode, state.difficulty, state.playerColor);
  });
  overlay.querySelector('#btn-menu').addEventListener('click', () => {
    overlay.remove();
    renderHomeScreen();
  });
  overlay.addEventListener('keydown', e => {
    if (e.key === 'Tab') trapFocus(e, overlay);
  });
}

function showHelpModal() {
  const overlay = document.createElement('div');
  overlay.className = 'overlay help-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Help');
  overlay.innerHTML = `
    <div class="overlay-panel help-panel">
      <div class="overlay-header">
        <h2>How to Play</h2>
        <button class="icon-btn btn-close-modal" aria-label="Close">${iconX()}</button>
      </div>
      <div class="help-content">
        <h3>Objective</h3>
        <p>Claim the most boxes by drawing lines between dots. The player with the most boxes at the end wins.</p>

        <h3>Rules</h3>
        <ol>
          <li>On your turn, click any unclaimed line between two adjacent dots.</li>
          <li>If your line completes a box (4th side), you score it and go again.</li>
          <li>The game ends when every line is drawn.</li>
        </ol>

        <h3>Key Strategies</h3>
        <ul>
          <li>Avoid being the first to touch a box that already has 2 sides -- you will likely hand it to your opponent.</li>
          <li>Control chains: a chain is a sequence of nearly-complete boxes. The player who opens a chain gives it all to the opponent.</li>
          <li>Doublecross: when forced to open a long chain, claim all but the last 2 boxes -- your opponent must then open the next chain.</li>
          <li>In the early game, avoid creating 3-sided boxes for your opponent.</li>
        </ul>

        <h3>Tips for Beginners</h3>
        <ul>
          <li>Look for lines that do not touch any box with 2 sides already drawn.</li>
          <li>When no such line exists, pick the one touching the fewest 2-sided boxes.</li>
          <li>Watch the score -- if you are behind, opening a chain may be necessary.</li>
        </ul>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('overlay-visible'));

  const close = () => overlay.remove();
  overlay.querySelector('.btn-close-modal').addEventListener('click', close);
  overlay.addEventListener('keydown', e => {
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') trapFocus(e, overlay);
  });
  overlay.querySelector('.btn-close-modal').focus();
}

function showConfirmModal(message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay confirm-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Confirm');
  overlay.innerHTML = `
    <div class="overlay-panel confirm-panel">
      <p class="confirm-message">${message}</p>
      <div class="overlay-actions">
        <button class="btn-primary" id="btn-confirm">Confirm</button>
        <button class="btn-secondary" id="btn-cancel">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('overlay-visible'));

  overlay.querySelector('#btn-confirm').focus();
  overlay.querySelector('#btn-confirm').addEventListener('click', () => { overlay.remove(); onConfirm(); });
  overlay.querySelector('#btn-cancel').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('keydown', e => {
    if (e.key === 'Escape') overlay.remove();
    if (e.key === 'Tab') trapFocus(e, overlay);
  });
}

function trapFocus(e, container) {
  const focusable = Array.from(container.querySelectorAll('button, [tabindex="0"], a[href]'));
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

function boot() {
  applyTheme(getTheme());
  const saved = loadGame();
  hasSavedGame = !!saved && !saved.gameOver;
  if (!hasSavedGame) clearSavedGame();
  renderHomeScreen();
}

boot();
