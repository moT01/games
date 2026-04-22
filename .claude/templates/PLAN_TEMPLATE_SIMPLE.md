# {game-name}
> Based on: {known-game}

## Game Design

**What we're building:** ...

**Rules:** ...

**Players:** ...

**Modes / variants:** ...

**Win / draw conditions:** ...

**Special rules / one-off mechanics:**
- ...

**Captured / out-of-play pieces:** ...

**UI flow:**
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
- [ ] Home screen
- [ ] Play screen
- [ ] HelpModal — "?" button accessible from all screens, content specific to this game
- [ ] ...

---

## Styling
- [ ] `style.css`
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
- [ ] ...
