function computeGhostBall(targetBall, pocket) {
  const dx = targetBall.x - pocket.x;
  const dy = targetBall.y - pocket.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return { x: targetBall.x, y: targetBall.y };
  return {
    x: pocket.x + (dx / dist) * BALL_RADIUS * 2,
    y: pocket.y + (dy / dist) * BALL_RADIUS * 2,
  };
}

function applyAimError(angle, errorDeg) {
  const errorRad = (errorDeg * Math.PI) / 180;
  // Box-Muller for Gaussian
  const u1 = Math.random();
  const u2 = Math.random();
  const gauss = Math.sqrt(-2 * Math.log(u1 + 1e-10)) * Math.cos(2 * Math.PI * u2);
  const err = Math.max(-3 * errorRad, Math.min(3 * errorRad, gauss * errorRad));
  return angle + err;
}

function scoreShot(cutAngleDeg, dist, difficulty) {
  let score = 100;
  score -= cutAngleDeg * 1.5;
  score -= dist * 0.04;
  return score;
}

function predictCueBallLeave(ghostX, ghostY, angle) {
  // Simplified: cue ball reflects at contact point
  const reflectAngle = angle + Math.PI;
  const speed = 8;
  let x = ghostX + Math.cos(reflectAngle) * speed * 10;
  let y = ghostY + Math.sin(reflectAngle) * speed * 10;
  x = Math.max(BALL_RADIUS, Math.min(TABLE_W - BALL_RADIUS, x));
  y = Math.max(BALL_RADIUS, Math.min(TABLE_H - BALL_RADIUS, y));
  return { x, y };
}

function leaveScore(pos) {
  // Reward center table position
  const cx = TABLE_W / 2;
  const cy = TABLE_H / 2;
  const dist = Math.sqrt((pos.x - cx) ** 2 + (pos.y - cy) ** 2);
  return Math.max(0, 30 - dist * 0.1);
}

function evaluateAttackShots(legalTargetIds) {
  const cueBall = state.balls[0];
  const shots = [];

  for (const targetId of legalTargetIds) {
    const target = state.balls.find(b => b.id === targetId);
    if (!target || target.pocketed) continue;

    for (const pocket of POCKETS) {
      const ghost = computeGhostBall(target, pocket);
      const dx = ghost.x - cueBall.x;
      const dy = ghost.y - cueBall.y;
      const distCue = Math.sqrt(dx * dx + dy * dy);
      const aimAngle = Math.atan2(dy, dx);

      // Cut angle: angle between cue-to-ghost and ghost-to-pocket
      const ctgAngle = Math.atan2(ghost.y - cueBall.y, ghost.x - cueBall.x);
      const gtpAngle = Math.atan2(pocket.y - ghost.y, pocket.x - ghost.x);
      let cutAngle = Math.abs(ctgAngle - gtpAngle);
      if (cutAngle > Math.PI) cutAngle = Math.PI * 2 - cutAngle;
      const cutAngleDeg = (cutAngle * 180) / Math.PI;

      // Line-of-sight check: any ball blocking cue to ghost?
      if (isLineBlocked(cueBall.x, cueBall.y, ghost.x, ghost.y, 0, targetId)) continue;

      const score = scoreShot(cutAngleDeg, distCue, state.aiDifficulty);
      const leavePos = predictCueBallLeave(ghost.x, ghost.y, aimAngle);
      shots.push({ targetId, pocket, ghost, aimAngle, distCue, cutAngleDeg, score, leavePos });
    }
  }

  shots.sort((a, b) => b.score - a.score);
  return shots;
}

function isLineBlocked(x1, y1, x2, y2, excludeId1, excludeId2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return false;
  const nx = dx / len;
  const ny = dy / len;

  for (const b of state.balls) {
    if (b.pocketed) continue;
    if (b.id === excludeId1 || b.id === excludeId2) continue;
    // Project ball center onto line
    const tx = b.x - x1;
    const ty = b.y - y1;
    const proj = tx * nx + ty * ny;
    if (proj < 0 || proj > len) continue;
    const perpX = tx - proj * nx;
    const perpY = ty - proj * ny;
    const perpDist = Math.sqrt(perpX * perpX + perpY * perpY);
    if (perpDist < BALL_RADIUS * 2) return true;
  }
  return false;
}

function evaluateSafety(legalTargetId) {
  const cueBall = state.balls[0];
  const target = state.balls.find(b => b.id === legalTargetId);
  if (!target) return { score: 0, angle: 0, power: 0.3, hitX: 0, hitY: 0 };

  // Aim to contact the target and leave cue near rail
  const dx = target.x - cueBall.x;
  const dy = target.y - cueBall.y;
  const angle = Math.atan2(dy, dx);
  // Estimate cue ball leave after light contact
  const leaveX = cueBall.x + Math.cos(angle + Math.PI) * 80;
  const leaveY = cueBall.y + Math.sin(angle + Math.PI) * 80;
  const railProximity = Math.min(leaveX, TABLE_W - leaveX, leaveY, TABLE_H - leaveY);
  const safetyScore = (1 / (railProximity + 1)) * 10 * 10;

  return { score: safetyScore, angle, power: 0.3, hitX: 0, hitY: 0 };
}

function calculateAIShot(difficulty) {
  const legalTargets = getLegalTargets();
  if (legalTargets.length === 0) {
    // No legal targets, just push cue ball
    return { angle: Math.random() * Math.PI * 2, power: 0.3, hitX: 0, hitY: 0 };
  }

  if (difficulty === 'easy') {
    const targetId = legalTargets[Math.floor(Math.random() * legalTargets.length)];
    const target = state.balls.find(b => b.id === targetId);
    const pocket = POCKETS[Math.floor(Math.random() * POCKETS.length)];
    const ghost = computeGhostBall(target, pocket);
    const cueBall = state.balls[0];
    const baseAngle = Math.atan2(ghost.y - cueBall.y, ghost.x - cueBall.x);
    const angle = applyAimError(baseAngle, 20);
    const power = 0.3 + Math.random() * 0.4;
    return { angle, power, hitX: 0, hitY: 0 };
  }

  const shots = evaluateAttackShots(legalTargets);

  if (difficulty === 'medium') {
    if (shots.length === 0) {
      const safety = evaluateSafety(legalTargets[0]);
      return { ...safety, angle: applyAimError(safety.angle, 8) };
    }
    const best = shots[0];
    const angle = applyAimError(best.aimAngle, 8);
    const power = 0.5 + Math.random() * 0.35;
    return { angle, power, hitX: 0, hitY: -0.1 };
  }

  // Hard
  if (shots.length > 0) {
    // Add leave scoring
    for (const s of shots) {
      s.score += leaveScore(s.leavePos);
    }
    shots.sort((a, b) => b.score - a.score);
    const best = shots[0];

    // Safety fallback if best score is low
    if (best.score < 15) {
      const safety = evaluateSafety(legalTargets[0]);
      if (safety.score > best.score) {
        return { angle: applyAimError(safety.angle, 3), power: safety.power, hitX: 0, hitY: 0 };
      }
    }

    const angle = applyAimError(best.aimAngle, 3);
    // Power based on distance
    const power = Math.min(0.9, 0.4 + best.distCue * 0.001);
    // Spin for leave
    const hitY = best.cutAngleDeg > 30 ? -0.2 : 0.1;
    return { angle, power, hitX: 0, hitY };
  }

  const safety = evaluateSafety(legalTargets[0]);
  return { ...safety, angle: applyAimError(safety.angle, 3) };
}
