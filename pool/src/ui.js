const app = document.getElementById('app');
let foulBannerTimeout = null;
let gameLoopId = null;
let canvasEl = null;
let currentScale = 1;

const CANVAS_DISPLAY_W = CANVAS_W;
const CANVAS_DISPLAY_H = CANVAS_H;

function showHome() {
  const mode = loadLastMode();
  const opponent = loadLastOpponent();
  const difficulty = loadLastDifficulty();
  const theme = loadTheme();

  app.innerHTML = `
    <div id="home-screen">
      <div class="home-card">
        <div class="home-header">
          <h1 class="game-title">Pool</h1>
          <button class="theme-toggle" id="theme-toggle" aria-label="Toggle theme">
            ${theme === 'dark' ? '<span>&#9790;</span>' : '<span>&#9728;</span>'}
          </button>
        </div>

        <div class="form-group">
          <label class="form-label">Game Mode</label>
          <div class="pill-group" id="mode-group" role="group" aria-label="Game Mode">
            <button class="pill-btn${mode === '8ball' ? ' active' : ''}" data-value="8ball" tabindex="0">8-Ball</button>
            <button class="pill-btn${mode === '9ball' ? ' active' : ''}" data-value="9ball" tabindex="0">9-Ball</button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Opponent</label>
          <div class="pill-group" id="opponent-group" role="group" aria-label="Opponent">
            <button class="pill-btn${opponent === 'player' ? ' active' : ''}" data-value="player" tabindex="0">vs Player</button>
            <button class="pill-btn${opponent === 'computer' ? ' active' : ''}" data-value="computer" tabindex="0">vs Computer</button>
          </div>
        </div>

        <div class="form-group difficulty-group${opponent === 'computer' ? '' : ' hidden'}" id="difficulty-group">
          <label class="form-label">Difficulty</label>
          <div class="pill-group" id="difficulty-pill-group" role="group" aria-label="Difficulty">
            <button class="pill-btn${difficulty === 'easy' ? ' active' : ''}" data-value="easy" tabindex="0">Easy</button>
            <button class="pill-btn${difficulty === 'medium' ? ' active' : ''}" data-value="medium" tabindex="0">Medium</button>
            <button class="pill-btn${difficulty === 'hard' ? ' active' : ''}" data-value="hard" tabindex="0">Hard</button>
          </div>
        </div>

        <button class="btn-primary" id="start-btn" tabindex="0">Start Game</button>

        <div class="home-actions">
          <button class="btn-secondary" id="help-btn" aria-label="Help">? Help</button>
          <button class="btn-secondary" id="donate-btn" aria-label="Donate">Donate</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('theme-toggle').addEventListener('click', () => {
    const current = loadTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    saveTheme(next);
    applyTheme(next);
    showHome();
  });

  const modeGroup = document.getElementById('mode-group');
  modeGroup.querySelectorAll('.pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      modeGroup.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      saveLastMode(btn.dataset.value);
    });
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
    });
  });

  const opponentGroup = document.getElementById('opponent-group');
  opponentGroup.querySelectorAll('.pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      opponentGroup.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      saveLastOpponent(btn.dataset.value);
      const diffGroup = document.getElementById('difficulty-group');
      diffGroup.classList.toggle('hidden', btn.dataset.value !== 'computer');
    });
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
    });
  });

  const diffGroup = document.getElementById('difficulty-pill-group');
  diffGroup.querySelectorAll('.pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      diffGroup.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      saveLastDifficulty(btn.dataset.value);
    });
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
    });
  });

  document.getElementById('start-btn').addEventListener('click', startGame);
  document.getElementById('start-btn').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') startGame();
  });

  document.getElementById('help-btn').addEventListener('click', showHelpModal);
  document.getElementById('donate-btn').addEventListener('click', () => {
    window.open('https://www.freecodecamp.org/donate', '_blank');
  });
}

function startGame() {
  const mode = loadLastMode();
  const opponent = loadLastOpponent();
  const difficulty = loadLastDifficulty();
  const players = [
    { name: 'Player 1', type: 'human', group: null },
    { name: opponent === 'computer' ? 'Computer' : 'Player 2', type: opponent === 'computer' ? 'computer' : 'human', group: null },
  ];
  clearGameState();
  initGame(mode, players, difficulty);
  showPlay();
}

function showPlay() {
  stopGameLoop();

  app.innerHTML = `
    <div id="play-screen">
      <div class="play-header">
        <div class="hud-player" id="hud-p1">
          <div class="hud-name" id="hud-name-0"></div>
          <div class="hud-tray" id="hud-tray-0"></div>
          <div class="hud-status" id="hud-status-0"></div>
        </div>
        <div class="hud-center">vs</div>
        <div class="hud-player hud-player-right" id="hud-p2">
          <div class="hud-name" id="hud-name-1"></div>
          <div class="hud-tray" id="hud-tray-1"></div>
          <div class="hud-status" id="hud-status-1"></div>
        </div>
        <button class="btn-icon help-btn-play" id="help-btn-play" aria-label="Help">?</button>
      </div>

      <div class="foul-banner" id="foul-banner" role="alert" aria-live="assertive" style="display:none">FOUL -- Ball in Hand</div>

      <div class="canvas-area">
        <div class="canvas-wrapper" id="canvas-wrapper">
          <canvas id="pool-canvas" width="${CANVAS_W}" height="${CANVAS_H}" aria-label="Pool table" role="img"></canvas>
          <div class="game-over-overlay" id="game-over-overlay" style="display:none">
            <div class="game-over-card">
              <div class="game-over-title" id="game-over-title"></div>
              <button class="btn-primary" id="play-again-btn">Play Again</button>
              <button class="btn-secondary" id="back-home-btn">Back to Home</button>
            </div>
          </div>
        </div>

        <div class="side-controls">
          <div class="power-bar-container" id="power-bar-container">
            <div class="power-bar-label">Power</div>
            <div class="power-bar-track">
              <div class="power-fill" id="power-fill"></div>
            </div>
          </div>
          <div class="hit-point-container">
            <div class="hit-point-label">Spin</div>
            <div class="hit-point-diagram" id="hit-point-diagram">
              <div class="hit-crosshair-h"></div>
              <div class="hit-crosshair-v"></div>
              <div class="hit-dot" id="hit-dot"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  canvasEl = document.getElementById('pool-canvas');
  initInput(canvasEl);

  const diagEl = document.getElementById('hit-point-diagram');
  initHitPointDiagram(diagEl);

  document.getElementById('help-btn-play').addEventListener('click', showHelpModal);

  updateCanvasScale();
  window.addEventListener('resize', updateCanvasScale);

  updateHUD();
  startGameLoop();

  // If current player is computer, trigger AI
  if (state.players[state.currentPlayer].type === 'computer') {
    triggerAIShot();
  }
}

function updateCanvasScale() {
  const wrapper = document.getElementById('canvas-wrapper');
  if (!wrapper) return;
  const vw = window.innerWidth - 80; // account for side controls
  const vh = window.innerHeight - 120; // account for HUD
  const scaleX = vw / CANVAS_DISPLAY_W;
  const scaleY = vh / CANVAS_DISPLAY_H;
  currentScale = Math.min(scaleX, scaleY, 1);
  wrapper.style.transform = `scale(${currentScale})`;
  wrapper.style.transformOrigin = 'top left';
  wrapper.style.width = `${CANVAS_DISPLAY_W}px`;
  wrapper.style.height = `${CANVAS_DISPLAY_H}px`;
  const outer = wrapper.parentElement;
  if (outer) {
    outer.style.width = `${CANVAS_DISPLAY_W * currentScale}px`;
    outer.style.height = `${CANVAS_DISPLAY_H * currentScale}px`;
  }
  setCanvasScale(currentScale);
}

function startGameLoop() {
  function loop() {
    if (!state) return;
    if (state.shotInProgress) {
      stepPhysics();
    }
    updatePowerBar();
    updateHUD();

    if (state._foulJustOccurred) {
      state._foulJustOccurred = false;
      showFoulBanner();
    }

    if (state.phase === 'gameover') {
      renderFrame(canvasEl, mouseSurfaceX, mouseSurfaceY);
      showGameOver();
      return;
    }

    if (state.illegalBreak) {
      state.illegalBreak = false;
      showIllegalBreakModal();
    }

    if (state.pushOutPending) {
      state.pushOutPending = false;
      showPushOutModal();
    }

    renderFrame(canvasEl, mouseSurfaceX, mouseSurfaceY);
    gameLoopId = requestAnimationFrame(loop);
  }
  gameLoopId = requestAnimationFrame(loop);
}

function stopGameLoop() {
  if (gameLoopId !== null) {
    cancelAnimationFrame(gameLoopId);
    gameLoopId = null;
  }
  window.removeEventListener('resize', updateCanvasScale);
}

function updateHUD() {
  if (!state) return;
  for (let i = 0; i < 2; i++) {
    const nameEl = document.getElementById(`hud-name-${i}`);
    const trayEl = document.getElementById(`hud-tray-${i}`);
    const statusEl = document.getElementById(`hud-status-${i}`);
    const playerEl = document.getElementById(`hud-p${i + 1}`);
    if (!nameEl) continue;

    const player = state.players[i];
    nameEl.textContent = player.name;

    // Active player highlight
    if (playerEl) {
      playerEl.classList.toggle('active-player', state.currentPlayer === i);
    }

    // Pocketed balls
    if (trayEl) {
      const pocketed = state.balls.filter(b => b.pocketed && b.id !== 0 && (
        player.group === null ? false :
        b.group === player.group || (player.group === 'solid' && b.id <= 7) || (player.group === 'stripe' && b.id >= 9 && b.id <= 15)
      ));
      const display = state.mode === '8ball'
        ? state.balls.filter(b => b.pocketed && b.id !== 0 && b.id !== 8 && (player.group ? b.group === player.group : false))
        : state.balls.filter(b => b.pocketed && b.id !== 0 && b.id !== 9 && b.id <= 9);
      trayEl.innerHTML = display.map(b => `<span class="tray-ball tray-ball-${b.group}" style="background:${getTrayColor(b)}"></span>`).join('');
    }

    // Status text
    if (statusEl) {
      if (state.currentPlayer === i) {
        if (player.type === 'computer' && state.shotInProgress) {
          statusEl.textContent = 'Computer thinking...';
        } else if (state.ballInHand) {
          statusEl.textContent = 'Ball in hand - place cue ball';
        } else if (state.pushOutPending) {
          statusEl.textContent = 'Push-out decision...';
        } else {
          statusEl.textContent = 'Your turn';
        }
      } else {
        statusEl.textContent = '';
      }
    }
  }
}

function getTrayColor(ball) {
  const colors = {
    1: '#f5e642', 2: '#3355dd', 3: '#cc2200', 4: '#660099',
    5: '#ff8800', 6: '#007722', 7: '#880022',
    9: '#f5e642', 10: '#3355dd', 11: '#cc2200', 12: '#660099',
    13: '#ff8800', 14: '#007722', 15: '#880022',
  };
  return colors[ball.id] || '#888';
}

function updatePowerBar() {
  const fill = document.getElementById('power-fill');
  if (!fill || !state) return;
  const pct = (state.cueState.power || 0) * 100;
  fill.style.height = `${pct}%`;
  fill.classList.toggle('power-high', pct > 85);
}

function showGameOver() {
  const overlay = document.getElementById('game-over-overlay');
  const title = document.getElementById('game-over-title');
  if (!overlay || !title) return;
  const winner = state.players[state.winner];
  title.textContent = `${winner.name} wins!`;
  overlay.style.display = 'flex';
  overlay.classList.add('fade-in');

  document.getElementById('play-again-btn').onclick = () => {
    const mode = state.mode;
    const players = state.players.map(p => ({ ...p, group: null }));
    const aiDifficulty = state.aiDifficulty;
    clearGameState();
    initGame(mode, players, aiDifficulty);
    showPlay();
  };
  document.getElementById('back-home-btn').onclick = () => {
    stopGameLoop();
    clearGameState();
    showHome();
  };
}

function showFoulBanner() {
  const banner = document.getElementById('foul-banner');
  if (!banner) return;
  banner.style.display = 'block';
  banner.classList.remove('slide-down');
  void banner.offsetWidth; // reflow
  banner.classList.add('slide-down');
  if (foulBannerTimeout) clearTimeout(foulBannerTimeout);
  foulBannerTimeout = setTimeout(() => {
    banner.style.display = 'none';
    banner.classList.remove('slide-down');
  }, 2000);
}

function showPushOutModal() {
  const breaker = state.players[1 - state.currentPlayer];
  showConfirmModal(
    `${breaker.name} played a push-out. Accept position or make them shoot again?`,
    () => resolvePushOut(true),
    () => resolvePushOut(false),
    'Accept Position',
    'Make Them Shoot Again'
  );
}

function showIllegalBreakModal() {
  const breaker = state.players[state.currentPlayer === 0 ? 1 : 0];
  showConfirmModal(
    `${breaker.name} did not drive 4 balls to a rail. Re-rack and break again, or accept the table?`,
    () => resolveIllegalBreak(true),
    () => resolveIllegalBreak(false),
    'Re-rack',
    'Accept Table'
  );
}

function showHelpModal() {
  const existing = document.getElementById('help-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'help-modal';
  modal.className = 'modal-overlay';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Help');
  modal.innerHTML = `
    <div class="modal-card help-modal-card">
      <h2 class="modal-title">Help</h2>
      <div class="help-tabs">
        <button class="help-tab active" data-tab="controls">Controls</button>
        <button class="help-tab" data-tab="8ball">8-Ball</button>
        <button class="help-tab" data-tab="9ball">9-Ball</button>
        <button class="help-tab" data-tab="tips">Tips</button>
      </div>
      <div class="help-content" id="help-content">
        ${helpTabContent('controls')}
      </div>
      <button class="btn-primary modal-close" id="help-close">Close</button>
    </div>
  `;
  app.appendChild(modal);

  modal.querySelectorAll('.help-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      modal.querySelectorAll('.help-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('help-content').innerHTML = helpTabContent(tab.dataset.tab);
    });
  });

  document.getElementById('help-close').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  document.addEventListener('keydown', function escClose(e) {
    if (e.key === 'Escape') { modal.remove(); document.removeEventListener('keydown', escClose); }
  });

  trapFocus(modal);
}

function helpTabContent(tab) {
  const content = {
    controls: `
      <p><strong>Aim:</strong> Move mouse around the cue ball to set angle.</p>
      <p><strong>Power:</strong> Click and drag away from the cue ball, then release to shoot. The further you drag, the more power.</p>
      <p><strong>Spin:</strong> Click the spin diagram (bottom right) to set where the cue hits the ball. Center = no spin. Top = follow. Bottom = draw/backspin. Left/Right = english.</p>
      <p><strong>Ball in hand:</strong> After a foul, move the cursor to place the cue ball, then click to confirm.</p>
    `,
    '8ball': `
      <p><strong>Objective:</strong> Pocket all your group (solids 1-7 or stripes 9-15), then legally pocket the 8-ball.</p>
      <p><strong>Break:</strong> Must pocket a ball or drive 4+ balls to a rail. Table is open until first legal pocket after break.</p>
      <p><strong>Fouls:</strong> Wrong ball first, no rail after contact, cue ball in pocket = ball-in-hand for opponent.</p>
      <p><strong>8-ball loss:</strong> Pocketing the 8 before clearing your group is an instant loss.</p>
    `,
    '9ball': `
      <p><strong>Objective:</strong> Pocket the 9-ball on any legal shot to win.</p>
      <p><strong>Contact rule:</strong> Must contact the lowest-numbered ball first on every shot.</p>
      <p><strong>Push-out:</strong> After the break, the breaker may declare a push-out. No foul penalty; opponent chooses to shoot or pass it back.</p>
      <p><strong>Fouls:</strong> Wrong ball first, no rail/pocket after contact, scratch = ball-in-hand. If 9 is pocketed on a foul shot, it gets spotted.</p>
    `,
    tips: `
      <p>Plan 2-3 shots ahead. Think about where the cue ball ends up, not just which ball you pocket.</p>
      <p>Keep the cue ball near the center of the table for maximum shot options.</p>
      <p>Use backspin (draw) on straight-in shots to stop the cue ball in place.</p>
      <p>Break clusters early - leaving them means fewer options when you need them.</p>
      <p>In 9-ball, look for a 9-ball combo on every shot, even early in the rack.</p>
      <p>When behind, play safe: contact your required ball and leave the cue ball tight to a rail.</p>
      <p>Most pockets need 40-70% power. Full power is rarely the right choice.</p>
    `,
  };
  return content[tab] || '';
}

function showConfirmModal(message, onConfirm, onCancel, confirmLabel, cancelLabel) {
  const existing = document.getElementById('confirm-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'confirm-modal';
  modal.className = 'modal-overlay';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.innerHTML = `
    <div class="modal-card">
      <p class="modal-message">${message}</p>
      <div class="modal-actions">
        <button class="btn-primary" id="confirm-yes">${confirmLabel || 'Yes'}</button>
        <button class="btn-secondary" id="confirm-no">${cancelLabel || 'Cancel'}</button>
      </div>
    </div>
  `;
  app.appendChild(modal);

  document.getElementById('confirm-yes').addEventListener('click', () => {
    modal.remove();
    if (onConfirm) onConfirm();
  });
  document.getElementById('confirm-no').addEventListener('click', () => {
    modal.remove();
    if (onCancel) onCancel();
  });

  document.addEventListener('keydown', function escClose(e) {
    if (e.key === 'Escape') { modal.remove(); document.removeEventListener('keydown', escClose); if (onCancel) onCancel(); }
  });

  trapFocus(modal);
}

function trapFocus(el) {
  const focusable = el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (first) first.focus();
  el.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
}

function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.add('light-theme');
  } else {
    document.body.classList.remove('light-theme');
  }
}
