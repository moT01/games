# variable-sorter
> Based on: variable-sorter

## Game Design

**What we're building:** A speed-based typing/sorting game where players drag variable declarations into the correct type bucket. Select a language and variable count at the start, then sort variables one at a time as fast as possible. Wrong drop = instant fail.

**Rules:**
- Player selects a language (JavaScript or Python) and variable count (10 / 20 / 30) on the home screen
- Variables appear one at a time in a "current" slot; the next variable is visible in a preview slot
- Player drags the current variable to the correct type bucket
- On correct drop: current advances, next moves to current, a new next is drawn from the queue
- On wrong drop: instant game over (fail state), show time elapsed
- On all correct: win state, show final time, compare to personal best

**Players:** 1 (single player, time attack)

**Modes / variants:**
- Language: JavaScript or Python
- Variable count: 10 / 20 / 30

**Win / draw conditions:**
- Win: all variables sorted correctly with no wrong drops
- Fail: any single wrong drop ends the run immediately

**Special rules / one-off mechanics:**
- Proximity-based drop detection: a variable is considered dropped into a bucket if its center is within ~80px of the bucket center (not requiring full overlap)
- Timer starts the moment the first variable becomes draggable (game start)
- Timer stops the moment the last variable is correctly dropped
- Personal best is tracked per language + variable count combo (6 combinations total)
- Keyboard shortcuts: keys 1–9 map to buckets left-to-right for fast play without dragging

**Variable declarations shown:**
- JavaScript: full `const`/`let`/`var` declarations, e.g. `const name = "Alice"`, `let count = 42`, `const active = true`, `const data = null`, `let x = undefined`, `const user = { id: 1 }`, `const tags = ["a", "b"]`, `const greet = () => "hi"`
- Python: assignment statements, e.g. `name = "Alice"`, `count = 42`, `price = 3.14`, `active = True`, `result = None`, `tags = ["a", "b"]`, `user = {"id": 1}`, `coords = (1, 2)`, `unique = {1, 2, 3}`
- Each variable is randomly generated from a pool of realistic names and values; no two consecutive variables look identical

**UI flow:**
1. Home screen: language selector (JS / Python toggle), variable count selector (10 / 20 / 30), best times table, Start button, Help button, Donate button, theme toggle
2. Play screen: current variable card (large, draggable), next variable preview (smaller, right side), type buckets laid out in a row below, timer (counting up), variable progress counter (e.g. "4 / 10")
3. Win screen: "Run complete!", final time, personal best for that combo, Play Again button, Change Settings button
4. Fail screen: "Wrong type!", the variable that was dropped, the bucket it was dropped in vs the correct bucket, time elapsed, Try Again button, Change Settings button

**Edge cases:**
- If the player drops a variable slightly outside all buckets (misses entirely), nothing happens — the card snaps back, no fail
- Last variable: after correct drop, immediately transition to win screen (no "next" preview needed)
- Second-to-last variable: next preview slot shows a placeholder or is empty
- Variable pool must have enough unique entries to fill up to 30 without repeating consecutively; if pool size < count, allow repeats but never consecutive
- Touch support: pointer events handle both mouse and touch drag

---

## Data Model

**Board / grid:** No grid — linear queue of variable cards, array of type buckets

**Piece / token types:**
- `Variable`: `{ id: string, declaration: string, type: JSType | PyType }`
- `Bucket`: `{ type: JSType | PyType, label: string, keyboardKey: number }`

**Type enums:**
```ts
type JSType = 'string' | 'number' | 'boolean' | 'null' | 'undefined' | 'object' | 'array' | 'function'
type PyType = 'str' | 'int' | 'float' | 'bool' | 'None' | 'list' | 'dict' | 'tuple' | 'set'
type Language = 'javascript' | 'python'
```

**Game state shape:**
```ts
type GamePhase = 'home' | 'playing' | 'win' | 'fail'

interface GameState {
  phase: GamePhase
  language: Language
  variableCount: 10 | 20 | 30
  queue: Variable[]        // remaining variables not yet shown (index 0 = next after current)
  current: Variable | null
  next: Variable | null
  sorted: number           // count of correctly sorted variables
  startTime: number | null // Date.now() when first variable became active
  endTime: number | null   // Date.now() when last correct drop happened or fail occurred
  failedDrop: { variable: Variable, droppedType: JSType | PyType, correctType: JSType | PyType } | null
  dragging: boolean        // whether a drag is in progress
  personalBests: PersonalBests
}

type PersonalBests = Record<Language, Record<10 | 20 | 30, number | null>>
// value is milliseconds, null = no best yet
```

**localStorage keys:**
- `vs_theme` — `'light' | 'dark'`
- `vs_personal_bests` — JSON of `PersonalBests` shape
- `vs_last_language` — `'javascript' | 'python'`
- `vs_last_count` — `10 | 20 | 30`
- Mid-run game state is NOT persisted — reloading during a run starts fresh (timer integrity cannot be preserved)

**State flags:**
- `phase`: controls which screen renders
- `dragging`: used to show drop zone highlights during drag
- `failedDrop`: populated on wrong drop, drives fail screen content

**Turn structure:** No turns — single player action loop: drag current → drop → advance or fail

**Move validation approach:**
- `getVariableType(variable: Variable, language: Language): JSType | PyType` returns the ground-truth type
- On drop: compare bucket.type to `getVariableType(current, language)`
- On mismatch: set `failedDrop`, set `phase = 'fail'`
- On match: pop next from queue, advance current/next pointers, increment sorted count; if sorted === variableCount set `phase = 'win'`

**Invalid move handling:** Dropped outside all buckets (no bucket within proximity threshold) → card animates back to current slot, no state change, no fail

---

## Help & Strategy Guide

**Objective:** Sort all variable declarations into the correct type bucket as fast as possible without making a single mistake.

**Rules summary:**
- Pick your language and variable count
- Drag each variable to its type bucket
- One wrong drop ends your run immediately
- Fastest correct run sets your personal best

**Key strategies:**
- Scan the value first, not the variable name — `const foo = []` is always `array` regardless of name
- Learn Python's `True`/`False` (capital T/F) vs JS's `true`/`false` — both are `bool`/`boolean`
- Arrow functions `() =>` and `function` keywords are always `function` type in JS
- In Python, `(1, 2)` is `tuple`, `[1, 2]` is `list`, `{1, 2}` is `set`, `{"a": 1}` is `dict` — learn the brackets
- Use keyboard shortcuts (1–9) instead of dragging once you know the bucket positions
- Preview the next variable while dragging the current one to plan ahead

**Common mistakes:**
- Confusing `null` and `undefined` in JS — `null` is explicit absence, `undefined` is unassigned
- Confusing Python `dict` (`{"key": "val"}`) with `set` (`{1, 2, 3}`) — both use `{}`; presence of `:` means dict
- Marking `const arr = []` as `object` — arrays in JS are technically objects but the bucket is `array`
- Forgetting that `0`, `NaN`, `-1` are all `number` type in JS
- In Python, `3` is `int` but `3.0` is `float` — the decimal point matters

**Tips for beginners:**
- Start with 10 variables to learn the bucket positions before going for speed
- Practice JavaScript first — its types are slightly more intuitive for beginners
- The next-variable preview is your biggest advantage — glance at it during each drop
- If unsure, slow down — there is no time limit, only your personal best to beat

---

## Game Logic
- [x] `generateQueue(language, count)` — builds a shuffled array of `Variable` objects; draws from per-language pools, ensures no two consecutive variables have identical declarations
- [x] `getVariableType(variable, language)` — returns the canonical type for a variable (used for drop validation)
- [x] `checkDrop(bucketType, variable, language)` — returns `true` if correct, `false` if wrong
- [x] `advanceQueue(state)` — moves `next` to `current`, pops first item from `queue` into `next`; if queue empty and next was last, sets `next = null`
- [x] `recordWin(state)` — sets `endTime`, checks/updates `personalBests` for this language+count combo, sets `phase = 'win'`
- [x] `recordFail(state, droppedType)` — sets `endTime`, sets `failedDrop`, sets `phase = 'fail'`
- [x] `getProximityBucket(dropX, dropY, buckets)` — given drop coordinates, returns the bucket whose center is closest AND within 80px threshold; returns null if none qualify
- [x] `formatTime(ms)` — converts milliseconds to `"1.23s"` or `"1:02.45"` (minutes when >= 60s)
- [x] JS variable pool: at least 8 entries per type (64 total), covering realistic names and values
- [x] Python variable pool: at least 8 entries per type (72 total), covering realistic names and values

---

## Components
- [x] `App` — top-level state management, phase routing (home/playing/win/fail), localStorage load/save
- [x] `HomeScreen` — language toggle (JS/Python), variable count selector (10/20/30), best times table, Start button, Help button, Donate button, theme toggle
- [x] `PlayScreen` — timer display, progress counter, current variable card, next variable preview, bucket row, handles drag orchestration
- [x] `VariableCard` — draggable card showing declaration text; accepts `onDragStart`/`onDragEnd` props; uses pointer events for mouse + touch; animates snap-back if dropped in dead zone; `aria-label="Current variable: [declaration]"`, `role="button"`, `tabIndex={0}`
- [x] `NextPreview` — smaller non-draggable display of the next variable declaration
- [x] `BucketRow` — renders all type buckets in a horizontal row
- [x] `Bucket` — individual drop target; highlights on drag-over if within proximity; shows keyboard shortcut number; label is the type name; `aria-label="Drop zone for [type]"`
- [x] `WinScreen` — "Run complete!", final time, personal best, Play Again and Change Settings buttons
- [x] `FailScreen` — "Wrong type!", shows variable declaration, dropped type vs correct type, time elapsed, Try Again and Change Settings buttons
- [x] `HelpModal` — overlay triggered by "?" button; explains types per language with examples; accessible from home and play screens
- [x] `ConfirmModal` — "Are you sure?" used for quit-during-play action only

---

## Styling
- [x] `global.css` — CSS variables for light/dark theme (colors, fonts), base reset, body background
- [x] `App.css` — top-level layout
- [x] `HomeScreen.css` — centered card layout, language toggle pill, count selector buttons, best times table
- [x] `PlayScreen.css` — timer top-right, progress counter top-left, current card centered, next preview right-aligned, bucket row fixed at bottom of play area
- [x] `VariableCard.css` — monospace font, code-block style, drag state (lifted shadow, slight rotation), snap-back animation
- [x] `Bucket.css` — fixed-width bucket, type label, keyboard hint, hover/proximity highlight, color-coded per type
- [x] `WinScreen.css` / `FailScreen.css` — centered result cards, time display
- [x] `HelpModal.css` / `ConfirmModal.css` — overlay backdrop, modal box

**Visual design notes:**
- Variable declarations use monospace font with syntax-style coloring (string values in one color, numbers in another, keywords like `null`/`true` in another)
- Buckets are color-coded by type — each type gets a distinct hue, consistent across languages where type names differ (e.g. JS `string` and Python `str` share a color)
- During drag, the dragged card has a slight rotation and elevated shadow
- Wrong drop triggers a red flash on the dropped bucket before transitioning to fail screen
- Correct drop triggers a brief green flash on the bucket

---

## Polish
- [x] Snap-back animation when card is dropped in dead zone (no bucket within proximity)
- [x] Green flash on bucket after correct drop, before advancing to next variable
- [x] Red flash on bucket after wrong drop, before transitioning to fail screen (100ms delay so player sees it)
- [x] Variable card lifts (shadow + slight rotation) while being dragged
- [x] Bucket highlights (border glow) when a drag is in progress and cursor is near
- [x] Smooth timer display (updates every 10ms for sub-second precision)
- [x] Keyboard shortcut hints shown on buckets, fade out after first keyboard use
- [x] Personal best indicator on win screen ("New best!" vs "Best: X.XXs")

---

## Testing

**Unit tests — game logic (`src/gameLogic.test.ts`):**
- [x] `generateQueue('javascript', 10)` returns exactly 10 Variable objects, no two consecutive entries have identical declarations
- [x] `generateQueue('python', 30)` returns exactly 30 Variable objects
- [x] `getVariableType` returns `'string'` for `const x = "hello"` in JS
- [x] `getVariableType` returns `'array'` for `const x = [1, 2, 3]` in JS (not `'object'`)
- [x] `getVariableType` returns `'function'` for `const x = () => 42` in JS
- [x] `getVariableType` returns `'null'` for `const x = null` in JS
- [x] `getVariableType` returns `'undefined'` for `let x = undefined` in JS
- [x] `getVariableType` returns `'float'` for `x = 3.14` in Python (not `'int'`)
- [x] `getVariableType` returns `'dict'` for `x = {"a": 1}` in Python (not `'set'`)
- [x] `getVariableType` returns `'tuple'` for `x = (1, 2)` in Python (not `'list'`)
- [x] `checkDrop('array', jsArrayVariable, 'javascript')` returns `true`
- [x] `checkDrop('object', jsArrayVariable, 'javascript')` returns `false`
- [x] `getProximityBucket(dropX, dropY, buckets)` returns null when closest bucket is > 80px away
- [x] `getProximityBucket` returns correct bucket when within threshold
- [x] `formatTime(1234)` returns `"1.23s"`
- [x] `formatTime(62000)` returns `"1:02.00"`
- [x] `advanceQueue` correctly shifts next to current and pops from queue
- [x] `advanceQueue` sets next to null when queue is empty

**Component tests — (`src/App.test.tsx`):**
- [x] Home screen renders with JS selected by default and count 10 selected
- [x] Changing language to Python updates displayed language label
- [x] Clicking Start transitions to play screen
- [x] Play screen shows current variable and next preview
- [x] Correct keyboard press (matching bucket key) advances to next variable
- [x] Wrong keyboard press triggers fail screen
- [x] Win screen shows after all variables sorted correctly
- [x] Fail screen shows the wrong bucket and correct bucket
- [x] Personal best is saved to localStorage on win
- [x] Personal best loads from localStorage on home screen mount
