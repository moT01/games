import { createMainBullet, createBigBullet } from './weapons.js';

const MOVE_SPEED = 280;
const MAIN_COOLDOWN = 0.15; // seconds
const BIG_RECHARGE_TIME = 8;

export function createPlayer(x, y) {
  return {
    x, y,
    vx: 0, vy: 0,
    angle: 0,
    bigAmmo: 3,
    bigAmmoRechargeTimer: 0,
    mainFireCooldown: 0,
    activePowerups: [],
    invincibleTimer: 1.5,
    trail: [],
  };
}

export function updatePlayer(player, dt, keys, mouseX, mouseY, W, H, playerBullets, waveState) {
  // Snap movement — no inertia
  const speedBoost = player.activePowerups.some(p => p.type === 'speed');
  const spd = speedBoost ? MOVE_SPEED * 2 : MOVE_SPEED;

  player.vx = 0;
  player.vy = 0;
  if (keys['ArrowUp'] || keys['KeyW'])    player.vy -= spd;
  if (keys['ArrowDown'] || keys['KeyS'])  player.vy += spd;
  if (keys['ArrowLeft'] || keys['KeyA'])  player.vx -= spd;
  if (keys['ArrowRight'] || keys['KeyD']) player.vx += spd;

  // Normalize diagonal so it doesn't move faster
  const mag = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
  if (mag > spd) {
    player.vx = player.vx / mag * spd;
    player.vy = player.vy / mag * spd;
  }

  // Trail
  player.trail.push({ x: player.x, y: player.y });
  if (player.trail.length > 5) player.trail.shift();

  player.x += player.vx * dt;
  player.y += player.vy * dt;

  // Wrap
  if (player.x < 0) player.x += W;
  if (player.x > W) player.x -= W;
  if (player.y < 0) player.y += H;
  if (player.y > H) player.y -= H;

  // Rotate toward mouse
  player.angle = Math.atan2(mouseY - player.y, mouseX - player.x);

  // Timers
  if (player.invincibleTimer > 0) player.invincibleTimer -= dt;
  if (player.mainFireCooldown > 0) player.mainFireCooldown -= dt;

  // Big ammo recharge only during active wave
  if (waveState === 'active' && player.bigAmmo < 5) {
    player.bigAmmoRechargeTimer += dt;
    if (player.bigAmmoRechargeTimer >= BIG_RECHARGE_TIME) {
      player.bigAmmo++;
      player.bigAmmoRechargeTimer = 0;
    }
  }

  // Power-up timers
  for (let i = player.activePowerups.length - 1; i >= 0; i--) {
    player.activePowerups[i].timeLeft -= dt;
    if (player.activePowerups[i].timeLeft <= 0) {
      player.activePowerups.splice(i, 1);
    }
  }
}

export function fireMain(player, playerBullets) {
  const rapidFire = player.activePowerups.some(p => p.type === 'rapidfire');
  const cooldown = rapidFire ? 0.075 : MAIN_COOLDOWN;
  if (player.mainFireCooldown > 0) return;
  player.mainFireCooldown = cooldown;

  const spread = player.activePowerups.some(p => p.type === 'spread');
  if (spread) {
    for (let i = -1; i <= 1; i++) {
      const a = player.angle + (i * 15 * Math.PI) / 180;
      playerBullets.push(createMainBullet(player.x, player.y, a));
    }
  } else {
    playerBullets.push(createMainBullet(player.x, player.y, player.angle));
  }
}

export function fireBig(player, playerBullets) {
  if (player.bigAmmo <= 0) return;
  player.bigAmmo--;
  player.bigAmmoRechargeTimer = 0;
  playerBullets.push(createBigBullet(player.x, player.y, player.angle));
}

export function renderPlayer(ctx, player, now) {
  for (let i = 0; i < player.trail.length; i++) {
    const t = player.trail[i];
    const alpha = (i / player.trail.length) * 0.3;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#88ccff';
    ctx.beginPath();
    ctx.arc(t.x, t.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Flicker when invincible
  if (player.invincibleTimer > 0) {
    if (Math.floor(now * 8) % 2 === 0) return;
  }

  const color = '#88ccff';
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.shadowBlur = 12;
  ctx.shadowColor = color;

  // Main circle
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, Math.PI * 2);
  ctx.fill();

  // Direction pip
  ctx.shadowBlur = 6;
  ctx.fillStyle = '#001a33';
  ctx.beginPath();
  ctx.arc(14, 0, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
