# <game-name>
> Based on: <known-game>

## Game Design

**Rules:** ...

**Players:** ...

**Modes / variants:** ...

**Win / draw conditions:** ...

**Special rules / one-off mechanics:**
- ...

**UI flow:** _(screen-to-screen path; note sub-states for complex play screens)_
1. ...

**Edge cases:**
- ...

---

## Data Model

**Board / grid:** ...

**Piece / token types:** ...

**Game state shape:** ...

**State flags:** ...

**Turn structure:** ...

**Move validation approach:** ...

**Invalid move handling:** ...

---

## AI / Computer Player

_(Include only if the game has a computer opponent)_

**Strategy approach:** ...

**Difficulty levels:** ...

**Performance constraints:** ...

---

## Help & Strategy Guide

**Objective:** ...

**Rules summary:** ...

**Key strategies:**
- ...

**Common mistakes:**
- ...

**Tips for beginners:**
- ...

---

## Game Logic
- [ ] ...

---

## UI & Rendering
- [ ] Home screen — [title, options, records display, New Game / Resume buttons]; header: help icon, theme icon, donate icon
- [ ] Play screen — [board/game area, score/status]; header: close icon, help icon, theme icon, donate icon
- [ ] Game over overlay — [result, best score, play again / return to menu]
- [ ] HelpModal — help icon accessible from all screens; content specific to this game
- [ ] ConfirmModal — for destructive actions (new game, quit to menu)
- [ ] ...

---

## Styling
- [ ] All colors use semantic variables — no hardcoded values
- [ ] All spacing uses `--space-*` variables
- [ ] Numbers, scores, and timers use `--font-mono`
- [ ] No surface is flat — subtle gradient on all panels and containers
- [ ] Main container: `--shadow-lg`, inset box-shadow border, min-width 420px, centered
- [ ] All interactive elements have hover, active, and disabled states with transitions — nothing snaps
- [ ] Status text: win=`--color-success`, loss=`--color-danger`, neutral=`--color-accent`
- [ ] Game over overlay animates in with fade + scale
- [ ] Responsive at 375px
- [ ] Light theme verified — surfaces have visible depth and contrast
- [ ] ...

---

## Polish
_(animations on key events, piece/card movement, sound if applicable, empty state handling)_
- [ ] ...
