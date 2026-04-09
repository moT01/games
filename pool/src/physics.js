const SUBSTEPS = 8;
const SLIDE_FRICTION = 0.012;
const ROLL_FRICTION = 0.006;
const ROLL_THRESHOLD = 0.5;
const RAIL_RESTITUTION = 0.75;
const THROW_FACTOR = 0.04;
const ENGLISH_LATERAL = 1.0;

function stepPhysics() {
  if (!state._railBallsHit) state._railBallsHit = new Set();

  for (let s = 0; s < SUBSTEPS; s++) {
    moveBalls();
    detectBallCollisions();
    detectRailCollisions();
    detectPockets();
  }

  if (allBallsStopped()) {
    resolveShotResult();
  }
}

function moveBalls() {
  const dt = 1 / SUBSTEPS;
  for (const ball of state.balls) {
    if (ball.pocketed) continue;
    const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);

    if (!ball.rolling) {
      // Sliding friction
      const newSpeed = Math.max(0, speed * (1 - SLIDE_FRICTION));
      if (speed > 0) {
        ball.vx = (ball.vx / speed) * newSpeed;
        ball.vy = (ball.vy / speed) * newSpeed;
      }
      if (newSpeed < ROLL_THRESHOLD) ball.rolling = true;

      // English effect
      ball.vx += ball.spinZ * ENGLISH_LATERAL * 0.002;

      // Topspin/backspin: spinX decays toward speed / BALL_RADIUS
      const targetSpin = newSpeed / BALL_RADIUS;
      ball.spinX += (targetSpin - ball.spinX) * 0.05;
    } else {
      // Rolling friction
      const newSpeed = Math.max(0, speed * (1 - ROLL_FRICTION));
      if (speed > 0) {
        ball.vx = (ball.vx / speed) * newSpeed;
        ball.vy = (ball.vy / speed) * newSpeed;
      }
      ball.spinX *= 0.97;
      ball.spinZ *= 0.97;

      // Draw: if backspin (negative spinX) dominates while rolling, briefly reverse
      if (ball.spinX < -0.02 && newSpeed < 1.5) {
        ball.vx *= -0.05;
        ball.vy *= -0.05;
      }
    }

    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
  }
}

function detectBallCollisions() {
  const active = state.balls.filter(b => !b.pocketed);
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i];
      const b = active[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < BALL_RADIUS * 2 && dist > 0) {
        // Normalize
        const nx = dx / dist;
        const ny = dy / dist;
        // Relative velocity along collision axis
        const dvx = b.vx - a.vx;
        const dvy = b.vy - a.vy;
        const dot = dvx * nx + dvy * ny;
        if (dot > 0) continue; // Moving apart

        const e = 0.95;
        const impulse = -(1 + e) * dot / 2;
        a.vx -= impulse * nx;
        a.vy -= impulse * ny;
        b.vx += impulse * nx;
        b.vy += impulse * ny;

        // Separate
        const overlap = (BALL_RADIUS * 2 - dist) / 2;
        a.x -= nx * overlap;
        a.y -= ny * overlap;
        b.x += nx * overlap;
        b.y += ny * overlap;

        // First contact tracking
        if (state.firstContactId === null) {
          if (a.id === 0) { state.firstContactId = b.id; }
          else if (b.id === 0) { state.firstContactId = a.id; }
        }

        // Spin throw: cue ball spin affects object ball
        if (a.id === 0) {
          b.vy += a.spinZ * THROW_FACTOR;
          b.rolling = false;
        } else if (b.id === 0) {
          a.vy += b.spinZ * THROW_FACTOR;
          a.rolling = false;
        }

        a.rolling = false;
        b.rolling = false;
      }
    }
  }
}

function detectRailCollisions() {
  for (const ball of state.balls) {
    if (ball.pocketed) continue;
    let hitRail = false;

    if (ball.x < BALL_RADIUS) {
      ball.x = BALL_RADIUS;
      ball.vx = Math.abs(ball.vx) * RAIL_RESTITUTION;
      ball.vy += ball.spinZ * 0.08;
      hitRail = true;
    } else if (ball.x > TABLE_W - BALL_RADIUS) {
      ball.x = TABLE_W - BALL_RADIUS;
      ball.vx = -Math.abs(ball.vx) * RAIL_RESTITUTION;
      ball.vy += ball.spinZ * 0.08;
      hitRail = true;
    }

    if (ball.y < BALL_RADIUS) {
      ball.y = BALL_RADIUS;
      ball.vy = Math.abs(ball.vy) * RAIL_RESTITUTION;
      hitRail = true;
    } else if (ball.y > TABLE_H - BALL_RADIUS) {
      ball.y = TABLE_H - BALL_RADIUS;
      ball.vy = -Math.abs(ball.vy) * RAIL_RESTITUTION;
      hitRail = true;
    }

    if (hitRail) {
      state.railContactOccurred = true;
      if (!state._railBallsHit) state._railBallsHit = new Set();
      state._railBallsHit.add(ball.id);
      state.railHitCount = state._railBallsHit.size;
      ball.rolling = false;
    }
  }
}

function detectPockets() {
  for (const ball of state.balls) {
    if (ball.pocketed) continue;
    for (const pocket of POCKETS) {
      const dx = ball.x - pocket.x;
      const dy = ball.y - pocket.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < pocket.r) {
        pocketBall(ball);
        // Pocket flash animation event
        if (typeof onPocketFlash === 'function') onPocketFlash(pocket.x, pocket.y);
        break;
      }
    }
  }
}

function pocketBall(ball) {
  ball.vx = 0; ball.vy = 0;
  ball.spinX = 0; ball.spinZ = 0;
  ball.pocketed = true;
  state.pocketedThisShot.push(ball.id);
  if (ball.id === 0) {
    state.foulOccurred = true;
  }
}

function allBallsStopped() {
  for (const ball of state.balls) {
    if (ball.pocketed) continue;
    const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    if (speed >= 0.1) return false;
    if (Math.abs(ball.spinX) >= 0.01) return false;
    if (Math.abs(ball.spinZ) >= 0.01) return false;
  }
  return true;
}
