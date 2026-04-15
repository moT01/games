import { createPlayer, updatePlayer, fireMain, fireBig, renderPlayer } from './player.js';
import { spawnEnemyAtEdge, spawnEnemy, updateDrifter, updateChaser, updateShooter, updateSwarmer, updateTank, updateSplitter, updateDasher, renderEnemy } from './enemies.js';
import { updateBullets, renderBullets } from './weapons.js';
import { updatePowerups, renderPowerups, dropPowerup, applyPowerup, randomPowerup } from './powerups.js';
import { updateParticles, renderParticles, burstParticles } from './particles.js';
import { getWaveComposition } from './waves.js';
import { renderHUD, renderWaveBanner, showGameOver, showHelpModal, hideHelpModal, showPause, hidePause, showQuitConfirm, renderScorePopups } from './ui.js';
import { saveHighScore, loadHighScore } from './storage.js';

const STAR_COUNT = 80;

export class Game {
  constructor(canvas, onGameOver, onHome) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onGameOver = onGameOver;
    this.onHome = onHome;

    this.resize();
    this.resizeHandler = () => this.resize();
    window.addEventListener('resize', this.resizeHandler);

    this.keys = {};
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseLeft = false;
    this.mouseRight = false;

    this.stars = this.generateStars();
    this.starsLayer2 = this.generateStars();
    this.starOffsetX = 0;
    this.starOffsetY = 0;

    this.state = {
      screen: 'playing',
      wave: 1,
      score: 0,
      highScore: loadHighScore(),
      waveState: 'active',
      waveCountdown: 3,
      spawnQueue: [],
      spawnTimer: 0,
      paused: false,
    };

    this.player = createPlayer(this.W / 2, this.H / 2);
    this.enemies = [];
    this.playerBullets = [];
    this.enemyBullets = [];
    this.powerups = [];
    this.particles = [];
    this.scorePopups = [];
    this.timedPowerupTimer = 0;
    this.nukeFlash = 0;
    this.waveBannerTimer = 0;
    this.bigWeaponRing = null;

    this.bindInput();
    this.startWave(1);

    this.lastTime = null;
    this.rafId = requestAnimationFrame(ts => this.loop(ts));
  }

  resize() {
    this.W = window.innerWidth;
    this.H = window.innerHeight;
    this.canvas.width = this.W;
    this.canvas.height = this.H;
  }

  generateStars() {
    const stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        r: 0.5 + Math.random() * 1.5,
      });
    }
    return stars;
  }

  bindInput() {
    this.keydownHandler = (e) => {
      this.keys[e.code] = true;
      if (e.code === 'KeyZ') this.handleFire('main');
      if (e.code === 'KeyX') this.handleFire('big');
      if (e.code === 'Escape') this.handleEscape();
      if (e.code === 'Space') e.preventDefault();
    };
    this.keyupHandler = (e) => { this.keys[e.code] = false; };
    this.mousemoveHandler = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
    };
    this.mousedownHandler = (e) => {
      if (e.button === 0) { this.mouseLeft = true; this.handleFire('main'); }
      if (e.button === 2) { this.mouseRight = true; this.handleFire('big'); }
    };
    this.mouseupHandler = (e) => {
      if (e.button === 0) this.mouseLeft = false;
      if (e.button === 2) this.mouseRight = false;
    };
    this.contextmenuHandler = (e) => e.preventDefault();

    window.addEventListener('keydown', this.keydownHandler);
    window.addEventListener('keyup', this.keyupHandler);
    this.canvas.addEventListener('mousemove', this.mousemoveHandler);
    this.canvas.addEventListener('mousedown', this.mousedownHandler);
    this.canvas.addEventListener('mouseup', this.mouseupHandler);
    this.canvas.addEventListener('contextmenu', this.contextmenuHandler);
  }

  handleFire(type) {
    if (this.state.paused || this.state.waveState !== 'active') return;
    if (type === 'main') fireMain(this.player, this.playerBullets);
    if (type === 'big') {
      fireBig(this.player, this.playerBullets);
      this.bigWeaponRing = { x: this.player.x, y: this.player.y, r: 5, maxR: 60, lifetime: 0.35 };
    }
  }

  handleEscape() {
    if (document.getElementById('help-modal')) { hideHelpModal(); return; }
    if (this.state.paused) { this.resume(); } else { this.pause(); showHelpModal(true); }
  }

  pause() {
    this.state.paused = true;
    showPause();
    const resumeBtn = document.getElementById('resume-btn');
    if (resumeBtn) resumeBtn.addEventListener('click', () => this.resume());
  }

  resume() {
    this.state.paused = false;
    hidePause();
    hideHelpModal();
  }

  startWave(wave) {
    this.state.wave = wave;
    this.state.waveState = 'active';
    this.state.spawnQueue = getWaveComposition(wave);
    const baseInterval = Math.max(0.4, 1.2 - wave * 0.04);
    this.state.spawnTimer = baseInterval * (0.5 + Math.random() * 1.3);
    this.player.invincibleTimer = 1.5;
    this.timedPowerupTimer = 20;
  }

  loop(ts) {
    if (this.destroyed) return;
    const dt = this.lastTime === null ? 0 : Math.min((ts - this.lastTime) / 1000, 0.05);
    this.lastTime = ts;
    this.update(dt, ts / 1000);
    this.render(ts / 1000);
    this.rafId = requestAnimationFrame(t => this.loop(t));
  }

  update(dt, now) {
    if (this.state.paused) return;

    const { W, H } = this;
    const state = this.state;

    // Auto-fire while holding
    if ((this.mouseLeft || this.keys['KeyZ']) && state.waveState === 'active') {
      fireMain(this.player, this.playerBullets);
    }

    updatePlayer(this.player, dt, this.keys, this.mouseX, this.mouseY, W, H, this.playerBullets, state.waveState);

    const hasSpeed = this.player.activePowerups.some(p => p.type === 'speed');
    const driftScale = hasSpeed ? 0.0004 : 0.0002;
    this.starOffsetX = (this.starOffsetX + this.player.vx * dt * driftScale) % 1;
    this.starOffsetY = (this.starOffsetY + this.player.vy * dt * driftScale) % 1;

    if (state.waveState === 'active') {
      this.updateEnemies(dt, now);
      this.updateSpawnQueue(dt);
      this.timedPowerupTimer -= dt;
      if (this.timedPowerupTimer <= 0) {
        this.timedPowerupTimer = 20;
        const px = 60 + Math.random() * (W - 120);
        const py = 60 + Math.random() * (H - 120);
        this.powerups.push(randomPowerup(px, py));
      }
    }

    updateBullets(this.playerBullets, dt, W, H);
    updateBullets(this.enemyBullets, dt, W, H);
    updatePowerups(this.powerups, dt);
    updateParticles(this.particles, dt);

    // Update score popups
    for (let i = this.scorePopups.length - 1; i >= 0; i--) {
      const p = this.scorePopups[i];
      p.y -= 40 * dt;
      p.lifetime -= dt;
      if (p.lifetime <= 0) this.scorePopups.splice(i, 1);
    }

    if (state.waveState === 'active') {
      this.checkCollisions();
      this.checkWaveCompletion();
    }

    if (state.waveState === 'countdown' || state.waveState === 'cleared') {
      state.waveCountdown -= dt;
      if (state.waveCountdown <= 0) {
        this.startWave(state.wave + 1);
      }
    }

    if (this.nukeFlash > 0) this.nukeFlash -= dt;
    if (this.bigWeaponRing) {
      this.bigWeaponRing.r += (this.bigWeaponRing.maxR / 0.35) * dt;
      this.bigWeaponRing.lifetime -= dt;
      if (this.bigWeaponRing.lifetime <= 0) this.bigWeaponRing = null;
    }
  }

  updateEnemies(dt, now) {
    const { W, H } = this;
    const px = this.player.x, py = this.player.y;
    for (const enemy of this.enemies) {
      switch (enemy.type) {
        case 'drifter':  updateDrifter(enemy, dt, W, H); break;
        case 'chaser':   updateChaser(enemy, dt, px, py, W, H); break;
        case 'shooter':  updateShooter(enemy, dt, px, py, W, H, this.enemyBullets); break;
        case 'swarmer':  updateSwarmer(enemy, dt, W, H); break;
        case 'tank':     updateTank(enemy, dt, px, py, W, H, this.enemyBullets); break;
        case 'splitter': updateSplitter(enemy, dt, W, H); break;
        case 'dasher':   updateDasher(enemy, dt, px, py, W, H); break;
      }
    }
  }

  updateSpawnQueue(dt) {
    if (this.state.spawnQueue.length === 0) return;
    this.state.spawnTimer -= dt;
    if (this.state.spawnTimer <= 0) {
      const type = this.state.spawnQueue.pop();
      const enemy = spawnEnemyAtEdge(type, this.W, this.H, this.state.wave);
      this.enemies.push(enemy);
      const baseInterval = Math.max(0.4, 1.2 - this.state.wave * 0.04);
      const jitterMin = Math.max(0.5, 0.7 - this.state.wave * 0.005);
      this.state.spawnTimer = baseInterval * (jitterMin + Math.random() * (1.8 - jitterMin));
    }
  }

  checkCollisions() {
    const player = this.player;
    const state = this.state;

    // Player bullets vs enemies
    for (let bi = this.playerBullets.length - 1; bi >= 0; bi--) {
      const b = this.playerBullets[bi];
      let hit = false;
      for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
        const e = this.enemies[ei];
        const dx = b.x - e.x, dy = b.y - e.y;
        if (dx * dx + dy * dy <= e.size * e.size) {
          if (b.type === 'main') {
            e.hp -= 1;
            hit = true;
            if (e.hp <= 0) this.killEnemy(ei, 'main');
          } else if (b.type === 'big') {
            e.hp -= 999;
            b.hitCount++;
            if (e.hp <= 0) this.killEnemy(ei, 'big');
          }
        }
      }
      if (hit && b.type === 'main') this.playerBullets.splice(bi, 1);
      else if (hit && b.type === 'big') this.playerBullets.splice(bi, 1);
    }

    // Enemy bullets vs player
    if (player.invincibleTimer <= 0) {
      for (const b of this.enemyBullets) {
        const dx = b.x - player.x, dy = b.y - player.y;
        if (dx * dx + dy * dy <= 12 * 12) {
          this.triggerGameOver();
          return;
        }
      }

      // Enemies vs player
      for (const e of this.enemies) {
        const dx = e.x - player.x, dy = e.y - player.y;
        if (dx * dx + dy * dy <= (e.size + 12) * (e.size + 12)) {
          this.triggerGameOver();
          return;
        }
      }
    }

    // Player vs powerups
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      const dx = p.x - player.x, dy = p.y - player.y;
      if (dx * dx + dy * dy <= 36 * 36) {
        applyPowerup(this, p.type);
        this.powerups.splice(i, 1);
      }
    }
  }

  killEnemy(idx, source) {
    const enemy = this.enemies[idx];
    this.state.score += enemy.scoreValue;
    this.scorePopups.push({ x: enemy.x, y: enemy.y, value: enemy.scoreValue, lifetime: 0.8 });
    burstParticles(this.particles, enemy.x, enemy.y, enemy.color, 12);

    if (enemy.type === 'splitter' && !enemy.isChild && source !== 'nuke') {
      for (let i = 0; i < 2; i++) {
        const child = spawnEnemy('drifter', enemy.x + (Math.random() - 0.5) * 20, enemy.y + (Math.random() - 0.5) * 20, this.state.wave, true);
        child.color = enemy.color;
        this.enemies.push(child);
      }
    }

    const pu = dropPowerup(enemy.x, enemy.y, enemy.type, this.state.wave);
    if (pu && enemy.type !== 'swarmer') this.powerups.push(pu);

    this.enemies.splice(idx, 1);
  }

  checkWaveCompletion() {
    if (this.state.spawnQueue.length === 0 && this.enemies.length === 0) {
      this.state.waveState = 'countdown';
      this.state.waveCountdown = 3;
      // Brief camera shake handled in render
      this.shakeFrames = 4;
    }
  }

  triggerGameOver() {
    const state = this.state;
    const hs = state.highScore;
    const isNewBest = !hs || state.score > hs.score || state.wave > hs.wave;
    if (isNewBest) {
      const newHs = { score: state.score, wave: state.wave };
      saveHighScore(newHs);
      state.highScore = newHs;
    }
    this.destroy();
    showGameOver(state.score, state.wave, state.highScore, isNewBest);
    this.onGameOver(state.score, state.wave, state.highScore);
  }

  render(now) {
    const { ctx, W, H } = this;
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, W, H);

    // Camera shake
    ctx.save();
    if (this.shakeFrames > 0) {
      this.shakeFrames--;
      const mag = this.shakeFrames * 1.5;
      ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
    }

    this.renderStarfield(now);
    renderPowerups(ctx, this.powerups, now);
    renderParticles(ctx, this.particles);
    for (const e of this.enemies) renderEnemy(ctx, e, now);
    renderPlayer(ctx, this.player, now);
    renderBullets(ctx, this.playerBullets, this.enemyBullets);

    // Big weapon ring
    if (this.bigWeaponRing) {
      const ring = this.bigWeaponRing;
      const alpha = ring.lifetime / 0.35;
      ctx.save();
      ctx.globalAlpha = alpha * 0.6;
      ctx.strokeStyle = '#ffaa00';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ffaa00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();

    // Nuke flash — fades out over 0.6s
    if (this.nukeFlash > 0) {
      ctx.save();
      ctx.globalAlpha = (this.nukeFlash / 0.6) * 0.75;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    renderHUD(ctx, this.state, this.player, W);
    renderWaveBanner(ctx, this.state, W, H, now);
    renderScorePopups(ctx, this.scorePopups);
  }

  renderStarfield(now) {
    const { ctx, W, H } = this;
    const starColor = 'rgba(255,255,255,0.6)';
    const starColor2 = 'rgba(255,255,255,0.3)';

    ctx.fillStyle = starColor;
    for (const s of this.stars) {
      const sx = ((s.x + this.starOffsetX) % 1 + 1) % 1;
      const sy = ((s.y + this.starOffsetY) % 1 + 1) % 1;
      ctx.beginPath();
      ctx.arc(sx * W, sy * H, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = starColor2;
    for (const s of this.starsLayer2) {
      const sx = ((s.x + this.starOffsetX * 0.5) % 1 + 1) % 1;
      const sy = ((s.y + this.starOffsetY * 0.5) % 1 + 1) % 1;
      ctx.beginPath();
      ctx.arc(sx * W, sy * H, s.r * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  destroy() {
    this.destroyed = true;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this.resizeHandler);
    window.removeEventListener('keydown', this.keydownHandler);
    window.removeEventListener('keyup', this.keyupHandler);
    this.canvas.removeEventListener('mousemove', this.mousemoveHandler);
    this.canvas.removeEventListener('mousedown', this.mousedownHandler);
    this.canvas.removeEventListener('mouseup', this.mouseupHandler);
    this.canvas.removeEventListener('contextmenu', this.contextmenuHandler);
  }
}

export class HomeAnimator {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.shapes = [];
    this.resize();
    this.resizeHandler = () => this.resize();
    window.addEventListener('resize', this.resizeHandler);
    for (let i = 0; i < 12; i++) this.shapes.push(this.randomShape());
    this.rafId = requestAnimationFrame(ts => this.loop(ts));
    this.lastTime = null;
  }

  resize() {
    this.W = window.innerWidth;
    this.H = window.innerHeight;
    this.canvas.width = this.W;
    this.canvas.height = this.H;
  }

  randomShape() {
    const types = ['triangle', 'diamond', 'circle', 'star'];
    const colors = ['#ff6666', '#66ccff', '#ffcc66', '#66ff99', '#cc66ff'];
    return {
      x: Math.random() * this.W,
      y: Math.random() * this.H,
      vx: (Math.random() - 0.5) * 40,
      vy: (Math.random() - 0.5) * 40,
      angle: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.5,
      size: 10 + Math.random() * 20,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: types[Math.floor(Math.random() * types.length)],
    };
  }

  loop(ts) {
    if (this.destroyed) return;
    const dt = this.lastTime === null ? 0 : Math.min((ts - this.lastTime) / 1000, 0.05);
    this.lastTime = ts;
    const { ctx, W, H } = this;
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, W, H);

    for (const s of this.shapes) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.angle += s.rotSpeed * dt;
      if (s.x < -50) s.x += W + 100;
      if (s.x > W + 50) s.x -= W + 100;
      if (s.y < -50) s.y += H + 100;
      if (s.y > H + 100) s.y -= H + 100;

      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle);
      ctx.fillStyle = s.color;
      ctx.globalAlpha = 0.25;
      ctx.shadowBlur = 8;
      ctx.shadowColor = s.color;
      drawHomeShape(ctx, s.shape, s.size);
      ctx.restore();
    }

    this.rafId = requestAnimationFrame(t => this.loop(t));
  }

  destroy() {
    this.destroyed = true;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this.resizeHandler);
  }
}

function drawHomeShape(ctx, shape, s) {
  switch (shape) {
    case 'triangle':
      ctx.beginPath();
      ctx.moveTo(0, -s); ctx.lineTo(s * 0.8, s * 0.7); ctx.lineTo(-s * 0.8, s * 0.7);
      ctx.closePath(); ctx.fill(); break;
    case 'diamond':
      ctx.beginPath();
      ctx.moveTo(0, -s); ctx.lineTo(s * 0.7, 0); ctx.lineTo(0, s); ctx.lineTo(-s * 0.7, 0);
      ctx.closePath(); ctx.fill(); break;
    case 'circle':
      ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fill(); break;
    case 'star': {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? s : s * 0.4;
        const a = (i * Math.PI) / 5 - Math.PI / 2;
        i === 0 ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r)
                : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath(); ctx.fill(); break;
    }
  }
}
