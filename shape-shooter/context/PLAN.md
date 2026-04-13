# retro-shooter
> Based on: retro-shooter (twin-stick arcade shooter, Asteroids-style movement)

## Game Design

**What we're building:** A canvas-based top-down arcade shooter. The player is a geometric shape (chevron/arrow) that moves freely in all directions with inertia (Asteroids-style). Aiming is decoupled from movement — the ship always rotates to face the mouse cursor. Enemies are geometric shapes that spawn from screen edges in count-based waves. Clearing all enemies in a wave ends it; a 3-second countdown precedes the next wave. Visual style: glowing geometric shapes on a dark background, colorful particle bursts on defeat (no gore, no explosions — light-show aesthetic).

**Players:** 1 player only.

**Modes / variants:** Single mode. One life. Game ends on any enemy contact or being hit by an enemy bullet.

**Win / draw conditions:**
- No win condition — survive as many waves as possible.
- Game over when the player is hit (contact with any enemy or enemy bullet).
- High score is the highest wave number + score reached before dying, persisted to localStorage.

**Controls:**
- WASD or arrow keys: apply thrust in the pressed direction (not relative to ship facing — cardinal directions)
- Mouse cursor: ship rotates to always face cursor
- Left click or Z: fire main weapon
- Right click or X: fire big weapon (if ammo > 0)
- ESC: pause / help modal

**Movement physics:**
- Player has velocity (vx, vy). Key presses add acceleration in the key direction.
- Drag/friction applied each frame: `vx *= 0.97`, `vy *= 0.97`
- Max speed capped at 400px/s
- Player wraps around screen edges (toroidal)
- Enemies also wrap around screen edges

**Weapons:**
- Main weapon: unlimited ammo, fast projectile (600px/s), low damage (1 hp). Fire rate limited to 1 shot per 150ms. Projectile is a thin glowing line/dash.
- Big weapon: limited ammo (starts at 3, max 5). Slow projectile (180px/s — slow enough to require leading a moving target). High damage (kills most enemies in 1 hit; Tank requires 2). Projectile is a large glowing orb. Ammo recharges at 1 per 8 seconds (passive). Picked up via Big Ammo power-up (+3, capped at 5).

**Screen wrapping:** Player, enemies, and all projectiles wrap around all 4 edges. Projectiles despawn after 4 seconds regardless.

**Wave structure:**
- Wave is active until all enemies on screen are dead (including Splitter children).
- On wave clear: flash "Wave X Complete!" message, 3-second countdown, then spawn next wave.
- Enemy count per wave scales: starts at 5–8 enemies, adds ~2 per wave, capped at 30.
- All enemy speeds multiply by `1 + (wave * 0.03)` — 3% faster per wave.

**Enemy spawning within a wave:**
- Enemies do not all appear at once. They trickle in from screen edges using a spawn queue.
- Base spawn interval starts at 2.5s for wave 1, shrinks by 0.05s per wave, floors at 0.6s.
- Each interval is jittered: actual delay = `baseInterval * random(0.5, 1.8)`. This produces natural bursts and lulls — sometimes 3 enemies arrive in quick succession, then a longer gap before the next.
- The jitter range itself narrows slightly each wave (floor approaches 0.7 of base), so later waves feel more relentless with fewer breathing gaps.
- All enemies in the queue must be spawned and killed before the wave can complete — the queue drains as enemies are spawned, the wave ends only when queue is empty AND no enemies remain on screen.

**Enemy introduction schedule:**
| Waves | New type introduced | Mix |
|-------|--------------------|----|
| 1-3 | Drifters only | 100% Drifters |
| 4-6 | Chasers | 60% Drifters, 40% Chasers |
| 7-9 | Shooters | 40% Drifters, 30% Chasers, 30% Shooters |
| 10-12 | Swarmers | Mix + Swarmer clusters (5–10 per cluster, count as 1 spawn slot) |
| 13-15 | Splitters | Replace some Drifters with Splitters |
| 16-18 | Dashers | Add Dashers to mix |
| 19-21 | Tanks | Add 1–2 Tanks per wave (high HP) |
| 22+ | All types, spawn rate and speed scale every 3 waves |

**Power-up drops:**
- Each enemy has a 15% drop chance on death (Tanks: 30%). Swarmers never drop.
- Power-ups also spawn on a timed basis: one random power-up every 20 seconds during active wave.
- Power-ups expire after 10 seconds if not collected (fade out).

| Power-up | Shape | Effect | Duration |
|----------|-------|--------|----------|
| Rapid Fire | Lightning bolt | Main weapon fires 2x faster (75ms cooldown) | 10s |
| Spread Shot | Fan shape | Main fires 3 bullets in a 30-degree cone | 10s |
| Big Ammo | Orb with '+' | +3 big weapon ammo (capped at 5) | Instant |
| Speed Boost | Arrow up | Player max speed 2x, drag reduced | 8s |
| Nuke | Star burst | Instantly destroys all enemies on screen. Each destroyed enemy still drops score but no particles (replaced by one large screen flash). | Instant |

**UI flow:**
1. Home screen: title, high score display, Start button, Help button, Donate button, theme toggle
2. On Start: canvas fills screen, HUD overlays (score, wave, big ammo, active power-ups, FPS optional)
3. On game over: overlay shows "Game Over", final score, wave reached, high score (updates if beaten), Play Again button, Home button
4. Help modal: accessible from home and during play (pauses game), explains controls and all enemy/power-up types

**Edge cases:**
- Splitter children must not re-trigger split logic (use `isChild: true` flag, children are plain Drifters)
- Splitter killed by big weapon: still splits. Killed by Nuke: no split (instant clear).
- Big weapon projectile hitting multiple enemies: damages each it passes through (piercing). Despawns after 2 seconds or after hitting a Tank twice.
- Wave countdown should not start until ALL enemies are gone, including Splitter children spawned mid-cleanup.
- Power-up spawned on top of another: allowed, they stack visually.
- Multiple power-ups of same type active: reset timer to full duration (no stacking of effect).
- Player is invincible for 1.5 seconds after wave start (grace period so enemies can't spawn on top of them).
- Nuke while no enemies present: does nothing (no wasted pickup).
- Big ammo recharge timer pauses during wave countdown (between waves).

---

## Data Model

**Game state shape:**
```javascript
{
  screen: 'home' | 'playing' | 'gameover',
  wave: number,                          // current wave number
  score: number,
  highScore: number,                     // from localStorage
  waveState: 'active' | 'cleared' | 'countdown',
  waveCountdown: number,                 // seconds remaining (counts down from 3)
  spawnQueue: string[],                  // remaining enemy types to spawn this wave
  spawnTimer: number,                    // seconds until next spawn
  theme: 'dark' | 'light',
  paused: boolean,
}
```

**Player shape:**
```javascript
{
  x: number, y: number,
  vx: number, vy: number,               // velocity px/s
  angle: number,                        // radians, toward mouse cursor
  bigAmmo: number,                      // 0–5
  bigAmmoRechargeTimer: number,         // seconds; resets to 0 when ammo added
  mainFireCooldown: number,             // ms remaining until next shot
  activePowerups: [{ type, timeLeft }],
  invincibleTimer: number,              // seconds of grace period
}
```

**Enemy shape (all types share base, extend with type-specific fields):**
```javascript
{
  id: string,                           // unique, used for collision dedup
  type: 'drifter'|'chaser'|'shooter'|'swarmer'|'tank'|'splitter'|'dasher',
  x: number, y: number,
  vx: number, vy: number,
  angle: number,
  hp: number, maxHp: number,
  size: number,
  scoreValue: number,
  shape: 'triangle'|'arrow'|'diamond'|'circle'|'hexagon'|'star'|'elongated-triangle',
  color: string,                        // hsl string, assigned per wave for visual variety
  // type-specific:
  isChild: boolean,                     // true for Splitter children (won't split again)
  dashState: 'idle'|'charging'|'dashing'|'cooldown',  // Dasher only
  dashTimer: number,
  dashTarget: { x, y },
  shootTimer: number,                   // Shooter and Tank only
  shootCooldown: number,
}
```

**Projectile shapes:**
```javascript
// Main bullet
{ x, y, vx, vy, lifetime: number, ownerId: 'player' }

// Big bullet
{ x, y, vx, vy, lifetime: number, hitCount: number }  // despawns at hitCount >= 2 (Tank) or lifetime >= 2s

// Enemy bullet
{ x, y, vx, vy, lifetime: number }
```

**Power-up shape:**
```javascript
{ type: 'rapidfire'|'spread'|'bigammo'|'speed'|'nuke', x, y, lifetime: number }
```

**Particle shape:**
```javascript
{ x, y, vx, vy, color, size, lifetime, maxLifetime }
```

**State flags:**
- `waveState` — controls whether enemy updates run ('cleared'/'countdown' freezes enemy AI, still renders them disappearing)
- `paused` — halts all updates, renders pause overlay
- `player.invincibleTimer` — player cannot take damage while > 0
- `enemy.isChild` — prevents re-split on Splitter children

**Turn structure:** Not turn-based. Game loop runs at 60fps target using `requestAnimationFrame`. Delta time (`dt` in seconds) passed to all update functions.

**Move validation approach:** No invalid move concept. Collision detection handles outcomes. Player-enemy collision: player dies unless invincible. Player bullet-enemy: apply damage. Enemy bullet-player: player dies unless invincible.

**Invalid move handling:** N/A

---

## Help & Strategy Guide

**Objective:** Survive as many waves as possible. Clear all enemies in each wave to advance. There is no final wave — difficulty increases without limit.

**Rules summary:**
- You have one life. Any hit ends the game.
- Main weapon is unlimited but weak. Big weapon is powerful but limited (max 5 ammo, recharges slowly).
- Clear all enemies in a wave to trigger the next one (3-second break between waves).
- Power-ups drop from enemies or spawn over time — collect them by touching.

**Enemy guide:**
- **Drifter (triangle):** Floats in one direction. Predictable. Easy to dodge and shoot.
- **Chaser (arrow):** Homes in on you. Will follow through screen wrap. Kill quickly or keep moving.
- **Shooter (diamond):** Slow but fires at your current position. Strafe sideways after shooting to dodge.
- **Swarmer (circle):** Tiny, fast, one-hit. Come in clusters of 5–10. Spread shot is ideal. Big weapon can clear a cluster.
- **Splitter (star):** Splits into 2 Drifters when killed. Expect a second cleanup. Don't use Nuke on them — waste of power-up.
- **Dasher (elongated triangle):** Pauses, then charges. Watch for the charge-up visual cue and sidestep.
- **Tank (hexagon):** Slow, very tough, fires spread shots. Requires 2 big weapon hits. Circle-strafe and use main weapon on health.

**Key strategies:**
- Keep moving — a stationary target is easy to hit.
- Big weapon requires leading: aim where the enemy will be, not where it is. Effective on Chasers (they move toward you predictably).
- Save Nuke for overwhelming Swarmer waves (waves 10–12) or when cornered.
- Speed Boost + Spread Shot together is the strongest combo — use it to clear dense waves fast.
- Don't over-rotate — your ship always faces the mouse. If enemies are behind you, strafe sideways rather than spinning.
- Big ammo recharges passively — don't save it too conservatively in early waves.

**Common mistakes:**
- Shooting in the direction you're moving and missing enemies behind you (aim at cursor, not at velocity).
- Forgetting Splitters will spawn children — kill them with main weapon first (save big weapon for Tanks).
- Walking into a power-up you don't need and wasting it before a better one spawns.
- Panic-firing main weapon during Swarmer clusters — use Spread Shot or big weapon instead.

**Tips for beginners:**
- In waves 1–3: use them to get comfortable with inertia. Practice stopping and reversing direction.
- The 3-second wave break is the only safe moment to reposition. Use it.
- Watch the big ammo counter (top HUD). Fire big weapon more freely when at 4–5 ammo (will recharge).
- Enemy bullets move in straight lines — juke left/right once you see a Shooter fire.

---

## Game Logic
- [x] `initGame()` — reset all state, set wave to 1, place player at canvas center, spawn wave 1 enemies
- [x] `gameLoop(timestamp)` — compute dt from last timestamp, call update(dt) then render(), schedule next frame
- [x] `update(dt)`:
  - [x] Skip all updates if `paused === true`
  - [x] `updatePlayer(dt)` — apply thrust from held keys, apply drag, clamp to max speed, wrap position, rotate toward mouse, tick invincibleTimer, tick bigAmmoRechargeTimer, tick mainFireCooldown, tick activePowerup timers (remove expired)
  - [x] `updateEnemies(dt)` — skip if waveState !== 'active'; call per-type update function for each enemy; wrap positions
  - [x] `updateBullets(dt)` — move all projectiles, wrap positions, tick lifetime, remove dead
  - [x] `updatePowerups(dt)` — tick lifetime, remove expired, check player proximity for collection (radius 20px)
  - [x] `updateParticles(dt)` — move particles, tick lifetime, remove dead
  - [x] `updateWaveCountdown(dt)` — if waveState === 'countdown': decrement waveCountdown by dt; when <= 0 call `startNextWave()`
  - [x] `checkCollisions()` — run only if waveState === 'active':
    - player bullets vs enemies: for each bullet, check each enemy (circle collision using size); apply damage; on hp <= 0 call `killEnemy(enemy, 'main')`
    - big bullet vs enemies: same, apply big damage; track hitCount; if Tank hitCount >= 2 despawn bullet
    - enemy bullets vs player: if invincibleTimer <= 0 and collision → call `triggerGameOver()`
    - enemies vs player: if invincibleTimer <= 0 and collision → call `triggerGameOver()`
    - player vs powerups: on collection call `applyPowerup(type)`
  - [x] `killEnemy(enemy, source)` — add score, spawn particles (burstParticles at position), maybe dropPowerup, if type === 'splitter' and !isChild and source !== 'nuke': spawn 2 Drifters with isChild:true at same position, remove enemy from array
  - [x] `updateSpawnQueue(dt)` — if waveState === 'active' and spawnQueue.length > 0: decrement spawnTimer by dt; when <= 0: pop next type from queue, call `spawnEnemy()` at random edge position, set spawnTimer = baseInterval * random(0.5, 1.8) where baseInterval = max(0.6, 2.5 - wave * 0.05)
  - [x] `checkWaveCompletion()` — if waveState === 'active' and spawnQueue.length === 0 and enemies.length === 0: set waveState = 'cleared', show "Wave X Complete!", start countdown timer (waveCountdown = 3)
- [x] **Per-enemy AI update functions:**
  - [x] `updateDrifter(enemy, dt)` — move by vx/vy (constant, set on spawn), no behavior change
  - [x] `updateChaser(enemy, dt)` — each frame compute angle toward player (accounting for screen wrap shortest path), rotate toward it at turnRate, accelerate forward up to max speed
  - [x] `updateShooter(enemy, dt)` — move slowly, tick shootTimer; when shootTimer <= 0: fire EnemyBullet toward player's current position, reset shootTimer to shootCooldown (2.5s base)
  - [x] `updateSwarmer(enemy, dt)` — same as Drifter but faster, slight random drift added each frame
  - [x] `updateTank(enemy, dt)` — move slowly, tick shootTimer; when <= 0: fire 3 EnemyBullets in a 45-degree spread centered on player, reset timer (4s base)
  - [x] `updateSplitter(enemy, dt)` — same as Drifter
  - [x] `updateDasher(enemy, dt)`:
    - idle: decrement dashTimer; at 0 set dashState = 'charging', set dashTimer = 0.6, set dashTarget = player position snapshot
    - charging: enemy pulses visually (handled in render); at dashTimer <= 0 set dashState = 'dashing', compute velocity toward dashTarget at 600px/s
    - dashing: move at dash velocity; if within 5px of dashTarget or 1.2s elapsed: set dashState = 'cooldown', dashTimer = 1.5s, velocity = 0
    - cooldown: stationary; at dashTimer <= 0 set dashState = 'idle', dashTimer = random 1–3s
- [x] `startNextWave()` — increment wave, build spawn queue by calling `getWaveComposition(wave)` (returns shuffled array of enemy type strings), set spawnTimer to first jittered interval, set waveState = 'active', reset player.invincibleTimer = 1.5
- [x] `getWaveComposition(wave)` — returns array of enemy type strings based on wave introduction schedule; uses weighted random selection
- [x] `spawnEnemy(type, x, y, wave)` — create enemy object with base stats scaled by wave speed multiplier, assign shape/color/scoreValue for type
- [x] `burstParticles(x, y, color, count)` — create `count` particles with random velocities, enemy color, lifetime 0.4–0.8s
- [x] `dropPowerup(x, y, enemyType)` — roll drop chance (15%, Tank 30%); pick random power-up type weighted toward Big Ammo for later waves; spawn Powerup object
- [x] `applyPowerup(type)` — Nuke: call `killEnemy` on all with source='nuke'; BigAmmo: player.bigAmmo = min(5, bigAmmo+3); others: check if same type active (reset timer) else push to activePowerups
- [x] `triggerGameOver()` — set screen = 'gameover', stop loop, update highScore in localStorage if score > highScore
- [x] `fireMainWeapon()` — if mainFireCooldown <= 0: create 1 (or 3 if Spread Shot active) MainBullet(s) from player position at player.angle (±15deg for spread), reset cooldown
- [x] `fireBigWeapon()` — if bigAmmo > 0: create BigBullet from player position toward mouse, decrement bigAmmo, reset bigAmmoRechargeTimer to 0
- [x] `handleInput()` — track keydown/keyup for WASD/arrows; track mouseMove for cursor position (convert to canvas coords); track mousedown left/right and keydown Z/X for firing

---

## UI & Rendering

- [x] **Home screen** (DOM overlay over canvas, canvas shows animated background with drifting shapes):
  - Title "Retro Shooter"
  - High score display: "Best: Wave 12 — 4,800 pts" (or "No score yet")
  - Start button
  - Help button (opens Help modal)
  - Donate button (links to freeCodeCamp donate page)
  - Theme toggle (sun/moon icon, top-right corner)
- [x] **Canvas render pipeline** (called every frame):
  - Clear canvas with background color
  - `renderStarfield()` — static dots for background depth (generated once, reused)
  - `renderPowerups()` — draw each power-up shape + pulsing glow ring, fade out last 3s
  - `renderEnemies()` — draw each enemy by shape; Dasher pulses during 'charging' state (scale oscillates); health bar above enemies with hp < maxHp
  - `renderPlayer()` — draw chevron at (x, y) rotated to angle; flicker (alpha toggle) while invincibleTimer > 0
  - `renderBullets()` — main bullets: short glowing lines; big bullet: large glowing circle with trail
  - `renderEnemyBullets()` — small glowing dots
  - `renderParticles()` — draw each particle as a small circle, alpha fades with lifetime
  - `renderHUD()` — score (top-left), wave number (top-center), big ammo pips (top-right), active power-up icons + timers (bottom-left)
- [x] **Wave complete banner** — centered canvas text "Wave X Complete!" fades in/out over 1.5s, shows wave countdown "Next wave in 3...2...1"
- [x] **Game over overlay** (DOM overlay):
  - "Game Over"
  - "Wave reached: X" and "Score: Y"
  - "Best: Z" (highlighted if new high score)
  - Play Again button
  - Home button
- [x] **Help modal** (DOM overlay, pauses game if open during play):
  - Controls section: keyboard and mouse diagram
  - Enemy types: shape + name + one-line description
  - Power-ups: icon + name + effect description
  - Close button (or ESC)
- [x] **Pause overlay** — dim canvas, "Paused" text, resume button (or press ESC again)
- [x] **"Are you sure?" modal** — triggered by clicking Home during active game; asks "Quit and lose progress?" with Confirm and Cancel buttons
- [x] **ARIA labels** on all interactive elements: Start, Home, Play Again, Help, Donate, theme toggle, Close (modal); all modals use `role="dialog"` and `aria-modal="true"`

---

## Styling

- [x] `src/global.css` — already provided (CSS variables, body reset)
- [x] `src/style.css`:
  - `#app` fills full viewport, position relative, overflow hidden
  - `#game-canvas` is full viewport (100vw × 100vh)
  - Home screen and game-over overlay: centered flex column, semi-transparent dark panel, uses CSS variables
  - Buttons: use `--color-accent` (yellow) for primary actions, `--color-surface-raised` for secondary
  - Theme toggle: positioned top-right, fixed
  - Help modal: fixed overlay, max-width 600px, scrollable, uses `--color-surface` background
  - HUD elements: positioned absolute on top of canvas, pointer-events none, monospace font
  - Power-up icons in HUD: 24×24 inline SVG or canvas-drawn
  - All transitions use CSS variables (`--transition-fast`, `--transition-default`)
  - Dark theme (default): canvas background `#050510`, shapes glow using `filter: drop-shadow`
  - Light theme: canvas background `#e8ecf0`, shapes use darker colors

---

## File Structure

- `index.html` — loads `src/global.css`, `src/style.css`, `src/index.js`
- `src/index.js` — entry: init DOM, bind screen transitions, load localStorage (theme, highScore), mount home screen, start game on click
- `src/game.js` — `Game` class: canvas setup, game loop, update, render, pause, resume, destroy
- `src/player.js` — `Player` class: state, updatePlayer, renderPlayer, fireMain, fireBig
- `src/enemies.js` — `spawnEnemy(type, x, y, waveSpeedMult)`, per-type update functions, renderEnemy
- `src/waves.js` — `getWaveComposition(wave)` returns enemy type list; `WAVE_ENEMY_STATS` constant table (hp, speed, scoreValue, shootCooldown, size per type)
- `src/weapons.js` — `MainBullet`, `BigBullet`, `EnemyBullet` classes with update + render
- `src/powerups.js` — `Powerup` class with update + render; `applyPowerup(game, type)`
- `src/particles.js` — `Particle` class; `burstParticles(particles, x, y, color, count)`
- `src/ui.js` — `renderHUD(ctx, state)`, `renderWaveBanner(ctx, state)`, DOM functions: `showHome()`, `showGameOver(score, wave, highScore)`, `showHelpModal()`, `hideHelpModal()`
- `src/storage.js` — `loadHighScore()`, `saveHighScore(score)`, `loadTheme()`, `saveTheme(theme)`, `saveGameState(state)`, `loadGameState()`
  - localStorage keys: `retro-shooter-highscore`, `retro-shooter-theme`, `retro-shooter-state`
  - gameState saved: `{ wave, score, waveState }` — player position not saved (wave restarts fresh)
  - No "last selected mode" (single mode game)

---

## Polish
- [x] Screen-edge spawn fade-in: enemies appear with 0.3s alpha fade so they don't pop in
- [x] Wave clear: brief camera shake (canvas translate oscillation, 4 frames)
- [x] Big weapon charge sound cue: visual ring that expands on fire (no audio required, visual only)
- [x] Nuke: full-screen white flash (canvas fillRect alpha 0.8 for 2 frames)
- [x] Enemy health bars: only shown when hp < maxHp, thin colored bar above enemy shape
- [x] Starfield parallax: two layers of dots at different speeds as player moves (subtle)
- [x] Active power-up HUD: colored icon + countdown bar underneath
- [x] Score popup: `+100` text floats up and fades at enemy kill location
- [x] Player trail: last 5 positions stored, rendered as fading dots behind the player
- [x] Responsive canvas: resize handler updates canvas dimensions and re-centers starfield
