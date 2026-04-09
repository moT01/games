import { POWERUP_COLORS } from './powerups.js';

const POWERUP_LABELS = {
  rapidfire: 'RAPID',
  spread: 'SPREAD',
  speed: 'SPEED',
};

export function renderHUD(ctx, state, player, W) {
  const textColor = '#ffffff';
  const shadowColor = '#000';
  const emptyPip = '#444';
  const barBg = '#333';

  ctx.save();
  ctx.font = `bold 18px Inconsolata, monospace`;
  ctx.fillStyle = textColor;
  ctx.shadowBlur = 4;
  ctx.shadowColor = shadowColor;

  // Score top-left
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${state.score}`, 12, 28);

  // Wave top-center
  ctx.textAlign = 'center';
  ctx.fillText(`Wave ${state.wave}`, W / 2, 28);

  // Big ammo pips top-right
  ctx.textAlign = 'right';
  ctx.fillText('BIG: ', W - 80, 28);
  for (let i = 0; i < 5; i++) {
    const px = W - 68 + i * 14;
    ctx.beginPath();
    if (i < player.bigAmmo) {
      ctx.fillStyle = '#ffaa00';
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 8;
    } else {
      ctx.fillStyle = emptyPip;
      ctx.shadowBlur = 0;
    }
    ctx.arc(px, 22, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = textColor;
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = 4;
  }

  // Active power-ups bottom-left
  let pyOffset = 0;
  for (const pu of player.activePowerups) {
    const color = POWERUP_COLORS[pu.type] || '#fff';
    const label = POWERUP_LABELS[pu.type] || pu.type.toUpperCase();
    const duration = pu.type === 'speed' ? 8 : 10;
    ctx.textAlign = 'left';
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.font = 'bold 13px Inconsolata, monospace';
    const y = ctx.canvas.height - 16 - pyOffset;
    ctx.fillText(`${label} ${pu.timeLeft.toFixed(1)}s`, 12, y);
    const barW = 80;
    ctx.fillStyle = barBg;
    ctx.shadowBlur = 0;
    ctx.fillRect(12, y + 3, barW, 4);
    ctx.fillStyle = color;
    ctx.fillRect(12, y + 3, barW * (pu.timeLeft / duration), 4);
    pyOffset += 24;
  }

  ctx.restore();
}

export function renderWaveBanner(ctx, state, W, H, now) {
  if (state.waveState !== 'cleared' && state.waveState !== 'countdown') return;

  const titleColor = '#ffcc00';
  const subtitleColor = '#ffffff';

  ctx.save();
  ctx.textAlign = 'center';

  const alpha = Math.min(1, state.waveCountdown > 2.5 ? (3 - state.waveCountdown) / 0.5 : state.waveCountdown > 0.5 ? 1 : state.waveCountdown / 0.5);

  ctx.globalAlpha = alpha;
  ctx.font = `bold 36px Inconsolata, monospace`;
  ctx.fillStyle = titleColor;
  ctx.shadowBlur = 20;
  ctx.shadowColor = titleColor;
  ctx.fillText(`Wave ${state.wave} Complete!`, W / 2, H / 2 - 30);

  ctx.font = `bold 24px Inconsolata, monospace`;
  ctx.fillStyle = subtitleColor;
  ctx.shadowColor = subtitleColor;
  ctx.shadowBlur = 10;
  ctx.fillText(`Next wave in ${Math.ceil(state.waveCountdown)}...`, W / 2, H / 2 + 20);

  ctx.restore();
}

export function showHome(highScore) {
  const app = document.getElementById('app');
  const hs = highScore
    ? `Best: Wave ${highScore.wave} &mdash; ${highScore.score.toLocaleString()} pts`
    : 'No score yet';

  app.innerHTML = `
    <div id="home-screen" class="overlay-panel" role="main">
      <h1 class="game-title">Shape Shooter</h1>
      <p class="high-score">${hs}</p>
      <div class="home-buttons">
        <button id="start-btn" class="btn btn-primary" aria-label="Start game">Start</button>
        <button id="help-btn" class="btn btn-secondary" aria-label="Open info">Info</button>
        <a href="https://www.freecodecamp.org/donate" target="_blank" rel="noopener" class="btn btn-secondary donate-btn" aria-label="Donate to freeCodeCamp">Donate</a>
      </div>
    </div>
  `;
}

export function showGameOver(score, wave, highScore, isNewBest) {
  const app = document.getElementById('app');
  const bestText = highScore
    ? `Best: Wave ${highScore.wave} &mdash; ${highScore.score.toLocaleString()} pts`
    : '';
  app.innerHTML = `
    <div id="gameover-screen" class="overlay-panel gameover-panel" role="dialog" aria-modal="true" aria-label="Game over">
      <h2 class="gameover-title">Game Over</h2>
      <p class="gameover-stat">Wave reached: <span class="mono">${wave}</span></p>
      <p class="gameover-stat">Score: <span class="mono">${score.toLocaleString()}</span></p>
      ${isNewBest ? '<p class="new-best">New Best!</p>' : ''}
      <p class="gameover-stat best-stat">${bestText}</p>
      <div class="gameover-buttons">
        <button id="play-again-btn" class="btn btn-primary" aria-label="Play again">Play Again</button>
        <button id="home-btn-go" class="btn btn-secondary" aria-label="Return to home">Home</button>
      </div>
      <div class="gameover-links">
        <button id="help-btn-go" class="btn-link" aria-label="Open info">Info</button>
        <a href="https://www.freecodecamp.org/donate" target="_blank" rel="noopener" class="btn-link" aria-label="Donate to freeCodeCamp">Donate</a>
      </div>
    </div>
  `;
}

export function showGameControls(onHelp) {
  let el = document.getElementById('game-controls');
  if (el) return;
  el = document.createElement('div');
  el.id = 'game-controls';
  el.className = 'game-controls';
  el.innerHTML = `
    <button id="game-help-btn" class="game-ctrl-btn" aria-label="Open info">?</button>
    <a href="https://www.freecodecamp.org/donate" target="_blank" rel="noopener" class="game-ctrl-btn" aria-label="Donate to freeCodeCamp">Donate</a>
  `;
  document.getElementById('app').appendChild(el);
  document.getElementById('game-help-btn').addEventListener('click', onHelp);
}

export function hideGameControls() {
  const el = document.getElementById('game-controls');
  if (el) el.remove();
}

export function showHelpModal(fromGame) {
  const existing = document.getElementById('help-modal');
  if (existing) return;
  const modal = document.createElement('div');
  modal.id = 'help-modal';
  modal.className = 'modal-overlay';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Info');
  modal.innerHTML = `
    <div class="modal-panel">
      <h2>Controls</h2>
      <ul class="help-list">
        <li><strong>WASD / Arrow Keys</strong> - Move</li>
        <li><strong>Mouse</strong> - Aim (ship faces cursor)</li>
        <li><strong>Left Click / Z</strong> - Fire main weapon</li>
        <li><strong>Right Click / X</strong> - Fire big weapon</li>
        <li><strong>ESC</strong> - Pause / close info</li>
      </ul>
      <h2>Enemies</h2>
      <ul class="help-list enemy-list">
        <li><svg class="help-icon" viewBox="0 0 20 20"><polygon points="10,2 18,18 2,18" fill="#ff6666"/></svg><strong>Drifter</strong> - Floats in one direction. Predictable.</li>
        <li><svg class="help-icon" viewBox="0 0 20 20"><polygon points="10,2 16,9 12,9 12,18 8,18 8,9 4,9" fill="#66ccff"/></svg><strong>Chaser</strong> - Homes in on you. Kill quickly.</li>
        <li><svg class="help-icon" viewBox="0 0 20 20"><polygon points="10,2 18,10 10,18 2,10" fill="#ffcc66"/></svg><strong>Shooter</strong> - Drifts slowly toward you and fires. Strafe after shots.</li>
        <li><svg class="help-icon" viewBox="0 0 20 20"><circle cx="10" cy="10" r="6" fill="#66ff99"/></svg><strong>Swarmer</strong> - Tiny, fast, in clusters. Use spread shot.</li>
        <li><svg class="help-icon" viewBox="0 0 20 20"><polygon points="10,2 12,8 18,8 13.5,12 15,18 10,14.5 5,18 6.5,12 2,8 8,8" fill="#ff9966"/></svg><strong>Splitter</strong> - Splits into 2 Drifters on death.</li>
        <li><svg class="help-icon" viewBox="0 0 20 20"><polygon points="10,1 14,19 6,19" fill="#cc66ff"/></svg><strong>Dasher</strong> - Charges at you in bursts. Watch for the glow cue.</li>
        <li><svg class="help-icon" viewBox="0 0 20 20"><polygon points="10,2 17,6 17,14 10,18 3,14 3,6" fill="#ff66cc"/></svg><strong>Tank</strong> - Very tough, fires spread. One big shot kills it.</li>
      </ul>
      <h2>Power-ups</h2>
      <ul class="help-list">
        <li><svg class="help-icon" viewBox="0 0 20 20"><polygon points="12,2 7,11 11,11 8,18 13,9 9,9" fill="#ffdd00"/></svg><strong style="color:#ffdd00">Rapid Fire</strong> - 2x fire rate for 10s</li>
        <li><svg class="help-icon" viewBox="0 0 20 20"><line x1="10" y1="17" x2="10" y2="3" stroke="#44ffaa" stroke-width="2"/><line x1="10" y1="17" x2="3" y2="5" stroke="#44ffaa" stroke-width="2"/><line x1="10" y1="17" x2="17" y2="5" stroke="#44ffaa" stroke-width="2"/></svg><strong style="color:#44ffaa">Spread Shot</strong> - 3-bullet cone for 10s</li>
        <li><svg class="help-icon" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="#ff8800"/><rect x="4" y="9" width="12" height="2" fill="#000"/><rect x="9" y="4" width="2" height="12" fill="#000"/></svg><strong style="color:#ff8800">Big Ammo</strong> - +3 big weapon ammo</li>
        <li><svg class="help-icon" viewBox="0 0 20 20"><polygon points="10,2 16,9 12,9 12,18 8,18 8,9 4,9" fill="#00ccff"/></svg><strong style="color:#00ccff">Speed Boost</strong> - 2x speed for 8s</li>
        <li><svg class="help-icon" viewBox="0 0 20 20"><polygon points="10,2 11.8,7.8 17.3,6 13.6,10 17.3,14 11.8,12.2 10,18 8.2,12.2 2.7,14 6.4,10 2.7,6 8.2,7.8" fill="#ff3366"/></svg><strong style="color:#ff3366">Nuke</strong> - Instantly clears all enemies</li>
      </ul>
      <button id="close-help-btn" class="btn btn-primary close-btn" aria-label="Close info">Close</button>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('close-help-btn').addEventListener('click', hideHelpModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) hideHelpModal(); });
}

export function hideHelpModal() {
  const modal = document.getElementById('help-modal');
  if (modal) modal.remove();
}

export function showPause() {
  let overlay = document.getElementById('pause-overlay');
  if (overlay) return;
  overlay = document.createElement('div');
  overlay.id = 'pause-overlay';
  overlay.className = 'pause-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `
    <div class="pause-panel">
      <p>Paused</p>
      <button id="resume-btn" class="btn btn-primary" aria-label="Resume game">Resume</button>
    </div>
  `;
  document.getElementById('app').appendChild(overlay);
}

export function hidePause() {
  const overlay = document.getElementById('pause-overlay');
  if (overlay) overlay.remove();
}

export function showQuitConfirm(onConfirm, onCancel) {
  let modal = document.getElementById('quit-confirm');
  if (modal) return;
  modal = document.createElement('div');
  modal.id = 'quit-confirm';
  modal.className = 'modal-overlay';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.innerHTML = `
    <div class="modal-panel small-panel">
      <p>Quit and lose progress?</p>
      <div class="confirm-buttons">
        <button id="quit-confirm-btn" class="btn btn-primary" aria-label="Confirm quit">Quit</button>
        <button id="quit-cancel-btn" class="btn btn-secondary" aria-label="Cancel quit">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('quit-confirm-btn').addEventListener('click', () => { modal.remove(); onConfirm(); });
  document.getElementById('quit-cancel-btn').addEventListener('click', () => { modal.remove(); onCancel(); });
}

export function renderScorePopups(ctx, popups) {
  const color = '#ffcc00';
  for (const p of popups) {
    const alpha = Math.min(1, p.lifetime / 0.4);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 14px Inconsolata, monospace';
    ctx.fillStyle = color;
    ctx.shadowBlur = 6;
    ctx.shadowColor = color;
    ctx.textAlign = 'center';
    ctx.fillText(`+${p.value}`, p.x, p.y);
    ctx.restore();
  }
}
