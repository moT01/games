import { burstParticles } from './particles.js';

const POWERUP_TYPES = ['rapidfire', 'spread', 'bigammo', 'speed', 'nuke'];
const POWERUP_COLORS = {
  rapidfire: '#ffdd00',
  spread:    '#44ffaa',
  bigammo:   '#ff8800',
  speed:     '#00ccff',
  nuke:      '#ff3366',
};

export function createPowerup(x, y, type) {
  return { type, x, y, lifetime: 10, maxLifetime: 10 };
}

export function randomPowerup(x, y) {
  const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
  return createPowerup(x, y, type);
}

export function dropPowerup(x, y, enemyType, wave) {
  const chance = enemyType === 'tank' ? 0.30 : 0.15;
  if (Math.random() > chance) return null;
  // Later waves: bias toward bigammo
  let weights;
  if (wave >= 10) {
    weights = [
      { type: 'rapidfire', w: 2 }, { type: 'spread', w: 2 },
      { type: 'bigammo', w: 4 },   { type: 'speed', w: 2 },
      { type: 'nuke', w: 1 },
    ];
  } else {
    weights = POWERUP_TYPES.map(t => ({ type: t, w: 1 }));
  }
  const total = weights.reduce((s, o) => s + o.w, 0);
  let r = Math.random() * total;
  let chosen = weights[weights.length - 1].type;
  for (const o of weights) {
    r -= o.w;
    if (r <= 0) { chosen = o.type; break; }
  }
  return createPowerup(x, y, chosen);
}

export function updatePowerups(powerups, dt) {
  for (let i = powerups.length - 1; i >= 0; i--) {
    powerups[i].lifetime -= dt;
    if (powerups[i].lifetime <= 0) powerups.splice(i, 1);
  }
}

export function applyPowerup(game, type) {
  const player = game.player;
  if (type === 'bigammo') {
    player.bigAmmo = Math.min(5, player.bigAmmo + 3);
    return;
  }
  if (type === 'nuke') {
    if (game.enemies.length === 0) return;
    game.nukeFlash = 0.6;
    for (const e of game.enemies) {
      game.score += e.scoreValue;
      burstParticles(game.particles, e.x, e.y, e.color, 10);
    }
    game.enemies = [];
    return;
  }
  // Timed power-ups
  const durations = { rapidfire: 10, spread: 10, speed: 8 };
  const duration = durations[type] || 10;
  const existing = player.activePowerups.findIndex(p => p.type === type);
  if (existing >= 0) {
    player.activePowerups[existing].timeLeft = duration;
  } else {
    player.activePowerups.push({ type, timeLeft: duration });
  }
}

export function renderPowerups(ctx, powerups, now) {
  for (const p of powerups) {
    const color = POWERUP_COLORS[p.type] || '#ffffff';
    const alpha = p.lifetime <= 3 ? p.lifetime / 3 : 1;
    const pulse = 1 + 0.15 * Math.sin(now * 4);
    const r = 10 * pulse;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowBlur = 15;
    ctx.shadowColor = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    drawPowerupShape(ctx, p.type, p.x, p.y, r);
    ctx.restore();
  }
}

function drawPowerupShape(ctx, type, x, y, r) {
  ctx.translate(x, y);
  switch (type) {
    case 'rapidfire': {
      // Lightning bolt
      ctx.beginPath();
      ctx.moveTo(4, -r);
      ctx.lineTo(-2, -2);
      ctx.lineTo(2, -2);
      ctx.lineTo(-4, r);
      ctx.lineTo(2, 2);
      ctx.lineTo(-2, 2);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'spread': {
      // Fan: 3 lines
      for (let a = -1; a <= 1; a++) {
        const angle = (a * 30 * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle - Math.PI / 2) * r, Math.sin(angle - Math.PI / 2) * r);
        ctx.lineWidth = 2;
        ctx.strokeStyle = ctx.fillStyle;
        ctx.stroke();
      }
      break;
    }
    case 'bigammo': {
      // Circle with +
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.fillRect(-r * 0.5, -2, r, 4);
      ctx.fillRect(-2, -r * 0.5, 4, r);
      break;
    }
    case 'speed': {
      // Arrow up
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(r * 0.7, 0);
      ctx.lineTo(r * 0.3, 0);
      ctx.lineTo(r * 0.3, r);
      ctx.lineTo(-r * 0.3, r);
      ctx.lineTo(-r * 0.3, 0);
      ctx.lineTo(-r * 0.7, 0);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'nuke': {
      // Star burst
      const spikes = 6;
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const rad = i % 2 === 0 ? r : r * 0.4;
        const ang = (i * Math.PI) / spikes - Math.PI / 2;
        i === 0 ? ctx.moveTo(Math.cos(ang) * rad, Math.sin(ang) * rad)
                : ctx.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
  }
}

export { POWERUP_COLORS };
