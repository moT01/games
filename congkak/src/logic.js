// pits[0..6]  = P1 houses, pits[7]  = P1 store
// pits[8..14] = P2 houses, pits[15] = P2 store
// P2 house[8] is opposite P1 house[6], P2 house[14] is opposite P1 house[0]
// Sowing order: 0->1->...->15->0 (CCW). P1 skips 15. P2 skips 7.

const P1_STORE = 7;
const P2_STORE = 15;
const P1_HOUSES = [0, 1, 2, 3, 4, 5, 6];
const P2_HOUSES = [8, 9, 10, 11, 12, 13, 14];

export function initBoard() {
  const pits = Array(16).fill(7);
  pits[P1_STORE] = 0;
  pits[P2_STORE] = 0;
  return pits;
}

export function initState(mode = 'vs-computer', difficulty = 'normal') {
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

export function getNextPit(currentIndex, player) {
  const skip = player === 1 ? P2_STORE : P1_STORE;
  let next = (currentIndex + 1) % 16;
  if (next === skip) next = (next + 1) % 16;
  return next;
}

export function computeSow(pits, startIndex, player) {
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

export function resolveTurn(pits, lastPit, player) {
  const newPits = [...pits];
  const ownStore = player === 1 ? P1_STORE : P2_STORE;
  const ownHouses = player === 1 ? P1_HOUSES : P2_HOUSES;

  if (lastPit === ownStore) {
    return { outcome: 'extra-turn', newPits };
  }

  if (ownHouses.includes(lastPit) && newPits[lastPit] === 1) {
    const oppIdx = oppositePit(lastPit);
    if (newPits[oppIdx] > 0) {
      // capture
      newPits[ownStore] += newPits[oppIdx] + 1;
      newPits[lastPit] = 0;
      newPits[oppIdx] = 0;
      return { outcome: 'capture', newPits, capturedPit: lastPit, oppositePit: oppIdx };
    }
  }

  return { outcome: 'end', newPits };
}

export function oppositePit(index) {
  if (index >= 0 && index <= 6) return 14 - index;
  if (index >= 8 && index <= 14) return 22 - index;
  return -1;
}

export function checkGameOver(pits) {
  const p1Empty = P1_HOUSES.every(i => pits[i] === 0);
  const p2Empty = P2_HOUSES.every(i => pits[i] === 0);
  return p1Empty || p2Empty;
}

export function sweepRemaining(pits) {
  const newPits = [...pits];
  const p1Empty = P1_HOUSES.every(i => newPits[i] === 0);
  const p2Empty = P2_HOUSES.every(i => newPits[i] === 0);

  if (!p1Empty) {
    P1_HOUSES.forEach(i => {
      newPits[P1_STORE] += newPits[i];
      newPits[i] = 0;
    });
  } else if (!p2Empty) {
    P2_HOUSES.forEach(i => {
      newPits[P2_STORE] += newPits[i];
      newPits[i] = 0;
    });
  }

  return newPits;
}

export function getWinner(pits) {
  if (pits[P1_STORE] > pits[P2_STORE]) return 1;
  if (pits[P2_STORE] > pits[P1_STORE]) return 2;
  return 'draw';
}

export function isValidMove(pits, pitIndex, player) {
  const ownHouses = player === 1 ? P1_HOUSES : P2_HOUSES;
  return ownHouses.includes(pitIndex) && pits[pitIndex] > 0;
}

export function getValidMoves(pits, player) {
  const ownHouses = player === 1 ? P1_HOUSES : P2_HOUSES;
  return ownHouses.filter(i => pits[i] > 0);
}

export function heuristic(pits) {
  let score = pits[P2_STORE] - pits[P1_STORE];

  // bonuses for P2
  P2_HOUSES.forEach(i => {
    const seeds = pits[i];
    if (seeds === 0) return;
    let cur = i;
    let s = seeds;
    while (s > 0) {
      cur = getNextPit(cur, 2);
      s--;
    }
    const lastPit = cur;
    if (lastPit === P2_STORE) score += 3;
    else if (P2_HOUSES.includes(lastPit) && pits[lastPit] === 0 && pits[oppositePit(lastPit)] > 0) score += 5;
  });

  // penalty for P2 exposed empty houses (opponent can land and capture)
  P2_HOUSES.forEach(i => {
    if (pits[i] === 0 && pits[oppositePit(i)] > 0) score -= 2;
  });

  return score;
}

export function minimax(pits, depth, alpha, beta, maximizing) {
  if (depth === 0 || checkGameOver(pits)) {
    return heuristic(pits);
  }

  const player = maximizing ? 2 : 1;
  const moves = getValidMoves(pits, player);

  if (moves.length === 0) {
    return heuristic(sweepRemaining(pits));
  }

  if (maximizing) {
    let best = -Infinity;
    for (const move of moves) {
      const { newPits, lastPit } = computeSow(pits, move, 2);
      const { outcome, newPits: resolved } = resolveTurn(newPits, lastPit, 2);
      const childPits = checkGameOver(resolved) ? sweepRemaining(resolved) : resolved;
      const nextMax = outcome === 'extra-turn' ? true : false;
      const val = minimax(childPits, depth - 1, alpha, beta, nextMax);
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
      const childPits = checkGameOver(resolved) ? sweepRemaining(resolved) : resolved;
      const nextMax = outcome === 'extra-turn' ? false : true;
      const val = minimax(childPits, depth - 1, alpha, beta, nextMax);
      best = Math.min(best, val);
      beta = Math.min(beta, val);
      if (beta <= alpha) break;
    }
    return best;
  }
}

export function getBestMove(pits, difficulty) {
  const depth = difficulty === 'hard' ? 6 : 3;
  const moves = getValidMoves(pits, 2);

  let bestScore = -Infinity;
  let bestMove = moves[0];
  let bestCapture = -Infinity;

  for (const move of moves) {
    const { newPits, lastPit } = computeSow(pits, move, 2);
    const { outcome, newPits: resolved } = resolveTurn(newPits, lastPit, 2);
    const childPits = checkGameOver(resolved) ? sweepRemaining(resolved) : resolved;
    const nextMax = outcome === 'extra-turn' ? true : false;
    const score = minimax(childPits, depth - 1, -Infinity, Infinity, nextMax);

    const capturedSeeds = resolved[P2_STORE] - pits[P2_STORE];

    if (
      score > bestScore ||
      (score === bestScore && difficulty === 'hard' && capturedSeeds > bestCapture)
    ) {
      bestScore = score;
      bestMove = move;
      bestCapture = capturedSeeds;
    }
  }

  return bestMove;
}

export function applyFirstMoves(pits, p1Pit, p2Pit) {
  const newPits = [...pits];
  const p1Seeds = newPits[p1Pit];
  const p2Seeds = newPits[p2Pit];
  newPits[p1Pit] = 0;
  newPits[p2Pit] = 0;

  const p1AnimSteps = [{ pit: p1Pit, delta: -p1Seeds }];
  const p2AnimSteps = [{ pit: p2Pit, delta: -p2Seeds }];

  let cur1 = p1Pit;
  let s1 = p1Seeds;
  while (s1 > 0) {
    cur1 = getNextPit(cur1, 1);
    newPits[cur1]++;
    s1--;
    p1AnimSteps.push({ pit: cur1, delta: 1 });
  }

  let cur2 = p2Pit;
  let s2 = p2Seeds;
  while (s2 > 0) {
    cur2 = getNextPit(cur2, 2);
    newPits[cur2]++;
    s2--;
    p2AnimSteps.push({ pit: cur2, delta: 1 });
  }

  return { newPits, p1AnimSteps, p2AnimSteps };
}

export function saveState(state) {
  try {
    localStorage.setItem('congkak-state', JSON.stringify(state));
  } catch (_) {}
}

export function loadState() {
  try {
    const raw = localStorage.getItem('congkak-state');
    if (!raw) return null;
    const state = JSON.parse(raw);
    if (!state || !Array.isArray(state.pits) || state.pits.length !== 16) return null;
    return state;
  } catch (_) {
    return null;
  }
}

export function savePrefs(prefs) {
  try {
    localStorage.setItem('congkak-prefs', JSON.stringify(prefs));
  } catch (_) {}
}

export function loadPrefs() {
  try {
    const raw = localStorage.getItem('congkak-prefs');
    if (!raw) return { mode: 'vs-computer', difficulty: 'normal', theme: 'dark' };
    return { mode: 'vs-computer', difficulty: 'normal', theme: 'dark', ...JSON.parse(raw) };
  } catch (_) {
    return { mode: 'vs-computer', difficulty: 'normal', theme: 'dark' };
  }
}

export function saveRecord(result, difficulty, mode) {
  const records = loadRecords();
  if (mode === 'vs-computer') {
    const key = difficulty === 'hard' ? 'winsHard' : 'winsNormal';
    if (result === 'win') records[key] = (records[key] || 0) + 1;
  } else {
    records.twoPlayerGames = (records.twoPlayerGames || 0) + 1;
  }
  try {
    localStorage.setItem('congkak-records', JSON.stringify(records));
  } catch (_) {}
}

export function loadRecords() {
  try {
    const raw = localStorage.getItem('congkak-records');
    if (!raw) return { winsNormal: 0, winsHard: 0, twoPlayerGames: 0 };
    return { winsNormal: 0, winsHard: 0, twoPlayerGames: 0, ...JSON.parse(raw) };
  } catch (_) {
    return { winsNormal: 0, winsHard: 0, twoPlayerGames: 0 };
  }
}
