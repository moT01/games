## Section: Polish

### Files created / modified
- `five-dice/src/components/Die.tsx` — replaced number display with 3×3 pip grid; added `rolling` prop; applies `die--rolling` class when rolling and not held
- `five-dice/src/components/Die.css` — removed font styles (no longer a number); added `padding: 8px`; added `.die__pips` grid, `.die__pip`, `.die__pip--active`; added `@keyframes die-shake` and `.die--rolling`
- `five-dice/src/components/DiceArea.tsx` — added `rolling` useState; `handleRoll` sets rolling=true, calls `onRoll`, clears rolling after 350ms via setTimeout; passes `rolling && !die.held` to each Die
- `five-dice/src/App.css` — added `@media (max-width: 640px)` to stack `.app` vertically

### Items already implemented in prior sections (no changes needed)
- **Smooth score transition** — `transition: background var(--transition-fast)` already in `ScoreRow.css` from Styling section
- **Disabled roll button greyed + cursor:not-allowed** — already in `DiceArea.css:disabled` rule from Styling section
- **Play Again no page reload** — `handlePlayAgain` calls `setState(makeInitialState())` already in App.tsx from Components section

### Decisions made
- Pip layout: 3×3 boolean grid (row-major). Positions TC (index 1) and BC (index 7) are always false — standard dice never use exact top/bottom center. This gives correct layouts for all 6 values.
- Pip map for 2: TR (2) and BL (6) — diagonal, matching standard die orientation
- Pip map for 6: TL+TR+ML+MR+BL+BR (indices 0,2,3,5,6,8) — left+right columns, no center row
- Rolling state lives in DiceArea (local state), not App — it's purely visual and doesn't affect game state
- Animation duration 350ms matches the keyframe duration in die-shake
- `rolling && !die.held` — held dice don't shake since they weren't re-rolled

### Uncertainties / flags
- None

### Anything the reviewer should pay extra attention to
- Pip map correctness: verify values 1–6 produce correct pip layouts
  - 1: only index 4 (center) — ✓
  - 2: indices 2 (TR) and 6 (BL) — ✓
  - 3: indices 2 (TR), 4 (center), 6 (BL) — ✓
  - 4: indices 0,2,6,8 (four corners) — ✓
  - 5: corners + center (0,2,4,6,8) — ✓
  - 6: left+right columns (0,2,3,5,6,8) — ✓
- DiceArea: `onRoll` is the prop from App; `handleRoll` wraps it locally — confirm the rolling state isn't leaked to App
- The 350ms setTimeout matches the CSS animation duration — they should stay in sync

### Items ready for review
- [ ] Die faces shown as pip dots (like real dice) rather than plain numbers
- [ ] Roll button shake/roll animation on dice that are not held
- [ ] Smooth transition when a score is locked in (row color change)
- [ ] Disabled Roll button clearly greyed out with cursor: not-allowed
- [ ] "Play Again" resets all state cleanly (no page reload)
- [ ] Responsive layout — scorecard stacks below dice on narrow screens
