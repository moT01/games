import { WAVE_ENEMY_STATS } from './waves.js';
import { createEnemyBullet } from './weapons.js';

const ENEMY_SHAPES = {
  drifter:  'triangle',
  chaser:   'arrow',
  shooter:  'diamond',
  swarmer:  'circle',
  splitter: 'star',
  dasher:   'elongated-triangle',
  tank:     'hexagon',
};

const ENEMY_COLORS = [
  '#ff6666', '#ff9966', '#ffcc66', '#66ff99',
  '#66ccff', '#cc66ff', '#ff66cc',
];

let enemyIdCounter = 0;

export function spawnEnemy(type, x, y, wave, isChild = false) {
  const stats = WAVE_ENEMY_STATS[type];
  const speedMult = 1 + (wave * 0.03);
  const color = ENEMY_COLORS[Math.floor(Math.random() * ENEMY_COLORS.length)];
  const angle = Math.random() * Math.PI * 2;

  const enemy = {
    id: `e${++enemyIdCounter}`,
    type,
    x, y,
    vx: Math.cos(angle) * stats.speed * speedMult,
    vy: Math.sin(angle) * stats.speed * speedMult,
    angle,
    hp: stats.hp,
    maxHp: stats.maxHp,
    size: stats.size,
    scoreValue: stats.scoreValue,
    shape: ENEMY_SHAPES[type],
    color,
    isChild,
    spawnAlpha: 0,
    // Dasher
    dashState: 'idle',
    dashTimer: 1 + Math.random() * 2,
    dashTarget: { x: 0, y: 0 },
    dashVx: 0,
    dashVy: 0,
    dashElapsed: 0,
    // Shooter/Tank
    shootTimer: stats.shootCooldown * (0.5 + Math.random()),
    shootCooldown: stats.shootCooldown,
  };
  return enemy;
}

export function spawnEnemyAtEdge(type, W, H, wave, isChild = false) {
  const side = Math.floor(Math.random() * 4);
  let x, y;
  const margin = 20;
  switch (side) {
    case 0: x = Math.random() * W; y = -margin; break;
    case 1: x = W + margin;        y = Math.random() * H; break;
    case 2: x = Math.random() * W; y = H + margin; break;
    default: x = -margin;          y = Math.random() * H; break;
  }
  return spawnEnemy(type, x, y, wave, isChild);
}

function shortestDelta(a, b, size) {
  let d = b - a;
  if (d > size / 2)  d -= size;
  if (d < -size / 2) d += size;
  return d;
}

export function updateDrifter(enemy, dt, W, H) {
  enemy.x += enemy.vx * dt;
  enemy.y += enemy.vy * dt;
  wrapEnemy(enemy, W, H);
  if (enemy.spawnAlpha < 1) enemy.spawnAlpha = Math.min(1, enemy.spawnAlpha + dt / 0.3);
}

export function updateChaser(enemy, dt, playerX, playerY, W, H) {
  const dx = shortestDelta(enemy.x, playerX, W);
  const dy = shortestDelta(enemy.y, playerY, H);
  const targetAngle = Math.atan2(dy, dx);
  let diff = targetAngle - enemy.angle;
  while (diff > Math.PI)  diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  const turnRate = 2.5;
  enemy.angle += Math.sign(diff) * Math.min(Math.abs(diff), turnRate * dt);
  enemy.vx += Math.cos(enemy.angle) * 200 * dt;
  enemy.vy += Math.sin(enemy.angle) * 200 * dt;
  const cur = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy);
  const maxSpd = 130;
  if (cur > maxSpd) { enemy.vx = enemy.vx / cur * maxSpd; enemy.vy = enemy.vy / cur * maxSpd; }
  enemy.x += enemy.vx * dt;
  enemy.y += enemy.vy * dt;
  wrapEnemy(enemy, W, H);
  if (enemy.spawnAlpha < 1) enemy.spawnAlpha = Math.min(1, enemy.spawnAlpha + dt / 0.3);
}

export function updateShooter(enemy, dt, playerX, playerY, W, H, enemyBullets) {
  const dx = shortestDelta(enemy.x, playerX, W);
  const dy = shortestDelta(enemy.y, playerY, H);
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const driftSpeed = 30;
  enemy.vx = (dx / dist) * driftSpeed;
  enemy.vy = (dy / dist) * driftSpeed;
  enemy.x += enemy.vx * dt;
  enemy.y += enemy.vy * dt;
  wrapEnemy(enemy, W, H);
  enemy.shootTimer -= dt;
  if (enemy.shootTimer <= 0) {
    const dx = shortestDelta(enemy.x, playerX, W);
    const dy = shortestDelta(enemy.y, playerY, H);
    const angle = Math.atan2(dy, dx);
    enemyBullets.push(createEnemyBullet(enemy.x, enemy.y, angle));
    enemy.shootTimer = enemy.shootCooldown;
  }
  if (enemy.spawnAlpha < 1) enemy.spawnAlpha = Math.min(1, enemy.spawnAlpha + dt / 0.3);
}

export function updateSwarmer(enemy, dt, W, H) {
  enemy.vx += (Math.random() - 0.5) * 40 * dt;
  enemy.vy += (Math.random() - 0.5) * 40 * dt;
  enemy.x += enemy.vx * dt;
  enemy.y += enemy.vy * dt;
  wrapEnemy(enemy, W, H);
  if (enemy.spawnAlpha < 1) enemy.spawnAlpha = Math.min(1, enemy.spawnAlpha + dt / 0.3);
}

export function updateTank(enemy, dt, playerX, playerY, W, H, enemyBullets) {
  enemy.x += enemy.vx * dt;
  enemy.y += enemy.vy * dt;
  enemy.vx *= 0.99;
  enemy.vy *= 0.99;
  wrapEnemy(enemy, W, H);
  enemy.shootTimer -= dt;
  if (enemy.shootTimer <= 0) {
    const dx = shortestDelta(enemy.x, playerX, W);
    const dy = shortestDelta(enemy.y, playerY, H);
    const baseAngle = Math.atan2(dy, dx);
    for (let i = -1; i <= 1; i++) {
      const a = baseAngle + (i * 22.5 * Math.PI) / 180;
      enemyBullets.push(createEnemyBullet(enemy.x, enemy.y, a));
    }
    enemy.shootTimer = enemy.shootCooldown;
  }
  if (enemy.spawnAlpha < 1) enemy.spawnAlpha = Math.min(1, enemy.spawnAlpha + dt / 0.3);
}

export function updateSplitter(enemy, dt, W, H) {
  updateDrifter(enemy, dt, W, H);
}

export function updateDasher(enemy, dt, playerX, playerY, W, H) {
  switch (enemy.dashState) {
    case 'idle':
      enemy.x += enemy.vx * dt;
      enemy.y += enemy.vy * dt;
      enemy.vx *= 0.97;
      enemy.vy *= 0.97;
      wrapEnemy(enemy, W, H);
      enemy.dashTimer -= dt;
      if (enemy.dashTimer <= 0) {
        enemy.dashState = 'charging';
        enemy.dashTimer = 0.6;
        enemy.dashTarget = { x: playerX, y: playerY };
      }
      break;
    case 'charging':
      enemy.dashTimer -= dt;
      if (enemy.dashTimer <= 0) {
        const dx = shortestDelta(enemy.x, enemy.dashTarget.x, W);
        const dy = shortestDelta(enemy.y, enemy.dashTarget.y, H);
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const dashSpeed = 600;
        enemy.dashVx = (dx / dist) * dashSpeed;
        enemy.dashVy = (dy / dist) * dashSpeed;
        enemy.dashState = 'dashing';
        enemy.dashElapsed = 0;
      }
      break;
    case 'dashing':
      enemy.x += enemy.dashVx * dt;
      enemy.y += enemy.dashVy * dt;
      wrapEnemy(enemy, W, H);
      enemy.dashElapsed += dt;
      const dx2 = shortestDelta(enemy.x, enemy.dashTarget.x, W);
      const dy2 = shortestDelta(enemy.y, enemy.dashTarget.y, H);
      if (enemy.dashElapsed >= 1.2 || Math.sqrt(dx2 * dx2 + dy2 * dy2) < 5) {
        enemy.dashState = 'cooldown';
        enemy.dashTimer = 1.5;
        enemy.dashVx = 0;
        enemy.dashVy = 0;
      }
      break;
    case 'cooldown':
      enemy.dashTimer -= dt;
      if (enemy.dashTimer <= 0) {
        enemy.dashState = 'idle';
        enemy.dashTimer = 1 + Math.random() * 2;
      }
      break;
  }
  if (enemy.spawnAlpha < 1) enemy.spawnAlpha = Math.min(1, enemy.spawnAlpha + dt / 0.3);
}

function wrapEnemy(enemy, W, H) {
  if (enemy.x < -50)  enemy.x += W + 100;
  if (enemy.x > W+50) enemy.x -= W + 100;
  if (enemy.y < -50)  enemy.y += H + 100;
  if (enemy.y > H+50) enemy.y -= H + 100;
}

export function renderEnemy(ctx, enemy, now) {
  const alpha = enemy.spawnAlpha ?? 1;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(enemy.x, enemy.y);
  ctx.rotate(enemy.angle);

  const color = enemy.color;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.shadowBlur = 10;
  ctx.shadowColor = color;

  if (enemy.dashState === 'charging') {
    const pulse = 0.8 + 0.4 * Math.abs(Math.sin(now * 10));
    ctx.scale(pulse, pulse);
    ctx.shadowBlur = 20;
  }

  const s = enemy.size;
  switch (enemy.shape) {
    case 'triangle':
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.8, s * 0.7);
      ctx.lineTo(-s * 0.8, s * 0.7);
      ctx.closePath();
      ctx.fill();
      break;
    case 'arrow':
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.6, 0);
      ctx.lineTo(s * 0.3, 0);
      ctx.lineTo(s * 0.3, s);
      ctx.lineTo(-s * 0.3, s);
      ctx.lineTo(-s * 0.3, 0);
      ctx.lineTo(-s * 0.6, 0);
      ctx.closePath();
      ctx.fill();
      break;
    case 'diamond':
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.7, 0);
      ctx.lineTo(0, s);
      ctx.lineTo(-s * 0.7, 0);
      ctx.closePath();
      ctx.fill();
      break;
    case 'circle':
      ctx.beginPath();
      ctx.arc(0, 0, s, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'star': {
      const spikes = 5;
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? s : s * 0.4;
        const a = (i * Math.PI) / spikes - Math.PI / 2;
        i === 0 ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r)
                : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'elongated-triangle':
      ctx.beginPath();
      ctx.moveTo(0, -s * 1.5);
      ctx.lineTo(s * 0.5, s * 0.5);
      ctx.lineTo(-s * 0.5, s * 0.5);
      ctx.closePath();
      ctx.fill();
      break;
    case 'hexagon': {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        i === 0 ? ctx.moveTo(Math.cos(a) * s, Math.sin(a) * s)
                : ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
  }

  ctx.restore();

  // Health bar
  if (enemy.hp < enemy.maxHp) {
    const bw = enemy.size * 2.2;
    const bx = enemy.x - bw / 2;
    const by = enemy.y - enemy.size - 8;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#333';
    ctx.fillRect(bx, by, bw, 4);
    ctx.fillStyle = enemy.color;
    ctx.fillRect(bx, by, bw * (enemy.hp / enemy.maxHp), 4);
    ctx.restore();
  }
}
