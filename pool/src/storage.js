/** @type {(val: string) => void} */
function saveTheme(val) { localStorage.setItem('pool_theme', val); }
/** @type {() => string} */
function loadTheme() { return localStorage.getItem('pool_theme') || 'dark'; }

/** @type {(val: string) => void} */
function saveLastMode(val) { localStorage.setItem('pool_last_mode', val); }
/** @type {() => string} */
function loadLastMode() { return localStorage.getItem('pool_last_mode') || '8ball'; }

/** @type {(val: string) => void} */
function saveLastOpponent(val) { localStorage.setItem('pool_last_opponent', val); }
/** @type {() => string} */
function loadLastOpponent() { return localStorage.getItem('pool_last_opponent') || 'player'; }

/** @type {(val: string) => void} */
function saveLastDifficulty(val) { localStorage.setItem('pool_last_difficulty', val); }
/** @type {() => string} */
function loadLastDifficulty() { return localStorage.getItem('pool_last_difficulty') || 'medium'; }

/** @type {(val: object) => void} */
function saveGameState(val) { localStorage.setItem('pool_game_state', JSON.stringify(val)); }
/** @type {() => object | null} */
function loadGameState() {
  const raw = localStorage.getItem('pool_game_state');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
/** @type {() => void} */
function clearGameState() { localStorage.removeItem('pool_game_state'); }
