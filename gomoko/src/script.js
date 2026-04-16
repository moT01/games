// ── Icons ─────────────────────────────────────────────────────────────────────

const ICON_MOON     = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor"><path d="M256 0C114.6 0 0 114.6 0 256S114.6 512 256 512c68.8 0 131.3-27.2 177.3-71.4 7.3-7 9.4-17.9 5.3-27.1s-13.7-14.9-23.8-14.1c-4.9 .4-9.8 .6-14.8 .6-101.6 0-184-82.4-184-184 0-72.1 41.5-134.6 102.1-164.8 9.1-4.5 14.3-14.3 13.1-24.4S322.6 8.5 312.7 6.3C294.4 2.2 275.4 0 256 0z"/></svg>`;
const ICON_SUN      = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="currentColor"><path d="M288-32c8.4 0 16.3 4.4 20.6 11.7L364.1 72.3 468.9 46c8.2-2 16.9 .4 22.8 6.3S500 67 498 75.1l-26.3 104.7 92.7 55.5c7.2 4.3 11.7 12.2 11.7 20.6s-4.4 16.3-11.7 20.6L471.7 332.1 498 436.8c2 8.2-.4 16.9-6.3 22.8S477 468 468.9 466l-104.7-26.3-55.5 92.7c-4.3 7.2-12.2 11.7-20.6 11.7s-16.3-4.4-20.6-11.7L211.9 439.7 107.2 466c-8.2 2-16.8-.4-22.8-6.3S76 445 78 436.8l26.2-104.7-92.6-55.5C4.4 272.2 0 264.4 0 256s4.4-16.3 11.7-20.6L104.3 179.9 78 75.1c-2-8.2 .3-16.8 6.3-22.8S99 44 107.2 46l104.7 26.2 55.5-92.6 1.8-2.6c4.5-5.7 11.4-9.1 18.8-9.1zm0 144a144 144 0 1 0 0 288 144 144 0 1 0 0-288zm0 240a96 96 0 1 1 0-192 96 96 0 1 1 0 192z"/></svg>`;
const ICON_HEART    = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor"><path d="M241 87.1l15 20.7 15-20.7C296 52.5 336.2 32 378.9 32 452.4 32 512 91.6 512 165.1l0 2.6c0 112.2-139.9 242.5-212.9 298.2-12.4 9.4-27.6 14.1-43.1 14.1s-30.8-4.6-43.1-14.1C139.9 410.2 0 279.9 0 167.7l0-2.6C0 91.6 59.6 32 133.1 32 175.8 32 216 52.5 241 87.1z"/></svg>`;
const ICON_QUESTION = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" fill="currentColor"><path d="M64 160c0-53 43-96 96-96s96 43 96 96c0 42.7-27.9 78.9-66.5 91.4-28.4 9.2-61.5 35.3-61.5 76.6l0 24c0 17.7 14.3 32 32 32s32-14.3 32-32l0-24c0-1.7 .6-4.1 3.5-7.3 3-3.3 7.9-6.5 13.7-8.4 64.3-20.7 110.8-81 110.8-152.3 0-88.4-71.6-160-160-160S0 71.6 0 160c0 17.7 14.3 32 32 32s32-14.3 32-32zm96 352c22.1 0 40-17.9 40-40s-17.9-40-40-40-40 17.9-40 40 17.9 40 40 40z"/></svg>`;
const ICON_X        = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="currentColor"><path d="M376.6 84.5c11.3-13.6 9.5-33.8-4.1-45.1s-33.8-9.5-45.1 4.1L192 206 56.6 43.5C45.3 29.9 25.1 28.1 11.5 39.4S-3.9 70.9 7.4 84.5L150.3 256 7.4 427.5c-11.3 13.6-9.5 33.8 4.1 45.1s33.8 9.5 45.1-4.1L192 306 327.4 468.5c11.3 13.6 31.5 15.4 45.1 4.1s15.4-31.5 4.1-45.1L233.7 256 376.6 84.5z"/></svg>`;

// ── Board helpers ────────────────────────────────────────────────────────────

function createBoard() {
  return Array.from({ length: 15 }, () => new Array(15).fill(0));
}

function placeStone(board, row, col, player) {
  const next = board.map(r => r.slice());
  next[row][col] = player;
  return next;
}

function countInDirection(board, row, col, dr, dc, player) {
  let count = 0;
  let r = row + dr;
  let c = col + dc;
  while (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] === player) {
    count++;
    r += dr;
    c += dc;
  }
  return count;
}

function checkWin(board, row, col, player) {
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  for (const [dr, dc] of directions) {
    const fwd = countInDirection(board, row, col, dr, dc, player);
    const bwd = countInDirection(board, row, col, -dr, -dc, player);
    const total = 1 + fwd + bwd;
    if (total === 5) {
      const winLine = [];
      for (let i = -bwd; i <= fwd; i++) {
        winLine.push([row + dr * i, col + dc * i]);
      }
      return { won: true, winLine };
    }
  }
  return { won: false, winLine: [] };
}

function checkDraw(board) {
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      if (board[r][c] === 0) return false;
    }
  }
  return true;
}

// ── AI helpers ───────────────────────────────────────────────────────────────

function getCandidates(board) {
  let hasStone = false;
  const candidates = [];
  const marked = Array.from({ length: 15 }, () => new Array(15).fill(false));

  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      if (board[r][c] !== 0) {
        hasStone = true;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (
              nr >= 0 && nr < 15 &&
              nc >= 0 && nc < 15 &&
              board[nr][nc] === 0 &&
              !marked[nr][nc]
            ) {
              marked[nr][nc] = true;
              candidates.push([nr, nc]);
            }
          }
        }
      }
    }
  }
  return hasStone ? candidates : [[7, 7]];
}

function scoreWindow(window, player) {
  const opponent = player === 1 ? 2 : 1;
  let p = 0;
  let o = 0;
  for (const cell of window) {
    if (cell === player) p++;
    else if (cell === opponent) o++;
  }
  if (o > 0 && p > 0) return 0;
  if (o > 0) return -scoreCount(o);
  if (p > 0) return scoreCount(p);
  return 0;
}

function scoreCount(n) {
  if (n === 5) return 100000000;
  if (n === 4) return 100000;
  if (n === 3) return 5000;
  if (n === 2) return 100;
  return 0;
}

function scoreBoard(board, player) {
  let score = 0;
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];

  for (const [dr, dc] of directions) {
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        const window = [];
        let valid = true;
        for (let i = 0; i < 5; i++) {
          const nr = r + dr * i;
          const nc = c + dc * i;
          if (nr < 0 || nr >= 15 || nc < 0 || nc >= 15) { valid = false; break; }
          window.push(board[nr][nc]);
        }
        if (valid) score += scoreWindow(window, player);
      }
    }
  }
  return score;
}

function negamax(board, depth, alpha, beta, player) {
  const opponent = player === 1 ? 2 : 1;

  if (depth === 0) {
    return { score: scoreBoard(board, player), move: null };
  }

  const candidates = getCandidates(board);
  if (candidates.length === 0) {
    return { score: 0, move: null };
  }

  // Move ordering: score each candidate shallowly
  const scored = candidates.map(([r, c]) => {
    const next = placeStone(board, r, c, player);
    return { move: [r, c], score: scoreBoard(next, player) };
  });
  scored.sort((a, b) => b.score - a.score);

  let bestMove = scored[0].move;
  let bestScore = -Infinity;

  for (const { move: [r, c] } of scored) {
    const next = placeStone(board, r, c, player);
    const { won } = checkWin(next, r, c, player);
    if (won) {
      return { score: 100000000 + depth, move: [r, c] };
    }
    const { score } = negamax(next, depth - 1, -beta, -alpha, opponent);
    const s = -score;
    if (s > bestScore) {
      bestScore = s;
      bestMove = [r, c];
    }
    if (s > alpha) alpha = s;
    if (alpha >= beta) break;
  }

  return { score: bestScore, move: bestMove };
}

function getBestMove(board, player) {
  const { move } = negamax(board, 4, -Infinity, Infinity, player);
  return move || [7, 7];
}

// ── State ────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'gomoko_state';
const THEME_KEY = 'gomoko_theme';
const MODE_KEY = 'gomoko_mode';
const COLOR_KEY = 'gomoko_color';

function makeInitialState(mode = 'hvc', humanPlayer = 1) {
  return {
    board: createBoard(),
    currentPlayer: 1,
    status: 'idle',
    winner: null,
    winLine: [],
    lastMove: null,
    mode,
    humanPlayer,
    aiThinking: false,
  };
}

let state = makeInitialState();

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) {}
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}


// ── Game actions ─────────────────────────────────────────────────────────────

function startGame(mode, humanPlayer) {
  const hp = humanPlayer ?? parseInt(localStorage.getItem(COLOR_KEY) || '1');
  localStorage.removeItem(STORAGE_KEY);
  state = makeInitialState(mode, hp);
  state.status = 'playing';
  saveState();
  render();
  if (mode === 'hvc' && hp === 2) triggerAI();
}

function resetGame() {
  startGame(state.mode, state.humanPlayer);
}

function handleCellClick(row, col) {
  if (state.status !== 'playing') return;
  if (state.aiThinking) return;
  if (state.board[row][col] !== 0) return;
  if (state.mode === 'hvc' && state.currentPlayer !== state.humanPlayer) return;

  applyMove(row, col, state.currentPlayer);
}

function applyMove(row, col, player) {
  state.board = placeStone(state.board, row, col, player);
  state.lastMove = [row, col];

  const { won, winLine } = checkWin(state.board, row, col, player);
  if (won) {
    state.status = 'won';
    state.winner = player;
    state.winLine = winLine;
    state.currentPlayer = player;
    saveState();
    render();
    return;
  }

  if (checkDraw(state.board)) {
    state.status = 'draw';
    saveState();
    render();
    return;
  }

  state.currentPlayer = player === 1 ? 2 : 1;

  if (state.mode === 'hvc' && state.currentPlayer !== state.humanPlayer) {
    triggerAI();
  } else {
    saveState();
    render();
  }
}

const MIN_AI_MS = 500;

function triggerAI() {
  state.aiThinking = true;
  render();
  setTimeout(runAI, 50);
}

function runAI() {
  const start = Date.now();
  const aiPlayer = state.humanPlayer === 1 ? 2 : 1;
  const move = getBestMove(state.board, aiPlayer);
  const elapsed = Date.now() - start;
  const delay = Math.max(0, MIN_AI_MS - elapsed);
  setTimeout(() => {
    state.aiThinking = false;
    if (move) applyMove(move[0], move[1], aiPlayer);
  }, delay);
}

// ── Rendering ────────────────────────────────────────────────────────────────

const CELL = 32; // px per grid cell
const BOARD_PX = CELL * 14; // 14 gaps between 15 lines
const PAD = 24;
const SVG_SIZE = BOARD_PX + PAD * 2;
const STONE_R = 13;

const STAR_POINTS = [
  [3, 3], [3, 7], [3, 11],
  [7, 7],
  [11, 3], [11, 7], [11, 11],
];

function cx(col) { return PAD + col * CELL; }
function cy(row) { return PAD + row * CELL; }

function svgEl(tag, attrs = {}, children = []) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  for (const child of children) el.appendChild(child);
  return el;
}

function buildBoard() {
  const svg = svgEl('svg', {
    viewBox: `0 0 ${SVG_SIZE} ${SVG_SIZE}`,
    class: 'board-svg',
    role: 'grid',
    'aria-label': 'Gomoku board',
  });

  // Board background
  const bg = svgEl('rect', {
    x: 0, y: 0, width: SVG_SIZE, height: SVG_SIZE,
    class: 'board-bg',
    rx: 8,
  });
  svg.appendChild(bg);

  // Grid lines
  for (let i = 0; i < 15; i++) {
    svg.appendChild(svgEl('line', {
      x1: cx(i), y1: cy(0), x2: cx(i), y2: cy(14),
      class: 'grid-line',
    }));
    svg.appendChild(svgEl('line', {
      x1: cx(0), y1: cy(i), x2: cx(14), y2: cy(i),
      class: 'grid-line',
    }));
  }

  // Star points
  for (const [r, c] of STAR_POINTS) {
    svg.appendChild(svgEl('circle', {
      cx: cx(c), cy: cy(r), r: 3,
      class: 'star-point',
    }));
  }

  // Hit areas + stones
  const winSet = new Set(state.winLine.map(([r, c]) => `${r},${c}`));

  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      const cell = state.board[r][c];
      const isLast = state.lastMove && state.lastMove[0] === r && state.lastMove[1] === c;
      const isWin = winSet.has(`${r},${c}`);
      const isEmpty = cell === 0;

      const canClick = (
        state.status === 'playing' &&
        !state.aiThinking &&
        isEmpty &&
        (state.mode === 'hvh' || state.currentPlayer === 1)
      );

      const label = `Row ${r + 1}, Column ${c + 1}, ${cell === 0 ? 'empty' : cell === 1 ? 'dark' : 'light'}`;

      const hitArea = svgEl('rect', {
        x: cx(c) - CELL / 2,
        y: cy(r) - CELL / 2,
        width: CELL,
        height: CELL,
        class: `hit-area${canClick ? ' clickable' : ''}`,
        role: 'button',
        'aria-label': label,
        tabindex: canClick ? '0' : '-1',
        'data-row': r,
        'data-col': c,
      });

      if (canClick) {
        hitArea.addEventListener('click', () => handleCellClick(r, c));
        hitArea.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCellClick(r, c);
          }
        });
      }

      svg.appendChild(hitArea);

      if (cell !== 0) {
        const defs = svg.querySelector('defs') || (() => {
          const d = svgEl('defs');
          svg.insertBefore(d, svg.firstChild);
          return d;
        })();

        const gradId = cell === 1 ? 'grad-dark' : 'grad-light';
        if (!svg.querySelector(`#${gradId}`)) {
          if (cell === 1) {
            defs.appendChild(svgEl('radialGradient', { id: 'grad-dark', cx: '30%', cy: '25%', r: '70%' }, [
              svgEl('stop', { offset: '0%', 'stop-color': '#66b3ff' }),
              svgEl('stop', { offset: '100%', 'stop-color': '#0066cc' }),
            ]));
          } else {
            defs.appendChild(svgEl('radialGradient', { id: 'grad-light', cx: '30%', cy: '25%', r: '70%' }, [
              svgEl('stop', { offset: '0%', 'stop-color': '#f8e1a0' }),
              svgEl('stop', { offset: '100%', 'stop-color': '#edb312' }),
            ]));
          }
        }

        const stone = svgEl('circle', {
          cx: cx(c),
          cy: cy(r),
          r: STONE_R,
          class: `stone stone-${cell === 1 ? 'dark' : 'light'}${isWin ? ' stone-win' : ''}`,
          fill: `url(#${gradId})`,
          stroke: cell === 1 ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.5)',
          'stroke-width': '1',
        });
        svg.appendChild(stone);

        if (isLast) {
          svg.appendChild(svgEl('circle', {
            cx: cx(c), cy: cy(r), r: 3,
            class: `last-move-dot last-move-${cell === 1 ? 'dark' : 'light'}`,
          }));
        }
      }
    }
  }

  return svg;
}

// ── Modals ───────────────────────────────────────────────────────────────────

function buildHelpModal() {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.setAttribute('role', 'dialog');
  backdrop.setAttribute('aria-modal', 'true');
  backdrop.setAttribute('aria-label', 'Help');

  const panel = document.createElement('div');
  panel.className = 'modal-panel';

  panel.innerHTML = `
    <h2 class="modal-title">How to Play</h2>
    <button class="modal-close" aria-label="Close help">X</button>
    <div class="modal-body">
      <h3>Objective</h3>
      <p>Be the first to place exactly 5 of your stones in an unbroken row — horizontally, vertically, or diagonally. Six or more in a row does not win.</p>
      <h3>Rules</h3>
      <ul>
        <li>Dark always goes first</li>
        <li>Players alternate placing one stone per turn</li>
        <li>A stone cannot be moved once placed</li>
        <li>Exactly 5 consecutive stones of the same color wins; 6 or more does not</li>
        <li>If the board fills with no winner, the game is a draw</li>
      </ul>
      <h3>Key Strategies</h3>
      <ul>
        <li>Build toward open fours (_XXXX_) — your opponent must block immediately or lose</li>
        <li>Create two simultaneous threats your opponent cannot both block</li>
        <li>Play in the center early; edge and corner stones have fewer winning directions</li>
        <li>Block your opponent's open threes immediately, not after they become open fours</li>
      </ul>
      <h3>Common Mistakes</h3>
      <ul>
        <li>Ignoring an opponent's open three — it becomes an unstoppable open four next turn</li>
        <li>Playing only in a straight line — it's predictable and easy to block</li>
        <li>Building closed fours instead of open fours — closed fours give the opponent time to respond</li>
      </ul>
      <h3>Tips for Beginners</h3>
      <ul>
        <li>Start at the center every game as dark</li>
        <li>Think of your stones as creating two threats at once</li>
        <li>A sequence of 3 is urgent, 4 is critical</li>
        <li>A draw is rare — focus on attacking rather than defending</li>
      </ul>
    </div>
  `;

  panel.querySelector('.modal-close').addEventListener('click', closeHelp);
  backdrop.addEventListener('click', e => { if (e.target === backdrop) closeHelp(); });
  document.addEventListener('keydown', helpEscHandler);

  backdrop.appendChild(panel);
  return backdrop;
}

function helpEscHandler(e) {
  if (e.key === 'Escape') closeHelp();
}

function openHelp() {
  if (document.getElementById('help-modal')) return;
  const modal = buildHelpModal();
  modal.id = 'help-modal';
  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('modal-visible'));
}

function closeHelp() {
  const modal = document.getElementById('help-modal');
  if (!modal) return;
  document.removeEventListener('keydown', helpEscHandler);
  modal.remove();
}

let confirmCallback = null;

function openConfirm(onConfirm, { title = 'New Game', body = 'Start a new game? Current progress will be lost.', okLabel = 'New Game' } = {}) {
  if (document.getElementById('confirm-modal')) return;
  confirmCallback = onConfirm;

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.id = 'confirm-modal';
  backdrop.setAttribute('role', 'dialog');
  backdrop.setAttribute('aria-modal', 'true');
  backdrop.setAttribute('aria-label', title);

  const panel = document.createElement('div');
  panel.className = 'modal-panel modal-panel-sm';
  panel.innerHTML = `
    <h2 class="modal-title">${title}</h2>
    <p class="modal-body-text">${body}</p>
    <div class="modal-actions">
      <button class="btn btn-secondary" id="confirm-cancel">Cancel</button>
      <button class="btn btn-primary" id="confirm-ok">${okLabel}</button>
    </div>
  `;

  panel.querySelector('#confirm-cancel').addEventListener('click', closeConfirm);
  panel.querySelector('#confirm-ok').addEventListener('click', () => {
    const cb = confirmCallback;
    closeConfirm();
    if (cb) cb();
  });

  document.addEventListener('keydown', confirmKeyHandler);
  backdrop.addEventListener('click', e => { if (e.target === backdrop) closeConfirm(); });
  backdrop.appendChild(panel);
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => backdrop.classList.add('modal-visible'));
}

function confirmKeyHandler(e) {
  if (e.key === 'Escape') closeConfirm();
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    const cb = confirmCallback;
    closeConfirm();
    if (cb) cb();
  }
}

function closeConfirm() {
  const modal = document.getElementById('confirm-modal');
  if (!modal) return;
  document.removeEventListener('keydown', confirmKeyHandler);
  modal.remove();
  confirmCallback = null;
}

function onNewGame() {
  if (state.status === 'playing') {
    openConfirm(resetGame);
  } else {
    resetGame();
  }
}

// ── Home Screen ──────────────────────────────────────────────────────────────

function renderHome() {
  const savedMode = localStorage.getItem(MODE_KEY) || 'hvc';
  const savedColor = parseInt(localStorage.getItem(COLOR_KEY) || '1');
  const hasSavedGame = loadState()?.status === 'playing';
  state.mode = savedMode;

  const app = document.getElementById('app');
  app.innerHTML = '';

  const screen = document.createElement('div');
  screen.className = 'home-screen';

  screen.innerHTML = `
    <div class="home-card">
      <div class="home-top-btns">
        <button class="btn btn-icon" id="help-btn-home" aria-label="Help">${ICON_QUESTION}</button>
        <button class="btn btn-icon" id="theme-btn-home" aria-label="Toggle theme"></button>
        <button class="btn btn-icon btn-donate" id="donate-btn-home" aria-label="Donate">${ICON_HEART}</button>
      </div>
      <div class="home-header">
        <h1 class="home-title">Gomoko</h1>
        <p class="home-subtitle">Five in a row wins</p>
      </div>
      <div class="mode-toggle" role="group" aria-label="Game mode">
        <button class="mode-btn${savedMode === 'hvc' ? ' mode-active' : ''}" data-mode="hvc" aria-pressed="${savedMode === 'hvc'}">vs Computer</button>
        <button class="mode-btn${savedMode === 'hvh' ? ' mode-active' : ''}" data-mode="hvh" aria-pressed="${savedMode === 'hvh'}">vs Human</button>
      </div>
      <div class="color-picker${savedMode === 'hvh' ? ' color-picker-hidden' : ''}" role="group" aria-label="Play as">
        <span class="color-picker-label">Play as</span>
        <button class="mode-btn${savedColor === 1 ? ' mode-active' : ''}" data-color="1" aria-pressed="${savedColor === 1}">Dark</button>
        <button class="mode-btn${savedColor === 2 ? ' mode-active' : ''}" data-color="2" aria-pressed="${savedColor === 2}">Light</button>
        <span class="color-picker-hint">Dark goes first</span>
      </div>
      <button class="btn btn-primary btn-lg" id="start-btn" aria-label="${hasSavedGame ? 'Start new game' : 'Start game'}">${hasSavedGame ? 'New Game' : 'Start Game'}</button>
      ${hasSavedGame ? `<button class="btn btn-secondary btn-lg" id="resume-btn" aria-label="Resume game">Resume Game</button>` : ''}
    </div>
  `;

  // Resume button
  const resumeBtn = screen.querySelector('#resume-btn');
  if (resumeBtn) {
    resumeBtn.addEventListener('click', () => {
      const saved = loadState();
      if (saved) {
        state = saved;
        render();
      }
    });
  }

  // Mode buttons
  screen.querySelectorAll('.mode-btn[data-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      state.mode = mode;
      localStorage.setItem(MODE_KEY, mode);
      screen.querySelectorAll('.mode-btn[data-mode]').forEach(b => {
        b.classList.toggle('mode-active', b.dataset.mode === mode);
        b.setAttribute('aria-pressed', b.dataset.mode === mode);
      });
      screen.querySelector('.color-picker').classList.toggle('color-picker-hidden', mode === 'hvh');
    });
  });

  // Color buttons
  screen.querySelectorAll('.mode-btn[data-color]').forEach(btn => {
    btn.addEventListener('click', () => {
      const color = parseInt(btn.dataset.color);
      localStorage.setItem(COLOR_KEY, color);
      screen.querySelectorAll('.mode-btn[data-color]').forEach(b => {
        b.classList.toggle('mode-active', parseInt(b.dataset.color) === color);
        b.setAttribute('aria-pressed', parseInt(b.dataset.color) === color);
      });
    });
  });

  screen.querySelector('#start-btn').addEventListener('click', () => {
    localStorage.setItem(MODE_KEY, state.mode);
    startGame(state.mode);
  });

  screen.querySelector('#help-btn-home').addEventListener('click', openHelp);
  screen.querySelector('#theme-btn-home').addEventListener('click', toggleTheme);
  screen.querySelector('#donate-btn-home').addEventListener('click', () => window.open('https://www.freecodecamp.org/donate', '_blank', 'noopener'));

  updateThemeBtn(screen.querySelector('#theme-btn-home'));

  app.appendChild(screen);
}

// ── Play Screen ──────────────────────────────────────────────────────────────

function renderPlay() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  const screen = document.createElement('div');
  screen.className = 'play-screen';

  const content = document.createElement('div');
  content.className = 'play-card';

  // Top bar
  let statusText = '';
  if (state.status === 'playing') {
    statusText = state.aiThinking ? 'Thinking...' : `${state.currentPlayer === 1 ? 'Dark' : 'Light'}'s turn`;
  }

  const topBar = document.createElement('div');
  topBar.className = 'top-bar';
  topBar.innerHTML = `
    <div class="top-bar-left">
      <button class="btn btn-icon" id="new-game-btn" aria-label="New game">${ICON_X}</button>
    </div>
    <div class="top-bar-center status-bar">${statusText}</div>
    <div class="top-bar-right">
      <button class="btn btn-icon" id="help-btn-play" aria-label="Help">${ICON_QUESTION}</button>
      <button class="btn btn-icon" id="theme-btn-play" aria-label="Toggle theme"></button>
      <button class="btn btn-icon btn-donate" id="donate-btn-play" aria-label="Donate">${ICON_HEART}</button>
    </div>
  `;

  topBar.querySelector('#new-game-btn').addEventListener('click', () => {
    if (state.status === 'playing') {
      openConfirm(goHome, { title: 'Quit Game', body: 'Return to the main menu? You can resume your game from there.', okLabel: 'Quit' });
    } else {
      goHome();
    }
  });
  topBar.querySelector('#help-btn-play').addEventListener('click', openHelp);
  topBar.querySelector('#theme-btn-play').addEventListener('click', toggleTheme);
  topBar.querySelector('#donate-btn-play').addEventListener('click', () => window.open('https://www.freecodecamp.org/donate', '_blank', 'noopener'));
  updateThemeBtn(topBar.querySelector('#theme-btn-play'));

  // Board
  const boardWrap = document.createElement('div');
  boardWrap.className = 'board-wrap';
  boardWrap.appendChild(buildBoard());

  // Game over overlay
  if (state.status === 'won' || state.status === 'draw') {
    const overlay = document.createElement('div');
    overlay.className = 'game-over-overlay';
    const panel = document.createElement('div');
    panel.className = 'game-over-panel';

    let resultText = '';
    if (state.status === 'draw') {
      resultText = 'Draw!';
    } else if (state.mode === 'hvc') {
      resultText = state.winner === state.humanPlayer ? 'You win!' : 'You lose';
    } else {
      const winner = state.winner === 1 ? 'Dark' : 'Light';
      resultText = `${winner} wins!`;
    }

    panel.innerHTML = `
      <p class="game-over-result">${resultText}</p>
      <div class="game-over-actions">
        <button class="btn btn-primary" id="play-again-btn" aria-label="Play again">Play Again</button>
        <button class="btn btn-secondary" id="home-btn" aria-label="Go to home screen">Home</button>
      </div>
    `;

    panel.querySelector('#play-again-btn').addEventListener('click', resetGame);
    panel.querySelector('#home-btn').addEventListener('click', goHome);

    overlay.appendChild(panel);
    boardWrap.appendChild(overlay);
  }

  content.appendChild(topBar);
  content.appendChild(boardWrap);
  screen.appendChild(content);
  app.appendChild(screen);

  // Animate overlay in
  if (state.status === 'won' || state.status === 'draw') {
    const overlay = screen.querySelector('.game-over-overlay');
    if (overlay) requestAnimationFrame(() => overlay.classList.add('overlay-visible'));
  }
}

function goHome() {
  state = makeInitialState(state.mode);
  render();
}

function render() {
  if (state.status === 'idle') {
    renderHome();
  } else {
    renderPlay();
  }
}

// ── Theme ─────────────────────────────────────────────────────────────────────

function getTheme() {
  return localStorage.getItem(THEME_KEY) || 'dark';
}

function applyTheme(theme) {
  document.body.classList.toggle('light-palette', theme === 'light');
  document.body.classList.toggle('dark-palette', theme === 'dark');
}

function toggleTheme() {
  const current = getTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
  document.querySelectorAll('.theme-btn, [id^="theme-btn"]').forEach(btn => updateThemeBtn(btn));
}

function updateThemeBtn(btn) {
  if (!btn) return;
  const theme = getTheme();
  btn.innerHTML = theme === 'dark' ? ICON_SUN : ICON_MOON;
  btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
}


// ── Init ──────────────────────────────────────────────────────────────────────

applyTheme(getTheme());

const saved = loadState();
if (saved && saved.status === 'playing') {
  state = saved;
  render();
} else {
  render();
}
