const HIGH_SCORE_KEY = 'shape-shooter-highscore';
const STATE_KEY = 'shape-shooter-state';

export function loadHighScore() {
  const val = localStorage.getItem(HIGH_SCORE_KEY);
  if (!val) return null;
  try { return JSON.parse(val); } catch { return null; }
}

export function saveHighScore(score) {
  localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(score));
}


export function saveGameState(state) {
  const data = { wave: state.wave, score: state.score, waveState: state.waveState };
  localStorage.setItem(STATE_KEY, JSON.stringify(data));
}

export function loadGameState() {
  const val = localStorage.getItem(STATE_KEY);
  if (!val) return null;
  try { return JSON.parse(val); } catch { return null; }
}
