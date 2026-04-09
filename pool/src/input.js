let canvasScale = 1;
let mouseSurfaceX = 0;
let mouseSurfaceY = 0;
let isDraggingCue = false;
let dragAnchorX = 0; // canvas coords at drag start
let dragAnchorY = 0;

function initInput(canvas) {
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const rawX = (e.clientX - rect.left) / canvasScale;
    const rawY = (e.clientY - rect.top) / canvasScale;
    mouseSurfaceX = rawX - RAIL_W;
    mouseSurfaceY = rawY - RAIL_W;
    onMouseMove(rawX, rawY);
  });

  canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    const rect = canvas.getBoundingClientRect();
    const rawX = (e.clientX - rect.left) / canvasScale;
    const rawY = (e.clientY - rect.top) / canvasScale;
    onMouseDown(rawX, rawY);
  });

  canvas.addEventListener('mouseup', (e) => {
    if (e.button !== 0) return;
    const rect = canvas.getBoundingClientRect();
    const rawX = (e.clientX - rect.left) / canvasScale;
    const rawY = (e.clientY - rect.top) / canvasScale;
    onMouseUp(rawX, rawY);
  });

  canvas.addEventListener('mouseleave', () => {
    if (isDraggingCue) {
      isDraggingCue = false;
    }
  });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const rawX = (touch.clientX - rect.left) / canvasScale;
    const rawY = (touch.clientY - rect.top) / canvasScale;
    mouseSurfaceX = rawX - RAIL_W;
    mouseSurfaceY = rawY - RAIL_W;
    onMouseMove(rawX, rawY);
  }, { passive: false });

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const rawX = (touch.clientX - rect.left) / canvasScale;
    const rawY = (touch.clientY - rect.top) / canvasScale;
    onMouseDown(rawX, rawY);
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    const rect = canvas.getBoundingClientRect();
    const rawX = (touch.clientX - rect.left) / canvasScale;
    const rawY = (touch.clientY - rect.top) / canvasScale;
    onMouseUp(rawX, rawY);
  }, { passive: false });
}

function onMouseMove(rawX, rawY) {
  if (!state || state.phase === 'gameover') return;
  if (state.shotInProgress) return;
  if (state.players[state.currentPlayer].type === 'computer') return;

  if (state.ballInHand) {
    // Cue ball follows cursor
    return; // Rendering handles the preview
  }

  const cueBall = state.balls[0];
  const cueCx = cueBall.x + RAIL_W;
  const cueCy = cueBall.y + RAIL_W;

  if (isDraggingCue) {
    // Compute power from drag distance
    const dx = rawX - dragAnchorX;
    const dy = rawY - dragAnchorY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    state.cueState.power = Math.min(1, dist / 80);
  } else {
    // Update aim angle
    const dx = rawX - cueCx;
    const dy = rawY - cueCy;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      state.cueState.angle = Math.atan2(dy, dx);
    }
  }
}

function onMouseDown(rawX, rawY) {
  if (!state || state.phase === 'gameover') return;
  if (state.shotInProgress) return;
  if (state.players[state.currentPlayer].type === 'computer') return;

  if (state.ballInHand) {
    // Click to place cue ball
    const sx = rawX - RAIL_W;
    const sy = rawY - RAIL_W;
    if (placeCueBall(sx, sy)) {
      updateHUD();
    }
    return;
  }

  // Start drag for power
  isDraggingCue = true;
  dragAnchorX = rawX;
  dragAnchorY = rawY;
  state.cueState.power = 0;
}

function onMouseUp(rawX, rawY) {
  if (!state || state.phase === 'gameover') return;
  if (state.players[state.currentPlayer].type === 'computer') return;
  if (!isDraggingCue) return;
  isDraggingCue = false;

  if (state.shotInProgress || state.ballInHand) return;

  const power = state.cueState.power;
  if (power < 0.02) return; // Too soft, ignore

  shoot(state.cueState.angle, power, state.cueState.hitX, state.cueState.hitY);
}

function setCanvasScale(scale) {
  canvasScale = scale;
}

function initHitPointDiagram(diagEl) {
  diagEl.addEventListener('mousedown', (e) => {
    e.preventDefault();
    const rect = diagEl.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const radius = rect.width / 2;
    const dx = e.clientX - rect.left - cx;
    const dy = e.clientY - rect.top - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const hitX = Math.max(-1, Math.min(1, dx / radius));
    const hitY = Math.max(-1, Math.min(1, dy / radius));
    if (dist <= radius) {
      state.cueState.hitX = hitX;
      state.cueState.hitY = hitY;
      updateHitPointDot(diagEl, hitX, hitY);
    }
  });

  diagEl.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = diagEl.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const radius = rect.width / 2;
    const dx = touch.clientX - rect.left - cx;
    const dy = touch.clientY - rect.top - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const hitX = Math.max(-1, Math.min(1, dx / radius));
    const hitY = Math.max(-1, Math.min(1, dy / radius));
    if (dist <= radius) {
      state.cueState.hitX = hitX;
      state.cueState.hitY = hitY;
      updateHitPointDot(diagEl, hitX, hitY);
    }
  }, { passive: false });
}

function updateHitPointDot(diagEl, hitX, hitY) {
  const dot = diagEl.querySelector('.hit-dot');
  if (!dot) return;
  const radius = diagEl.offsetWidth / 2;
  dot.style.left = `${50 + hitX * 40}%`;
  dot.style.top = `${50 + hitY * 40}%`;
}
