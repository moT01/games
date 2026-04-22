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

_(Include only if the game has a computer player)_

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

## Components
- [ ] `App` — top-level layout and state
- [ ] `HomeScreen` — [title, options, records display, New Game / Resume buttons]; header: help icon, theme icon, donate icon
- [ ] `PlayScreen` — [board/game area, score/status]; header: close icon, help icon, theme icon, donate icon
- [ ] `GameOver` — overlay with result, best score, play again / return to menu
- [ ] `HelpModal` — help icon accessible from all screens; content specific to this game
- [ ] `ConfirmModal` — for destructive actions (new game, quit to menu)
- [ ] ...

---

## Styling
- [ ] All colors use semantic variables — no hardcoded values
- [ ] All spacing uses `--space-*` variables
- [ ] Numbers, scores, and timers use `--font-mono`
- [ ] Headings: tight letter-spacing (`-0.02em`); uppercase labels: wide (`0.06em`)
- [ ] No surface is flat — subtle gradient on all panels and containers
- [ ] Main container: `--shadow-lg`, inset box-shadow border, min-width 420px, centered
- [ ] Primary buttons: gradient, hover lift `-1px` + stronger shadow, active scale down, disabled `opacity: 0.4`, all transitions
- [ ] Secondary buttons: surface color with border, same states as primary
- [ ] All interactive elements have hover, active, and disabled states — nothing snaps
- [ ] Focus rings: custom `box-shadow`, no browser defaults
- [ ] Hoverable board squares: inset border on hover
- [ ] Selected pieces: glow with `--shadow-accent`
- [ ] Status text: win=`--color-success`, loss=`--color-danger`, neutral=`--color-accent`
- [ ] Game over overlay animates in with fade + scale
- [ ] Responsive at 375px
- [ ] Light theme verified — surfaces have visible depth and contrast

---

## Polish
_(animations on key events, piece/card movement, sound if applicable, empty state handling)_
- [ ] ...

---

## Testing

**Unit tests — game logic (`src/gameLogic.test.ts`):**
- [ ] ...

**Component tests — (`src/App.test.tsx`):**
- [ ] ...