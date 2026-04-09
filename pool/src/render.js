const RAIL_W = 50;
const CANVAS_W = 1000;
const CANVAS_H = 550;

// Ball colors
const BALL_COLORS = {
  1: '#f5e642', 2: '#3355dd', 3: '#cc2200', 4: '#660099',
  5: '#ff8800', 6: '#007722', 7: '#880022',
  8: '#111111',
  9: '#f5e642', 10: '#3355dd', 11: '#cc2200', 12: '#660099',
  13: '#ff8800', 14: '#007722', 15: '#880022',
};
const BALL_NUMBER_COLOR = { solid: '#ffffff', stripe: '#111111', '8ball': '#ffffff', cue: '#111111' };

// Pocket flash animations
const pocketFlashes = [];

function onPocketFlash(x, y) {
  pocketFlashes.push({ x, y, t: 0, maxT: 18 }); // ~300ms at 60fps
}

function renderFrame(canvas, mouseX, mouseY) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  drawTable(ctx);
  drawPocketFlashes(ctx);
  drawBalls(ctx);

  const cueBall = state.balls[0];
  if (!state.shotInProgress && !state.ballInHand && state.phase !== 'gameover') {
    drawAimGuide(ctx, cueBall, state.cueState.angle);
    drawCue(ctx, cueBall, state.cueState.angle, state.cueState.power);
    drawHitPointOnBall(ctx, cueBall, state.cueState.hitX, state.cueState.hitY);
  }

  if (state.ballInHand && !cueBall.pocketed) {
    drawBallInHandPreview(ctx, mouseX, mouseY);
  }

  // Update pocket flashes
  for (let i = pocketFlashes.length - 1; i >= 0; i--) {
    pocketFlashes[i].t++;
    if (pocketFlashes[i].t >= pocketFlashes[i].maxT) pocketFlashes.splice(i, 1);
  }
}

function drawTable(ctx) {
  // Rails (wood)
  ctx.fillStyle = '#4a2c0a';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Felt
  ctx.fillStyle = '#1a7a3c';
  ctx.fillRect(RAIL_W, RAIL_W, TABLE_W, TABLE_H);

  // Subtle felt gradient
  const grad = ctx.createLinearGradient(RAIL_W, RAIL_W, RAIL_W + TABLE_W, RAIL_W + TABLE_H);
  grad.addColorStop(0, 'rgba(255,255,255,0.04)');
  grad.addColorStop(1, 'rgba(0,0,0,0.08)');
  ctx.fillStyle = grad;
  ctx.fillRect(RAIL_W, RAIL_W, TABLE_W, TABLE_H);

  // Cushion inner edge lines
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.strokeRect(RAIL_W, RAIL_W, TABLE_W, TABLE_H);

  // Pocket holes
  for (const pocket of POCKETS) {
    const px = pocket.x + RAIL_W;
    const py = pocket.y + RAIL_W;
    ctx.beginPath();
    ctx.arc(px, py, pocket.r + 2, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();
    // Inner dark circle
    ctx.beginPath();
    ctx.arc(px, py, pocket.r, 0, Math.PI * 2);
    ctx.fillStyle = '#111111';
    ctx.fill();
  }

  // Head string (faint)
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.setLineDash([5, 5]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(HEAD_STRING_X + RAIL_W, RAIL_W);
  ctx.lineTo(HEAD_STRING_X + RAIL_W, RAIL_W + TABLE_H);
  ctx.stroke();
  ctx.setLineDash([]);

  // Foot spot dot
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.arc(FOOT_SPOT_X + RAIL_W, FOOT_SPOT_Y + RAIL_W, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawPocketFlashes(ctx) {
  for (const f of pocketFlashes) {
    const progress = f.t / f.maxT;
    const radius = f.maxT * 2 * progress;
    const alpha = 1 - progress;
    ctx.beginPath();
    ctx.arc(f.x + RAIL_W, f.y + RAIL_W, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${alpha * 0.6})`;
    ctx.fill();
  }
}

function drawBalls(ctx) {
  for (const ball of state.balls) {
    if (ball.pocketed) continue;
    const bx = ball.x + RAIL_W;
    const by = ball.y + RAIL_W;

    // Shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    if (ball.id === 0) {
      // Cue ball
      ctx.beginPath();
      ctx.arc(bx, by, BALL_RADIUS, 0, Math.PI * 2);
      const g = ctx.createRadialGradient(bx - 3, by - 3, 1, bx, by, BALL_RADIUS);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(1, '#cccccc');
      ctx.fillStyle = g;
      ctx.fill();
    } else if (ball.group === 'stripe') {
      // White base
      ctx.beginPath();
      ctx.arc(bx, by, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();
      ctx.save();
      // Stripe band
      ctx.beginPath();
      ctx.arc(bx, by, BALL_RADIUS, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = BALL_COLORS[ball.id] || '#888888';
      ctx.fillRect(bx - BALL_RADIUS, by - BALL_RADIUS * 0.55, BALL_RADIUS * 2, BALL_RADIUS * 1.1);
    } else {
      // Solid or 8-ball
      ctx.beginPath();
      ctx.arc(bx, by, BALL_RADIUS, 0, Math.PI * 2);
      const color = BALL_COLORS[ball.id] || '#888888';
      const g = ctx.createRadialGradient(bx - 3, by - 3, 1, bx, by, BALL_RADIUS);
      g.addColorStop(0, lightenColor(color, 40));
      g.addColorStop(1, color);
      ctx.fillStyle = g;
      ctx.fill();
    }

    ctx.restore();

    // Number label (small white circle + number)
    if (ball.id !== 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(bx, by, BALL_RADIUS * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = ball.group === 'stripe' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)';
      ctx.fill();
      ctx.font = `bold ${BALL_RADIUS * 0.9}px var(--font-mono, monospace)`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = ball.group === '8ball' ? '#ffffff' : (ball.group === 'stripe' ? '#111111' : '#ffffff');
      ctx.fillText(String(ball.id), bx, by + 0.5);
      ctx.restore();
    }
  }
}

function lightenColor(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `rgb(${r},${g},${b})`;
}

function drawAimGuide(ctx, cueBall, angle) {
  const cx = cueBall.x + RAIL_W;
  const cy = cueBall.y + RAIL_W;

  // Trace aim line until it hits a ball or rail
  const { hitPoint, hitBall } = traceAimLine(cueBall.x, cueBall.y, angle);

  // Dashed aim line
  ctx.save();
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(hitPoint.x + RAIL_W, hitPoint.y + RAIL_W);
  ctx.stroke();
  ctx.setLineDash([]);

  if (hitBall) {
    // Ghost ball
    const gx = hitPoint.x + RAIL_W;
    const gy = hitPoint.y + RAIL_W;
    ctx.beginPath();
    ctx.arc(gx, gy, BALL_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fill();

    // Object ball deflection arrow (perpendicular to shot direction)
    const tx = hitBall.x + RAIL_W;
    const ty = hitBall.y + RAIL_W;
    const toBall = normalizeVec(hitBall.x - hitPoint.x, hitBall.y - hitPoint.y);
    const arrowEnd = { x: tx + toBall.x * 30, y: ty + toBall.y * 30 };
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(arrowEnd.x, arrowEnd.y);
    ctx.strokeStyle = 'rgba(255,220,50,0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawArrowHead(ctx, tx, ty, arrowEnd.x, arrowEnd.y, 7, 'rgba(255,220,50,0.7)');

    // Cue ball path after contact (faint)
    const reflectAngle = angle + Math.PI;
    const cbEnd = {
      x: cx + Math.cos(reflectAngle) * 80,
      y: cy + Math.sin(reflectAngle) * 80,
    };
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(cbEnd.x, cbEnd.y);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}

function traceAimLine(sx, sy, angle) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const maxDist = 800;

  // Check ball collisions
  let closestDist = maxDist;
  let hitBall = null;
  let ghostPos = null;

  for (const ball of state.balls) {
    if (ball.pocketed || ball.id === 0) continue;
    // Ray-circle intersection
    const bx = ball.x - sx;
    const by = ball.y - sy;
    const proj = bx * dx + by * dy;
    if (proj < 0) continue;
    const perpX = bx - proj * dx;
    const perpY = by - proj * dy;
    const perpDist2 = perpX * perpX + perpY * perpY;
    const r = BALL_RADIUS * 2;
    if (perpDist2 < r * r) {
      const backDist = Math.sqrt(r * r - perpDist2);
      const contactDist = proj - backDist;
      if (contactDist > 0 && contactDist < closestDist) {
        closestDist = contactDist;
        hitBall = ball;
        ghostPos = { x: sx + dx * contactDist, y: sy + dy * contactDist };
      }
    }
  }

  if (hitBall && ghostPos) {
    return { hitPoint: ghostPos, hitBall };
  }

  // Rail intersection
  const endX = sx + dx * maxDist;
  const endY = sy + dy * maxDist;
  const cx = Math.max(BALL_RADIUS, Math.min(TABLE_W - BALL_RADIUS, endX));
  const cy = Math.max(BALL_RADIUS, Math.min(TABLE_H - BALL_RADIUS, endY));
  return { hitPoint: { x: cx, y: cy }, hitBall: null };
}

function normalizeVec(x, y) {
  const len = Math.sqrt(x * x + y * y);
  return len > 0 ? { x: x / len, y: y / len } : { x: 0, y: 0 };
}

function drawArrowHead(ctx, fromX, fromY, toX, toY, size, color) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - size * Math.cos(angle - 0.4), toY - size * Math.sin(angle - 0.4));
  ctx.lineTo(toX - size * Math.cos(angle + 0.4), toY - size * Math.sin(angle + 0.4));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCue(ctx, cueBall, angle, power) {
  if (state.players[state.currentPlayer].type === 'computer') return;
  const cx = cueBall.x + RAIL_W;
  const cy = cueBall.y + RAIL_W;
  const pullBack = power * 30;
  const cueLength = 200;
  const tipOffset = BALL_RADIUS + 4 + pullBack;
  const buttOffset = tipOffset + cueLength;

  const tipX = cx - Math.cos(angle) * tipOffset;
  const tipY = cy - Math.sin(angle) * tipOffset;
  const buttX = cx - Math.cos(angle) * buttOffset;
  const buttY = cy - Math.sin(angle) * buttOffset;

  ctx.save();
  ctx.lineCap = 'round';
  // Butt (thick end)
  const grad = ctx.createLinearGradient(tipX, tipY, buttX, buttY);
  grad.addColorStop(0, '#e8c87a');
  grad.addColorStop(0.2, '#c8a050');
  grad.addColorStop(1, '#6a3f10');
  ctx.strokeStyle = grad;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(buttX, buttY);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();

  // Tip (thin, light)
  ctx.strokeStyle = '#d0c0a0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX + Math.cos(angle) * 20, tipY + Math.sin(angle) * 20);
  ctx.stroke();
  ctx.restore();
}

function drawHitPointOnBall(ctx, cueBall, hitX, hitY) {
  if (hitX === 0 && hitY === 0) return;
  const cx = cueBall.x + RAIL_W;
  const cy = cueBall.y + RAIL_W;
  const dotX = cx + hitX * BALL_RADIUS * 0.6;
  const dotY = cy + hitY * BALL_RADIUS * 0.6;
  ctx.beginPath();
  ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 80, 80, 0.9)';
  ctx.fill();
}

function drawBallInHandPreview(ctx, mx, my) {
  // mx, my are already in surface coords
  const bx = Math.max(BALL_RADIUS, Math.min(TABLE_W - BALL_RADIUS, mx));
  const by = Math.max(BALL_RADIUS, Math.min(TABLE_H - BALL_RADIUS, my));
  const overlapping = state.balls.some(b => {
    if (b.pocketed || b.id === 0) return false;
    const dx = b.x - bx;
    const dy = b.y - by;
    return Math.sqrt(dx * dx + dy * dy) < BALL_RADIUS * 2;
  });
  const cx = bx + RAIL_W;
  const cy = by + RAIL_W;
  ctx.beginPath();
  ctx.arc(cx, cy, BALL_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = overlapping ? 'rgba(255, 60, 60, 0.7)' : 'rgba(255, 255, 255, 0.7)';
  ctx.fill();
  ctx.strokeStyle = overlapping ? '#ff3333' : '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
}
