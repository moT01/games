# pool
> Based on: pool (8-ball and 9-ball billiards)

## Game Design

**What we're building:** A top-down 2D billiards game with realistic physics, supporting 8-ball and 9-ball modes. Player vs Player (hot-seat) and Player vs Computer with three AI difficulty levels. Canvas-based rendering with a full cue stick aiming system, hit-point spin control, and ghost-ball preview. Canvas scales responsively to fit any viewport.

**Rules:**

_8-Ball:_
- 15 object balls: 1-7 (solids), 9-15 (stripes), 8-ball
- Break from behind the head string; must pocket a ball or drive 4+ balls to a rail, or opponent re-racks
- Table is "open" until the first ball is legally pocketed after the break — that determines group assignment
- On a legal break, if 8 is pocketed: shooter wins; if cue ball is pocketed on break: opponent gets ball-in-hand
- Each turn: must hit your group ball first (or any non-8 on an open table); after contact, at least one ball must be pocketed or hit a rail (or it's a foul)
- Win: pocket all your group, then legally pocket the 8-ball
- Lose: pocket the 8 before clearing your group; scratch while pocketing the 8; pocket the 8 on a non-winning shot

_9-Ball:_
- 9 balls (1-9), diamond rack, ball 1 at apex (foot spot), ball 9 in center
- Must contact the lowest-numbered ball on the table first each shot; any ball can be pocketed legally on a valid hit
- Win: pocket the 9-ball on any legal shot (can be on the break, or via combo)
- Push-out: after the break only, current player may declare a "push out" before shooting — they shoot without foul penalty, but the opponent may choose to shoot next or pass it back
- Foul: cue ball pocketed; lowest ball not contacted first; no ball reaches a rail or pocket after contact

**Players:** 2 (Player vs Player hot-seat, or Player vs Computer)

**Modes / variants:**
- `8ball` — standard 8-ball (BCA rules, ball-in-hand anywhere after fouls)
- `9ball` — standard 9-ball (with push-out rule after break)

**Win / draw conditions:**
- 8-ball: first to legally pocket the 8 after clearing their group wins
- 9-ball: first to legally pocket the 9 wins; no draws possible in either mode

**Special rules / one-off mechanics:**
- Ball-in-hand: after any foul, opponent may place the cue ball anywhere on the table before shooting
- 8-ball open table: until a ball is legally pocketed post-break, either player may hit any non-8 ball; the first ball pocketed (not via foul) assigns that ball's group to the shooter
- 9-ball push-out: declared before the shot by the breaker on the very next shot after the break; no rail/pocket requirement applies; opponent then chooses to accept position or make breaker shoot again
- Continuous turn: if a player legally pockets one or more correct-group balls (8-ball) or any ball on a valid hit (9-ball), they continue shooting
- 8-ball break pocket-win: pocketing the 8 on the break is an immediate win
- No shot calling: players are not required to call which ball or pocket; any legal pocket counts

**Captured / out-of-play pieces:** Pocketed balls are removed from the table and tracked in each ball's `pocketed` flag. In 9-ball, pocketed non-9 balls are simply gone. In 8-ball they count toward group clearing. The cue ball when pocketed re-enters play during ball-in-hand.

**UI flow:**
1. Home screen: mode select (8-ball / 9-ball), opponent select (vs Player / vs Computer + difficulty), Start, Help, Donate, theme toggle
2. Play screen: canvas (table + balls + cue), player HUD strip, pocketed ball tray, shot power bar, cue ball hit-point diagram, Help button
3. Ball-in-hand state: cue ball follows cursor, red when overlapping another ball, click to confirm placement
4. Push-out prompt (9-ball): modal asking opponent to accept position or make breaker shoot again
5. Illegal break modal: offer to re-rack or accept table
6. Game over: winner name, play again, back to home

**Edge cases:**
- Break: fewer than 4 balls reach a rail and none are pocketed = illegal break; opponent chooses re-rack or accept table
- 8-ball: if the 8 and a group ball are pocketed on the same shot (8 pocketed illegally before group is cleared) = loss
- 9-ball: 9 pocketed simultaneously with a foul = 9 spotted to foot spot, foul stands, ball-in-hand
- Cue ball and object ball simultaneously pocketed = both events resolved; cue ball pocket = foul; object ball pocket counted only if no foul on that contact
- Ball lands exactly on pocket edge = pocketed if ball center is within pocket radius
- All balls stop with cue ball in pocket = ball-in-hand before next shot
- Fast collisions in cluster break = sub-step physics prevents tunneling
- Ball exits table bounds (engine bug guard) = spot at foot spot

---

## Data Model

**Board / grid:** Canvas 2D table. Playing surface: 900x450px. Rails add ~50px on each side, giving total canvas size 1000x550px. Coordinate origin (0,0) is top-left of playing surface (not canvas). 6 pockets: TL, TR, ML, MR, BL, BR. Corner pocket radius: 22px. Middle pocket radius: 20px. Head string at x=225 (1/4 from left). Foot spot at (675, 225) (3/4 from left, vertical center).

**Piece / token types:**
```
Ball {
  id: number,           // 0 = cue ball, 1-15 = object balls
  x: number,            // position on playing surface
  y: number,
  vx: number,           // velocity x (px/frame at 60fps)
  vy: number,
  spinX: number,        // top/backspin (positive = topspin/follow, negative = backspin/draw)
  spinZ: number,        // sidespin (positive = right english, negative = left english)
  rolling: boolean,     // sliding->rolling transition completed
  pocketed: boolean,
  group: 'solid' | 'stripe' | '8ball' | 'cue'
}
```

**Game state shape:**
```javascript
{
  mode: '8ball' | '9ball',
  phase: 'home' | 'breaking' | 'playing' | 'ballinhand' | 'pushout' | 'gameover',
  balls: Ball[],           // index 0 = cue ball, 1-15 = object balls
  currentPlayer: 0 | 1,
  players: [
    { name: string, type: 'human' | 'computer', group: null | 'solid' | 'stripe' },
    { name: string, type: 'human' | 'computer', group: null | 'solid' | 'stripe' }
  ],
  aiDifficulty: 'easy' | 'medium' | 'hard',
  openTable: boolean,       // 8-ball: groups not yet assigned
  ballInHand: boolean,      // cue ball may be placed freely
  pushOutAvailable: boolean,// 9-ball: next shot after break may be push-out
  pushOutPending: boolean,  // 9-ball: waiting for opponent's push-out decision
  foulOccurred: boolean,    // foul this shot
  shotInProgress: boolean,  // balls are moving
  breakShot: boolean,       // current shot is the break
  firstContactId: number | null, // id of first object ball contacted this shot
  pocketedThisShot: number[],    // ids of balls pocketed this shot
  railContactOccurred: boolean,
  winner: null | 0 | 1,
  cueState: {
    angle: number,          // radians
    power: number,          // 0.0-1.0
    hitX: number,           // -1.0 to 1.0; horizontal hit offset on cue ball (left=english, right=reverse english)
    hitY: number,           // -1.0 to 1.0; vertical hit offset on cue ball (up=topspin, down=backspin)
    dragging: boolean,
    dragStartX: number,
    dragStartY: number
  },
  theme: 'light' | 'dark'
}
```

**State flags:**
- `openTable` — 8-ball: groups not assigned yet; cleared on first legal pocket after break
- `breakShot` — true for the very first shot of a game; cleared after `resolveShotResult()`
- `ballInHand` — set after any foul; cleared when player confirms cue ball placement
- `pushOutAvailable` — 9-ball: set at game start, cleared after break resolves (whether or not push-out is used)
- `pushOutPending` — 9-ball: set when breaker declares push-out; cleared when opponent decides
- `foulOccurred` — set during shot resolution; used to determine ball-in-hand and turn change
- `shotInProgress` — prevents input while balls are moving
- `railContactOccurred` — cleared at shot start, set if any ball touches a rail this shot
- `firstContactId` — null at shot start; set to first object ball id that contacts the cue ball

**Turn structure:**
1. Player aims and shoots (or AI calculates shot after `AI_THINK_DELAY`)
2. `shotInProgress = true`; per-shot tracking flags reset
3. Physics runs each frame via `stepPhysics()`
4. When all balls stop: `resolveShotResult()` runs
5. `resolveShotResult()` checks fouls, pocketed balls, win conditions, open table assignment in order
6. If no foul and legal pocket of correct ball: current player shoots again
7. Else: switch `currentPlayer`; if foul: `ballInHand = true`
8. If 9-ball push-out declared: set `pushOutPending`, show modal, wait for opponent decision
9. If win condition met: `phase = 'gameover'`

**Move validation approach:** No pre-shot validation (other than ball-in-hand placement). All fouls detected post-shot by `resolveShotResult()`. `firstContactId` set during physics to track which ball the cue ball touched first.

**Invalid move handling:** Ball-in-hand placement blocked (red indicator) when overlapping another ball or off-table. All game fouls trigger foul banner then ball-in-hand for opponent.

---

## Physics Engine

**Core loop:** `requestAnimationFrame` at 60fps. Each frame: if `shotInProgress`, call `stepPhysics()`. Uses `SUBSTEPS = 8` sub-steps per frame for collision accuracy. All balls "stopped" when every active ball has speed < 0.1 px/frame and |spin| < 0.01.

**Initial shot velocity:** `vx = power * MAX_POWER * cos(angle)`, `vy = power * MAX_POWER * sin(angle)`. `spinX = hitY * power * MAX_SPIN` (topspin/backspin from vertical hit offset); `spinZ = -hitX * power * MAX_SPIN` (english from horizontal offset). `MAX_POWER = 25` px/frame, `MAX_SPIN = 0.4`.

**Per-sub-step update for each ball:**
1. Apply sliding friction (if not rolling): `speed *= (1 - SLIDE_FRICTION)`; if speed drops below `ROLL_THRESHOLD`, set `rolling = true`
2. If rolling: apply rolling friction `speed *= (1 - ROLL_FRICTION)` and decay spin: `spinX *= 0.97`, `spinZ *= 0.97`
3. Topspin/backspin effect (spinX): while sliding, `spinX` decays toward `speed / BALL_RADIUS`; if `spinX` is negative (draw) and ball is rolling, briefly reverse velocity when `spinX` dominates
4. English effect (spinZ): while sliding, impart small lateral velocity component `vx += spinZ * ENGLISH_LATERAL * 0.002`
5. Update position: `x += vx / SUBSTEPS`, `y += vy / SUBSTEPS`

**Ball-to-ball collision:**
- For each pair (i, j): compute `dist = distance(i, j)`
- If `dist < 2 * BALL_RADIUS` and both not pocketed: resolve collision
- Normalize delta vector; compute relative velocity along collision axis
- Exchange collision-axis velocity components: restitution `e = 0.95`
- Separate balls: push each `(2*BALL_RADIUS - dist) / 2` along delta axis
- Spin throw: if cue ball (id=0) colliding with object ball, apply `objectBall.vy += cueBall.spinZ * THROW_FACTOR`
- First contact tracking: if `firstContactId === null` and one ball is id=0, set `firstContactId` to the other ball's id; set `railContactOccurred = true` per rail hit

**Ball-to-rail collision:**
- Left: `x < BALL_RADIUS` → `vx = -vx * RAIL_RESTITUTION`; clamp x
- Right: `x > TABLE_W - BALL_RADIUS` → same
- Top: `y < BALL_RADIUS` → `vy = -vy * RAIL_RESTITUTION`; clamp y
- Bottom: `y > TABLE_H - BALL_RADIUS` → same
- Sidespin effect on rail bounce: `vy += spinZ * 0.08` on left/right rail hit
- Mark `railContactOccurred = true` on any rail contact

**Pocket detection:** Each sub-step, for each non-pocketed ball, check distance to 6 pocket centers. If `dist < POCKET_RADIUS`: call `pocketBall(ball)`. Pocket positions (playing surface coords): `[[22,22],[878,22],[0,225],[900,225],[22,428],[878,428]]` (TL, TR, ML, MR, BL, BR).

**Constants:**
```
BALL_RADIUS = 11
TABLE_W = 900, TABLE_H = 450
POCKET_RADIUS_CORNER = 22
POCKET_RADIUS_MIDDLE = 20
MAX_POWER = 25
SLIDE_FRICTION = 0.012
ROLL_FRICTION = 0.006
ROLL_THRESHOLD = 0.5
RAIL_RESTITUTION = 0.75
THROW_FACTOR = 0.04
ENGLISH_LATERAL = 1.0
SUBSTEPS = 8
AI_THINK_DELAY_MIN = 400
AI_THINK_DELAY_MAX = 900
```

---

## AI / Computer Player

**Strategy approach:** AI evaluates all legal target ball + pocket combinations. For each it computes the aim angle (ghost-ball method), cut angle, distance, and predicted cue ball leave. It picks the highest-scored shot and applies Gaussian angle error based on difficulty. AI always waits `AI_THINK_DELAY` ms before shooting.

**Ghost-ball method:** To pocket `targetBall` in `pocket`: ghost ball center = `pocket - normalize(pocket - targetBall) * 2 * BALL_RADIUS`. Aim angle = angle from cue ball center to ghost ball center.

**Shot scoring (`scoreShot`):**
- Start at 100
- Cut angle penalty: `- cutAngleDeg * 1.5` (steeper = harder; cut angle = angle between cue-to-ghost and ghost-to-pocket)
- Distance penalty: `- distCueBallToGhost * 0.04`
- Leave bonus (hard only): `+ leaveScore(predictedCueBallFinalPos)` where leave score rewards landing near table center or near the next legal target

**Difficulty levels:**
- `easy`: select random legal target + pocket; aim error `±20 deg` (uniform); power random 30-70%; hit point always center (no spin)
- `medium`: select highest-scored attack shot; aim error `±8 deg` (Gaussian); power 50-85%; slight follow (hitY = -0.1)
- `hard`: select highest-scored shot with leave scoring; aim error `±3 deg`; power optimized per shot distance; considers safety if no attack shot scores > 15; uses hit point for spin

**Safety shots (hard only):** Aim to contact required ball and leave cue ball frozen to a rail, ideally behind a cluster. `safetyScore = railProximity * 10 + clusterProximity * 5`. If `safetyScore > bestAttackScore`, play safety.

**9-ball AI:** Must contact lowest numbered ball. If lowest ball is snookered (no direct line to cue ball), `hard` calculates single-rail kick shot; `easy/medium` aim roughly at the rail near the lowest ball.

**Push-out decision (9-ball):** Hard AI accepts push-out if the resulting position scores > 30 for an attack shot; otherwise declines. Easy/medium always accept.

**Performance:** Max 54 combinations (9 balls × 6 pockets). All synchronous, completes in < 2ms.

---

## Help & Strategy Guide

**Objective:**
- 8-ball: pocket all your group (solids 1-7 or stripes 9-15), then legally pocket the 8-ball to win
- 9-ball: legally pocket the 9-ball — directly or via combination — to win

**Rules summary:**
- Always hit your required ball first (your group in 8-ball; lowest numbered ball in 9-ball)
- After contact, at least one ball must be pocketed or reach a rail — otherwise it's a foul
- Fouls give your opponent ball-in-hand (place cue ball anywhere on the table)
- 8-ball: pocketing the 8 before clearing your group is an instant loss
- 9-ball: if you pocket the 9 via a legal combo, you win immediately

**Key strategies:**
- Plan 2-3 shots ahead — think about where the cue ball will end up, not just which ball you're pocketing
- Keep the cue ball in the center of the table for maximum shot selection
- Use draw (backspin) on straight-in shots to stop the cue ball in place
- Break clusters early — leaving a cluster for later means fewer options when you need them
- In 9-ball, look for a 9-ball combo on every shot, even early in the rack
- When behind, play a safety — leave your opponent with no good shot rather than taking a low-percentage attack

**Common mistakes:**
- Ignoring cue ball position and leaving it stuck in a corner
- Shooting too hard — power scatters balls unpredictably and wastes position
- Forgetting that the 8-ball pocketed early is an instant loss in 8-ball
- Failing to touch a rail — especially on short safety shots where no ball is pocketed
- Pocketing the 9-ball on a shot where the lowest ball was not contacted first (foul, 9 gets spotted)

**Tips for beginners:**
- Use the ghost ball preview to aim: the ghost ball shows where the cue ball needs to be at contact
- The object ball travels roughly perpendicular to the cue ball's impact direction on cut shots — use the deflection arrow
- Click above center on the cue ball diagram for topspin (follow), below center for backspin (draw/stop)
- Full-power shots are rarely right — most pockets need 40-70% power
- When in doubt about a shot, play safe: softly contact your ball and leave the cue ball tight to the far rail

---

## Game Logic
- [x]`initGame(mode, players)` — reset full state, call `initBalls(mode)`, set `breakShot = true`, `openTable = true` (8-ball), `pushOutAvailable = true` (9-ball)
- [x]`initBalls(mode)` — create 16 Ball objects; position cue ball at (225, 225); call `rackTriangle()` (8-ball) or `rackDiamond()` (9-ball)
- [x]`rackTriangle(footSpot)` — place balls 1-15 in triangle: rows [1,2,3,4,5]; row offset `rowIndex * BALL_RADIUS * sqrt(3)`; col offset within row; ball 8 forced to position row=2,col=1 (0-indexed center); one solid and one stripe randomly placed at back corners; remaining balls fill remaining spots randomly
- [x]`rackDiamond(footSpot)` — place balls 1-9 in diamond (rows 1,2,3,2,1); ball 1 at apex (front), ball 9 at center, remaining 7 random
- [x]`shoot(angle, power, hitX, hitY)` — derive `spinX = hitY * power * MAX_SPIN`, `spinZ = -hitX * power * MAX_SPIN`; apply velocity/spin to cue ball; set `shotInProgress = true`; reset `firstContactId = null`, `pocketedThisShot = []`, `railContactOccurred = false`, `foulOccurred = false`
- [x]`stepPhysics()` — run `SUBSTEPS` sub-steps: `moveBalls()`, `detectBallCollisions()`, `detectRailCollisions()`, `detectPockets()`; after all sub-steps, if all balls stopped call `resolveShotResult()`
- [x]`moveBalls()` — for each non-pocketed ball: apply friction, update spin, apply english/draw effects, update `x/y` by `vx/vy / SUBSTEPS`
- [x]`detectBallCollisions()` — O(n^2) all non-pocketed pairs; resolve elastic collision; record `firstContactId`
- [x]`detectRailCollisions()` — check each ball against 4 boundaries; reflect velocity; set `railContactOccurred`
- [x]`detectPockets()` — check each ball against 6 pockets; call `pocketBall()` if within radius
- [x]`pocketBall(ball)` — zero velocity/spin; set `ball.pocketed = true`; push id to `pocketedThisShot`; if cue ball: set `foulOccurred = true`
- [x]`allBallsStopped()` — returns true if every non-pocketed ball has `speed < 0.1` and `|spin| < 0.01`
- [x]`resolveShotResult()` — full post-shot resolution in this order:
  1. If `breakShot`: call `checkIllegalBreak()`
  2. Detect fouls: cue ball pocketed (already flagged); wrong first contact (`firstContactId` not in legal targets); no rail and no pocket (`!railContactOccurred && pocketedThisShot.length === 0`)
  3. Determine legally pocketed balls: remove from `pocketedThisShot` any cue ball (id=0); in 8-ball, also flag 8-ball pocketed status
  4. Check 8-ball win: 8 pocketed, no foul, current player's group fully cleared
  5. Check 8-ball loss: 8 pocketed with foul, or 8 pocketed before group cleared
  6. Check 9-ball win: 9 in `pocketedThisShot` and no foul
  7. Check 9-ball foul + 9 pocketed: spot 9 at foot spot
  8. Assign open table (8-ball): if `openTable` and a non-8 ball legally pocketed: assign groups (first pocketed ball type = current player's group, other group to opponent); set `openTable = false`
  9. Determine `continuousTurn`: at least one correct-group ball (8-ball) or any non-cue ball (9-ball) legally pocketed with no foul
  10. If `breakShot` and 9-ball: set `pushOutAvailable = true`; clear `breakShot`
  11. If foul: `ballInHand = true`; switch player
  12. Else if not `continuousTurn`: switch player
  13. If `pushOutAvailable` and current player is human: enable push-out option in UI before next shot
- [x]`declarePushOut()` — set `pushOutPending = true`, `pushOutAvailable = false`; show push-out modal to opponent
- [x]`resolvePushOut(opponentAccepts)` — if accepts: switch player (opponent shoots); if declines: switch back to breaker (breaker shoots again)
- [x]`checkIllegalBreak()` — count balls that touched a rail; if count < 4 and `pocketedThisShot.length === 0`: set `illegalBreak = true`, show illegal break modal
- [x]`resolveIllegalBreak(reRack)` — if `reRack`: call `initGame()` with same settings, switch breaker; else: `ballInHand = true` for opponent, continue
- [x]`spotBall(ball)` — place at foot spot (675,225); if occupied, try head spot (225,225); if occupied, scan outward in small increments until open position found
- [x]`placeCueBall(x, y)` — clamp to table bounds with margin; check no overlap with any non-pocketed ball; if valid: set cue ball position, clear `ballInHand`; if invalid: show red indicator
- [x]`getLegalTargets(player)` — returns array of ball ids that `player` must contact first this shot: 8-ball open table = all non-8 ids; 8-ball assigned = all ids in player's group; 9-ball = [lowestNumberedActiveBall]
- [x]`getLowestActiveBall()` — 9-ball: find minimum id among non-pocketed balls 1-9
- [x]`switchPlayer()` — toggle `currentPlayer`; if new current player is computer, call `triggerAIShot()`
- [x]`triggerAIShot()` — wait `random(AI_THINK_DELAY_MIN, AI_THINK_DELAY_MAX)` ms (via setTimeout); call `calculateAIShot(difficulty)` then `shoot()`
- [x]`calculateAIShot(difficulty)` — get legal targets; call `evaluateAttackShots()`; apply difficulty logic; return `{angle, power, hitX, hitY}`
- [x]`evaluateAttackShots(legalTargets)` — for each legal target ball × each pocket: compute `ghostBallPos`, `aimAngle`, `cutAngle`, `distCueToBall`; call `scoreShot()`; return array sorted by score descending
- [x]`computeGhostBall(targetBall, pocket)` — returns `{x, y}` of ghost ball position: `pocket - normalize(pocket - targetBall) * 2 * BALL_RADIUS`
- [x]`scoreShot(cutAngle, dist, leavePos, difficulty)` — returns numeric score; higher = better
- [x]`predictCueBallLeave(angle, power)` — simplified 1-step simulation (no spin) to estimate final cue ball position after contact; used for leave scoring in hard/expert
- [x]`applyAimError(angle, errorDeg)` — add normally-distributed error: Box-Muller transform for Gaussian; clamp to ±3× errorDeg
- [x]`evaluateSafety(legalTarget)` — compute rail-freeze shot angle; score by cue ball final rail proximity and cluster blockage; used by hard/expert AI

---

## Files
- `src/index.js` — entry point: load saved preferences, render home screen, wire up home screen events, start game loop on play
- `src/physics.js` — exports: `stepPhysics`, `moveBalls`, `detectBallCollisions`, `detectRailCollisions`, `detectPockets`, `allBallsStopped`, `placeCueBall`, `spotBall`
- `src/game.js` — exports: `initGame`, `initBalls`, `rackTriangle`, `rackDiamond`, `shoot`, `resolveShotResult`, `checkIllegalBreak`, `resolveIllegalBreak`, `declarePushOut`, `resolvePushOut`, `getLegalTargets`, `getLowestActiveBall`, `switchPlayer`, `triggerAIShot`; holds global `state` object
- `src/ai.js` — exports: `calculateAIShot`, `evaluateAttackShots`, `computeGhostBall`, `scoreShot`, `predictCueBallLeave`, `applyAimError`, `evaluateSafety`
- `src/render.js` — exports: `renderFrame`; draws table felt, rails, pocket holes, balls (numbered, colored), cue stick, aim guide line, ghost ball, deflection arrow, power bar fill, hit-point diagram indicator, player HUD, foul banner, AI thinking indicator
- `src/input.js` — exports: `initInput`; handles `mousemove` (update cue angle — all coords divided by canvas scale ratio), `mousedown`/`mouseup` (drag for power), ball-in-hand drag and click-to-place, hit-point diagram click to set hitX/hitY
- `src/ui.js` — exports: `showHome`, `showPlay`, `showGameOver`, `showFoulBanner`, `showPushOutModal`, `showIllegalBreakModal`, `showHelpModal`, `showConfirmModal`; builds and shows DOM screens/overlays
- `src/storage.js` — exports: `saveTheme`, `loadTheme`, `saveLastMode`, `loadLastMode`, `saveLastOpponent`, `loadLastOpponent`, `saveLastDifficulty`, `loadLastDifficulty`
- `src/style.css` — game screens, modals, HUD, buttons, power bar, hit-point diagram, foul banner animation
- `src/global.css` — CSS reset, CSS custom properties for theme, font

---

## UI & Rendering
- [x]Home screen: game title "Pool", mode buttons (8-ball / 9-ball, pill toggle), opponent buttons (vs Player / vs Computer), difficulty pill selector (Easy / Medium / Hard, visible only when vs Computer selected), Start button, Help button ("?"), Donate button, theme toggle (sun/moon icon)
- [x]Play screen: `<canvas>` centered on page; HUD strip above canvas (Player 1 area left with pocketed ball icons, "vs" center, Player 2 area right); power bar on right side of canvas (vertical, 0-100%); hit-point diagram below power bar (48px circle showing cue ball face; player clicks within it to set hit point; dot shows current offset; resets to center each shot); Help button top-right
- [x]Canvas table rendering: dark green felt `#1a7a3c`, dark wood rails `#4a2c0a` (50px wide on each side), pocket holes as black circles, cushion edge lines
- [x]Ball rendering: each ball is a filled circle (radius 11px) with number label:
  - Cue ball: white fill
  - Solids (1-7): fully colored fill + white number (1=yellow `#f5e642`, 2=blue `#3355dd`, 3=red `#cc2200`, 4=purple `#660099`, 5=orange `#ff8800`, 6=green `#007722`, 7=maroon `#880022`)
  - 8-ball: black fill, white number
  - Stripes (9-15): white fill + colored horizontal stripe band (same color map: 9=yellow, 10=blue, 11=red, 12=purple, 13=orange, 14=green, 15=maroon) + black number
  - Pocketed balls shown in HUD tray at half-size (radius 6px), no number
- [x]Cue stick: drawn as a long tapered rectangle (tip to butt) positioned behind cue ball at `angle + PI`; length 200px; visually pulls back when power is being set (tip retreats from cue ball by up to 30px based on power)
- [x]Aim guide: dashed line from cue ball center in `angle` direction (up to 800px or first ball hit); ghost ball (semi-transparent circle) at predicted contact point; object ball deflection arrow (short, from contact point perpendicular to shot direction); cue ball path line after contact (faint)
- [x]Power bar: vertical bar on right of canvas, fills from bottom; turns red at > 85% power; labeled "Power"
- [x]Hit-point diagram: 48px circle below power bar; crosshair lines; dot shows current hit offset (starts center); player clicks anywhere in circle to move the dot — x offset = english, y offset = top/backspin; dot resets to center when a new shot begins; labeled "Spin"
- [x]Player HUD: current player name has colored border highlight; shows pocketed ball icons; shows "Your turn" or "Computer thinking..." text
- [x]Foul banner: fixed position top of canvas area, slides in with CSS animation, text "FOUL -- Ball in Hand", dismisses after 2s
- [x]Ball-in-hand indicator: cue ball follows cursor (clamped to table bounds); filled white normally, red when overlapping another ball; cursor changes to `grab`
- [x]Push-out modal: centered overlay, "Player X played a push-out. Accept position or make them shoot again?", two buttons
- [x]Illegal break modal: "[Player] did not drive 4 balls to a rail. Re-rack and break again, or accept the table?", two buttons
- [x]Help modal: tabbed or sectioned content — Controls (mouse to aim, drag cue back for power, click hit-point diagram to set spin), 8-ball rules summary, 9-ball rules summary, Strategy tips; accessible via "?" button any time during play
- [x]Game over overlay: semi-transparent dark overlay on canvas; "[Player Name] wins!" large text; Play Again and Back to Home buttons
- [x]"Are you sure?" confirmation modal triggered when clicking Back to Home or New Game during an active game

---

## Styling
- [x]`global.css`: CSS reset (`box-sizing: border-box`, `margin: 0`); theme custom properties on `:root` (light) and `body.dark` (dark): `--bg`, `--surface`, `--text`, `--text-muted`, `--accent`, `--border`; `font-family: system-ui, sans-serif`; `body` background uses `--bg`
- [x]`style.css`:
  - `#home-screen`: centered flex column, max-width 400px, gap between elements; card surface `--surface`, border radius 12px, padding 24px
  - `.mode-toggle`, `.opponent-toggle`: horizontal pill button group, active pill uses `--accent` background
  - `.difficulty-selector`: hidden by default, shown when computer opponent selected; 3 pill buttons
  - `.btn-primary`: `--accent` background, white text, rounded; `.btn-secondary`: outlined
  - `#play-screen`: flex column, canvas centered; HUD strip above canvas with flex row
  - `.hud-player`: flex column, player name, pocketed tray (flex row of small ball icons)
  - `.power-bar-container`: fixed width 24px, height 200px, right of canvas; `.power-fill`: bottom-up fill, transition, turns `#cc2200` above 85%
  - `.hit-point-diagram`: 48px circle, border, cursor crosshair; `.hit-dot`: 8px dot positioned by hit offset within circle; crosshair lines drawn via CSS pseudo-elements or inline SVG
  - `.foul-banner`: fixed, top of canvas, slide-down animation (`@keyframes slideDown`), `--accent` or red background, dismisses via `opacity 0` after 2s
  - `.modal-overlay`: full-screen dark backdrop; `.modal-card`: centered card, surface color, border radius
  - `.game-over-overlay`: absolute over canvas, semi-transparent dark bg, flex column centered
  - Dark theme: `body.dark` — `--bg: #0d0d0d`, `--surface: #1a1a1a`, `--text: #eeeeee`, `--accent: #4caf50`, `--border: #333`
  - Light theme default: `--bg: #f0f0f0`, `--surface: #ffffff`, `--text: #111111`, `--accent: #2e7d32`, `--border: #ccc`
  - Responsive: canvas wrapper uses `transform: scale(ratio)` where `ratio = min(viewportWidth / CANVAS_DISPLAY_W, viewportHeight / CANVAS_DISPLAY_H, 1)`; wrapper has fixed dimensions matching canvas, centered via flex; all mouse event coordinates divided by current scale ratio before being passed to game logic; `window.resize` listener recalculates ratio

---

## Local Storage
- [x]`pool_theme` — `'light'` or `'dark'`; applied on load via `body.dark` class
- [x]`pool_last_mode` — `'8ball'` or `'9ball'`; pre-selects mode on home screen
- [x]`pool_last_opponent` — `'player'` or `'computer'`; pre-selects opponent
- [x]`pool_last_difficulty` — `'easy'|'medium'|'hard'`; pre-selects difficulty
- [x]`pool_game_state` — full serialized `state` object (JSON) saved after every shot resolves and on mode/player changes; loaded on page reload to resume in-progress game; cleared on game over or new game start

---

## Accessibility
- [x]Keyboard navigation on home screen: Tab through mode/opponent/difficulty buttons and Start; Enter activates focused button
- [x]ARIA labels: Help button `aria-label="Help"`, theme toggle `aria-label="Toggle theme"`, donate button `aria-label="Donate"`
- [x]Foul banner: `role="alert"` so screen readers announce it
- [x]All modals: focus trapped while open (Tab cycles within modal); Escape key closes confirmation and help modals
- [x]Canvas: `aria-label="Pool table"`, `role="img"`; all game interaction is pointer-based

---

## Polish
- [x]Pocket "flash": brief white circle expands and fades at pocket position when a ball is pocketed (canvas animation over ~300ms)
- [x]Cue stick forward jerk on shoot: animate cue stick tip forward 15px over 80ms then remove cue from view while balls move
- [x]Power bar pulses with subtle glow at 100% power
- [x]AI thinking indicator: "Computer thinking..." appears in AI player's HUD area during delay
- [x]Current player HUD border pulses gently with `--accent` color to indicate active turn
- [x]Smooth game-over overlay: fades in over 400ms with CSS `opacity` transition
- [x]Ball rolling shadow: small semi-transparent dark oval beneath each ball (canvas shadow via `ctx.shadowBlur`)
- [x]Hit-point indicator on aiming cue ball: small dot on the cue ball on the canvas showing the current hit point offset (mirrors the hit-point diagram), so player sees both the diagram and the ball-level indicator simultaneously

---

## Testing
- [x]8-ball: first ball legally pocketed post-break assigns that group to shooter; next shot shows correct group highlighting
- [x]8-ball: pocketing opponent's group ball does not assign player to that group; turn ends normally (no foul if rail contact occurred)
- [x]8-ball: pocketing 8 before clearing group = immediate loss, game over shows loser
- [x]8-ball: pocketing 8 on the break (legal hit, 4 balls reach rail) = immediate win
- [x]8-ball: scratch while potting 8 = loss even if 8 goes in
- [x]9-ball: if balls 1 and 2 are pocketed and ball 3 is lowest, hitting ball 4 first = foul; ball-in-hand for opponent
- [x]9-ball: pocketing 9 via combo off ball 1 (ball 1 is lowest) = win, game over immediately
- [x]9-ball: pocketing 9 when ball 3 is lowest and ball 4 was contacted first = foul; 9 spotted at foot spot, ball-in-hand
- [x]Foul: cue ball pocketed = foul banner shows; opponent gets ball-in-hand; dragging cue ball works; red indicator on overlap
- [x]Foul: no rail contact and no pocket = foul banner; ball-in-hand
- [x]Push-out: breaker declares push-out, modal shows to opponent; opponent accepts = opponent shoots from that position; opponent declines = breaker shoots again
- [x]Illegal break: fewer than 4 balls reach rail and none pocketed = modal appears; re-rack resets game with opponent breaking; accept = opponent gets ball-in-hand
- [x]Physics: straight-on full-power shot, no spin = cue ball stops (dead stop), object ball travels straight forward
- [x]Physics: draw (backspin) shot, straight-on = cue ball reverses direction after contact
- [x]Physics: topspin (follow) shot = cue ball continues forward after contact
- [x]Physics: cue ball hits rail at 45 degrees = reflects at 45 degrees (within RAIL_RESTITUTION damping)
- [x]AI easy: always contacts a legal ball (never fouls by wrong first contact); aim is visibly inaccurate
- [x]AI hard: in 9-ball with 9-ball combo available (ball 1 lined up for 9), pockets the 9 within 2 turns
- [x]Ball-in-hand: placing cue ball on another ball shows red, blocks placement; valid position places and clears ball-in-hand flag
- [x]Theme: toggling persists across home and play screens; stored in localStorage; reloading page restores theme
