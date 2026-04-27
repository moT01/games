// pits[0..6]  = P1 houses, pits[7]  = P1 store
// pits[8..14] = P2 houses, pits[15] = P2 store
// P2 house[8] is opposite P1 house[6], P2 house[14] is opposite P1 house[0]
// Sowing order: 0->1->...->15->0 (CCW). P1 skips 15. P2 skips 7.

const P1_STORE = 7;
const P2_STORE = 15;
const P1_HOUSES = [0, 1, 2, 3, 4, 5, 6];
const P2_HOUSES = [8, 9, 10, 11, 12, 13, 14];

// --- Game Logic ---

function initBoard() {
  const pits = Array(16).fill(7);
  pits[P1_STORE] = 0;
  pits[P2_STORE] = 0;
  return pits;
}

function initState(mode, difficulty) {
  const pits = initBoard();
  return {
    pits,
    phase: 'home',
    turn: 1,
    mode,
    difficulty,
    firstMoveP1: null,
    firstMoveP2: null,
    winner: null,
    animQueue: [],
    scores: { p1: 0, p2: 0 },
  };
}

function getNextPit(currentIndex, player) {
  const skip = player === 1 ? P2_STORE : P1_STORE;
  let next = (currentIndex + 1) % 16;
  if (next === skip) next = (next + 1) % 16;
  return next;
}

function computeSow(pits, startIndex, player) {
  const newPits = [...pits];
  let seeds = newPits[startIndex];
  newPits[startIndex] = 0;
  const animSteps = [{ pit: startIndex, delta: -seeds }];
  let current = startIndex;
  while (seeds > 0) {
    current = getNextPit(current, player);
    newPits[current]++;
    seeds--;
    animSteps.push({ pit: current, delta: 1 });
  }
  return { newPits, animSteps, lastPit: current };
}

function oppositePit(index) {
  if (index >= 0 && index <= 6) return 14 - index;
  if (index >= 8 && index <= 14) return 22 - index;
  return -1;
}

function resolveTurn(pits, lastPit, player) {
  const newPits = [...pits];
  const ownStore = player === 1 ? P1_STORE : P2_STORE;
  const ownHouses = player === 1 ? P1_HOUSES : P2_HOUSES;

  if (lastPit === ownStore) {
    return { outcome: 'extra-turn', newPits };
  }

  if (ownHouses.includes(lastPit) && newPits[lastPit] === 1) {
    const oppIdx = oppositePit(lastPit);
    if (newPits[oppIdx] > 0) {
      newPits[ownStore] += newPits[oppIdx] + 1;
      newPits[lastPit] = 0;
      newPits[oppIdx] = 0;
      return { outcome: 'capture', newPits, capturedPit: lastPit, oppPit: oppIdx };
    }
  }

  return { outcome: 'end', newPits };
}

function checkGameOver(pits) {
  const p1Empty = P1_HOUSES.every(i => pits[i] === 0);
  const p2Empty = P2_HOUSES.every(i => pits[i] === 0);
  return p1Empty || p2Empty;
}

function sweepRemaining(pits) {
  const newPits = [...pits];
  const p1Empty = P1_HOUSES.every(i => newPits[i] === 0);
  const p2Empty = P2_HOUSES.every(i => newPits[i] === 0);
  if (!p1Empty) {
    P1_HOUSES.forEach(i => { newPits[P1_STORE] += newPits[i]; newPits[i] = 0; });
  } else if (!p2Empty) {
    P2_HOUSES.forEach(i => { newPits[P2_STORE] += newPits[i]; newPits[i] = 0; });
  }
  return newPits;
}

function getWinner(pits) {
  if (pits[P1_STORE] > pits[P2_STORE]) return 1;
  if (pits[P2_STORE] > pits[P1_STORE]) return 2;
  return 'draw';
}

function isValidMove(pits, pitIndex, player) {
  const ownHouses = player === 1 ? P1_HOUSES : P2_HOUSES;
  return ownHouses.includes(pitIndex) && pits[pitIndex] > 0;
}

function getValidMoves(pits, player) {
  const ownHouses = player === 1 ? P1_HOUSES : P2_HOUSES;
  return ownHouses.filter(i => pits[i] > 0);
}

function heuristic(pits) {
  let score = pits[P2_STORE] - pits[P1_STORE];
  P2_HOUSES.forEach(i => {
    const seeds = pits[i];
    if (seeds === 0) return;
    let cur = i;
    let s = seeds;
    while (s > 0) { cur = getNextPit(cur, 2); s--; }
    if (cur === P2_STORE) score += 3;
    else if (P2_HOUSES.includes(cur) && pits[cur] === 0 && pits[oppositePit(cur)] > 0) score += 5;
  });
  P2_HOUSES.forEach(i => {
    if (pits[i] === 0 && pits[oppositePit(i)] > 0) score -= 2;
  });
  return score;
}

function minimax(pits, depth, alpha, beta, maximizing) {
  if (depth === 0 || checkGameOver(pits)) return heuristic(pits);
  const player = maximizing ? 2 : 1;
  const moves = getValidMoves(pits, player);
  if (moves.length === 0) return heuristic(sweepRemaining(pits));
  if (maximizing) {
    let best = -Infinity;
    for (const move of moves) {
      const { newPits, lastPit } = computeSow(pits, move, 2);
      const { outcome, newPits: resolved } = resolveTurn(newPits, lastPit, 2);
      const child = checkGameOver(resolved) ? sweepRemaining(resolved) : resolved;
      const val = minimax(child, depth - 1, alpha, beta, outcome === 'extra-turn');
      best = Math.max(best, val);
      alpha = Math.max(alpha, val);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      const { newPits, lastPit } = computeSow(pits, move, 1);
      const { outcome, newPits: resolved } = resolveTurn(newPits, lastPit, 1);
      const child = checkGameOver(resolved) ? sweepRemaining(resolved) : resolved;
      const val = minimax(child, depth - 1, alpha, beta, outcome !== 'extra-turn');
      best = Math.min(best, val);
      beta = Math.min(beta, val);
      if (beta <= alpha) break;
    }
    return best;
  }
}

function getBestMove(pits, difficulty) {
  const depth = difficulty === 'hard' ? 6 : 3;
  const moves = getValidMoves(pits, 2);
  let bestScore = -Infinity;
  let bestMove = moves[0];
  let bestCapture = -Infinity;
  for (const move of moves) {
    const { newPits, lastPit } = computeSow(pits, move, 2);
    const { outcome, newPits: resolved } = resolveTurn(newPits, lastPit, 2);
    const child = checkGameOver(resolved) ? sweepRemaining(resolved) : resolved;
    const score = minimax(child, depth - 1, -Infinity, Infinity, outcome === 'extra-turn');
    const capturedSeeds = resolved[P2_STORE] - pits[P2_STORE];
    if (score > bestScore || (score === bestScore && difficulty === 'hard' && capturedSeeds > bestCapture)) {
      bestScore = score;
      bestMove = move;
      bestCapture = capturedSeeds;
    }
  }
  return bestMove;
}

function applyFirstMoves(pits, p1Pit, p2Pit) {
  const newPits = [...pits];
  const p1Seeds = newPits[p1Pit];
  const p2Seeds = newPits[p2Pit];
  newPits[p1Pit] = 0;
  newPits[p2Pit] = 0;
  const p1AnimSteps = [{ pit: p1Pit, delta: -p1Seeds }];
  const p2AnimSteps = [{ pit: p2Pit, delta: -p2Seeds }];
  let cur1 = p1Pit;
  let s1 = p1Seeds;
  while (s1 > 0) { cur1 = getNextPit(cur1, 1); newPits[cur1]++; s1--; p1AnimSteps.push({ pit: cur1, delta: 1 }); }
  let cur2 = p2Pit;
  let s2 = p2Seeds;
  while (s2 > 0) { cur2 = getNextPit(cur2, 2); newPits[cur2]++; s2--; p2AnimSteps.push({ pit: cur2, delta: 1 }); }
  return { newPits, p1AnimSteps, p2AnimSteps };
}

// --- localStorage ---

function saveState(s) {
  try { localStorage.setItem('congkak-state', JSON.stringify(s)); } catch (_) {}
}

function loadState() {
  try {
    const raw = localStorage.getItem('congkak-state');
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || !Array.isArray(s.pits) || s.pits.length !== 16) return null;
    return s;
  } catch (_) { return null; }
}

function clearState() {
  try { localStorage.removeItem('congkak-state'); } catch (_) {}
}

function savePrefs(prefs) {
  try { localStorage.setItem('congkak-prefs', JSON.stringify(prefs)); } catch (_) {}
}

function loadPrefs() {
  try {
    const raw = localStorage.getItem('congkak-prefs');
    if (!raw) return { mode: 'vs-computer', difficulty: 'normal', theme: 'dark' };
    return { mode: 'vs-computer', difficulty: 'normal', theme: 'dark', ...JSON.parse(raw) };
  } catch (_) { return { mode: 'vs-computer', difficulty: 'normal', theme: 'dark' }; }
}

function saveRecord(result, difficulty, mode) {
  const rec = loadRecords();
  if (mode === 'vs-computer') {
    const key = difficulty === 'hard' ? 'winsHard' : 'winsNormal';
    if (result === 'win') rec[key] = (rec[key] || 0) + 1;
  } else {
    rec.twoPlayerGames = (rec.twoPlayerGames || 0) + 1;
  }
  try { localStorage.setItem('congkak-records', JSON.stringify(rec)); } catch (_) {}
}

function loadRecords() {
  try {
    const raw = localStorage.getItem('congkak-records');
    if (!raw) return { winsNormal: 0, winsHard: 0, twoPlayerGames: 0 };
    return { winsNormal: 0, winsHard: 0, twoPlayerGames: 0, ...JSON.parse(raw) };
  } catch (_) { return { winsNormal: 0, winsHard: 0, twoPlayerGames: 0 }; }
}

// --- Theme ---

let currentTheme = loadPrefs().theme || 'dark';

function applyTheme(t) {
  document.body.classList.remove('light-palette', 'dark-palette');
  document.body.classList.add(t === 'light' ? 'light-palette' : 'dark-palette');
}

applyTheme(currentTheme);

// --- Icons ---

const ICON_QUESTION = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M64 160c0-53 43-96 96-96s96 43 96 96c0 42.7-27.9 78.9-66.5 91.4-28.4 9.2-61.5 35.3-61.5 76.6l0 24c0 17.7 14.3 32 32 32s32-14.3 32-32l0-24c0-1.7 .6-4.1 3.5-7.3 3-3.3 7.9-6.5 13.7-8.4 64.3-20.7 110.8-81 110.8-152.3 0-88.4-71.6-160-160-160S0 71.6 0 160c0 17.7 14.3 32 32 32s32-14.3 32-32zm96 352c22.1 0 40-17.9 40-40s-17.9-40-40-40-40 17.9-40 40 17.9 40 40 40z"/></svg>`;
const ICON_X       = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M376.6 84.5c11.3-13.6 9.5-33.8-4.1-45.1s-33.8-9.5-45.1 4.1L192 206 56.6 43.5C45.3 29.9 25.1 28.1 11.5 39.4S-3.9 70.9 7.4 84.5L150.3 256 7.4 427.5c-11.3 13.6-9.5 33.8 4.1 45.1s33.8 9.5 45.1-4.1L192 306 327.4 468.5c11.3 13.6 31.5 15.4 45.1 4.1s15.4-31.5 4.1-45.1L233.7 256 376.6 84.5z"/></svg>`;
const ICON_HEART   = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M241 87.1l15 20.7 15-20.7C296 52.5 336.2 32 378.9 32 452.4 32 512 91.6 512 165.1l0 2.6c0 112.2-139.9 242.5-212.9 298.2-12.4 9.4-27.6 14.1-43.1 14.1s-30.8-4.6-43.1-14.1C139.9 410.2 0 279.9 0 167.7l0-2.6C0 91.6 59.6 32 133.1 32 175.8 32 216 52.5 241 87.1z"/></svg>`;
const ICON_SUN     = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M288-32c8.4 0 16.3 4.4 20.6 11.7L364.1 72.3 468.9 46c8.2-2 16.9 .4 22.8 6.3S500 67 498 75.1l-26.3 104.7 92.7 55.5c7.2 4.3 11.7 12.2 11.7 20.6s-4.4 16.3-11.7 20.6L471.7 332.1 498 436.8c2 8.2-.4 16.9-6.3 22.8S477 468 468.9 466l-104.7-26.3-55.5 92.7c-4.3 7.2-12.2 11.7-20.6 11.7s-16.3-4.4-20.6-11.7L211.9 439.7 107.2 466c-8.2 2-16.8-.4-22.8-6.3S76 445 78 436.8l26.2-104.7-92.6-55.5C4.4 272.2 0 264.4 0 256s4.4-16.3 11.7-20.6L104.3 179.9 78 75.1c-2-8.2 .3-16.8 6.3-22.8S99 44 107.2 46l104.7 26.2 55.5-92.6 1.8-2.6c4.5-5.7 11.4-9.1 18.8-9.1zm0 144a144 144 0 1 0 0 288 144 144 0 1 0 0-288zm0 240a96 96 0 1 1 0-192 96 96 0 1 1 0 192z"/></svg>`;
const ICON_MOON    = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 0C114.6 0 0 114.6 0 256S114.6 512 256 512c68.8 0 131.3-27.2 177.3-71.4 7.3-7 9.4-17.9 5.3-27.1s-13.7-14.9-23.8-14.1c-4.9 .4-9.8 .6-14.8 .6-101.6 0-184-82.4-184-184 0-72.1 41.5-134.6 102.1-164.8 9.1-4.5 14.3-14.3 13.1-24.4S322.6 8.5 312.7 6.3C294.4 2.2 275.4 0 256 0z"/></svg>`;

function themeIcon() { return currentTheme === 'dark' ? ICON_SUN : ICON_MOON; }
function themeLabel() { return currentTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'; }

// --- App state ---

let state = initState('vs-computer', 'normal');
let animating = false;

const app = document.getElementById('app');

function render() {
  const ph = state.phase;
  if (ph === 'home') {
    renderHome();
  } else if (ph === 'first-move-p1' || ph === 'first-move-p2' || ph === 'first-move-pass' || ph === 'first-move-reveal' || ph === 'playing' || ph === 'animating' || ph === 'computer-thinking') {
    renderPlay();
  } else if (ph === 'game-over') {
    renderPlay();
    renderGameOver();
  }
}

// --- Home screen ---

function renderHome() {
  const prefs = loadPrefs();
  const rec = loadRecords();
  const saved = loadState();
  const showResume = saved && saved.phase !== 'home' && saved.phase !== 'game-over';
  const showDiff = prefs.mode === 'vs-computer';

  app.innerHTML = `
    <div class="container home-container">
      <div class="home-header">
        <div class="header-spacer"></div>
        <div class="header-icons">
          <button class="icon-btn" id="btn-help" aria-label="Help">${ICON_QUESTION}</button>
          <button class="icon-btn" id="btn-theme" aria-label="${themeLabel()}" aria-pressed="${currentTheme === 'light'}">${themeIcon()}</button>
          <a href="https://www.freecodecamp.org/donate" target="_blank" rel="noopener" class="icon-btn" aria-label="Donate">${ICON_HEART}</a>
        </div>
      </div>
      <hr class="header-rule" />
      <div class="home-body">
        <h1 class="game-title">Congkak</h1>
        <div class="mode-tabs" id="mode-tabs">
          <button class="tab-btn ${prefs.mode === 'vs-computer' ? 'active' : ''}" data-mode="vs-computer">vs Computer</button>
          <button class="tab-btn ${prefs.mode === '2-player' ? 'active' : ''}" data-mode="2-player">2 Players</button>
        </div>
        <div class="diff-row ${showDiff ? '' : 'hidden'}" id="diff-row">
          <span class="diff-label">Difficulty</span>
          <div class="diff-tabs" id="diff-tabs">
            <button class="tab-btn ${prefs.difficulty === 'normal' ? 'active' : ''}" data-diff="normal">Normal</button>
            <button class="tab-btn ${prefs.difficulty === 'hard' ? 'active' : ''}" data-diff="hard">Hard</button>
          </div>
        </div>
        <div class="records-panel">
          <div class="records-label">Wins</div>
          <div class="record-row"><span>Normal</span><span class="record-val">${rec.winsNormal}</span></div>
          <div class="record-row"><span>Hard</span><span class="record-val">${rec.winsHard}</span></div>
          <div class="record-row"><span>2 Players (games)</span><span class="record-val">${rec.twoPlayerGames}</span></div>
        </div>
        <div class="home-actions">
          <button class="btn-primary" id="btn-new-game">New Game</button>
          ${showResume ? `<button class="btn-secondary" id="btn-resume">Resume</button>` : ''}
        </div>
      </div>
    </div>
    ${helpModalHtml()}
  `;

  bindHomeEvents(prefs);
}

function bindHomeEvents(prefs) {
  let selectedMode = prefs.mode;
  let selectedDiff = prefs.difficulty;

  document.getElementById('mode-tabs').addEventListener('click', e => {
    const btn = e.target.closest('.tab-btn[data-mode]');
    if (!btn) return;
    selectedMode = btn.dataset.mode;
    document.querySelectorAll('#mode-tabs .tab-btn').forEach(b => b.classList.toggle('active', b === btn));
    const diffRow = document.getElementById('diff-row');
    diffRow.classList.toggle('hidden', selectedMode !== 'vs-computer');
    savePrefs({ mode: selectedMode, difficulty: selectedDiff, theme: currentTheme });
  });

  document.getElementById('diff-tabs').addEventListener('click', e => {
    const btn = e.target.closest('.tab-btn[data-diff]');
    if (!btn) return;
    selectedDiff = btn.dataset.diff;
    document.querySelectorAll('#diff-tabs .tab-btn').forEach(b => b.classList.toggle('active', b === btn));
    savePrefs({ mode: selectedMode, difficulty: selectedDiff, theme: currentTheme });
  });

  document.getElementById('btn-new-game').addEventListener('click', () => {
    savePrefs({ mode: selectedMode, difficulty: selectedDiff, theme: currentTheme });
    state = initState(selectedMode, selectedDiff);
    state.phase = 'first-move-p1';
    clearState();
    render();
    if (selectedMode === 'vs-computer') {
      // computer pre-selects silently
      state.firstMoveP2 = getBestMove(state.pits, selectedDiff);
    }
  });

  const resumeBtn = document.getElementById('btn-resume');
  if (resumeBtn) {
    resumeBtn.addEventListener('click', () => {
      const saved = loadState();
      if (saved) { state = saved; animating = false; render(); }
    });
  }

  document.getElementById('btn-theme').addEventListener('click', toggleTheme);
  document.getElementById('btn-help').addEventListener('click', showHelp);
  bindHelpModal();
}

// --- Play screen ---

function renderPlay() {
  const s = state;
  const validMoves = animating ? [] : getValidMoves(s.pits, s.turn);
  const isFirstMove = s.phase === 'first-move-p1' || s.phase === 'first-move-p2' || s.phase === 'first-move-pass';
  const isThinking = s.phase === 'computer-thinking';

  app.innerHTML = `
    <div class="container play-container">
      <div class="play-header">
        <button class="icon-btn" id="btn-close" aria-label="Close game">${ICON_X}</button>
        <div class="header-icons">
          <button class="icon-btn" id="btn-help" aria-label="Help">${ICON_QUESTION}</button>
          <button class="icon-btn" id="btn-theme" aria-label="${themeLabel()}" aria-pressed="${currentTheme === 'light'}">${themeIcon()}</button>
          <a href="https://www.freecodecamp.org/donate" target="_blank" rel="noopener" class="icon-btn" aria-label="Donate">${ICON_HEART}</a>
        </div>
      </div>
      <hr class="header-rule" />
      <div class="status-bar" id="status-bar" aria-live="polite">
        ${buildStatusText(s, isThinking)}
      </div>
      <div class="board-wrap">
        ${renderBoard(s, validMoves)}
        ${renderFirstMovePrompt(s)}
      </div>
    </div>
    ${helpModalHtml()}
    ${confirmModalHtml()}
  `;

  bindPlayEvents(validMoves, isFirstMove);
}

function buildStatusText(s, isThinking) {
  if (s.phase === 'game-over') {
    if (s.winner === 'draw') return `<span class="status-neutral">Draw!</span>`;
    if (s.mode === 'vs-computer') {
      return s.winner === 1
        ? `<span class="status-win">You win!</span>`
        : `<span class="status-loss">You lose.</span>`;
    }
    return `<span class="status-win">Player ${s.winner} wins!</span>`;
  }
  if (isThinking) {
    return `<span class="status-thinking">Thinking<span class="dot-pulse"><span>.</span><span>.</span><span>.</span></span></span>`;
  }
  if (s.phase === 'first-move-p1') {
    return `<span class="status-neutral">Player 1: choose your opening house</span>`;
  }
  if (s.phase === 'first-move-pass') {
    return `<span class="status-neutral">Pass to Player 2</span>`;
  }
  if (s.phase === 'first-move-p2') {
    return `<span class="status-neutral">Player 2: choose your opening house</span>`;
  }
  if (s.phase === 'first-move-reveal') {
    return `<span class="status-neutral">First move!</span>`;
  }
  if (s.mode === 'vs-computer') {
    return `<span class="status-neutral">${s.turn === 1 ? 'Your turn' : 'Opponent\'s turn'}</span>`;
  }
  return `<span class="status-neutral">Player ${s.turn}'s turn</span>`;
}

function renderBoard(s, validMoves) {
  const pits = s.pits;
  const p1StoreLabel = s.mode === 'vs-computer' ? 'You' : 'P1';
  const p2StoreLabel = s.mode === 'vs-computer' ? 'Opp' : 'P2';

  // P2 top row: pits 14,13,12,11,10,9,8 (left to right from P1 view, right to left from P2 view)
  const p2Row = [14, 13, 12, 11, 10, 9, 8];
  // P1 bottom row: pits 0,1,2,3,4,5,6
  const p1Row = [0, 1, 2, 3, 4, 5, 6];

  const isFirstMoveP1 = s.phase === 'first-move-p1';
  const isFirstMoveP2 = s.phase === 'first-move-p2';

  function pitHtml(idx) {
    const count = pits[idx];
    const isP1House = P1_HOUSES.includes(idx);
    const isP2House = P2_HOUSES.includes(idx);
    const isValid = validMoves.includes(idx);
    const isSelected = (isFirstMoveP1 && s.firstMoveP1 === idx) || (isFirstMoveP2 && s.firstMoveP2 === idx);
    const isEmpty = count === 0;

    let cls = 'pit';
    if (isValid) cls += ' valid';
    if (!isValid) cls += ' disabled';
    if (isEmpty) cls += ' empty';
    if (isSelected) cls += ' selected';

    // During first-move phases, only active player's row is interactive
    const isActiveSide = (isFirstMoveP1 && isP1House) || (isFirstMoveP2 && isP2House);
    const interactable = isFirstMoveP1 || isFirstMoveP2 ? isActiveSide && !isEmpty : isValid;

    const playerLabel = isP1House ? 'Player 1' : 'Player 2';
    const houseNum = isP1House ? idx + 1 : idx - 7;
    const label = `${playerLabel} house ${houseNum}, ${count} seed${count !== 1 ? 's' : ''}${isValid ? ', valid move' : ''}`;

    return `<div class="${cls}" data-pit="${idx}" role="button"
      tabindex="${interactable ? '0' : '-1'}"
      aria-label="${label}"
      aria-disabled="${!interactable}">${count}</div>`;
  }

  return `
    <div class="board">
      <div class="store p2-store" aria-label="${p2StoreLabel} store, ${pits[P2_STORE]} seeds">
        <div class="store-count">${pits[P2_STORE]}</div>
        <div class="store-label">${p2StoreLabel}</div>
      </div>
      <div class="houses">
        <div class="row-label">${s.mode === 'vs-computer' ? 'Opponent' : 'Player 2'}</div>
        <div class="house-row p2-row">${p2Row.map(pitHtml).join('')}</div>
        <div class="house-row p1-row">${p1Row.map(pitHtml).join('')}</div>
        <div class="row-label">${s.mode === 'vs-computer' ? 'You' : 'Player 1'}</div>
      </div>
      <div class="store p1-store" aria-label="${p1StoreLabel} store, ${pits[P1_STORE]} seeds">
        <div class="store-count">${pits[P1_STORE]}</div>
        <div class="store-label">${p1StoreLabel}</div>
      </div>
    </div>
  `;
}

function renderFirstMovePrompt(s) {
  if (s.phase === 'first-move-pass') {
    return `
      <div class="first-move-overlay">
        <div class="first-move-pass-panel">
          <div class="pass-text">Player 1 has chosen. Pass the device to Player 2.</div>
          <button class="btn-primary" id="btn-pass-confirm">Continue</button>
        </div>
      </div>
    `;
  }
  return '';
}

function renderGameOver() {
  const s = state;
  let headline, headlineCls;
  if (s.winner === 'draw') {
    headline = 'Draw!';
    headlineCls = 'status-neutral';
  } else if (s.mode === 'vs-computer') {
    headline = s.winner === 1 ? 'You win!' : 'You lose.';
    headlineCls = s.winner === 1 ? 'status-win' : 'status-loss';
  } else {
    headline = `Player ${s.winner} wins!`;
    headlineCls = 'status-win';
  }

  const p1Label = s.mode === 'vs-computer' ? 'You' : 'P1';
  const p2Label = s.mode === 'vs-computer' ? 'Opp' : 'P2';

  const overlay = document.createElement('div');
  overlay.className = 'gameover-overlay';
  overlay.innerHTML = `
    <div class="gameover-panel">
      <div class="gameover-headline ${headlineCls}">${headline}</div>
      <div class="gameover-scores">
        <div class="score-row"><span>${p1Label}</span><span class="score-val">${s.pits[P1_STORE]}</span></div>
        <div class="score-row"><span>${p2Label}</span><span class="score-val">${s.pits[P2_STORE]}</span></div>
      </div>
      <div class="gameover-actions">
        <button class="btn-primary" id="btn-play-again">Play Again</button>
        <button class="btn-secondary" id="btn-menu">Menu</button>
      </div>
    </div>
  `;

  app.querySelector('.board-wrap').appendChild(overlay);

  document.getElementById('btn-play-again').addEventListener('click', () => {
    state = initState(s.mode, s.difficulty);
    state.phase = 'first-move-p1';
    clearState();
    render();
    if (state.mode === 'vs-computer') {
      state.firstMoveP2 = getBestMove(state.pits, state.difficulty);
    }
  });

  document.getElementById('btn-menu').addEventListener('click', () => {
    clearState();
    state = initState(loadPrefs().mode, loadPrefs().difficulty);
    state.phase = 'home';
    render();
  });
}

function bindPlayEvents(validMoves, isFirstMove) {
  document.getElementById('btn-close').addEventListener('click', () => {
    if (state.phase !== 'game-over' && !animating) {
      showConfirm();
    } else {
      goHome();
    }
  });

  document.getElementById('btn-theme').addEventListener('click', toggleTheme);
  document.getElementById('btn-help').addEventListener('click', showHelp);

  bindHelpModal();
  bindConfirmModal();

  // First-move pass button
  const passBtn = document.getElementById('btn-pass-confirm');
  if (passBtn) {
    passBtn.addEventListener('click', () => {
      state.phase = 'first-move-p2';
      render();
    });
  }

  // Pit clicks
  document.querySelectorAll('.pit').forEach(el => {
    const idx = parseInt(el.dataset.pit, 10);
    const handler = () => handlePitClick(idx);
    el.addEventListener('click', handler);
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
    });
  });

  // Tab cycles through valid pits only
  const validEls = [...document.querySelectorAll('.pit.valid')];
  validEls.forEach((el, i) => {
    el.addEventListener('keydown', e => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const next = validEls[(i + (e.shiftKey ? validEls.length - 1 : 1)) % validEls.length];
        next.focus();
      }
    });
  });

  document.addEventListener('keydown', escapeHandler);
}

function escapeHandler(e) {
  if (e.key === 'Escape') {
    const modal = document.getElementById('help-modal') || document.getElementById('confirm-modal');
    if (modal && !modal.classList.contains('hidden')) modal.classList.add('hidden');
  }
}

function handlePitClick(idx) {
  if (animating) return;

  // First move phases
  if (state.phase === 'first-move-p1') {
    if (!P1_HOUSES.includes(idx) || state.pits[idx] === 0) return;
    state.firstMoveP1 = idx;
    render(); // show selection highlight
    // re-bind after render
    setTimeout(() => {
      if (state.mode === 'vs-computer') {
        // computer already pre-selected; go straight to reveal
        runFirstMoveReveal();
      } else {
        // show pass screen
        state.phase = 'first-move-pass';
        render();
      }
    }, 200);
    return;
  }

  if (state.phase === 'first-move-p2') {
    if (!P2_HOUSES.includes(idx) || state.pits[idx] === 0) return;
    state.firstMoveP2 = idx;
    render();
    setTimeout(() => runFirstMoveReveal(), 200);
    return;
  }

  if (state.phase !== 'playing') return;
  if (!isValidMove(state.pits, idx, state.turn)) return;
  animateSow(idx, state.turn);
}

function runFirstMoveReveal() {
  state.phase = 'first-move-reveal';
  render();
  animating = true;

  const { newPits, p1AnimSteps, p2AnimSteps } = applyFirstMoves(state.pits, state.firstMoveP1, state.firstMoveP2);

  // Animate both simultaneously
  const maxLen = Math.max(p1AnimSteps.length, p2AnimSteps.length);
  let step = 1; // skip the delta:-seeds step (index 0) for display, just start distributing

  // Apply the initial empty to displayed pits immediately
  const displayPits = [...state.pits];
  displayPits[state.firstMoveP1] = 0;
  displayPits[state.firstMoveP2] = 0;

  function nextStep() {
    if (step >= maxLen) {
      state.pits = newPits;
      state.scores = { p1: newPits[P1_STORE], p2: newPits[P2_STORE] };

      // Resolve both turns
      const p1Last = p1AnimSteps[p1AnimSteps.length - 1].pit;
      const p2Last = p2AnimSteps[p2AnimSteps.length - 1].pit;
      const r1 = resolveTurn(state.pits, p1Last, 1);
      const r2 = resolveTurn(r1.newPits, p2Last, 2);
      state.pits = r2.newPits;
      state.scores = { p1: state.pits[P1_STORE], p2: state.pits[P2_STORE] };

      // Determine who goes next: extra-turn wins, else P1 goes first
      if (r1.outcome === 'extra-turn') state.turn = 1;
      else if (r2.outcome === 'extra-turn') state.turn = 2;
      else state.turn = 1;

      animating = false;
      state.firstMoveP1 = null;
      state.firstMoveP2 = null;

      if (checkGameOver(state.pits)) {
        finishGame();
      } else {
        state.phase = 'playing';
        saveState(state);
        render();
        if (state.mode === 'vs-computer' && state.turn === 2) {
          triggerComputer();
        }
      }
      return;
    }

    if (step < p1AnimSteps.length) {
      const s1 = p1AnimSteps[step];
      flashPit(s1.pit);
    }
    if (step < p2AnimSteps.length) {
      const s2 = p2AnimSteps[step];
      flashPit(s2.pit);
    }
    step++;
    setTimeout(nextStep, 80);
  }

  setTimeout(nextStep, 80);
}

function animateSow(pitIndex, player) {
  animating = true;
  state.phase = 'animating';
  render();

  const sowPath = buildSowPath(state.pits, pitIndex, player);
  let step = 0;

  function nextStep() {
    if (step >= sowPath.length) {
      finishSow(pitIndex, player);
      return;
    }
    flashPit(sowPath[step]);
    step++;
    setTimeout(nextStep, 80);
  }

  nextStep();
}

function buildSowPath(pits, startPit, player) {
  const seeds = pits[startPit];
  const path = [];
  let cursor = startPit;
  let remaining = seeds;
  while (remaining > 0) {
    cursor = getNextPit(cursor, player);
    path.push(cursor);
    remaining--;
  }
  return path;
}

function flashPit(idx) {
  const el = document.querySelector(`.pit[data-pit="${idx}"]`);
  if (!el) return;
  el.classList.add('receiving');
  setTimeout(() => el.classList.remove('receiving'), 120);
}

function finishSow(pitIndex, player) {
  const { newPits, lastPit } = computeSow(state.pits, pitIndex, player);
  const { outcome, newPits: resolved, capturedPit, oppPit } = resolveTurn(newPits, lastPit, player);

  if (outcome === 'capture' && capturedPit !== undefined) {
    // Flash captured pit and store
    state.pits = newPits; // show post-sow state before capture
    render();
    const capEl = document.querySelector(`.pit[data-pit="${capturedPit}"]`);
    const oppEl = document.querySelector(`.pit[data-pit="${oppPit}"]`);
    if (capEl) capEl.classList.add('captured');
    if (oppEl) oppEl.classList.add('captured');
    setTimeout(() => {
      applyResolvedTurn(resolved, outcome, player);
    }, 350);
    return;
  }

  applyResolvedTurn(resolved, outcome, player);
}

function applyResolvedTurn(resolved, outcome, player) {
  state.pits = resolved;
  state.scores = { p1: resolved[P1_STORE], p2: resolved[P2_STORE] };

  if (checkGameOver(state.pits)) {
    animating = false;
    finishGame();
    return;
  }

  if (outcome === 'extra-turn') {
    animating = false;
    state.phase = 'playing';
    saveState(state);
    render();
    if (state.mode === 'vs-computer' && state.turn === 2) {
      triggerComputer();
    }
    return;
  }

  // Switch turn
  state.turn = state.turn === 1 ? 2 : 1;

  // Check if next player has moves
  const nextMoves = getValidMoves(state.pits, state.turn);
  if (nextMoves.length === 0) {
    animating = false;
    finishGame();
    return;
  }

  animating = false;
  state.phase = 'playing';
  saveState(state);
  render();

  if (state.mode === 'vs-computer' && state.turn === 2) {
    triggerComputer();
  }
}

function finishGame() {
  const swept = sweepRemaining(state.pits);
  state.pits = swept;
  state.scores = { p1: swept[P1_STORE], p2: swept[P2_STORE] };
  state.winner = getWinner(state.pits);
  state.phase = 'game-over';

  // Record win
  if (state.mode === 'vs-computer') {
    if (state.winner === 1) saveRecord('win', state.difficulty, state.mode);
  } else {
    if (state.winner !== 'draw') saveRecord('win', state.difficulty, state.mode);
  }

  clearState();
  render();
}

function triggerComputer() {
  state.phase = 'computer-thinking';
  render();
  setTimeout(() => {
    if (state.phase !== 'computer-thinking') return;
    const pit = getBestMove(state.pits, state.difficulty);
    if (pit === null) { finishGame(); return; }
    animateSow(pit, 2);
  }, 400);
}

function goHome() {
  clearState();
  document.removeEventListener('keydown', escapeHandler);
  state = initState(loadPrefs().mode, loadPrefs().difficulty);
  state.phase = 'home';
  animating = false;
  render();
}

// --- Modals ---

function helpModalHtml() {
  return `
    <div id="help-modal" class="modal-overlay hidden" role="dialog" aria-modal="true" aria-label="Help">
      <div class="modal-panel">
        <div class="modal-header">
          <h2>How to Play</h2>
          <button class="icon-btn modal-close" aria-label="Close help">${ICON_X}</button>
        </div>
        <div class="modal-body">
          <h3>Objective</h3>
          <p>Collect more than 49 seeds in your store (the large pit on your right) before all houses are empty.</p>
          <h3>Taking a Turn</h3>
          <ul>
            <li>Pick up all seeds from one of your 7 houses and sow them counter-clockwise, one seed per pit.</li>
            <li>Skip your opponent's store when passing it.</li>
            <li>Land in your store: take another turn.</li>
            <li>Land in your own empty house when the opposite house has seeds: capture all of them into your store.</li>
          </ul>
          <h3>First Move</h3>
          <ul>
            <li>Both players secretly choose a starting house, then both sow simultaneously.</li>
            <li>Whoever earns an extra turn from their first move goes again; otherwise Player 1 moves first.</li>
          </ul>
          <h3>Game End</h3>
          <ul>
            <li>When one side's houses are all empty, the other player sweeps their remaining seeds into their store.</li>
            <li>Most seeds wins. 49 each is a draw.</li>
          </ul>
          <h3>Key Strategies</h3>
          <ul>
            <li>Houses closest to your store (houses 6 for P1, 8 for P2) land in your store most easily for extra turns.</li>
            <li>Empty a house deliberately, then sow into it next turn for a big capture.</li>
            <li>Count seeds before picking — if the count equals the distance to your store, you get a free turn.</li>
            <li>Watch your opponent's empty houses: landing opposite one gives them a capture opportunity.</li>
          </ul>
        </div>
      </div>
    </div>
  `;
}

function confirmModalHtml() {
  return `
    <div id="confirm-modal" class="modal-overlay hidden" role="dialog" aria-modal="true" aria-label="Confirm action">
      <div class="modal-panel modal-sm">
        <div class="modal-header">
          <h2>Abandon this game?</h2>
        </div>
        <div class="modal-body">
          <p>Your current game progress will be lost.</p>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" id="confirm-cancel">Cancel</button>
          <button class="btn-danger" id="confirm-quit">Quit</button>
        </div>
      </div>
    </div>
  `;
}

function showHelp() {
  const modal = document.getElementById('help-modal');
  if (modal) { modal.classList.remove('hidden'); trapFocus(modal); }
}

function showConfirm() {
  const modal = document.getElementById('confirm-modal');
  if (modal) { modal.classList.remove('hidden'); trapFocus(modal); }
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
  modal.querySelector('#confirm-cancel')?.addEventListener('click', () => modal.classList.add('hidden'));
  modal.querySelector('#confirm-quit')?.addEventListener('click', () => {
    modal.classList.add('hidden');
    goHome();
  });
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });
}

function trapFocus(modal) {
  const focusable = [...modal.querySelectorAll('button, a, [tabindex="0"]')];
  if (!focusable.length) return;
  focusable[0].focus();
  modal.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }, { once: false });
}

function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  const prefs = loadPrefs();
  savePrefs({ ...prefs, theme: currentTheme });
  applyTheme(currentTheme);
  render();
}

// --- Init ---

render();
