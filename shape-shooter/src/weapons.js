const MAIN_SPEED = 600;
const BIG_SPEED = 180;
const ENEMY_BULLET_SPEED = 220;

export function createMainBullet(x, y, angle) {
  return {
    x, y,
    vx: Math.cos(angle) * MAIN_SPEED,
    vy: Math.sin(angle) * MAIN_SPEED,
    lifetime: 30,
    ownerId: 'player',
    type: 'main',
  };
}

export function createBigBullet(x, y, angle) {
  return {
    x, y,
    vx: Math.cos(angle) * BIG_SPEED,
    vy: Math.sin(angle) * BIG_SPEED,
    lifetime: 30,
    age: 0,
    hitCount: 0,
    type: 'big',
  };
}

export function createEnemyBullet(x, y, angle) {
  return {
    x, y,
    vx: Math.cos(angle) * ENEMY_BULLET_SPEED,
    vy: Math.sin(angle) * ENEMY_BULLET_SPEED,
    lifetime: 30,
    type: 'enemy',
  };
}

export function updateBullets(bullets, dt, W, H) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.lifetime -= dt;
    if (b.age !== undefined) b.age += dt;
    if (b.lifetime <= 0 || b.x < 0 || b.x > W || b.y < 0 || b.y > H) {
      bullets.splice(i, 1);
    }
  }
}

export function renderBullets(ctx, playerBullets, enemyBullets) {
  const mainColor = '#66aaff';
  const bigColor = '#ffaa00';
  const enemyColor = '#ff6666';

  for (const b of playerBullets) {
    if (b.type === 'main') {
      ctx.save();
      ctx.strokeStyle = mainColor;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 6;
      ctx.shadowColor = mainColor;
      ctx.globalAlpha = 0.9;
      const len = 12;
      const ex = b.x - (b.vx / MAIN_SPEED) * len;
      const ey = b.y - (b.vy / MAIN_SPEED) * len;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.restore();
    } else if (b.type === 'big') {
      const r = 10 + Math.min((b.age ?? 0) / 2, 1) * 4;
      ctx.save();
      ctx.fillStyle = bigColor;
      ctx.shadowBlur = 20;
      ctx.shadowColor = bigColor;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  for (const b of enemyBullets) {
    ctx.save();
    ctx.fillStyle = enemyColor;
    ctx.shadowBlur = 8;
    ctx.shadowColor = enemyColor;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
