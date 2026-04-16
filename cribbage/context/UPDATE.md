# Unified Screen Update

## Goal

After the home screen, everything happens on one persistent surface. No screen transitions. The board, deck, and all zones are always visible. Only the content inside each zone changes as the phase changes.

Reference wireframe: `context/wireframe.html`

---

## Layout (all phases after home)

```
┌─ topbar ────────────────────────────────────────────────────┐
│  Cribbage                              ? ✕ ♥ ☀              │
├─ computer zone ─────────────────────────────────────────────┤
│  [Computer hand: backs]    [Crib]   [Deck stack] [Starter]  │
├─ peg board ─────────────────────────────────────────────────┤
│  ● ● ● ● ● ● ● ● ● ● ● ● ● ● ● ● ● ● ● ● ● ● ● ● ● ● ●  │
├─ event strip ───────────────────────────────────────────────┤
│  Computer plays 8 of Spades — Fifteen for 2!           [+2] │
├─ center content (phase-specific) ───────────────────────────┤
│                                                             │
├─ player zone ───────────────────────────────────────────────┤
│  Your Hand: [cards]                      [action button]    │
└─────────────────────────────────────────────────────────────┘
```

The deck and starter card slot live permanently in the top-right of the computer zone. They appear after the cut-for-deal resolves and stay for the rest of the game.

---

## Phase behavior

### cutForDeal
- Peg board shows 0–0
- Computer zone: label only, no cards, no deck visible yet
- Player zone: label only, no cards
- Center: full-width spread deck — "Click a card to cut"
- After human cuts: their card flips up in the spread, computer card flips after a delay
- After both cut: show result in center, "Computer deals" or "You deal", Continue button
- On continue: spread collapses, deck stack appears in computer zone top-right, dealing begins

### dealing
- Brief — auto-advances
- Event strip: "Dealing..."

### discard
- Deck stack visible top-right, starter slot empty/dashed
- Center: crib ownership label + instruction
- Player zone: 6 cards, select 2, Confirm Discard button
- After confirm: event strip shows "Computer is discarding...", computer discards after short delay

### cut (starter)
- If human is dealer: deck stack in top-right glows/pulses — clicking it cuts the starter
- If computer is dealer: auto-cuts after delay, starter revealed in top-right
- Event strip: "Jack of Hearts — His Heels! 2 points for Computer" if applicable

### play
- Starter card revealed in top-right next to deck
- Center: big running count + played card sequence
- Event strip: last play event (see messages below)
- Player zone: 4 cards, Play Card or Go button

### show
- Center: show panel (hand being counted)
- Event strip: scoring combos as they're claimed or auto-counted

### summary
- Center: hand summary, Next Hand button
- Event strip: final hand totals

---

## Deck and starter card

- After cut-for-deal resolves, the deck stack appears in the computer zone top-right
- It stays there for the rest of the game as a visual anchor — "the deck is on the table"
- During the cut phase: the deck stack is clickable (if human is dealer) — clicking reveals the starter
- After the starter is cut, the starter card appears face-up next to the deck
- The deck stack remains (greyed slightly) to show the rest of the deck is still there

---

## Event strip

A single persistent line between the peg board and the center content. Always visible. Shows the most recent event. No scroll, no log — just the latest.

Replaces the current scoring toast (flying bubble) entirely.

### Styling
- Scoring events: gold text, score badge on the right (e.g. `[+2]`)
- Computer narration: muted/italic
- Instructions that belong in the strip (not center): muted

### All messages, by phase

**cutForDeal**
- "Click a card to cut for deal" — instruction (center, not strip)
- "Computer cuts next..." — strip, muted italic
- "You cut [rank] of [suit], Computer cut [rank] of [suit] — [Player] deals" — strip after result

**dealing**
- "Dealing..." — strip, muted

**discard**
- "Select 2 cards to discard" — instruction (center, not strip)
- "Computer is discarding..." — strip, muted italic

**cut (starter)**
- "Cut the deck to reveal the starter" — instruction (center, not strip)
- "Computer is cutting the deck..." — strip, muted italic
- "[Rank] of [Suit]" — strip when revealed
- "His Heels! 2 points for [dealer]" — strip, gold, [+2] badge (starter is a Jack)

**play**
- "Computer plays [rank] of [suit]" — strip, muted
- "Computer plays [rank] of [suit] — [combo]" — strip, gold for the combo part
- "You played [rank] of [suit] — [combo]" — strip, gold for the combo part
- "Computer says Go" — strip, muted italic
- "Go — 1 point for [player]" — strip, gold, [+1] badge
- "31 — 2 points for [player]" — strip, gold, [+2] badge
- "New count" — strip, muted (after 31 or go sequence resolves)

**show**
- "Counting [Your Hand / Computer's Hand / Your Crib / Computer's Crib]..." — strip, muted
- "[combo] for [n]" — strip, gold, as each combo is claimed or auto-counted
- "[total] points in [hand/crib]" — strip when scorer finishes

**summary**
- "Hand complete" — strip, muted

---

## Structural changes required

- [ ] Move cutForDeal into the GameBoard shell (add to PLAY_PHASES in App.tsx)
- [ ] Remove the standalone CutForDeal component from App routing
- [ ] Add deck stack + starter slot to the computer zone in GameBoard (persistent)
- [ ] Show deck/starter based on phase — hidden during cutForDeal, appears after
- [ ] Render the cut-for-deal spread in the center content area of GameBoard
- [ ] Add a persistent event strip between the peg board and center content
- [ ] Replace the ScoringToast component with the event strip
- [ ] Wire all messages (listed above) into a single `eventMessage` state field
- [ ] Pass eventMessage down through GameBoard to the event strip

---

## Open questions

- Does the spread deck during cut-for-deal sit inside the center content area, or does it overlay the full board area (peg board and all)?
- Should the deck stack show an approximate card count, or just look like a stack?
