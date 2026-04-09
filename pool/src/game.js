// Constants
const BALL_RADIUS = 11;
const TABLE_W = 900;
const TABLE_H = 450;
const POCKET_RADIUS_CORNER = 22;
const POCKET_RADIUS_MIDDLE = 20;
const MAX_POWER = 25;
const MAX_SPIN = 0.4;
const HEAD_STRING_X = 225;
const FOOT_SPOT_X = 675;
const FOOT_SPOT_Y = 225;
const AI_THINK_DELAY_MIN = 400;
const AI_THINK_DELAY_MAX = 900;

// Pocket centers on playing surface
const POCKETS = [
  { x: 22, y: 22, r: POCKET_RADIUS_CORNER },
  { x: 878, y: 22, r: POCKET_RADIUS_CORNER },
  { x: 0, y: 225, r: POCKET_RADIUS_MIDDLE },
  { x: 900, y: 225, r: POCKET_RADIUS_MIDDLE },
  { x: 22, y: 428, r: POCKET_RADIUS_CORNER },
  { x: 878, y: 428, r: POCKET_RADIUS_CORNER },
];

// Global state
/** @type {object} */
let state = null;

function createBall(id, x, y) {
  const group = id === 0 ? 'cue'
    : id === 8 ? '8ball'
    : id <= 7 ? 'solid'
    : 'stripe';
  return { id, x, y, vx: 0, vy: 0, spinX: 0, spinZ: 0, rolling: false, pocketed: false, group };
}

function rackTriangle(footSpot) {
  // 5 rows: row 0 = 1 ball, row 4 = 5 balls
  // Row offset along x: row * BALL_RADIUS * sqrt(3)
  // Ball 8 at row=2 col=1 (center)
  // Back corners: row=4 col=0 and row=4 col=4 get one solid + one stripe randomly
  const sqrt3 = Math.sqrt(3);
  const positions = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col <= row; col++) {
      const px = footSpot.x + row * BALL_RADIUS * sqrt3;
      const py = footSpot.y + (col - row / 2) * BALL_RADIUS * 2;
      positions.push({ px, py, row, col });
    }
  }

  // Assign: ball 8 goes to row=2,col=1 (center)
  const balls = [];
  const centerPos = positions.find(p => p.row === 2 && p.col === 1);
  const cornerPos1 = positions.find(p => p.row === 4 && p.col === 0);
  const cornerPos2 = positions.find(p => p.row === 4 && p.col === 4);

  const solids = [1, 2, 3, 4, 5, 6, 7];
  const stripes = [9, 10, 11, 12, 13, 14, 15];
  shuffleArray(solids);
  shuffleArray(stripes);

  // Place 8 at center
  balls.push(createBall(8, centerPos.px, centerPos.py));

  // Place one solid and one stripe at back corners (randomly which corner)
  const cornerSolid = solids.pop();
  const cornerStripe = stripes.pop();
  if (Math.random() < 0.5) {
    balls.push(createBall(cornerSolid, cornerPos1.px, cornerPos1.py));
    balls.push(createBall(cornerStripe, cornerPos2.px, cornerPos2.py));
  } else {
    balls.push(createBall(cornerStripe, cornerPos1.px, cornerPos1.py));
    balls.push(createBall(cornerSolid, cornerPos2.px, cornerPos2.py));
  }

  // Fill remaining positions with remaining balls
  const remainingBalls = [...solids, ...stripes];
  shuffleArray(remainingBalls);
  const usedPositions = new Set([centerPos, cornerPos1, cornerPos2]);
  const freePositions = positions.filter(p => !usedPositions.has(p));
  freePositions.forEach((pos, i) => {
    balls.push(createBall(remainingBalls[i], pos.px, pos.py));
  });

  return balls;
}

function rackDiamond(footSpot) {
  // Diamond: rows 1,2,3,2,1 from front (apex) to back
  // Ball 1 at apex (front, leftmost), ball 9 at center, rest random
  const sqrt3 = Math.sqrt(3);
  // Column offsets (0-4), row offsets within each col
  // Diamond shape: col 0 has 1, col 1 has 2, col 2 has 3, col 3 has 2, col 4 has 1
  const colCounts = [1, 2, 3, 2, 1];
  const positions = [];
  let posIdx = 0;
  for (let col = 0; col < 5; col++) {
    const count = colCounts[col];
    for (let row = 0; row < count; row++) {
      const px = footSpot.x + col * BALL_RADIUS * sqrt3;
      const py = footSpot.y + (row - (count - 1) / 2) * BALL_RADIUS * 2;
      positions.push({ px, py, col, row, posIdx: posIdx++ });
    }
  }

  // Ball 1 at apex (col=0, only position)
  // Ball 9 at center (col=2, row=1, the middle of 3)
  const apexPos = positions.find(p => p.col === 0);
  const centerPos = positions.find(p => p.col === 2 && p.row === 1);
  const otherPositions = positions.filter(p => p !== apexPos && p !== centerPos);

  const others = [2, 3, 4, 5, 6, 7, 8];
  shuffleArray(others);

  const balls = [];
  balls.push(createBall(1, apexPos.px, apexPos.py));
  balls.push(createBall(9, centerPos.px, centerPos.py));
  otherPositions.forEach((pos, i) => {
    balls.push(createBall(others[i], pos.px, pos.py));
  });

  return balls;
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function initBalls(mode) {
  const cueBall = createBall(0, HEAD_STRING_X, TABLE_H / 2);
  const footSpot = { x: FOOT_SPOT_X, y: FOOT_SPOT_Y };
  const racked = mode === '8ball' ? rackTriangle(footSpot) : rackDiamond(footSpot);
  return [cueBall, ...racked];
}

function initGame(mode, players, aiDifficulty) {
  const balls = initBalls(mode);
  state = {
    mode,
    phase: 'breaking',
    balls,
    currentPlayer: 0,
    players,
    aiDifficulty: aiDifficulty || 'medium',
    openTable: mode === '8ball',
    ballInHand: false,
    pushOutAvailable: mode === '9ball',
    pushOutPending: false,
    foulOccurred: false,
    shotInProgress: false,
    breakShot: true,
    firstContactId: null,
    pocketedThisShot: [],
    railContactOccurred: false,
    winner: null,
    illegalBreak: false,
    cueState: {
      angle: Math.PI,
      power: 0,
      hitX: 0,
      hitY: 0,
      dragging: false,
      dragStartX: 0,
      dragStartY: 0,
    },
    theme: loadTheme(),
  };
}

function shoot(angle, power, hitX, hitY) {
  const cueBall = state.balls[0];
  const spinX = hitY * power * MAX_SPIN;
  const spinZ = -hitX * power * MAX_SPIN;
  cueBall.vx = power * MAX_POWER * Math.cos(angle);
  cueBall.vy = power * MAX_POWER * Math.sin(angle);
  cueBall.spinX = spinX;
  cueBall.spinZ = spinZ;
  cueBall.rolling = false;
  state.shotInProgress = true;
  state.firstContactId = null;
  state.pocketedThisShot = [];
  state.railContactOccurred = false;
  state.foulOccurred = false;
  state.railHitCount = 0;
  state._railBallsHit = new Set();
  state._continuousTurn = false;
  state.cueState.power = 0;
}

function getLegalTargets() {
  const player = state.players[state.currentPlayer];
  if (state.mode === '9ball') {
    return [getLowestActiveBall()].filter(id => id !== null);
  }
  if (state.openTable) {
    return state.balls.filter(b => !b.pocketed && b.id !== 8 && b.id !== 0).map(b => b.id);
  }
  if (player.group === null) return [];
  return state.balls.filter(b => !b.pocketed && b.group === player.group).map(b => b.id);
}

function getLowestActiveBall() {
  const active = state.balls.filter(b => !b.pocketed && b.id >= 1 && b.id <= 9);
  if (active.length === 0) return null;
  return active.reduce((min, b) => b.id < min ? b.id : min, active[0].id);
}

function resolveShotResult() {
  state.shotInProgress = false;

  let foul = state.foulOccurred; // cue ball pocketed flag
  const legal = state.pocketedThisShot.filter(id => id !== 0);

  // Check illegal break first
  if (state.breakShot) {
    checkIllegalBreak();
    if (state.illegalBreak) {
      state.breakShot = false;
      return;
    }
  }

  // Wrong first contact foul
  const legalTargets = getLegalTargets();
  if (state.firstContactId !== null && !legalTargets.includes(state.firstContactId)) {
    foul = true;
  }
  // Miss (cue ball never contacted another ball) is a foul
  if (state.firstContactId === null && !state.foulOccurred) {
    foul = true;
  }

  // No rail and no pocket foul (not on break)
  if (!state.breakShot && !state.railContactOccurred && legal.length === 0) {
    foul = true;
  }

  state.foulOccurred = foul;
  state._foulJustOccurred = foul; // picked up by game loop for banner

  if (state.mode === '8ball') {
    resolve8Ball(legal, foul);
  } else {
    resolve9Ball(legal, foul);
  }

  if (state.breakShot && state.mode === '9ball') {
    state.pushOutAvailable = true;
  }
  const wasBreak = state.breakShot;
  state.breakShot = false;

  if (state.winner !== null) {
    state.phase = 'gameover';
    clearGameState();
    return;
  }

  // Transition from breaking to playing
  if (wasBreak) {
    state.phase = foul ? 'ballinhand' : 'playing';
  }

  if (foul) {
    state.ballInHand = true;
    state.phase = 'ballinhand';
    // Un-pocket cue ball for placement
    const cueBall = state.balls[0];
    if (cueBall.pocketed) {
      cueBall.pocketed = false;
      cueBall.vx = 0; cueBall.vy = 0;
      cueBall.x = HEAD_STRING_X; cueBall.y = TABLE_H / 2;
    }
    switchPlayer();
  } else if (!state._continuousTurn) {
    state.phase = 'playing';
    switchPlayer();
  } else {
    state.phase = 'playing';
  }

  // 9-ball push-out: if push-out available and current player is human, enable option in UI
  // (handled in UI layer)

  saveGameState(state);
}

function resolve8Ball(legal, foul) {
  const eightPocketed = legal.includes(8);
  const player = state.players[state.currentPlayer];
  const opponent = state.players[1 - state.currentPlayer];

  // 8-ball break: if 8 pocketed on break -> win
  if (state.breakShot && eightPocketed && !state.foulOccurred) {
    state.winner = state.currentPlayer;
    return;
  }

  // Assign groups on open table
  if (state.openTable && !foul) {
    const nonEight = legal.filter(id => id !== 8);
    if (nonEight.length > 0) {
      const firstId = nonEight[0];
      const firstBall = state.balls.find(b => b.id === firstId);
      if (firstBall) {
        player.group = firstBall.group;
        opponent.group = firstBall.group === 'solid' ? 'stripe' : 'solid';
        state.openTable = false;
      }
    }
  }

  // Check player's group fully cleared
  const playerGroupCleared = player.group !== null &&
    state.balls.filter(b => b.group === player.group && !b.pocketed).length === 0;

  // 8-ball loss conditions
  if (eightPocketed) {
    if (foul) { state.winner = 1 - state.currentPlayer; return; }
    if (!playerGroupCleared) { state.winner = 1 - state.currentPlayer; return; }
    // Win!
    state.winner = state.currentPlayer;
    return;
  }

  // Continuous turn: legally pocketed at least one of own group, no foul
  const ownGroupPocketed = legal.filter(id => {
    const b = state.balls.find(ball => ball.id === id);
    return b && (state.openTable || b.group === player.group);
  });
  state._continuousTurn = !foul && ownGroupPocketed.length > 0 && !eightPocketed;
}

function resolve9Ball(legal, foul) {
  const ninePocketed = legal.includes(9);

  if (ninePocketed) {
    if (foul) {
      // Spot 9
      const nine = state.balls.find(b => b.id === 9);
      if (nine) spotBall(nine);
      state._continuousTurn = false;
    } else {
      state.winner = state.currentPlayer;
      return;
    }
  } else {
    state._continuousTurn = !foul && legal.length > 0;
  }
}

function checkIllegalBreak() {
  // Count balls that touched a rail this shot (approximated via railContactOccurred for now)
  // Per plan: if railContactOccurred is false and no balls pocketed = illegal
  // More precise: plan says "count balls that touched a rail; if < 4 and none pocketed"
  // We track railContactOccurred as a boolean (true if any ball hit a rail)
  // Use railHitCount from physics if available
  const pocketed = state.pocketedThisShot.filter(id => id !== 0).length;
  const railHits = state.railHitCount || 0;
  if (railHits < 4 && pocketed === 0) {
    state.illegalBreak = true;
  }
}

function resolveIllegalBreak(reRack) {
  state.illegalBreak = false;
  if (reRack) {
    const mode = state.mode;
    const players = state.players;
    const aiDifficulty = state.aiDifficulty;
    // Switch breaker
    const nextBreaker = 1 - state.currentPlayer;
    initGame(mode, players, aiDifficulty);
    state.currentPlayer = nextBreaker;
  } else {
    state.ballInHand = true;
    switchPlayer();
  }
}

function spotBall(ball) {
  const candidates = [
    { x: FOOT_SPOT_X, y: FOOT_SPOT_Y },
    { x: HEAD_STRING_X, y: TABLE_H / 2 },
  ];
  for (const c of candidates) {
    if (isPositionFree(c.x, c.y, ball.id)) {
      ball.x = c.x;
      ball.y = c.y;
      ball.vx = 0; ball.vy = 0;
      ball.pocketed = false;
      return;
    }
  }
  // Scan outward from foot spot
  for (let d = BALL_RADIUS * 2; d < TABLE_H; d += BALL_RADIUS * 2) {
    for (let angle = 0; angle < Math.PI * 2; angle += 0.3) {
      const x = FOOT_SPOT_X + Math.cos(angle) * d;
      const y = FOOT_SPOT_Y + Math.sin(angle) * d;
      if (x > BALL_RADIUS && x < TABLE_W - BALL_RADIUS && y > BALL_RADIUS && y < TABLE_H - BALL_RADIUS) {
        if (isPositionFree(x, y, ball.id)) {
          ball.x = x; ball.y = y;
          ball.vx = 0; ball.vy = 0;
          ball.pocketed = false;
          return;
        }
      }
    }
  }
}

function isPositionFree(x, y, excludeId) {
  for (const b of state.balls) {
    if (b.id === excludeId || b.pocketed) continue;
    const dx = b.x - x;
    const dy = b.y - y;
    if (Math.sqrt(dx * dx + dy * dy) < BALL_RADIUS * 2 + 1) return false;
  }
  return true;
}

function placeCueBall(x, y) {
  const cx = Math.max(BALL_RADIUS, Math.min(TABLE_W - BALL_RADIUS, x));
  const cy = Math.max(BALL_RADIUS, Math.min(TABLE_H - BALL_RADIUS, y));
  const cueBall = state.balls[0];
  if (isPositionFree(cx, cy, 0)) {
    cueBall.x = cx;
    cueBall.y = cy;
    cueBall.vx = 0; cueBall.vy = 0;
    cueBall.pocketed = false;
    state.ballInHand = false;
    state.phase = 'playing';
    return true;
  }
  return false;
}

function declarePushOut() {
  state.pushOutPending = true;
  state.pushOutAvailable = false;
}

function resolvePushOut(opponentAccepts) {
  state.pushOutPending = false;
  if (opponentAccepts) {
    switchPlayer();
  }
  // If declines, breaker shoots again (no switch needed)
}

function switchPlayer() {
  state.currentPlayer = 1 - state.currentPlayer;
  state._continuousTurn = false;
  if (state.players[state.currentPlayer].type === 'computer') {
    triggerAIShot();
  }
}

function triggerAIShot() {
  const delay = AI_THINK_DELAY_MIN + Math.random() * (AI_THINK_DELAY_MAX - AI_THINK_DELAY_MIN);
  setTimeout(() => {
    if (state.shotInProgress || state.ballInHand || state.phase === 'gameover') return;
    const shot = calculateAIShot(state.aiDifficulty);
    shoot(shot.angle, shot.power, shot.hitX, shot.hitY);
  }, delay);
}
