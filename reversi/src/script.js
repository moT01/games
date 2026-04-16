// ─── Constants ───────────────────────────────────────────────────────────────

const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0,  -1],           [0,  1],
  [1,  -1], [1,  0], [1,  1],
];

const POSITION_WEIGHTS = [
  [100, -20,  10,   5,   5,  10, -20, 100],
  [-20, -50,  -2,  -2,  -2,  -2, -50, -20],
  [ 10,  -2,   0,   1,   1,   0,  -2,  10],
  [  5,  -2,   1,   0,   0,   1,  -2,   5],
  [  5,  -2,   1,   0,   0,   1,  -2,   5],
  [ 10,  -2,   0,   1,   1,   0,  -2,  10],
  [-20, -50,  -2,  -2,  -2,  -2, -50, -20],
  [100, -20,  10,   5,   5,  10, -20, 100],
];

// ─── Game Logic ──────────────────────────────────────────────────────────────

function createBoard() {
  const board = Array.from({ length: 8 }, () => Array(8).fill(0));
  board[3][3] = 2; // light
  board[3][4] = 1; // dark
  board[4][3] = 1; // dark
  board[4][4] = 2; // light
  return board;
}

function getFlips(board, row, col, player) {
  if (board[row][col] !== 0) return [];
  const opponent = player === 1 ? 2 : 1;
  const flips = [];
  for (const [dr, dc] of DIRECTIONS) {
    const line = [];
    let r = row + dr;
    let c = col + dc;
    while (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c] === opponent) {
      line.push([r, c]);
      r += dr;
      c += dc;
    }
    if (line.length > 0 && r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c] === player) {
      flips.push(...line);
    }
  }
  return flips;
}

function getValidMoves(board, player) {
  const moves = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === 0 && getFlips(board, r, c, player).length > 0) {
        moves.push([r, c]);
      }
    }
  }
  return moves;
}

function applyMove(board, row, col, player) {
  const flipped = getFlips(board, row, col, player);
  const newBoard = board.map(r => [...r]);
  newBoard[row][col] = player;
  for (const [r, c] of flipped) {
    newBoard[r][c] = player;
  }
  return { board: newBoard, flipped };
}

function countDiscs(board) {
  const counts = { 1: 0, 2: 0 };
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === 1) counts[1]++;
      else if (board[r][c] === 2) counts[2]++;
    }
  }
  return counts;
}

// ─── AI ──────────────────────────────────────────────────────────────────────

function evaluateBoard(board, player) {
  const opponent = player === 1 ? 2 : 1;
  const playerMoves = getValidMoves(board, player);
  const opponentMoves = getValidMoves(board, opponent);

  if (playerMoves.length === 0 && opponentMoves.length === 0) {
    const counts = countDiscs(board);
    return (counts[player] - counts[opponent]) * 1000;
  }

  let positional = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === player) positional += POSITION_WEIGHTS[r][c];
      else if (board[r][c] === opponent) positional -= POSITION_WEIGHTS[r][c];
    }
  }

  const mobility = (playerMoves.length - opponentMoves.length) * 10;

  let endgameBonus = 0;
  const total = countDiscs(board);
  const totalDiscs = total[1] + total[2];
  if (totalDiscs >= 50) {
    endgameBonus = (total[player] - total[opponent]) * 5;
  }

  return positional + mobility + endgameBonus;
}

function negamax(board, depth, alpha, beta, player) {
  const opponent = player === 1 ? 2 : 1;
  const moves = getValidMoves(board, player);

  if (depth === 0 || (moves.length === 0 && getValidMoves(board, opponent).length === 0)) {
    return evaluateBoard(board, player);
  }

  if (moves.length === 0) {
    return -negamax(board, depth, -beta, -alpha, opponent);
  }

  let best = -Infinity;
  for (const [r, c] of moves) {
    const { board: newBoard } = applyMove(board, r, c, player);
    const score = -negamax(newBoard, depth - 1, -beta, -alpha, opponent);
    if (score > best) best = score;
    if (score > alpha) alpha = score;
    if (alpha >= beta) break;
  }
  return best;
}

function getBestMove(board, player, depth) {
  const opponent = player === 1 ? 2 : 1;
  const moves = getValidMoves(board, player);
  let bestScore = -Infinity;
  let bestMove = moves[0];
  for (const [r, c] of moves) {
    const { board: newBoard } = applyMove(board, r, c, player);
    const score = -negamax(newBoard, depth - 1, -Infinity, Infinity, opponent);
    if (score > bestScore) {
      bestScore = score;
      bestMove = [r, c];
    }
  }
  return bestMove;
}

// ─── State ───────────────────────────────────────────────────────────────────

const state = {
  board: createBoard(),
  currentPlayer: 1,
  status: 'idle',
  winner: null,
  scores: { 1: 2, 2: 2 },
  validMoves: [],
  lastMove: null,
  flippedCells: [],
  mode: 'hvc',
  playerColor: 1,
  aiThinking: false,
  passMessage: null,
  difficulty: 'normal',
  wins: { normal: 0, hard: 0 },
};

// ─── Persistence ─────────────────────────────────────────────────────────────

function saveState() {
  const toSave = { ...state };
  delete toSave.flippedCells;
  delete toSave.aiThinking;
  delete toSave.passMessage;
  localStorage.setItem('reversi_state', JSON.stringify(toSave));
}

function loadState() {
  const winsRaw = localStorage.getItem('reversi_wins');
  if (winsRaw) {
    try { Object.assign(state.wins, JSON.parse(winsRaw)); } catch (_) {}
  }

  const raw = localStorage.getItem('reversi_state');
  if (raw) {
    try {
      const saved = JSON.parse(raw);
      if (saved.status === 'playing') {
        Object.assign(state, saved);
        state.flippedCells = [];
        state.aiThinking = false;
        state.passMessage = null;
        state.validMoves = getValidMoves(state.board, state.currentPlayer).map(([r, c]) => `${r},${c}`);
        return;
      }
    } catch (_) {}
  }

  // Restore preferences
  const theme = localStorage.getItem('reversi_theme') || 'dark';
  applyTheme(theme);
  const mode = localStorage.getItem('reversi_mode') || 'hvc';
  const color = parseInt(localStorage.getItem('reversi_color') || '1', 10);
  const difficulty = localStorage.getItem('reversi_difficulty') || 'normal';
  state.mode = mode;
  state.playerColor = color;
  state.difficulty = difficulty;
  state.status = 'idle';
}

// ─── Turn / Move Logic ───────────────────────────────────────────────────────

function handleCellClick(row, col) {
  if (state.status !== 'playing') return;
  if (state.aiThinking) return;
  if (!state.validMoves.includes(`${row},${col}`)) return;

  const { board: newBoard, flipped } = applyMove(state.board, row, col, state.currentPlayer);
  state.board = newBoard;
  state.lastMove = [row, col];
  state.flippedCells = flipped;
  state.scores = countDiscs(newBoard);

  playSound('place');
  if (flipped.length > 0) setTimeout(() => playSound('flip'), 80);

  render();

  setTimeout(() => {
    state.flippedCells = [];
    render();
  }, 400);

  advanceTurn(newBoard, state.currentPlayer);
  saveState();
}

function advanceTurn(board, justPlayed) {
  const opponent = justPlayed === 1 ? 2 : 1;
  const opponentMoves = getValidMoves(board, opponent);
  const currentMoves = getValidMoves(board, justPlayed);
  const counts = countDiscs(board);
  const boardFull = counts[1] + counts[2] === 64;

  if (boardFull || (opponentMoves.length === 0 && currentMoves.length === 0)) {
    endGame(board);
    render();
    return;
  }

  if (opponentMoves.length === 0) {
    const colorName = opponent === 1 ? 'Dark' : 'Light';
    const otherName = justPlayed === 1 ? 'Dark' : 'Light';
    state.passMessage = `${colorName} has no moves — ${otherName}'s turn`;
    state.currentPlayer = justPlayed;
    state.validMoves = currentMoves.map(([r, c]) => `${r},${c}`);
    render();
    setTimeout(() => {
      state.passMessage = null;
      render();
    }, 1500);
    if (state.mode === 'hvc' && state.currentPlayer !== state.playerColor) {
      triggerAI();
    }
    return;
  }

  state.currentPlayer = opponent;
  state.validMoves = opponentMoves.map(([r, c]) => `${r},${c}`);
  render();

  if (state.mode === 'hvc' && state.currentPlayer !== state.playerColor) {
    triggerAI();
  }
}

function triggerAI() {
  state.aiThinking = true;
  render();
  const aiColor = state.mode === 'hvc' ? (state.playerColor === 1 ? 2 : 1) : state.currentPlayer;
  const depth = state.difficulty === 'hard' ? 5 : 3;
  const aiStartTime = Date.now();
  const move = getBestMove(state.board, aiColor, depth);
  const elapsed = Date.now() - aiStartTime;

  setTimeout(() => {
    state.aiThinking = false;
    if (move) {
      handleCellClick(move[0], move[1]);
    }
  }, Math.max(0, 500 - elapsed));
}

function endGame(board) {
  const counts = countDiscs(board);
  state.scores = counts;
  if (counts[1] > counts[2]) {
    state.status = 'won';
    state.winner = 1;
  } else if (counts[2] > counts[1]) {
    state.status = 'won';
    state.winner = 2;
  } else {
    state.status = 'draw';
    state.winner = null;
  }
  if (state.mode === 'hvc' && state.winner === state.playerColor) {
    state.wins[state.difficulty]++;
    localStorage.setItem('reversi_wins', JSON.stringify(state.wins));
  }
}

function startGame() {
  state.board = createBoard();
  state.currentPlayer = 1;
  state.status = 'playing';
  state.winner = null;
  state.lastMove = null;
  state.flippedCells = [];
  state.passMessage = null;
  state.scores = { 1: 2, 2: 2 };
  state.validMoves = getValidMoves(state.board, 1).map(([r, c]) => `${r},${c}`);
  saveState();
  render();
  if (state.mode === 'hvc' && state.playerColor === 2) {
    triggerAI();
  }
}

function resetGame() {
  if (state.status === 'playing') {
    showConfirmModal(startGame);
  } else {
    startGame();
  }
}

// ─── Sound ───────────────────────────────────────────────────────────────────

function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === 'place') {
      osc.frequency.value = 520;
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } else {
      osc.frequency.value = 280;
      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    }
    osc.onended = () => ctx.close();
  } catch (_) {}
}

// ─── Theme ───────────────────────────────────────────────────────────────────

function applyTheme(theme) {
  document.body.classList.remove('dark-palette', 'light-palette');
  document.body.classList.add(theme === 'light' ? 'light-palette' : 'dark-palette');
  localStorage.setItem('reversi_theme', theme);
}

function toggleTheme() {
  const isLight = document.body.classList.contains('light-palette');
  applyTheme(isLight ? 'dark' : 'light');
  render();
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const ICON_QUESTION = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="8"/><path d="M7.5 7.5a2.5 2.5 0 0 1 5 0c0 2-2.5 2.5-2.5 4"/><line x1="10" y1="15.5" x2="10.01" y2="15.5"/></svg>`;
const ICON_HEART = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M10 17s-7-4.35-7-9a5 5 0 0 1 7-4.58A5 5 0 0 1 17 8c0 4.65-7 9-7 9z"/></svg>`;
const ICON_X = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="4" x2="16" y2="16"/><line x1="16" y1="4" x2="4" y2="16"/></svg>`;

function sunIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="10" cy="10" r="3"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="10" y1="16" x2="10" y2="18"/><line x1="2" y1="10" x2="4" y2="10"/><line x1="16" y1="10" x2="18" y2="10"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="14.36" y1="14.36" x2="15.78" y2="15.78"/><line x1="14.36" y1="5.64" x2="15.78" y2="4.22"/><line x1="4.22" y1="15.78" x2="5.64" y2="14.36"/></svg>`;
}

function moonIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M17.5 11.5A7.5 7.5 0 0 1 8.5 2.5a7.5 7.5 0 1 0 9 9z"/></svg>`;
}

function themeIcon() {
  return document.body.classList.contains('light-palette') ? moonIcon() : sunIcon();
}

// ─── Rendering ───────────────────────────────────────────────────────────────

function render() {
  const app = document.getElementById('app');
  if (state.status === 'idle') {
    app.innerHTML = renderHome();
  } else {
    app.innerHTML = renderPlay();
  }
  attachEvents();
}

// ─── Home Screen ─────────────────────────────────────────────────────────────

function renderHome() {
  const isHvc = state.mode === 'hvc';
  const hasSaved = (() => {
    try {
      const raw = localStorage.getItem('reversi_state');
      if (!raw) return false;
      return JSON.parse(raw).status === 'playing';
    } catch (_) { return false; }
  })();

  return `
    <div class="home-screen">
      <div class="home-bg-discs" aria-hidden="true"></div>
      <div class="home-card">
        <header class="header">
          <div class="header-left">
            <h1 class="game-title">Reversi</h1>
            <p class="game-subtitle">MOST DISCS WINS</p>
          </div>
          <div class="header-buttons">
            <button class="icon-btn" id="help-btn" aria-label="Help">${ICON_QUESTION}</button>
            <button class="icon-btn" id="theme-btn" aria-label="Toggle theme">${themeIcon()}</button>
            <a class="icon-btn" href="https://www.freecodecamp.org/donate" target="_blank" rel="noopener" aria-label="Donate">${ICON_HEART}</a>
          </div>
        </header>

        <div class="mode-tabs">
          <button class="tab-btn ${state.mode === 'hvc' ? 'active' : ''}" data-mode="hvc">vs Computer</button>
          <button class="tab-btn ${state.mode === 'hvh' ? 'active' : ''}" data-mode="hvh">2 Players</button>
        </div>

        ${isHvc ? `
          <div class="option-row">
            <span class="option-label">Color</span>
            <div class="pill-toggle">
              <button class="pill-btn ${state.playerColor === 1 ? 'active' : ''}" data-color="1">
                Dark <span class="goes-first">(goes first)</span>
              </button>
              <button class="pill-btn ${state.playerColor === 2 ? 'active' : ''}" data-color="2">Light</button>
            </div>
          </div>

          <div class="option-row">
            <span class="option-label">Difficulty</span>
            <div class="pill-toggle">
              <button class="pill-btn ${state.difficulty === 'normal' ? 'active' : ''}" data-diff="normal">Normal</button>
              <button class="pill-btn ${state.difficulty === 'hard' ? 'active' : ''}" data-diff="hard">Hard</button>
            </div>
          </div>

          <div class="wins-display">
            <span class="wins-label">Wins</span>
            <span class="wins-counts">Normal: <span class="wins-num">${state.wins.normal}</span> &nbsp; Hard: <span class="wins-num">${state.wins.hard}</span></span>
          </div>
        ` : ''}

        <div class="home-actions">
          <button class="primary-btn" id="new-game-btn">New Game</button>
          ${hasSaved ? `<button class="secondary-btn" id="resume-btn">Resume Game</button>` : ''}
        </div>
      </div>
    </div>
  `;
}

// ─── Play Screen ─────────────────────────────────────────────────────────────

function renderPlay() {
  const isHvc = state.mode === 'hvc';
  const aiColor = isHvc ? (state.playerColor === 1 ? 2 : 1) : null;
  const isAITurn = isHvc && state.currentPlayer === aiColor;
  const isOver = state.status === 'won' || state.status === 'draw';

  let turnText = '';
  if (!isOver) {
    if (state.aiThinking) {
      turnText = 'Thinking...';
    } else {
      turnText = state.currentPlayer === 1 ? "Dark's turn" : "Light's turn";
    }
  }

  return `
    <div class="play-screen">
      <header class="header">
        <button class="icon-btn" id="close-btn" aria-label="Close">${ICON_X}</button>
        <button class="icon-btn" id="help-btn" aria-label="Help">${ICON_QUESTION}</button>
        <button class="icon-btn" id="theme-btn" aria-label="Toggle theme">${themeIcon()}</button>
        <a class="icon-btn" href="https://www.freecodecamp.org/donate" target="_blank" rel="noopener" aria-label="Donate">${ICON_HEART}</a>
      </header>
      <hr class="header-rule" />

      <div class="score-bar">
        <div class="score-item">
          <span class="disc-icon dark-disc"></span>
          <span class="score-label">Dark:</span>
          <span class="score-num">${state.scores[1]}</span>
        </div>
        <div class="score-item">
          <span class="disc-icon light-disc"></span>
          <span class="score-label">Light:</span>
          <span class="score-num">${state.scores[2]}</span>
        </div>
      </div>

      <div class="turn-label ${state.aiThinking ? 'thinking' : ''}">${turnText}</div>

      <div class="board-wrapper">
        ${renderBoard(isHvc, aiColor)}
        ${isOver ? renderGameOver() : ''}
      </div>

      <div id="pass-message" class="pass-message" aria-live="polite">${state.passMessage || ''}</div>
    </div>
  `;
}

function renderBoard(isHvc, aiColor) {
  const validSet = new Set(state.validMoves);
  const showDots = !state.aiThinking && (!isHvc || state.currentPlayer === state.playerColor);
  let html = '<div class="board" role="grid">';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const key = `${r},${c}`;
      const val = state.board[r][c];
      const isValid = validSet.has(key);
      const isLast = state.lastMove && state.lastMove[0] === r && state.lastMove[1] === c;
      const isFlipped = state.flippedCells.some(([fr, fc]) => fr === r && fc === c);
      const isEmpty = val === 0;

      const discClass = val === 1 ? 'dark' : val === 2 ? 'light' : '';
      let flipClass = '';
      if (isFlipped) {
        flipClass = state.currentPlayer === 1 ? 'flip-to-dark' : 'flip-to-light';
      }

      const isDisabled = !isValid || state.aiThinking;
      const cellLabel = `Row ${r + 1} Column ${c + 1}, ${val === 0 ? 'empty' : val === 1 ? 'dark disc' : 'light disc'}`;

      html += `<div
        class="cell${isValid ? ' valid' : ''}"
        role="button"
        tabindex="${isValid && !isDisabled ? '0' : '-1'}"
        aria-label="${cellLabel}"
        aria-disabled="${isDisabled ? 'true' : 'false'}"
        data-row="${r}" data-col="${c}"
      >`;

      if (val !== 0) {
        html += `<div class="disc ${discClass}${flipClass ? ' ' + flipClass : ''}"></div>`;
      } else if (isValid && showDots) {
        html += `<div class="valid-dot"></div>`;
      }
      if (isLast) {
        html += `<div class="last-move-ring"></div>`;
      }
      html += `</div>`;
    }
  }
  html += '</div>';
  return html;
}

function renderGameOver() {
  const isWon = state.status === 'won';
  const isDraw = state.status === 'draw';
  let resultText = '';
  if (isDraw) resultText = 'Draw!';
  else resultText = state.winner === 1 ? 'Dark wins!' : 'Light wins!';

  return `
    <div class="game-over-overlay">
      <div class="game-over-card">
        <div class="game-over-result ${isDraw ? 'draw' : state.winner === 1 ? 'dark-wins' : 'light-wins'}">${resultText}</div>
        <div class="game-over-counts">Dark ${state.scores[1]} — Light ${state.scores[2]}</div>
        <div class="game-over-actions">
          <button class="primary-btn" id="play-again-btn">Play Again</button>
          <button class="secondary-btn" id="home-btn">Home</button>
        </div>
      </div>
    </div>
  `;
}

// ─── Help Modal ──────────────────────────────────────────────────────────────

function renderHelpModal() {
  return `
    <div class="modal-backdrop" id="modal-backdrop">
      <div class="modal-card" role="dialog" aria-modal="true" aria-label="Help">
        <button class="modal-close icon-btn" id="modal-close-btn">${ICON_X}</button>
        <h2 class="modal-title">How to Play</h2>
        <div class="modal-content">
          <h3>Objective</h3>
          <p>Have more discs of your color on the board than your opponent when neither player can move.</p>

          <h3>Rules</h3>
          <ul>
            <li>Dark goes first; players alternate placing one disc per turn.</li>
            <li>A disc can only be placed where it flips at least one opponent disc.</li>
            <li>All opponent discs sandwiched between your new disc and an existing friendly disc (in any direction) are flipped simultaneously.</li>
            <li>If you have no valid move, your turn is skipped automatically.</li>
            <li>Game ends when neither player can move or all 64 squares are filled.</li>
          </ul>

          <h3>Strategy</h3>
          <ul>
            <li>Corners are permanent once captured; anchor your edge control around them.</li>
            <li>Avoid X-squares (diagonally adjacent to corners) — giving them away hands your opponent the corner.</li>
            <li>Avoid C-squares (edge squares adjacent to corners) for the same reason.</li>
            <li>Prioritize mobility (more valid moves than opponent) over raw disc count early in the game.</li>
            <li>Fewer discs mid-game is often an advantage — it limits your opponent's flipping options.</li>
          </ul>

          <h3>Common mistakes</h3>
          <ul>
            <li>Taking X-squares to gain a few discs — your opponent captures the corner next turn.</li>
            <li>Chasing disc count in the first 30 moves.</li>
            <li>Ignoring opponent mobility — many opponent moves means they control the board.</li>
          </ul>

          <h3>Tips</h3>
          <ul>
            <li>Count your opponent's valid moves after each placement — fewer is better.</li>
            <li>The first player to capture a corner almost always wins.</li>
            <li>Edges are strong once fully filled.</li>
          </ul>
        </div>
      </div>
    </div>
  `;
}

// ─── Confirm Modal ───────────────────────────────────────────────────────────

let confirmCallback = null;

function showConfirmModal(cb) {
  confirmCallback = cb;
  const existing = document.getElementById('confirm-backdrop');
  if (existing) existing.remove();
  const div = document.createElement('div');
  div.innerHTML = `
    <div class="modal-backdrop" id="confirm-backdrop">
      <div class="modal-card" role="dialog" aria-modal="true">
        <h2 class="modal-title">Start a new game?</h2>
        <p class="modal-body">Your current game will be lost.</p>
        <div class="modal-actions">
          <button class="secondary-btn" id="confirm-cancel">Cancel</button>
          <button class="primary-btn" id="confirm-ok">New Game</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(div.firstElementChild);
  document.getElementById('confirm-cancel').addEventListener('click', () => {
    document.getElementById('confirm-backdrop').remove();
  });
  document.getElementById('confirm-ok').addEventListener('click', () => {
    document.getElementById('confirm-backdrop').remove();
    if (confirmCallback) confirmCallback();
  });
  document.getElementById('confirm-backdrop').addEventListener('click', e => {
    if (e.target.id === 'confirm-backdrop') document.getElementById('confirm-backdrop').remove();
  });
}

// ─── Event Wiring ────────────────────────────────────────────────────────────

function attachEvents() {
  // Board cells
  document.querySelectorAll('.cell').forEach(cell => {
    const row = parseInt(cell.dataset.row, 10);
    const col = parseInt(cell.dataset.col, 10);
    cell.addEventListener('click', () => handleCellClick(row, col));
    cell.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleCellClick(row, col);
      }
    });
  });

  // Help button
  document.getElementById('help-btn')?.addEventListener('click', () => {
    document.body.insertAdjacentHTML('beforeend', renderHelpModal());
    wireHelpModal();
  });

  // Theme button
  document.getElementById('theme-btn')?.addEventListener('click', toggleTheme);

  // Home screen
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.mode = btn.dataset.mode;
      localStorage.setItem('reversi_mode', state.mode);
      render();
    });
  });

  document.querySelectorAll('.pill-btn[data-color]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.playerColor = parseInt(btn.dataset.color, 10);
      localStorage.setItem('reversi_color', state.playerColor);
      render();
    });
  });

  document.querySelectorAll('.pill-btn[data-diff]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.difficulty = btn.dataset.diff;
      localStorage.setItem('reversi_difficulty', state.difficulty);
      render();
    });
  });

  document.getElementById('new-game-btn')?.addEventListener('click', resetGame);
  document.getElementById('resume-btn')?.addEventListener('click', () => {
    try {
      const saved = JSON.parse(localStorage.getItem('reversi_state'));
      if (saved && saved.status === 'playing') {
        Object.assign(state, saved);
        state.flippedCells = [];
        state.aiThinking = false;
        state.passMessage = null;
        state.validMoves = getValidMoves(state.board, state.currentPlayer).map(([r, c]) => `${r},${c}`);
        render();
      }
    } catch (_) {}
  });

  // Play screen
  document.getElementById('close-btn')?.addEventListener('click', () => {
    if (state.status === 'playing') {
      showConfirmModal(() => {
        state.status = 'idle';
        render();
      });
    } else {
      state.status = 'idle';
      render();
    }
  });

  document.getElementById('play-again-btn')?.addEventListener('click', startGame);
  document.getElementById('home-btn')?.addEventListener('click', () => {
    state.status = 'idle';
    render();
  });
}

function wireHelpModal() {
  const backdrop = document.getElementById('modal-backdrop');
  document.getElementById('modal-close-btn')?.addEventListener('click', () => backdrop.remove());
  backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop.remove(); });
  document.addEventListener('keydown', function onEsc(e) {
    if (e.key === 'Escape') { backdrop.remove(); document.removeEventListener('keydown', onEsc); }
  });
}

// ─── Init ─────────────────────────────────────────────────────────────────────

applyTheme(localStorage.getItem('reversi_theme') || 'dark');
loadState();
render();
