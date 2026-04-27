# nine-mens-morris
> Based on: Nine Men's Morris

## Game Design

**Rules:** Standard Nine Men's Morris. Each player has 9 pieces. Three phases: (1) Placement — players alternate placing pieces on empty nodes until all 18 are placed; (2) Movement — players alternate sliding one piece to an adjacent empty node; (3) Flying — a player reduced to exactly 3 pieces may move to any empty node. Forming a mill (3 in a row) during any phase immediately grants a capture: remove one opponent piece that is not part of a mill (unless all opponent pieces are in mills, then any piece may be removed). A mill that is broken and reformed counts as a new mill and grants another capture.

**Players:** 2 (human vs human or human vs computer)

**Modes / variants:** Player vs Computer (Normal / Hard difficulty), Player vs Player (local, same device). Player chooses color (black or white); black always moves first.

**Win / draw conditions:**
- Win: reduce opponent to 2 pieces, OR leave opponent with no legal moves during movement phase (a blocked player in flying phase cannot be blocked, only reduced to 2)
- Draw: same board position repeated 3 times (50-move rule optional; implement the 3-fold repetition only)

**Special rules / one-off mechanics:**
- Mill formation is checked immediately after each placement or move; if a mill is formed, `mustRemove` becomes true and current player must remove before control passes
- A piece inside a mill is protected from capture unless ALL opponent pieces are in mills
- Flying is triggered the moment a player's on-board count drops to 3 (not at the start of their turn — re-evaluate phase after each capture)
- During placement phase, the moving player is still the one who placed the piece even after the capture; opponent places next
- A player with no pieces left to place and fewer than 3 on board immediately loses (can happen if heavily outplayed during placement)

**UI flow:**
1. Home screen (default view)
2. User selects mode, difficulty (if PvC), color; clicks New Game → Play screen
3. Play screen: placement phase → movement phase → (optional) flying phase → Game Over overlay
4. Game Over overlay: result + updated records + Play Again / Menu buttons
5. Help modal accessible at any point via ? icon
6. Confirm modal when quitting mid-game or starting new game mid-game
7. Resume button on home screen if a saved game exists in localStorage

**Edge cases:**
- Player forms multiple mills in one move: only one capture is granted (place/move creates at most one "new mill" event, even if two mills are simultaneously completed — use previous board state to detect which mills are newly formed and grant one capture per move)
- All opponent pieces in mills during a required capture: allow removing any piece
- Player reduced to 2 pieces during placement (not movement) — immediate loss
- Computer's turn to remove: AI picks the best opponent piece to remove (not in a mill unless forced; prefer pieces in potential mills or high-mobility pieces)
- Board state hash for 3-fold repetition must include currentPlayer, phase, and board contents
- PvP: no computer delay; moves are instant
- Resuming a game mid-placement vs mid-movement — phase must be persisted correctly

---

## Data Model

**Board / grid:** 24 nodes indexed 0–23. Three concentric squares with midpoint cross-connectors.

Node coordinates in SVG space (viewBox 0 0 480 480):
```
Outer ring:  0=(40,40)   1=(240,40)  2=(440,40)
             3=(40,240)              4=(440,240)
             5=(40,440)  6=(240,440) 7=(440,440)

Middle ring: 8=(120,120) 9=(240,120) 10=(360,120)
            11=(120,240)            12=(360,240)
            13=(120,360) 14=(240,360) 15=(360,360)

Inner ring: 16=(200,200) 17=(240,200) 18=(280,200)
            19=(200,240)              20=(280,240)
            21=(200,280) 22=(240,280) 23=(280,280)
```

**Adjacency list** (undirected):
```js
const ADJACENCY = [
  [1,3],      // 0
  [0,2,9],    // 1
  [1,4],      // 2
  [0,5,11],   // 3
  [2,7,12],   // 4
  [3,6],      // 5
  [5,7,14],   // 6
  [4,6],      // 7
  [9,11],     // 8
  [1,8,10,17],// 9
  [9,12],     // 10
  [3,8,13,19],// 11
  [4,10,15,20],// 12
  [11,14],    // 13
  [6,13,15,22],// 14
  [12,14],    // 15
  [17,19],    // 16
  [9,16,18],  // 17
  [17,20],    // 18
  [11,16,21], // 19
  [12,18,23], // 20
  [19,22],    // 21
  [14,21,23], // 22
  [20,22],    // 23
];
```

**All 16 mills:**
```js
const MILLS = [
  [0,1,2],[2,4,7],[7,6,5],[5,3,0],    // outer square
  [8,9,10],[10,12,15],[15,14,13],[13,11,8], // middle square
  [16,17,18],[18,20,23],[23,22,21],[21,19,16], // inner square
  [1,9,17],[3,11,19],[4,12,20],[6,14,22]  // cross connectors
];
```

**Piece / token types:**
- `null` — empty node
- `'black'` — black piece (first player)
- `'white'` — white piece (second player)

**Game state shape:**
```js
{
  board: Array(24).fill(null),   // current node occupancy
  phase: 'placement',            // 'placement' | 'movement' | 'flying'
  currentPlayer: 'black',        // whose turn it is
  piecesToPlace: { black: 9, white: 9 }, // remaining in hand
  piecesOnBoard: { black: 0, white: 0 },
  selectedNode: null,            // index of selected piece during movement/flying
  mustRemove: false,             // current player must remove an opponent piece
  gameOver: null,                // null | { winner: 'black'|'white'|'draw' }
  boardHistory: [],              // array of serialized board+player strings for 3-fold repetition
  mode: 'pvc',                   // 'pvc' | 'pvp'
  difficulty: 'normal',          // 'normal' | 'hard' (pvc only)
  playerColor: 'black',          // human's color in pvc mode
}
```

**State flags:**
- `mustRemove` — blocks all actions except clicking a removable opponent piece
- `selectedNode` — non-null during movement/flying; highlights valid destinations
- `phase` — re-evaluated after every capture: if `piecesOnBoard[player] === 3 && piecesToPlace[player] === 0` → `'flying'`; placement ends when both `piecesToPlace` are 0
- `gameOver` — set on: piece count < 3 after removal, no legal moves at start of a player's turn

**Turn structure:**
1. If `mustRemove === true`: player clicks an opponent piece to remove → check win → switch player → clear `mustRemove`
2. Else if `phase === 'placement'`: player clicks empty node → place piece → decrement `piecesToPlace` → increment `piecesOnBoard` → check for new mill → if mill: set `mustRemove = true`, else switch player
3. Else (movement/flying): if `selectedNode === null`: player clicks own piece → set `selectedNode` → if `phase === 'movement'`: highlight adjacent empty nodes; if `phase === 'flying'`: highlight all empty nodes. If player clicks a non-highlighted node or own piece: update or clear selection. If player clicks a highlighted destination: move piece → check for new mill → if mill: `mustRemove = true`, else switch player
4. After switching player, check if new current player has legal moves (in movement phase). If none: `gameOver = { winner: opponent }`

**Move validation approach:**
- Placement: `board[node] === null`
- Movement: `board[node] === null && ADJACENCY[selectedNode].includes(node)`
- Flying: `board[node] === null`
- Removal: `board[node] === opponent && !isInMillUnlessAllInMills(node)`
- `isInMillUnlessAllInMills(node)`: check if node is part of any mill; if yes, check if all opponent pieces are in mills — if so, allow removal anyway

**Invalid move handling:** Ignore clicks on invalid targets silently. Clicking own piece during movement/flying changes the selection.

---

## AI / Computer Player

**Strategy approach:** Minimax with alpha-beta pruning. The computer plays the opponent of `playerColor`. Separate move generators for placement, movement, flying, and removal phases.

**Evaluation function** (from computer's perspective):
- `+200` for each computer mill formed
- `-200` for each opponent mill
- `+10` per computer piece on board
- `-10` per opponent piece on board
- `+5` per computer "almost mill" (2 pieces in a mill with the third empty)
- `-5` per opponent "almost mill"
- `+1` per computer mobility (valid moves count)
- `-1` per opponent mobility
- `+9999` / `-9999` for terminal win/loss states

**Key heuristics:**
- During placement, prefer nodes that participate in multiple MILLS (corners of inner square, midpoints of cross-connectors)
- Prioritize "double mill" setups: a piece that can slide back and forth to repeatedly form mills each turn
- During removal: prefer removing opponent's piece that is part of the most almost-mills; avoid removing pieces in active mills unless forced

**Difficulty levels:**
- Normal: minimax depth 3, no opening book
- Hard: minimax depth 5, prefer strategic placement positions (center cross nodes: 1, 3, 4, 6, 9, 11, 12, 14)

**Performance constraints:** Alpha-beta at depth 5 should complete well under 500ms for typical board states. Use move ordering (captures first, mill-forming moves first) to maximize pruning. No web worker needed for these depths.

---

## Help & Strategy Guide

**Objective:** Reduce your opponent to 2 pieces, or leave them with no legal moves.

**Rules summary:**
- Place all 9 pieces on the board, one per turn, on any empty intersection
- Each time you get 3 in a row (a "mill"), remove one of your opponent's pieces — but not one that is in a mill unless that is all they have left
- Once all pieces are placed, slide pieces one step at a time along the lines
- If you are down to 3 pieces, you may "fly" — jump to any open spot
- You lose if you are reduced to 2 pieces or have no legal moves

**Key strategies:**
- **Build mills early** — corners and midpoints of the outer ring are the best starting positions because they participate in more mills
- **Double mill (the windmill trap)** — set up two overlapping mills sharing one piece; slide that piece back and forth to remove an opponent piece every single turn
- **Block before you build** — if your opponent has 2 pieces in a mill, block the third spot immediately rather than extending your own position
- **Keep pieces mobile** — avoid clustering in one corner; spread pieces so you always have moves in the movement phase
- **Force your opponent into no-move situations** — a win by blocking is just as valid as reducing them to 2 pieces

**Common mistakes:**
- Focusing only on placement without watching the opponent build an unblocked mill
- Removing opponent pieces from far corners (low-impact) when you should remove pieces in forming mills
- Leaving a "double mill" setup uncontested — once established it is almost unbeatable
- Moving into the movement phase with poor piece distribution and immediately getting blocked
- Forgetting that flying players cannot be blocked, only eliminated by piece count

**Tips for beginners:**
- The inner square is cramped and hard to use for mills — focus on the outer and middle rings first
- Count how many mills each empty spot belongs to before you place; pick the highest count
- If the computer is wiping you out on Normal, try to always have at least 2 pieces in different rings to stay mobile
- Removing a piece from a mill is allowed when that is all the opponent has — do not give up your turn thinking you cannot act

---

## Local Storage

Keys (all under prefix `nmm_`):
- `nmm_theme` — `'dark'` | `'light'`; applied on page load before render
- `nmm_mode` — last selected mode (`'pvc'` | `'pvp'`)
- `nmm_difficulty` — last selected difficulty (`'normal'` | `'hard'`)
- `nmm_playerColor` — last selected color (`'black'` | `'white'`)
- `nmm_gameState` — full serialized game state object (JSON); saved after every state change; cleared on game over; drives the Resume button visibility
- `nmm_records` — `{ pvc: { normal: 0, hard: 0 } }` — PvC win counts per difficulty; incremented on win, never decremented

## Accessibility

- [ ] All SVG nodes are `<circle>` elements with `role="button"`, `tabindex="0"`, and `aria-label` describing position and occupant (e.g. "Position 1, empty" / "Position 1, your piece")
- [ ] Keyboard navigation: Tab cycles through valid target nodes only (when a piece is selected or in placement); Enter/Space activates the focused node
- [ ] Status bar has `aria-live="polite"` so screen readers announce phase changes and prompts
- [ ] Modal dialogs use `role="dialog"` with `aria-modal="true"` and trap focus within while open
- [ ] Theme toggle has `aria-label="Toggle light/dark theme"` and updates `aria-pressed`
- [ ] Piece-in-hand counters have `aria-label="Black pieces remaining: N"` etc.

---

## Game Logic
- [x] `initGame(mode, difficulty, playerColor)` — returns fresh state object with all defaults
- [x] `getPhase(piecesToPlace, piecesOnBoard, player)` — returns `'placement'|'movement'|'flying'` for a given player
- [x] `recomputePhase(state)` — updates `state.phase` based on `currentPlayer`'s counts
- [x] `getMills(board, color)` — returns array of mill triplets that are fully occupied by `color`
- [x] `isNewMill(boardBefore, boardAfter, color)` — returns true if any mill exists in `boardAfter` that did not exist in `boardBefore` (detects newly formed mills only, not pre-existing ones)
- [x] `getRemovablePieces(board, opponent)` — returns array of node indices: all opponent nodes not in any mill; if that set is empty, returns all opponent nodes
- [x] `getValidMoves(state)` — returns list of valid actions for `currentPlayer` based on phase and `mustRemove` flag
- [x] `applyPlacement(state, node)` — place piece, update counts, check for new mill, set `mustRemove` or switch player
- [x] `applyMove(state, from, to)` — slide/fly piece, check for new mill, set `mustRemove` or switch player
- [x] `applyRemoval(state, node)` — remove opponent piece, decrement `piecesOnBoard`, check win condition, switch player, clear `mustRemove`, recompute phase for new current player
- [x] `checkWin(state)` — after every `applyRemoval` and after every player switch: check if opponent has < 3 pieces (post-placement loss if < 3 and no more to place), or has 0 legal moves in movement phase; set `state.gameOver`
- [x] `hasLegalMoves(state, player)` — returns true if player has any valid move in current phase (used in `checkWin`)
- [x] `serializeBoard(state)` — returns string of board + currentPlayer for 3-fold repetition check
- [x] `checkDraw(state)` — push serialized state into `boardHistory`; if same string appears 3 times set `state.gameOver = { winner: 'draw' }`
- [x] `switchPlayer(state)` — flip `currentPlayer`, recompute phase, call `checkWin`, call `checkDraw`
- [x] `getAlmostMills(board, color)` — count mills where exactly 2 positions are `color` and one is `null` (used in AI evaluation)
- [x] `evaluateBoard(board, computerColor)` — scoring function using piece count, mills, almost-mills, mobility
- [x] `minimax(state, depth, alpha, beta, maximizing)` — returns best score; move ordering: mill-forming moves first, then captures during removal, then others
- [x] `getBestMove(state)` — entry point for AI; calls minimax at configured depth; returns action object `{ type, node } | { type, from, to }`
- [x] `getBestRemoval(state)` — called separately when AI must remove; picks opponent piece maximizing eval
- [x] `handleClick(state, nodeIndex)` — main dispatcher: routes to placement, selection, movement, or removal logic based on current state flags

---

## UI & Rendering
- [x] Home screen — title "Nine Men's Morris", mode selector (PvC / PvP), difficulty selector (Normal / Hard, visible only in PvC mode), color selector (Black / White, visible only in PvC mode); records: "vs Computer — Normal wins: N, Hard wins: N"; New Game button always; Resume button only if saved game in localStorage; header: help, theme, donate icons
- [x] Play screen — centered container, SVG board, status bar showing current player name + phase label + mustRemove prompt; header: close (confirm modal), help, theme, donate icons; horizontal rule below header
- [x] SVG board — `viewBox="0 0 480 480"` rendered at max 480px, responsive (width 100%); board lines in `--color-border`; node circles radius 14px; empty nodes show subtle dot; placed pieces filled with `--piece-blue` (black player) or `--piece-gold` (white player) with `--piece-highlight` radial gradient; selected piece has glowing outline in `--color-accent`; valid move targets show dashed pulsing ring; mill pieces have subtle glow in their piece color
- [x] Piece-in-hand counter — two rows below status bar showing each player's remaining pieces to place (shown only during placement phase); use small filled circles in player colors
- [x] Game over overlay — semi-transparent backdrop over play screen; result text (win/lose/draw) in `--color-success` / `--color-danger` / `--color-accent`; updated win record; Play Again button, Return to Menu button; fades in with scale animation
- [x] HelpModal — triggered by ? icon from any screen; covers full viewport with semi-transparent backdrop; contains rules, strategies, and tips from Help & Strategy Guide section; scrollable; close button
- [x] ConfirmModal — triggered when clicking close icon mid-game or New Game mid-game; "Are you sure? This will end the current game."; Confirm and Cancel buttons
- [x] Computer "thinking" indicator — brief 400ms delay before computer moves with a subtle "thinking..." status label (prevents instant-move feel)

---

## Styling
- [x] All colors use semantic variables — no hardcoded values
- [x] All spacing uses `--space-*` variables
- [x] Numbers and counters use `--font-mono`
- [x] Main container: `--shadow-lg`, inset box-shadow border using `--color-border`, `--radius-lg`, min-width 420px, centered, `--color-surface` background
- [x] All interactive elements have hover, active, and disabled states with transitions — nothing snaps
- [x] Status text: win=`--color-success`, loss=`--color-danger`, neutral=`--color-accent`, muted info=`--color-text-muted`
- [x] Game over overlay animates in with `opacity 0→1` and `scale 0.92→1` over `--transition-slow`
- [x] SVG node hover state: cursor pointer, node circle grows from radius 14 to 17 on hover with `transition: r 120ms ease`
- [x] Selected piece pulses with a `box-shadow` / SVG filter glow in `--color-accent`
- [x] Valid move target nodes show a dashed circle that animates `stroke-dashoffset` continuously
- [x] Mill pieces glow with a drop-shadow filter in their piece color
- [x] Mode/difficulty/color selectors styled as pill toggle groups (border + background highlight on selected)
- [x] Responsive at 375px: board SVG scales down, container padding reduces to `--space-3`
- [x] Light theme verified — board lines and node dots remain visible on light `--color-surface` background

---

## Polish
- [x] Computer move delay: 400ms pause before AI places/moves, makes interaction feel natural
- [x] Piece placement animation: new piece scales from 0→1 with `--transition-default`
- [x] Piece removal animation: removed piece fades out and shrinks to 0 over `--transition-default`
- [x] Mill formation flash: when a mill is formed, the three pieces briefly pulse brighter (one-shot CSS animation)
- [x] Slide animation: during movement phase, the piece animates from source node to destination node along the board line (translate animation, 200ms)
- [x] Invalid click: brief shake animation on the status bar text if user clicks an invalid target during mustRemove phase
- [x] Game over result text animates in with a bounce (`transform: scale` keyframe)
- [x] Theme toggle fades background and surface colors with a body-level `transition: background-color 200ms`
